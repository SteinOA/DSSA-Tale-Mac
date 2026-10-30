"""Download an optional public alignment model; never uploads audio/text or uses implicit tokens."""
import os
os.environ.update(HF_HUB_DISABLE_TELEMETRY='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',HF_HUB_OFFLINE='0')
import argparse,json,hashlib
from pathlib import Path
from huggingface_hub import snapshot_download
parser=argparse.ArgumentParser();parser.add_argument('--language',choices=['no','nn'],required=True);parser.add_argument('--destination',type=Path,required=True);args=parser.parse_args()
spec=json.loads((Path(__file__).parent/'alignment-models.json').read_text())[args.language]
snapshot_download(spec['repo'],revision=spec['revision'],local_dir=args.destination,allow_patterns=list(spec['sha256']),token=False)
for name,expected in spec['sha256'].items():
 with (args.destination/name).open('rb') as stream:
  if hashlib.file_digest(stream,'sha256').hexdigest()!=expected:raise ValueError('Publisher checksum mismatch')
(args.destination/'dssa-alignment-manifest.json').write_text(json.dumps(spec,indent=2))
print(json.dumps({'success':True,'repo':spec['repo'],'revision':spec['revision']}))
