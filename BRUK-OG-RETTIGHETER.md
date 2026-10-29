# Bruk, opphav og rettigheter

DSSA Tale er en uavhengig Mac-tilpasning. Den er ikke godkjent eller sponset av OpenWhispr, Nasjonalbiblioteket, Apple, Google eller Microsoft. MIT-lisensen gjelder appens kode; tredjepartskomponenter beholder sine egne lisenser. Ingen betaling eller abonnement kreves av denne appen.

## Kilder

- [OpenWhispr v1.9.2](https://github.com/OpenWhispr/openwhispr/tree/v1.9.2), commit `313ba032534d7a7ca8c3d633d096ec3171dfcb6c`: MIT. Originale opphavsmerknader er bevart.
- [SteinOA NB-oppsett](https://github.com/SteinOA/openwhispr-nb-whisper), commit `55708e7`: MIT. Windows-repoet er separat.
- [NbAiLab/nb-whisper-large](https://huggingface.co/NbAiLab/nb-whisper-large) og [GGML-modellene](https://huggingface.co/NbAiLab/nb-whisper-large/tree/8c6249fdeeb4dcd05e5735a4c39640607eb6e4ac): Apache-2.0. Kilder/revisjon og kontrollsummer er låst i modellregister og legal-metadata. Modellvekter følger ikke med denne installasjonsfilen.
- [OpenWhispr/whisper.cpp](https://github.com/OpenWhispr/whisper.cpp), pinned commit `dd18d1107cf20feb58f11b2719d66a5bfeaff0dc`: MIT.
- [FFmpeg 6.0](https://ffmpeg.org/releases/): eget LGPL-2.1+-bygg uten GPL/nonfree. Full kildekode, byggevalg og FFmpeg-stishim følger i `legal/`. Opus er BSD; lisens/kilde følger med. FFmpeg er et separat program og kan erstattes med et kompatibelt eget bygg i appens utpakkede ressursmappe; en endring kan bryte appens signatur og kreve egen signering.
- Electron/Chromium, llama.cpp, ONNX Runtime, sherpa-onnx og øvrige biblioteker har egne notices i [resources/legal/NOTICE.txt](resources/legal/NOTICE.txt), [avhengighetsoversikten](resources/legal/dependency-licenses.json) og `npm-notices/`. Eigen-kilden følger for relevante MPL-komponenter.
- Valgfrie Qwen-modellers opprinnelse, revisjon, lisens og kontrollsummer står i [optional-LLM-license-metadata.json](resources/legal/optional-LLM-license-metadata.json). Norske resultater er ikke sertifisert av modellutgiverne.

Tjenestenavnene Google Disk, OneDrive, SharePoint, iCloud og FaceTime brukes som beskrivende referanser. Knappene bruker generiske Lucide-ikoner under ISC; proprietære tjenestelogoer er fjernet fra denne utgivelsen.

## Dine data og tillatelser

Tale behandles lokalt etter modellnedlasting. Ingen nødvendig skytranskripsjon eller lydopplasting. Mikrofon gir appen lydtilgang; Tilgjengelighet gir appen mulighet til å sette inn tekst i andre apper. Kalender er valgfri og macOS kan dele flere kalenderkontoer samtidig. Skymapper kan synkroniseres av Apple, Google eller Microsoft når du selv bruker dem. Dette er noe annet enn lokal modellkjøring.

Ta bare opp og del innhold du har rett til å bruke. Kontroller hvem dokumenter deles med. Transkripsjon, talermerking og KI-genererte referater kan være feil; kontroller navn, tall og beslutninger før videre bruk. Appens lisens gir ikke rettigheter til andres tale, personopplysninger eller dokumenter.

## Testlyd og testbegrensning

Tidligere og nye importtester bruker offentlig NPSC-tale fra [NbAiLab/NPSC](https://huggingface.co/datasets/NbAiLab/NPSC), revisjon `e862cba896ef8f8c7190be21bdb485a9491679a4`, med faktiske nynorske referanser. Original tale/transkripsjon er CC0; kuratert datasett oppgir CC-BY-SA-3.0. Lokale gjentatte/kortede testfiler er ikke ekte møter og følger ikke med brukerpakken. Testtekster for eksport er syntetiske.

Dette er en teknisk kontroll av medfølgende lisensmateriale, ikke en juridisk garanti for enhver bruk. Se fulltekstene for de enkelte komponentene.
