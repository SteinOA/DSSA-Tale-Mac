#!/bin/bash
# Optional, separate local runtime. Does not copy models or touch notes/settings.
set -euo pipefail
python_bin="${1:-python3}"
profile_root="${2:-$HOME/Library/Application Support/OpenWhispr-NB-Test}"
script_root="$(CDPATH= cd "$(dirname "$0")" && pwd)"
"$python_bin" -c 'import sys,platform; assert sys.version_info >= (3,11), "Python 3.11+ required"; assert platform.system()=="Darwin" and platform.machine()=="arm64", "Apple Silicon Mac required"'
runtime_dir="$profile_root/community1/runtime"
if [ ! -x "$runtime_dir/bin/python" ]; then "$python_bin" -m venv "$runtime_dir"; fi
"$runtime_dir/bin/python" -m pip install -r "$script_root/requirements-mac-lock.txt"
printf '%s\n' 'Python-miljø klart. Velg denne Python-filen under Lydfiler → Community-1:' "$runtime_dir/bin/python"
