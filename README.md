# DSSA Tale for Mac

DSSA Tale er en lokal norsk taleapp basert på OpenWhispr, tilpasset med **NB-Whisper Large fra Nasjonalbiblioteket**. Appen gjør tale og lydfiler om til tekst på Mac-en, uten konto, API-nøkkel eller abonnement.

> **Testversjon – signert utgave er planlagt.**
> Lokal transkribering med begge NB-modellene er testet. Apple Developer ID-signering og notarisation mangler foreløpig, så Gatekeeper kan stoppe en nedlastet kopi. Det er ingen bekreftet dato for en signert utgave. Teams-møter, hurtigtaster og automatisk innliming er ikke sluttverifisert. Ikke legg kritiske møter eller opptak i appens hender uten egen prøve først.

## Last ned

## [⬇ Last ned DSSA Tale for Mac](https://drive.google.com/file/d/1Yc2fbrEaWW--HwV1ppyJn7f-Wry2Vgy8/view?usp=drivesdk)

**Apple Silicon · testversjon · ca. 3,6 GB · begge NB Large-modeller inkludert.**
Nedlastingen ligger i den offentlige Google Drive-mappen og krever ingen GitHub-konto.
Google kan vise en nedlastingsbekreftelse fordi filen er stor. Se [enkel installasjon](INSTALLASJON.md).

**Apple-signering og notarisation mangler foreløpig.** Nedlasting uten konto betyr ikke
at appen er godkjent av Gatekeeper; macOS kan stoppe testversjonen når den åpnes.

[Kontrollsum](SHA256SUMS.txt) · [Teststatus og begrensninger](TESTSTATUS.txt) ·
[Windows-versjonen](https://github.com/SteinOA/openwhispr-nb-whisper)

## Innhold

- Begge NB-Whisper Large-modellene følger med DMG-en: **full presisjon** og **kvantisert q5_0**. Full presisjon er standard; q5_0 bruker mindre minne.
- **Bokmål** er standard. **Nynorsk** kan velges, og språkvalget skal beholdes etter omstart.
- Norsk menyspråk som standard, med engelsk som alternativ, lyst/mørkt utseende og aksentfarger.
- Valg av mikrofon, hurtigtaster, ordliste og tekstsnutter.
- Import av lokale lydfiler og eksport til Word, PDF eller ren tekst. Talernavn og tidsstempler kan velges ved eksport.
- Valgfri lokal språkmodell for opprydding og notatformatering. Disse modellene lastes ned separat; automatisk opprydding er av som standard.
- Ingen automatisk appoppdatering. Nye versjoner installeres manuelt, og den separate datamappen beholdes.

Talegjenkjenningen skjer lokalt. Lagrer du en fil i iCloud Drive, OneDrive eller Google Drive, kan den valgte tjenesten synkronisere filen. Dette er bruk av mapper i Finder, ikke en egen sky-API-integrasjon. Opptak fra Apple Taleopptak importeres som eksporterte lydfiler; hele Taleopptak-biblioteket vises ikke direkte i DSSA Tale.

## Mac-støtte

| Område | Status |
|---|---|
| Prosessor | Apple Silicon, arm64. Ingen Intel-utgave. |
| Teknisk minstekrav | macOS 26.0, på grunn av medfølgende kjøremotorer. |
| Faktisk prøvemaskin | Apple M4, 24 GB RAM, macOS 27.0.1. |
| macOS 26 | Ikke prøvd på en egen maskin. |
| Akselerasjon | Apple Metal er testet med NB-Whisper. |

## Kilde og lisenser

Dette er en uavhengig Mac-tilpasning av [OpenWhispr](https://github.com/OpenWhispr/openwhispr) 1.9.2 og [SteinOAs NB-Whisper-oppsett](https://github.com/SteinOA/openwhispr-nb-whisper). Det opprinnelige repoet og Windows-oppsettet beholdes separat.

Appen og tilpasningene bruker MIT-lisens. [NB-Whisper-modellene](https://huggingface.co/NbAiLab/nb-whisper-large) bruker Apache-2.0. Den medfølgende FFmpeg-binæren er et eget LGPL-2.1+-bygg uten GPL/nonfree-komponenter. Lisensopplysninger, attribusjoner og relevante kildearkiver følger i appens `Contents/Resources/legal` og kildeleveransen.

DSSA Tale er ikke utgitt eller godkjent av OpenWhispr eller Nasjonalbiblioteket.

## For utviklere

Koden bygger på OpenWhispr v1.9.2 med den lokale NB-tilpasningen. Se [bygge- og lisensnotater](BUILD-NOTES.txt). Modellvekter og ferdige binærfiler ligger ikke i Git-repoet; begge NB-modellene følger med DMG-en. Upstreams GitHub Actions er bevart under `.github/upstream-workflows-disabled` og kjører ikke automatisk her. Det er ikke satt opp automatisk appoppdatering.
