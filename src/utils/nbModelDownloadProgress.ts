// The preload bridge calls listeners with (IpcRendererEvent, payload).
// Accept payload-only emitters too, but never render the Electron event as progress.
export function nbModelDownloadProgress(event: unknown, payload?: unknown) {
  const value = (payload ?? event) as Record<string,unknown> | null;
  if (!value || typeof value.modelId !== "string") return null;
  const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n) ? Math.max(0,n) : 0;
  const downloadedSize = finite(value.downloadedSize);
  const totalSize = finite(value.totalSize);
  return {
    ...value,
    modelId: value.modelId,
    type: typeof value.type === "string" ? value.type : undefined,
    code: typeof value.code === "string" ? value.code : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    progress: Math.min(100, typeof value.progress === "number" ? finite(value.progress) : totalSize ? downloadedSize / totalSize * 100 : 0),
    downloadedSize,
    totalSize,
  };
}
