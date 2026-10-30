# DSSA Tale for Mac

Norsk tale til tekst på din egen Mac, med NB-Whisper Large fra Nasjonalbiblioteket. Uavhengig tilpasning av [OpenWhispr v1.9.2](https://github.com/OpenWhispr/openwhispr/tree/v1.9.2). Ikke et offisielt produkt fra OpenWhispr, Nasjonalbiblioteket, Apple, Google eller Microsoft.

**1.9.20 er en testversjon.** Den er ad hoc-signert, men mangler Apple Developer ID og notarisering. Automatisk innliming, fysisk dikteringssnarvei og komplette møter er ikke sluttgodkjent i denne testappen. Se [teststatus og begrensninger](TESTSTATUS-1.9.20.md).

## Last ned og installer

Bruk DMG-filen under [GitHub-utgivelser](https://github.com/SteinOA/DSSA-Tale-Mac/releases). Et offentlig repo krever ikke GitHub-medlemskap for nedlasting. Velg **DSSA Tale Test**; ikke kildekodearkivene.

1. Åpne DMG-filen og dra **DSSA Tale Test** til **Applications / Programmer**. Vent til kopieringen er ferdig.
2. Åpne appen fra **Programmer**. Løs ut installasjonsdisken etterpå.
3. Velg og last ned en NB-Whisper Large-modell i appen. Modeller følger **ikke** med installasjonsfilen. Internett trengs ved nedlasting; tale behandles lokalt etterpå.
4. Velg bokmål eller nynorsk og ønsket mikrofon. Tillat mikrofon når du selv vil starte diktering. Tilgjengelighet trengs for automatisk innliming i andre apper.

Hvis Apple blokkerer åpning: bare dersom du stoler på kilden, bruk **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel** etter et blokkert forsøk. Ikke slå av Gatekeeper. Signert/notarisert utgave har ingen bekreftet dato.

Testappen har eget navn, app-ID og innstillingsmappe. Den erstatter ikke den vanlige DSSA Tale-appen. Avslutt den andre dikteringsappen før testing. Oppdatering av samme testapp ved å erstatte den i Programmer bevarer profil, nedlastede modeller og notater. Ikke slett brukermappen.

[Detaljert installasjon](INSTALLASJON.md) · [Bruk og rettigheter](BRUK-OG-RETTIGHETER.md) · [Teststatus](TESTSTATUS-1.9.20.md)

## Modellene

- **NB-Whisper Large, full presisjon**: standardvalget, omtrent 3,10 GB nedlasting.
- **NB-Whisper Large, kvantisert q5_0**: omtrent 1,08 GB. Begge er Large-modeller; q5_0 er en mindre representasjon av vektene.
- Begge lastes ned fra en fast modellrevisjon og kontrolleres med eksakt størrelse og SHA-256 før de blir klare. Ingen manuell modellkonfigurering eller utviklingsverktøy trengs.
- Valgfrie lokale Qwen-modeller kan lastes ned til tekstopprydding, notatformatering og assistent. De erstatter ikke talemodellen. Automatisk opprydding er av ved ny installasjon. Større modell garanterer ikke bedre norsk.

Grensesnitt: bokmål, nynorsk og engelsk. Transkripsjon: bokmål og nynorsk. Dokumenteksport har separate valg for tidsstempler og talernavn. Ingen oversettelse til bokmål skal tvinges på nynorsk, men modellene kan gjøre språk- og faktiske feil.

## Lokal behandling og tilkoblinger

Ingen nødvendig konto, API-nøkkel, betaling eller lydopplasting for talegjenkjenning. Ingen automatisk upstream-oppdatering.

Mikrofon- og høyttalervalg gjelder appen. Appen endrer ikke Macens globale lydruting. Notater og transkripsjoner lagres lokalt når historikk er slått på. Word, PDF og ren tekst kan eksporteres med vanlige lagredialoger.

Google Disk, OneDrive/SharePoint og iCloud Drive bruker mapper du selv velger. Eksport til en synkronisert mappe kan lastes opp av leverandørens klient; dette er ikke en bekreftelse på sikkerhetskopi. Kalender leses valgfritt gjennom Kalender på Mac-en. Leverandørknappene viser oppsettsveiledning, ikke en innebygd direkte konto- eller Teams-botkobling. Møtelenken i avtalen avgjør tjenesten.

## Maskiner og støtte

Pakken er **arm64 for Apple Silicon**, med teknisk minimum **macOS 26.0**. Faktisk prøvd på **Mac mini M4, 24 GB, macOS 27.0.1**. Andre maskiner og macOS 26 er ikke fysisk verifisert. **Ingen Intel-støtte.**

Denne lette pakken bruker Metal eller CPU. Core ML-encoderens modellvekter følger ikke med. Det loves ikke bruk av Neural Engine eller tekstinnsetting innen ett sekund.

## Sikre lokale versjoner

[Mac-verktøy for kildekodekontrollpunkter](DSSA-VERSJONSSIKRING.md) kan sikre en lokalt bygget 1.9.23 eller nyere på en egen GitHub-gren med versjonsmerke og filkontrollsummer. Det endrer ikke appen eller innstillingene. Verktøyet må kjøres på Mac-en som har kildekoden; det betyr ikke at 1.9.23 allerede er lastet opp eller utgitt. Ferdigbygde installasjonspakker er et eget steg.

## Kilder og lisenser

App/tilpasning: MIT. NB-modeller: Apache-2.0. Medfølgende FFmpeg er et eget LGPL-2.1+-bygg uten GPL/nonfree, med kildearkiv, Opus-kilder og byggevalg. Alle påkrevde opplysninger for distribuerte komponenter ligger i appens `Contents/Resources/legal/` og [resources/legal](resources/legal).

[Windows-oppsettet](https://github.com/SteinOA/openwhispr-nb-whisper) er separat. Denne utgivelsen endrer ikke Windows-versjonen.
