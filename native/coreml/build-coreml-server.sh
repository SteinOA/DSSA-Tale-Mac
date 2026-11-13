#!/bin/sh
# Build only an optional M4-specific helper; do not replace the generic server.
set -eu
if [ "$#" -ne 3 ]; then
  echo 'Usage: build-coreml-server.sh PINNED_SOURCE BUILD_DIR OUTPUT_BINARY' >&2
  exit 2
fi
source_dir=$1
build_dir=$2
output=$3
expected=dd18d1107cf20feb58f11b2719d66a5bfeaff0dc
actual=$(git -C "$source_dir" rev-parse HEAD)
[ "$actual" = "$expected" ] || { echo 'Wrong whisper.cpp revision' >&2; exit 1; }
[ "$(uname -m)" = arm64 ] || { echo 'arm64 build host required' >&2; exit 1; }
case "$(sysctl -n machdep.cpu.brand_string)" in
  'Apple M4'|'Apple M4 Pro'|'Apple M4 Max') ;;
  *) echo 'This recipe uses native M4 instructions; use a verified M4 build host.' >&2; exit 1 ;;
esac
# Apply the supplied one-line CPU_AND_NE patch once before running this script.
grep -q '^[[:space:]]*config.computeUnits = MLComputeUnitsCPUAndNeuralEngine;' "$source_dir/src/coreml/whisper-encoder.mm"
cmake -S "$source_dir" -B "$build_dir" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=26.0 -DGGML_NATIVE=ON -DGGML_METAL=ON \
  -DWHISPER_COREML=ON -DWHISPER_COREML_ALLOW_FALLBACK=ON -DBUILD_SHARED_LIBS=OFF
cmake --build "$build_dir" --target whisper-server -j 4
mkdir -p "$(dirname "$output")"
cp "$build_dir/bin/whisper-server" "$output"
chmod 755 "$output"
otool -L "$output"
otool -l "$output" | grep -A5 LC_BUILD_VERSION
shasum -a 256 "$output"
