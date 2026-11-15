const os = require('node:os');
const { promisify } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);

// ps TIME is cumulative CPU time, usually minutes:seconds.hundredths on
// macOS, with optional hours/days for long-running processes.
function parseCpuTime(value) {
  const match = /^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/.exec(value);
  if (!match) throw new Error('Invalid process CPU time');
  const days = Number(match[1] || 0), hours = Number(match[2] || 0);
  const minutes = Number(match[3]), seconds = Number(match[4]);
  if (seconds >= 60 || (match[2] && minutes >= 60) || (match[1] && !match[2])) throw new Error('Invalid process CPU time');
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  if (!Number.isFinite(total)) throw new Error('Invalid process CPU time');
  return total;
}
function parseProcesses(stdout) {
  return stdout.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4 || !fields.slice(0, 3).every(value => /^\d+$/.test(value))) throw new Error('Invalid process row');
    const [pid, ppid, rssKb] = fields.slice(0, 3).map(Number);
    if (![pid, ppid, rssKb].every(Number.isSafeInteger) || pid < 1) throw new Error('Invalid process row');
    return { pid, ppid, rss: rssKb * 1024, cpu: parseCpuTime(fields[3]) };
  });
}
async function readProcesses() {
  const { stdout } = await execFile('/bin/ps', ['-axo', 'pid=,ppid=,rss=,time='], {
    timeout: 3000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8',
    env: { ...process.env, LC_ALL: 'C' },
  });
  return stdout;
}
function createAppMetricsSampler({ read = readProcesses, rootPid = process.pid,
  now = () => Number(process.hrtime.bigint()) / 1e9,
  logicalCores = () => os.cpus().length } = {}) {
  let previous = null, inFlight = null;
  async function sample() {
    let cores = null;
    try {
      cores = typeof logicalCores === 'function' ? logicalCores() : logicalCores;
      if (!Number.isSafeInteger(cores) || cores < 1) throw new Error('Invalid CPU capacity');
      const rows = parseProcesses(await read());
      const timestamp = now();
      if (!Number.isFinite(timestamp) || !rows.some(row => row.pid === rootPid)) throw new Error('Missing app process');
      const family = new Set([rootPid]);
      let added = true;
      while (added) {
        added = false;
        for (const row of rows) if (family.has(row.ppid) && !family.has(row.pid)) { family.add(row.pid); added = true; }
      }
      const current = new Map(rows.filter(row => family.has(row.pid)).map(row => [row.pid, row]));
      const rss = [...current.values()].reduce((total, row) => total + row.rss, 0);
      let cpuPercent = null;
      const elapsed = previous ? timestamp - previous.timestamp : 0;
      if (previous && elapsed > 0 && previous.cores === cores) {
        let delta = 0;
        for (const row of current.values()) {
          const old = previous.processes.get(row.pid);
          // New/reparented processes get a baseline. Never count their entire
          // lifetime; vanished children cannot subtract from the app's usage.
          if (old && old.ppid === row.ppid && row.cpu >= old.cpu) delta += row.cpu - old.cpu;
        }
        cpuPercent = Math.min(100, Math.max(0, delta / (elapsed * cores) * 100));
      }
      if (!previous || elapsed > 0 || previous.cores !== cores) previous = { timestamp, cores, processes: current };
      return { rss, cpuPercent, cpuLogicalCores: cores, processCount: current.size };
    } catch {
      previous = null;
      return { rss: null, cpuPercent: null, cpuLogicalCores: Number.isSafeInteger(cores) && cores > 0 ? cores : null, processCount: null };
    }
  }
  return {
    sample() {
      // Concurrent renderer polls share one measurement and cannot overwrite
      // the baseline out of order.
      if (!inFlight) inFlight = sample().finally(() => { inFlight = null; });
      return inFlight;
    },
  };
}
const defaultSampler = createAppMetricsSampler();
module.exports = { createAppMetricsSampler, parseCpuTime, sampleAppMetrics: () => defaultSampler.sample() };
