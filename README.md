# DSSA Tale for Mac

Lokal norsk tale til tekst for Apple Silicon med NB-Whisper Large fra Nasjonalbiblioteket. Uavhengig tilpasning av OpenWhispr.

> **1.9.7 er en usignert testversjon.** Lokal lydimport og modellkjøring er prøvd. Fornyet innlimingstillatelse, faktisk innliming i Tekstredigering og valgt BlackHole-mikrofon er prøvd. Fysisk snarvei og møte-/kontorintegrasjoner er ikke sluttgodkjent. Talerseparasjon har påviste svakheter og må kontrolleres manuelt.

## Last ned og installer

[Last ned DSSA Tale 1.9.7 for Apple Silicon](https://drive.google.com/file/d/1H4CdzhCJh2s4PaxUZFCu9n-63pQX5dcp/view?usp=drivesdk) – 3,61 GB. Alle med lenken kan laste ned uten GitHub-medlemskap eller Google-innlogging. Google kan vise en bekreftelse fordi filen er stor.

Åpne DMG-en, dra **DSSA Tale** til **Applications/Programmer**, vent på kopieringen og åpne appen fra Programmer. Løs deretter ut installasjonsdisken. Manuell erstatning av appen bevarer innstillinger og notater. Ikke slett brukermappen.

Apple Developer ID-signering og notarisering mangler. Apple kan derfor blokkere første åpning. Bare hvis du stoler på kilden: etter et blokkert forsøk går du selv til **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel**. Ikke slå av Gatekeeper generelt. En signert utgave har ingen bekreftet dato.

[Detaljert norsk installasjon](INSTALLASJON-1.9.7-NORSK.txt) · [SHA256](SHA256SUMS-1.9.7.txt) · [Full test og vurdering](FULL-TEST-OG-VURDERING-1.9.7.txt)

## Hva som følger med

- Begge NB-Whisper Large-modellene: full presisjon som standard og q5_0 som alternativ. Begge modellfilene er kontrollert. Store binærfiler pakkes med appen og ligger ikke i Git.
- Bokmål som standard; nynorsk valgfritt. Språk, modeller og lydenheter beholdes etter omstart.
- Lokal talegjenkjenning med Metal/CPU, uten nødvendig konto, API-nøkkel, abonnement, Terminal, Python eller Homebrew for brukeren.
- Mikrofonvalg, også BlackHole 2ch, og eget høyttalervalg for appens lyder. Appen endrer ikke Macens globale lydruting.
- Valgfri lokal tekstopprydding, av som standard ved ny installasjon. Fire valgfrie Qwen-modeller kan lastes ned separat; teknisk nedlasting og kjøring er prøvd.
- WAV/MP3/M4A-import, egne samtalenotater og tekstkopier, Word/PDF/TXT-eksport og valgfrie taler-/tidsopplysninger.
- Fast sidemeny, Hjem-knapp, norske standardtekster og lyst/mørkt uttrykk fra det godkjente designet.
- Ingen automatisk upstream-oppdatering som kan overskrive NB-tilpasningen.

## Faktisk støtte og teststatus

Pakken er **arm64 for Apple Silicon**, teknisk minimum **macOS 26.0**. Praktisk testet på **Mac mini M4, 24 GB, macOS 27.0.1**. macOS 26 på egen maskin og Intel er ikke testet; Intel støttes ikke av denne pakken.

Full testkjøring: **3182 bestått, 0 feil, 185 hoppet over og 1 todo**. Begge NB-modeller og målformer er prøvd med Metal. I installert 1.9.7 er M4A og en MP3 på 85,5 sekunder transkribert og lagret. Word/PDF er visuelt kontrollert. Fire LLM-filer har korrekt SHA256 og har kjørt norsk testtekst lokalt.

Dette er ikke bevis for ferdig Teams-integrasjon eller feilfri diktering i alle programmer. Se [krav og gjenstående arbeid](KRAV-OG-STATUS.md). Ingen GitHub-release er publisert.

## Kilder og lisenser

Grunnlaget er fortsatt **OpenWhispr v1.9.2**. [v1.10.4](https://github.com/OpenWhispr/openwhispr/releases/tag/v1.10.4) er undersøkt, men ikke migrert inn. [Windows-oppsettet](https://github.com/SteinOA/openwhispr-nb-whisper) er separat og uendret.

OpenWhispr og DSSA-tilpasning: MIT. NB-modeller: Apache-2.0. Medfølgende FFmpeg: LGPL-2.1+ uten GPL/nonfree, med kildearkiv og byggeopplysninger. Se LICENSE og resources/legal for fulltekster, attribusjon, øvrige komponenter og modellkilder.
