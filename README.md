# DSSA Tale for Mac

Norsk tale til tekst på din egen Mac, med NB-Whisper Large fra Nasjonalbiblioteket. Uavhengig tilpasning av [OpenWhispr v1.9.2](https://github.com/OpenWhispr/openwhispr/tree/v1.9.2). Ikke et offisielt produkt fra OpenWhispr, Nasjonalbiblioteket, Apple, Google eller Microsoft.

**1.9.39 er en offentlig testversjon (Pre-release), uten medfølgende LLM-modeller.** Den er ad hoc-signert, men mangler Apple Developer ID og notarisering. Apple kan derfor blokkere første åpning. En signert utgave er målet, uten bekreftet dato.

**[Last ned DSSA Tale Test 1.9.39 for Apple Silicon (DMG)](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/DSSA-Tale-Test-1.9.39-Apple-Silicon.dmg)** — ingen GitHub-konto nødvendig. [Les utgivelsen og installasjonstrinnene her](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.39-test).

[Detaljert installasjon 1.9.39](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/INSTALLER-LES-MEG.txt) · [Teststatus 1.9.39](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/TESTSTATUS-1.9.39.txt) · [Kontrollsum](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/DSSA-Tale-Test-1.9.39-Apple-Silicon.dmg.sha256)

Når appen er installert og åpnet: klikk **Assistent i venstremenyen → Tale til tekst – start her → NB-Whisper-modeller → Last ned**. Du trenger bare én Large-modell. Samme nedlasting finnes også på velkomstsiden. Vanlig diktering trenger ingen ekstra LLM. Tekstopprydding er av ved ny installasjon; valgfrie tekstmodeller kan lastes ned senere. Nytt i 1.9.39: **innebygd bruksanvisning, tydeligere modellvalg, halvfete knapper og færre doble rammer**. Flervalg og automatisk mappeimport med undermapper er beholdt. Hver brukbar lydfil lagres som et eget dokument under Notater før neste fil starter. Ingen fast antallsgrense. La appen være åpen; kølisten gjenopprettes ikke automatisk etter avslutning.

**Tidligere mappeprøve i 1.9.38**, på M4/24 GB/macOS 27.2: **31 lydfiler med 23 t 26 min 05 sek lyd ga 31 separate dokumenter**, på målt **2 t 29 min 02 sek** fra første normaliserte arbeidskopi til siste lagrede notat. Køen fullførte uten køfeil. Full språklig korrekthet er ikke manuelt kontrollert. Mikrofon/hurtigtast og innliming er ikke retestet i denne køprøven. Dette er tidligere resultater, ikke en ny tilsvarende 1.9.39-prøve. [Se den tidligere teststatusen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.38-test/TESTSTATUS-1.9.38.md).

Hjelp-knappen åpner nå en **innebygd, søkbar bruksanvisning med 15 emner** på valgt menyspråk. Den virker uten nett, også før modelloppsettet er ferdig. Typekontroll, rendererbygg og 20 målrettede tester består. Menyer/hjelp, lyse og mørke flater og større tekst er kontrollert i separat pakket app. Denne UI-oppdateringen er ikke en ny full mikrofon-, hurtigtast-, innlimings-, Teams- eller Community-1-test; les teststatusen.

## Last ned og installer

Bruk DMG-filen under [GitHub-utgivelser](https://github.com/SteinOA/DSSA-Tale-Mac/releases). Et offentlig repo krever ikke GitHub-medlemskap for nedlasting. Velg **DSSA Tale Test**; ikke kildekodearkivene.

1. Åpne DMG-filen og dra **DSSA Tale Test** til **Applications / Programmer**. Vent til kopieringen er ferdig.
2. Åpne appen fra **Programmer**. Løs ut installasjonsdisken etterpå.
3. Velg og last ned en NB-Whisper Large-modell i appen. Modeller følger **ikke** med installasjonsfilen. Internett trengs ved nedlasting; tale behandles lokalt etterpå.
4. Velg bokmål eller nynorsk og ønsket mikrofon. Tillat mikrofon når du selv vil starte diktering. Tilgjengelighet trengs for automatisk innliming i andre apper.

Hvis Apple blokkerer åpning: bare dersom du stoler på kilden, bruk **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel** etter et blokkert forsøk. Ikke slå av Gatekeeper. Signert/notarisert utgave har ingen bekreftet dato.

Testappen har eget navn, app-ID og innstillingsmappe. Den erstatter ikke den vanlige DSSA Tale-appen. Avslutt den andre dikteringsappen før testing. Oppdatering av samme testapp ved å erstatte den i Programmer bevarer profil, nedlastede modeller og notater. Ikke slett brukermappen.

[Detaljert installasjon 1.9.39](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/INSTALLER-LES-MEG.txt) · [Bruk og rettigheter](BRUK-OG-RETTIGHETER.md) · [Teststatus 1.9.39](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.39-test/TESTSTATUS-1.9.39.txt)

## Modellene

- **NB-Whisper Large, full presisjon**: standardvalget, omtrent 3,10 GB nedlasting.
- **NB-Whisper Large, kvantisert q5_0**: omtrent 1,08 GB. Begge er Large-modeller; q5_0 er en mindre representasjon av vektene.
- Begge lastes ned fra en fast modellrevisjon og kontrolleres med eksakt størrelse og SHA-256 før de blir klare. Ingen manuell modellkonfigurering eller utviklingsverktøy trengs.
- Valgfrie lokale Qwen- og Gemma-modeller kan lastes ned til tekstopprydding, notatformatering og assistent. De erstatter ikke talemodellen. Automatisk opprydding er av ved ny installasjon. Større modell garanterer ikke bedre norsk. Nye forslag er begrenset til 2B–4B Q4; dette er ikke en målt eller håndhevet 10 GB RAM-grense.

Grensesnitt: bokmål, nynorsk og engelsk. Transkripsjon: bokmål og nynorsk. Når du velger bokmål eller nynorsk i språkvalget, følger både transkripsjon, menyer og lokal hjelp dette valget. Engelske menyer oversetter ikke norsk diktering. Eksisterende lagrede valg migreres ikke ved oppstart. Dokumenteksport har separate valg for tidsstempler og talernavn. Ingen oversettelse til bokmål skal tvinges på nynorsk, men modellene kan gjøre språk- og faktiske feil.

## Lokal behandling og tilkoblinger

Ingen nødvendig konto, API-nøkkel, betaling eller lydopplasting for talegjenkjenning. Ingen automatisk upstream-oppdatering.

Mikrofon- og høyttalervalg gjelder appen. Appen endrer ikke Macens globale lydruting. Notater og transkripsjoner lagres lokalt når historikk er slått på. Word, PDF og ren tekst kan eksporteres med vanlige lagredialoger.

Google Disk, OneDrive/SharePoint og iCloud Drive bruker mapper du selv velger. Eksport til en synkronisert mappe kan lastes opp av leverandørens klient; dette er ikke en bekreftelse på sikkerhetskopi. Kalender leses valgfritt gjennom Kalender på Mac-en. Leverandørknappene viser oppsettsveiledning, ikke en innebygd direkte konto- eller Teams-botkobling. Møtelenken i avtalen avgjør tjenesten.

## Maskiner og støtte

Pakken er **arm64 for Apple Silicon**, med teknisk minimum **macOS 26.0**. Faktisk prøvd på **Mac mini M4, 24 GB, macOS 27.2**. Andre maskiner og macOS 26 er ikke fysisk verifisert. **Ingen Intel-støtte.**

Denne lette pakken bruker Metal eller CPU. Core ML-encoderens modellvekter følger ikke med. Det loves ikke bruk av Neural Engine eller tekstinnsetting innen ett sekund.

## Kilder og lisenser

App/tilpasning: MIT. NB-modeller: Apache-2.0. Medfølgende FFmpeg er et eget LGPL-2.1+-bygg uten GPL/nonfree, med kildearkiv, Opus-kilder og byggevalg. Alle påkrevde opplysninger for distribuerte komponenter ligger i appens `Contents/Resources/legal/` og [resources/legal](resources/legal).

[Windows-oppsettet](https://github.com/SteinOA/openwhispr-nb-whisper) er separat. Denne utgivelsen endrer ikke Windows-versjonen.


Utgivelsen distribuerer DMG og dokumentasjon. Den nye private kildekoden for 1.9.39 er ikke pushet. GitHubs automatiske «Source code»-arkiver skal ikke brukes til installasjon eller forveksles med kildecommitten oppgitt i utgivelsen.
