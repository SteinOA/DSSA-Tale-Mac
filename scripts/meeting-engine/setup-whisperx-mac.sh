#!/bin/bash
# Optional CPU word alignment in a separate, locked runtime; not a replacement ASR.
set -euo pipefail
python_bin="${1:-python3}"
profile_root="${2:-$HOME/Library/Application Support/OpenWhispr-NB-Test}"
script_root="$(CDPATH= cd "$(dirname "$0")" && pwd)"
"$python_bin" -c 'import sys,platform; assert sys.version_info >= (3,11); assert platform.system()=="Darwin" and platform.machine()=="arm64"'
runtime_dir="$profile_root/community1/alignment-runtime"
if [ ! -x "$runtime_dir/bin/python" ]; then "$python_bin" -m venv "$runtime_dir"; fi
"$runtime_dir/bin/python" -m pip install -r "$script_root/requirements-whisperx-mac-lock.txt"
printf '%s\n' 'Separat WhisperX-miljø klart:' "$runtime_dir/bin/python"
