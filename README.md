# DSSA Tale for Mac

DSSA Tale gjør norsk tale og lydfiler om til tekst lokalt på Mac-en med **NB-Whisper Large fra Nasjonalbiblioteket**. Du trenger ingen konto, API-nøkkel eller abonnement for transkribering.

> **Testversjon – signert utgave er planlagt.**
> Versjon **1.9.4 er tilgjengelig**. Appnavn og faktisk versjonsnummer vises fast nederst i sidemenyen. Modellnedlasting har fremdriftsvisning og filkontroll. Automatisk innliming er bygd om og har en norsk testknapp; den endelige prøven fra installert app med Mac-tillatelse gjenstår. Apple Developer ID-signering og notarisation mangler. Nedlasting uten konto betyr ikke at Gatekeeper godkjenner appen. Ingen dato for signert utgave er bekreftet.

## Nedlasting

**[⬇ Last ned DSSA Tale 1.9.4 for Apple Silicon](https://drive.google.com/file/d/1Z9bUyCmgpWfAnj1h4x4uUJAdNLYpQSLL/view?usp=drivesdk)** — ca. 3,6 GB.

Filen heter `DSSA-Tale-1.9.4-Apple-Silicon.dmg`. Alle med lenken kan laste ned uten GitHub-konto eller Google-innlogging. Google kan be om bekreftelse fordi filen er for stor til viruskontrollen. [Kontrollsum for 1.9.4](SHA256SUMS.txt).

Tidligere pakker beholdes i [Drive-mappen](https://drive.google.com/drive/folders/1V9J05FTCdjoR99HIYa_fC-wkxrPEnKVd). Velg **1.9.4** for den synlige versjonsvisningen.

[Enkel installasjon og oppdatering](INSTALLASJON.md) · [Endringer i 1.9.4](RELEASE-NOTES-1.9.4.md) · [Teststatus](TESTSTATUS.txt) · [Windows-versjonen](https://github.com/SteinOA/openwhispr-nb-whisper)

## Dette følger med

- Begge NB-Whisper **Large**-modellene: full presisjon som standard, og kvantisert q5_0 som bruker mindre minne. Ingen manuell modellinstallasjon for disse to.
- Bokmål som standard og Nynorsk som alternativ. Språkvalget beholdes etter omstart.
- Norske menyer med engelsk som alternativ, lyst/mørkt utseende og aksentfarger.
- Mikrofonvalg, hurtigtaster, ordliste og tekstsnutter.
- Import av lydfiler og eksport til Word, PDF eller ren tekst. Talernavn og tidsstempler er valgfrie.
- Valgfri lokal språkmodell for tekstopprydding og notatformatering. Disse lastes ned separat og krever nett ved nedlasting. Opprydding er av som standard.
- Manuell appoppdatering med separat datamappe. Ingen automatiske oppdateringer som erstatter NB-tilpasningen.

Talegjenkjenningen skjer lokalt. Filer du selv lagrer i iCloud Drive, OneDrive eller Google Drive, kan synkroniseres av tjenesten. Dette er mapper i Finder, ikke direkte sky-API-integrasjoner. Apple Taleopptak støttes gjennom eksporterte lydfiler; appen leser ikke hele Taleopptak-biblioteket direkte.

Teams-møter, fysisk hurtigtast med automatisk innliming og lyd fra brukerens PC/Mac er ikke ferdig verifisert. Prøv egne opptak før du bruker appen til viktige møter.

## Mac-støtte

| Område | Status |
|---|---|
| Prosessor | Apple Silicon, arm64. Ingen Intel-utgave. |
| Teknisk minstekrav | macOS 26.0 på grunn av medfølgende kjøremotorer. |
| Testmaskin | Apple M4, 24 GB RAM, macOS 27.0.1. |
| macOS 26 og andre Mac-er | Ikke installasjonstestet på egne maskiner. |
| Akselerasjon | Apple Metal testet med begge NB-modellene fra 1.9.3-DMG. |

## Kilde og lisenser

Tilpasningen bygger på [OpenWhispr v1.9.2](https://github.com/OpenWhispr/openwhispr) og [SteinOAs NB-Whisper-oppsett](https://github.com/SteinOA/openwhispr-nb-whisper). Mac-utgavens versjonsnummer 1.9.3 er eget; Windows-oppsettet beholdes separat.

Appen og tilpasningene bruker MIT-lisens. [NB-Whisper-modellene](https://huggingface.co/NbAiLab/nb-whisper-large) bruker Apache-2.0. Medfølgende FFmpeg er et eget LGPL-2.1+-bygg uten GPL/nonfree-komponenter. Påkrevde lisensopplysninger, attribusjoner og relevante kildearkiver følger i `Contents/Resources/legal` og kildeleveransen. Se [bygge- og lisensnotater](BUILD-NOTES.txt).

DSSA Tale er ikke utgitt eller godkjent av OpenWhispr eller Nasjonalbiblioteket. Modellvekter og ferdige binærfiler ligger ikke i Git-repoet. Upstreams arbeidsflyter er bevart under `.github/upstream-workflows-disabled` og kjører ikke automatisk her.
