# DSSA Tale for Mac

Basert på [OpenWhispr 1.9.2](https://github.com/OpenWhispr/openwhispr/tree/v1.9.2) og [Nasjonalbibliotekets NB-Whisper](https://huggingface.co/NbAiLab/nb-whisper-large). Uavhengig tilpasning; ikke et offisielt eller sertifisert produkt fra OpenWhispr, Nasjonalbiblioteket eller Apple.

**[Last ned DSSA Tale 1.9.45 for Apple Silicon – DMG](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/DSSA-Tale-1.9.45-Apple-Silicon.dmg)** · [Betaomtale og installasjon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.45-beta.1) · [Kommentarer og feilrapporter](https://github.com/SteinOA/DSSA-Tale-Mac/issues/10)

Offentlig **beta / Pre-release**. Nedlasting krever ingen GitHub-konto. Appen heter **DSSA Tale**, uten «Test». Den er ad-hoc-signert, men har ikke Apple Developer ID eller notarisation. Apple kan blokkere første åpning; les installasjonstrinnene. Ikke en ferdig Apple-godkjent stabil utgave.

## Hva gjør appen?

**100 % lokal talegjenkjenning og transkribering.** Lyd og tekst lastes ikke opp til en KI-tjeneste for behandlingen. Modellene lastes ned ved oppsett, deretter arbeider NB-Whisper på Mac-en. Ingen nødvendig konto, API-nøkkel, abonnement eller betaling per bruk for vanlig diktering. Valgfri lokal tekstopprydding og talermerking kjøres også lokalt når modellene er satt opp. Modellnedlasting, lenker og valgfrie kalender-/skytjenester kan bruke nett. En synkroniseringstjeneste kan laste opp filer du selv lagrer i dens mappe.

- Dikter der markøren står i vanlige tekstfelt, eksempelvis Teams, Word, Outlook og andre programmer som tillater innliming. Brukeren har bekreftet fungerende automatisk innliming i andre programmer på sin Mac; ikke alle programmer eller beskyttede felt er testet.
- Samle diktater i en automatisk notatblokk, søk i notater og opprett møte- og arbeidsnotater.
- Importer flere lydfiler eller en mappe, eventuelt med undermapper. Køen fortsetter automatisk og lagrer hver brukbar utskrift som et eget lokalt notat før neste fil. Ingen fast antallsgrense. La appen være åpen; kølisten gjenopprettes ikke automatisk etter avslutning.
- Transkriber svært lange opptak uten fast timegrense i filimporten. Maskinen, diskplass, filtilstand og behandlingsvalg setter praktiske grenser.
- Ta opp møter med **Start møteopptak** og **Stopp møteopptak** i et notat. Velg tekst underveis eller etter opptaket. Behandlet lyd, status og resttidsanslag vises når det finnes målegrunnlag.
- Eksporter til Word, PDF eller tekst, med valgfrie tidsstempler og talermerking der dataene finnes. Køen lagrer lokale notater, ikke automatisk eksterne Word-/PDF-filer.
- Velg mikrofon, høyttaler for appens lyder, hurtigtast, opptaksmåte, lys/mørk visning og tekststørrelse. Vis eller skjul CPU-/minnelinjen. Bruk ordliste og tekstsnutter.

### Teams: tekstfelt, møtelyd og valgfri autostart

Diktering i et Teams-tekstfelt er vanlig innliming. Møteopptak er en annen funksjon: riktig mikrofon og **Systemlyd** med nødvendige macOS-tillatelser må levere begge lydretninger. En allerede konfigurert virtuell inngang kan brukes. Appen endrer ikke global lydruting. Ingen innebygd Teams-bot eller automatisk møtedeltaker er lovet. Lokalt opptak varsler ikke nødvendigvis andre automatisk; informer deltakerne og avklar opptaket.

Under **Innstillinger → Opptak og innliming** finnes **Start automatisk når Teams bruker mikrofonen (utprøving)**. Dette er en valgfri beta, av ved ny installasjon. Registrert mikrofonbruk fra Microsoft Teams-appen kan starte møtenotat/opptak med valgt behandling. Å åpne Teams alene utløser ikke dette; Teams i nettleseren omfattes ikke av prosesskontrollen. Fem målrettede trigger-/prosesskontrolltester består. Faktisk automatisk opptak i et reelt Teams-møte og begge lydretninger er ikke sluttverifisert for denne betaen.

### Filer og dokumentert hastighet

Mappe-/flervalget tar WAV, MP3, M4A, M4B, MP4, MOV, WebM, MKV, OGG/OGA, Opus, FLAC og AIF/AIFF. Lydkodeken må også støttes. WMA og rå AAC-filer støttes ikke av dette FFmpeg-bygget; AAC-lyd i M4A/MP4 støttes. Originalen endres ikke. Dette er ikke støtte for absolutt alle filtyper.

**Tidligere Mac-prøve (1.9.38): 31 filer med 23 t 26 min 05 s lyd → 31 lagrede notater på omtrent 2 t 29 min 02 s**, tilsvarende omtrent **9,4 ganger sanntid**. Apple M4, 24 GB, macOS 27.2, NB-Whisper Large full presisjon, uten talermerking og ekstra LLM. Målt fra første normaliserte arbeidsfil til siste lagrede notat, ikke nøyaktig fra Start-klikket eller bare dekoding. Dette er ikke en ny tilsvarende langprøve av 1.9.45, en enkeltfiltest på 23 timer eller et kvalitetsløfte for hvert ord. Tid varierer med maskin, modell, lyd og etterbehandling. Brukeren omtaler også erfaringen som rundt 20 timer lyd. [Tidligere teststatus](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.38-test/TESTSTATUS-1.9.38.md).

## Modeller og språk

| Modell | Nedlasting | Bruk |
|---|---|---|
| NB-Whisper Large full presisjon | ca. 3,10 GB | Standardvalget |
| NB-Whisper Large q5_0 | ca. 1,08 GB | Kvantisert Large med vanligvis lavere minnebruk |

Begge er fra Nasjonalbiblioteket, bygget på Whisper og videre trent for norsk. Begge inneholder støtte for bokmål/nynorsk. Modellene kontrolleres mot fast revisjon, størrelse og SHA-256 før bruk. Filstørrelse er ikke hele RAM-behovet; på Apple Silicon deler CPU/GPU minnet.

**Modellvektene følger ikke DMG-en.** Last ned én i første oppsett eller **Assistent → Tale til tekst – start her → NB-Whisper-modeller → Last ned**. Ingen Terminal, Homebrew eller system-Python trengs til vanlig NB-Whisper-diktering.

- Menyer, førstegangsoppsett og lokal hjelp: **bokmål, nynorsk og engelsk**.
- Vanlige målformvalg for diktering og filtranskribering: **bokmål og nynorsk**. Valget beholdes til du endrer det. Bokmål-/nynorskvalget følger også menyene.
- Engelske menyer er et separat grensesnittvalg. De oversetter ikke norsk tale til engelsk. Eget engelsk tale-/filtranskripsjonsvalg er ikke tilbudt og verifisert i denne forenklede Mac-visningen.
- **Ekstra LLM er ikke nødvendig. Tekstopprydding er av ved ny installasjon.** Valgfrie Qwen-/Gemma-modeller kan brukes til etterarbeid. Kandidatene er ikke en målt rangering av norsk kvalitet. Nye forslag er begrenset til 2B–4B Q4; dette er ikke en målt eller håndhevet 10 GB RAM-grense.
- Valgfritt lokalt stemmeskille grupperer stemmer; navn og usikker merking må kontrolleres. Community-1 ved lydimport krever separat modell/kjøremiljø, [godkjente modellvilkår](https://huggingface.co/pyannote/speaker-diarization-community-1), Hugging Face-konto og eventuell [lesetilgangsnøkkel](https://huggingface.co/settings/tokens), lagret i macOS Keychain. Dette trengs ikke for NB-Whisper. Community-1 loves ikke automatisk i direkte møter.

## Last ned og installer

1. Velg DMG-lenken øverst, ikke GitHubs «Source code».
2. Avslutt en eldre app. Åpne DMG-en, dra **DSSA Tale** til **Programmer**, vent på kopiering og åpne appen derfra.
3. Hvis Apple blokkerer betaen: bare hvis du stoler på kilden, velg **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel** etter et blokkert startforsøk og godkjenn lokalt når dette tilbys. Ikke slå av Gatekeeper.
4. Følg **Talemodell → Mikrofon → Innliming og test**. Last ned én NB-Whisper Large. Gi mikrofontilgang og velg inngangen med lyd. Nye profiler følger Mac-ens standard mikrofon/utgang og bruker **hold ⌘ + ⇧ + mellomrom inne for å snakke, slipp for å stoppe**. Kontroller den viste hurtigtasten; lagrede valg beholdes.
5. Innlimingstrinnets pop-up viser konkrete klikk. På test-Mac-en heter siden **Personvern og sikkerhet → Enhetskontroll og datatilgang**; eldre macOS bruker Tilgjengelighet. Bruk appens knapp. Legg til **DSSA Tale fra Programmer** og slå på bryteren.
6. En påslått gammel DSSA-oppføring er ikke nok. Hvis appen ikke registrerer tilgangen: fjern bare den foreldede DSSA-oppføringen, legg til den aktuelle appfilen fra Programmer igjen, slå på og bruk **Start DSSA Tale på nytt**. Modellen beholdes.
7. Kjør **Test automatisk innliming**, kontroller hele testsetningen i dokumentet og fullfør oppsettet. Klikk deretter i ditt eget tekstfelt og dikter med valgt hurtigtast.

Mac-passord/Touch ID brukes bare i systemvinduet, aldri i chat. **Hjelp → Gå gjennom oppsettet** åpner veiledningen igjen uten å slette notater/modeller. Bare lydfiler kan brukes uten mikrofon-/innlimingstillatelse.

Vanlig oppdatering av samme ordinære app bevarer dens profil. Eldre **DSSA Tale Test** har egen profil; den nye ordinære appen flytter ikke automatisk data fra testprofilen. Bevar gamle profiler. Ikke slett brukerdata for å oppdatere.

[Utførlig installasjon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/INSTALLASJON-1.9.45.txt) · [Opphav/teststatus](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/OPPHAV-OG-TESTSTATUS-1.9.45.txt) · [SHA-256](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/DSSA-Tale-1.9.45-Apple-Silicon.dmg.sha256)

## Maskiner, teststatus og begrensninger

**Kun Apple Silicon/arm64.** Oppgitt minimum macOS 26.0; macOS 26 er ikke separat funksjonstestet. Faktisk brukt på **Mac mini M4, 24 GB, macOS 27.2.1**. Andre M-maskiner er ikke fysisk verifisert. Ingen Intel-bygg. Metal/CPU finnes; Core ML-encodervekter følger ikke denne pakken, og Neural Engine-bruk eller ett sekund til ferdig tekst loves ikke.

1.9.45: typekontroll, rendererbygg, DMG-integritet, ad-hoc-signatur, versjon/navn/kildecommit og SHA-256 kontrollert. 28 relevante filimport-/oppsett-/omstartstester og fem Teams-triggertester består. Pop-up, innstillingslenke, omstart og bevart modell er prøvd i pakken. **Automatisk innliming i andre programmer er brukerbekreftet**. Den separate nye automatiske mottakertesten ble avbrutt under samtidig bruk og telles ikke som bestått maskintest.

Ingen uavhengig nyinstallasjonsprøve på en annen ren Mac. Ikke uttømmende prøvd med alle programmer, formater, målformer, talere eller lange møter. Kontroller navn, tall, taleridentitet og KI-bearbeidet tekst. Ingen automatisk upstream-oppdatering og ingen betalingsplan. [Windows-oppsettet](https://github.com/SteinOA/openwhispr-nb-whisper) er separat og er ikke endret.

## Kilder og rettigheter

- [OpenWhispr 1.9.2](https://github.com/OpenWhispr/openwhispr/tree/v1.9.2): MIT. DSSA-tilpasninger: MIT.
- [Nasjonalbiblioteket AI Lab / NB-Whisper Large](https://huggingface.co/NbAiLab/nb-whisper-large): Apache-2.0.
- [whisper.cpp](https://github.com/OpenWhispr/whisper.cpp/releases/tag/0.0.8) og [llama.cpp](https://github.com/ggml-org/llama.cpp/tree/b9763): MIT.
- Electron/Chromium og JavaScript-avhengigheter: egne medfølgende lisenser.
- [FFmpeg 6.0](https://ffmpeg.org/legal.html): separat LGPL-2.1+-bygg uten GPL/nonfree. FFmpeg-, Opus- og Eigen-kilder/byggevalg er med i appens **Contents/Resources/legal**, sammen med fulltekstlisenser og bidragsytere.
- [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx), ONNX Runtime, Silero, pyannote og øvrige underkomponenter har egne vedlagte vilkår. [Community-1](https://huggingface.co/pyannote/speaker-diarization-community-1): CC-BY-4.0; [pyannote.audio](https://github.com/pyannote/pyannote-audio): MIT. Modeller/runtime lastes ned separat.

Kildecommit for binærfilen: **e3a950938060df5e567bcd43f161568cb073e478**. Privat Mac-kilde er ikke pushet. Distribusjonsrepoets tagg og GitHubs «Source code»-arkiver er ikke installasjonsfilen eller den private binærkilden. Kontrollsum:

`73e58f27d8d0f1beda2bfa03ebd6c1813124b8566ac825800c301845aa483a09`

## Kommenter betaen

[Legg igjen tilbakemelding her](https://github.com/SteinOA/DSSA-Tale-Mac/issues/10), eller [opprett en egen feilrapport](https://github.com/SteinOA/DSSA-Tale-Mac/issues/new/choose). Oppgi app-/macOS-versjon, Mac-modell, modellvalg og hva du forsøkte. Ikke publiser private opptak, transkripsjoner, passord eller nøkler. GitHub-konto trengs for kommentarer og saker, men ikke for nedlasting.
