#!/bin/bash
# Åpnes på Mac-en som har den faktiske kildekoden. Endrer ikke den installerte appen.
set -euo pipefail
script_dir="$(CDPATH= cd "$(dirname "$0")" && pwd)"
notify_action() {
  /usr/bin/osascript -e 'beep' >/dev/null 2>&1 || true
  if [ -x /usr/bin/say ]; then /usr/bin/say "$1" >/dev/null 2>&1 || true; fi
}
finish() {
  result=$?
  if [ "$result" -eq 0 ]; then
    notify_action 'Stein. Les resultatet i vinduet. Trykk Enter når du vil lukke.'
  else
    notify_action 'Stein. Sikringen stoppet og trenger hjelp. Les meldingen i vinduet.'
  fi
  printf '\nDIN TUR: Les resultatet. Trykk Enter for å lukke.\n'
  read -r _ || true
}
trap finish EXIT
helper="$script_dir/DSSA-sikre-mac-versjon.cjs"
if [ ! -f "$helper" ]; then
  printf 'Pakk ut hele ZIP-filen først. Hjelpefilen må ligge ved siden av denne filen.\n' >&2
  exit 1
fi
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/v24.*/bin/node; do
    if [ -x "$candidate" ]; then node_bin="$candidate"; break; fi
  done
fi
if [ -z "$node_bin" ]; then
  printf 'Fant ikke Node.js. Kjør sikringsverktøyet fra utviklingsmiljøet som bygget DSSA Tale Mac.\n' >&2
  exit 1
fi
printf 'DIN TUR: Velg prosjektmappen med kildekoden i vinduet som åpnes.\n'
notify_action 'Stein. Velg prosjektmappen med kildekoden for DSSA Tale Mac i vinduet som åpnes.'
project="$(osascript -e 'POSIX path of (choose folder with prompt "Velg kildekodemappen for DSSA Tale Mac 1.9.23 eller nyere – ikke appen i Programmer")')" || exit 0
printf 'Sikrer kildekode til SteinOA/DSSA-Tale-Mac. Ingen installasjonspakke publiseres.\n'
"$node_bin" "$helper" --project "$project" --push
