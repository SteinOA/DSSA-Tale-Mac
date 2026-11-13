export type HotkeyRegistrationStatus = {
  status: "idle" | "waiting" | "registering" | "registered" | "failed";
  desiredKey?: string;
  message?: string;
};

/** One startup attempt only. Registration is atomic in main; never persist a fallback. */
export function createNbHotkeyStartup(options: {
  enabled: boolean;
  getDesired: () => string;
  getActive: () => Promise<string | null | undefined>;
  update: (key: string) => Promise<{ success: boolean; message?: string }>;
  setActive: (key: string) => void;
  setStatus: (status: HotkeyRegistrationStatus) => void;
}) {
  let attempted = false;
  let pending: Promise<void> | undefined;
  return function reconcile(): Promise<void> {
    if (!options.enabled || attempted) return Promise.resolve();
    if (pending) return pending;
    pending = (async () => {
      try {
        const active = await options.getActive();
        const desired = options.getDesired();
        if (!desired) return;
        // Do not compete with main's initial startup registration.
        if (!active) {
          options.setStatus({ status: "waiting", desiredKey: desired });
          return;
        }
        options.setActive(active);
        attempted = true;
        if (active === desired) {
          options.setStatus({ status: "registered", desiredKey: desired });
          return;
        }
        options.setStatus({ status: "registering", desiredKey: desired });
        const result = await options.update(desired);
        // A manual edit while IPC was pending owns the new preference/status.
        if (options.getDesired() !== desired) return;
        if (result.success) {
          const confirmed = await options.getActive();
          if (confirmed) options.setActive(confirmed);
          options.setStatus({
            status: confirmed === desired ? "registered" : "failed",
            desiredKey: desired,
            ...(confirmed === desired ? {} : { message: "Snarveien ble ikke bekreftet som aktiv." }),
          });
        } else {
          options.setStatus({ status: "failed", desiredKey: desired, message: result.message || "Snarveien kunne ikke registreres." });
        }
      } catch (error) {
        attempted = true;
        options.setStatus({ status: "failed", desiredKey: options.getDesired(), message: error instanceof Error ? error.message : String(error) });
      }
    })().finally(() => { pending = undefined; });
    return pending;
  };
}
