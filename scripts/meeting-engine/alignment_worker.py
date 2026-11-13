"""Optional local WhisperX word alignment. Never transcribes or translates input text."""
import os
os.environ.update(HF_HUB_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1', PYANNOTE_METRICS_ENABLED='0', TRANSFORMERS_OFFLINE='1')
import json, sys, time, wave, hashlib, resource
from pathlib import Path
REPOS={'nn':'NbAiLab/nb-wav2vec2-1b-nynorsk','no':'NbAiLab/nb-wav2vec2-1b-bokmaal-v2'}
def main(request):
    import torch
    from whisperx.alignment import load_align_model, align
    if request.get('action') == 'probe':
        from importlib.metadata import version
        return {'success':True,'version':version('whisperx'),'device':'cpu'}
    language='no' if request.get('language') in {'no','nb'} else request.get('language')
    if language not in REPOS: raise ValueError('Unsupported written language')
    model=Path(request['modelPath']).resolve(strict=True)
    manifest=json.loads((model/'dssa-alignment-manifest.json').read_text())
    expected=json.loads((Path(__file__).parent/'alignment-models.json').read_text()).get(language)
    if not expected or manifest != expected or manifest.get('repo') != REPOS[language]: raise ValueError('Wrong alignment language/model provenance')
    for name,expected in manifest['sha256'].items():
        file=(model/name).resolve(strict=True)
        if not file.is_relative_to(model): raise ValueError('Invalid model manifest')
        if hashlib.file_digest(file.open('rb'),'sha256').hexdigest()!=expected: raise ValueError('Alignment checksum mismatch')
    torch.set_num_threads(4)
    import numpy as np
    with wave.open(str(request['audioPath'])) as stream:
        if (stream.getnchannels(),stream.getsampwidth(),stream.getframerate()) != (1,2,16000): raise ValueError('Expected mono16k PCM16')
        audio=np.frombuffer(stream.readframes(stream.getnframes()),dtype='<i2').astype('float32')/32768
    started=time.perf_counter()
    acoustic,metadata=load_align_model(language_code=language,device='cpu',model_name=str(model),model_cache_only=True)
    loaded=time.perf_counter()
    # Missing acoustic positions stay missing. Never interpolate invented word clocks.
    result=align(request['segments'],acoustic,metadata,audio,'cpu',interpolate_method='ignore',return_char_alignments=False,print_progress=False)
    for segment in result['segments']:
        segment['words']=[{'text':w['word'],'start':w.get('start'),'end':w.get('end')} for w in segment.get('words',[])]
    normalize=lambda text:' '.join(text.split())
    if normalize(' '.join(s['text'] for s in result['segments'])) != normalize(request['text']): raise ValueError('Alignment changed transcript')
    return {'success':True,'engine':'whisperx','device':'cpu','segments':result['segments'],'language':language,
            'timings':{'loadSeconds':loaded-started,'alignmentSeconds':time.perf_counter()-loaded},
            'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}
if __name__=='__main__':
    try:
        request=json.loads(sys.stdin.read());result=main(request)
        if request.get('resultPath'):
            target=Path(request['resultPath']);temp=target.with_suffix('.tmp');temp.write_text(json.dumps(result));temp.chmod(0o600);temp.replace(target)
        else: print(json.dumps({'type':'result','result':result}),flush=True)
    except Exception as error:
        print(json.dumps({'type':'error','code':type(error).__name__}),flush=True);sys.exit(1)
