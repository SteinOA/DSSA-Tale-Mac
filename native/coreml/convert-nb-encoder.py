#!/usr/bin/env python3
# NB-Whisper encoder conversion. MIT; derived format from whisper.cpp (MIT).
# Model weights retain NbAiLab Apache-2.0 licensing.
import argparse, hashlib
from pathlib import Path
args=argparse.ArgumentParser(description="Convert the verified NB Large full GGML encoder only")
args.add_argument("--model",type=Path,required=True)
args.add_argument("--output",type=Path,required=True)
args=args.parse_args()
source_model=args.model.resolve(); root=args.output.resolve(); root.mkdir(parents=True,exist_ok=True)
expected="0f2f66f22e11a7c7da3c582d8e5c89cb2c0011753ba9c7c9731e320a4ba33e76"
h=hashlib.sha256()
with source_model.open('rb') as stream:
 for chunk in iter(lambda:stream.read(8388608),b''):h.update(chunk)
if h.hexdigest()!=expected:raise ValueError("Not the verified NB Large full GGML model")

import struct,json,math
from pathlib import Path
p=source_model
rows=[]
with p.open('rb') as f:
 def ints(n=1):return struct.unpack('<'+'i'*n,f.read(4*n))
 magic,*dims=ints(12);assert magic==0x67676d6c
 mels,fft=ints(2);f.seek(4*mels*fft,1)
 vocab,=ints()
 for i in range(vocab):
  n,=ints();f.seek(n,1)
 while f.tell()<p.stat().st_size:
  nd,nlen,ft=ints(3);assert 1<=nd<=4 and 0<nlen<500 and ft in [0,1],(nd,nlen,ft,f.tell())
  shape=ints(nd)[::-1];name=f.read(nlen).decode();offset=f.tell();size=math.prod(shape)*(4 if ft==0 else 2)
  rows.append(dict(name=name,shape=shape,type=ft,offset=offset,bytes=size));f.seek(size,1)
 assert f.tell()==p.stat().st_size
print('HEADER',dims,'tensors',len(rows),'encoder',sum(r['name'].startswith('encoder.') for r in rows))
(root/'ggml-index.json').write_text(json.dumps(dict(path=str(p),dims=dims,tensors=rows),indent=2))

import os
os.environ['TOKENIZERS_PARALLELISM']='false'
from pathlib import Path
import json,time,resource,gc
import numpy as np
import torch
from whisper.model import AudioEncoder,MultiHeadAttention
import coremltools as ct
# root and source_model are command-line inputs above
index=json.loads((root/'ggml-index.json').read_text());dims=index['dims']
torch.set_num_threads(4)
MultiHeadAttention.use_sdpa=False
with torch.device('meta'):
 encoder=AudioEncoder(dims[9],dims[1],dims[2],dims[3],dims[4])
expected=encoder.state_dict();weights={};verified=[]
for r in index['tensors']:
 if not r['name'].startswith('encoder.'):continue
 name=r['name'].removeprefix('encoder.')
 arr=np.memmap(index['path'],mode='r',offset=r['offset'],dtype='<f4' if r['type']==0 else '<f2',shape=tuple(r['shape']))
 shape=tuple(expected[name].shape)
 assert arr.size==expected[name].numel(),name
 if tuple(arr.shape)!=shape:assert name in ['conv1.bias','conv2.bias'] and tuple(arr.shape)==(shape[0],1),(name,arr.shape,shape)
 value=np.array(arr,dtype=np.float32).reshape(shape)
 assert np.array_equal(value.reshape(arr.shape),arr),name
 weights[name]=torch.from_numpy(value)
 verified.append({'name':name,'shape':shape,'source_type':r['type'],'exact':True})
 del arr
assert set(weights)==set(expected)
encoder.load_state_dict(weights,strict=True,assign=True)
del weights,expected;gc.collect()
(root/'encoder-verification.json').write_text(json.dumps({'verified':len(verified),'source':'bundled NB full GGML','tensors':verified},indent=2))
print('EXACT_ENCODER',len(verified),'RSS',resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,flush=True)
encoder.eval()
example=torch.zeros(1,dims[9],3000)
start=time.time()
with torch.no_grad():
 traced=torch.jit.trace(encoder,example,check_trace=False)
print('TRACED',time.time()-start,'RSS',resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,flush=True)
converted=ct.convert(traced,convert_to='mlprogram',inputs=[ct.TensorType(name='logmel_data',shape=example.shape)],outputs=[ct.TensorType(name='output',dtype=np.float32)],compute_units=ct.ComputeUnit.ALL,compute_precision=ct.precision.FLOAT16,skip_model_load=True)
converted.save(str(root/'nb-encoder.mlpackage'))
print('CONVERTED',time.time()-start,'RSS',resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,flush=True)
del traced,encoder,converted;gc.collect()
ct.models.utils.compile_model(str(root/'nb-encoder.mlpackage'),destination_path=str(root/'nb-encoder.mlmodelc'))
print('COMPILED',time.time()-start,flush=True)
