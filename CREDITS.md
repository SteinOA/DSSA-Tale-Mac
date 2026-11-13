# DSSA Tale Mac – kreditering

DSSA Tale Mac bygger på [OpenWhispr](https://github.com/OpenWhispr/openwhispr),
med de opprinnelige bidragsyterne og MIT-lisensen bevart i Git-historikken og LICENSE.
NB-Whisper kommer fra [Nasjonalbiblioteket / NbAiLab](https://huggingface.co/NbAiLab).
Se også `resources/legal/THIRD-PARTY-NOTICES.txt` og `resources/legal/SOURCES.txt`
for native kjørefiler, modellkort, FFmpeg-vilkår og kildegrunnlag.

## Valgfri Community-1-motor

- [pyannote.audio](https://github.com/pyannote/pyannote-audio): Hervé Bredin og
  øvrige pyannote-bidragsytere. Kode under MIT.
- [pyannote/speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1):
  modell under CC-BY-4.0. Modellvekter lastes ned separat etter brukerens
  godkjenning. Modellkortets forskerreferanser og opphavsrett gjelder også.
- Alexis Plaquet og Hervé Bredin: *Powerset multi-class cross entropy loss for
  neural speaker diarization*, INTERSPEECH 2023 (segmentering).
- Hongji Wang mfl.: *Wespeaker: A research and production oriented speaker
  embedding learning toolkit*, ICASSP 2023 (stemmeresrepresentasjon).
- Federico Landini, Jan Profant, Mireia Diez og Lukáš Burget:
  *Bayesian HMM clustering of x-vector sequences (VBx) in speaker diarization*,
  Computer Speech & Language 2022 (gruppering).
- GENCI og Jean Zay støttet trening og tuning, som oppgitt i modellkortet.
- [SteinOA Windows PR 1](https://github.com/SteinOA/openwhispr-nb-whisper/pull/1):
  grunnlag for den tidsbaserte talerkoblingen, arbeiderprotokollen og den låste
  modellrevisjonen. Mac-tilpasningen bruker CPU/MPS, Mac-prosessgrupper og
  macOS Keychain; ingen Windows-stier, CUDA-runtime eller Windows-modellmiljø arves.

PyTorch/torchaudio, NumPy, Hugging Face Hub og de øvrige Python-avhengighetene
beholder egne lisenser. Låste, faktisk installerte Mac-versjoner er oppgitt i
`scripts/meeting-engine/requirements-mac-lock.txt`. Runtime og modellvekter
følger ikke installasjonspakken. Ingen av opphavspersonene har godkjent eller
sertifisert DSSA Tale. Stemmegrupper dokumenterer ikke personidentitet.

## Valgfri ordjustering

[WhisperX](https://github.com/m-bain/whisperX), Max Bain og bidragsyterne,
BSD-2-Clause, brukes bare til valgfri akustisk ordjustering. ASR og tekst beholdes.
Separate [NbAiLab nynorsk](https://huggingface.co/NbAiLab/nb-wav2vec2-1b-nynorsk)
og [bokmål](https://huggingface.co/NbAiLab/nb-wav2vec2-1b-bokmaal-v2) wav2vec2-
modeller har Apache-2.0-vilkår. Krediter Nasjonalbiblioteket AI Lab og
Rolv-Arild Braaten, Javier de la Rosa og Freddy Wetjen, samt Meta/XLS-R-grunnlaget
og modellkortenes referanser. Vektene og Python-runtime distribueres separat.
