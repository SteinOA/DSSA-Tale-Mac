# DSSA Tale for Mac – bruksanvisning

Versjon 1.9.45 · 15.11.2026 · bokmål

Denne bruksanvisningen gjelder DSSA Tale 1.9.45 for Mac. Skjermbildene er tatt i den installerte Mac-appen 15. november 2026. De viser bokmålsmenyer og denne maskinens valg. Personlige notater og opptak er ikke tatt med.

Appen gjør tale og lydfiler om til tekst lokalt. Last ned én NB-Whisper Large-modell; ekstra LLM er ikke nødvendig. Modellnedlasting krever nett. Skytjenester kan synkronisere filer du selv legger i deres mapper.

Start med Assistent for modell og målform, og Innstillinger → Tale og mikrofon for lyd og tillatelser. Hjelp → Gå gjennom oppsettet åpner førstegangsveiledningen igjen.

Viktig: Appen i denne utgivelsen heter DSSA Tale, uten «Test». Enkelte hjelpetekster i selve 1.9.45 sier fortsatt «DSSA Tale Test»; i systeminnstillingene skal du velge den faktiske DSSA Tale-appen fra Programmer. Denne separate veiledningen bruker riktig navn.

På en ny Mac velger du dens egen mikrofon og utgang. BlackHole i bildene er et spesielt oppsett på testmaskinen, ikke noe andre må installere. Bildet av hurtigtaster viser Ctrl + ⌘ + pil ned som personlig valg. Standard ved ny installasjon er hold ⌘ + ⇧ + mellomrom inne mens du snakker, slipp når du er ferdig. Se alltid hvilken kombinasjon din app viser.

Første gang du åpner Notater kan du se Handlinger med lokal språkmodell og Kom i gang. Du trenger ikke velge en ekstra språkmodell for vanlig transkripsjon. Systemlyd er en egen macOS-tillatelse hvis du vil ha med møtelyd fra andre apper. En pipelyd bekrefter ikke mikrofoninngangen.

Pakken er for Apple Silicon/arm64, med oppgitt minimum macOS 26. Faktisk prøvd på M4 med 24 GB; ikke alle M-maskiner eller macOS-versjoner er testet. Betaen mangler Developer ID-signering og Apple-notarisering. Se utgivelsens installasjons- og teststatus.

Dette arbeidet dokumenterer skjermene og valgene. Det er ikke en ny full funksjonstest av møtelyd, talermerking eller alle modellene.

[Last ned appen og les teststatus](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.45-beta.1)

## Innhold

- [Kom i gang](#guide)

## Kom i gang

### Du kan fullføre senere

Øverst i oppsettet finnes Åpne appen – fullfør oppsettet senere. Den åpner notater og resten av appen uten å påstå at diktering er klar. Hjem viser Fortsett oppsettet. Du kan alltid flytte vinduet i den vanlige Mac-tittellinjen og dra kanten for å endre størrelse. Første gang bruker appen Mac-ens standardmikrofon og standardutgang, og Hold inne for å snakke. Velg egne enheter bare hvis du ønsker det.

### 1. Tre trinn ved første åpning

Åpne Finder → Programmer → DSSA Tale. Oppsettet har tre trinn: Talemodell, Mikrofon og Innliming og test. Hvert trinn viser status og hva du skal gjøre videre. Last ned én NB-Whisper Large-modell i trinn 1 og vent til Klar til bruk. I trinn 2: Gi mikrofontilgang, velg Tillat fra macOS og velg riktig mikrofon. I trinn 3: Åpne innlimingstillatelsen. Under Personvern og sikkerhet heter siden Enhetskontroll og datatilgang på nyere macOS, ellers Tilgjengelighet. Slå på DSSA Tale; hvis appen mangler, legg den til fra Programmer. Gå tilbake til appen og kontroller status. Start DSSA Tale på nytt beholder trinnet. Test automatisk innliming åpner et eget testdokument, uten mikrofon. Kontroller at teksten faktisk kom inn. Trykk til slutt Åpne DSSA Tale for diktering. Hjelp → Gå gjennom oppsettet åpner veiledningen igjen uten å slette modeller eller notater.

### Bare lydfiler uten mikrofon

Hvis du bare vil transkribere ferdige lydfiler, last ned én talemodell og velg Åpne bare for lydfiler – innliming av. Mikrofon og innlimingstillatelse er da ikke nødvendig. Automatisk innliming er avslått i denne modusen. Når du senere vil diktere, bruk Hjelp → Gå gjennom oppsettet og fullfør mikrofon og innliming.

### 2. Finn talemodellen i menyen

Når programmet er åpnet, klikk Assistent i venstremenyen. Under Tale til tekst – start her finner du NB-Whisper fra Nasjonalbiblioteket. Klikk Last ned ved Large – full presisjon (3,10 GB), eller q5_0 (1,08 GB) for mindre minnebruk. Vent til Klar til bruk. Disse filene følger ikke installasjonsfilen. Du trenger bare én av dem.

### 3. Velg mikrofon og prøv

Velg Innstillinger → Tale og mikrofon. Velg mikrofonen du faktisk bruker, og prøv Test valgt mikrofon i 5 sekunder. Åpne deretter et tomt dokument i Tekstredigering, sett markøren i dokumentet og bruk dikteringssnarveien. Standard er å holde ⌘ + ⇧ + mellomrom inne mens du snakker og slippe når du er ferdig. Se Hurtigtaster for den aktive kombinasjonen og opptaksmåten.

### 4. Prøv uten ekstra LLM først

NB-Whisper er talemodellen som gjør lyd til skrevet tekst, normalt med tegnsetting. Du trenger ikke en annen LLM for å diktere eller redigere teksten selv. La tekstopprydding være av. Tale og eventuell lokal tekstopprydding behandles på Mac-en, uten konto, abonnement, API-nøkkel eller opplasting av lyd for behandling.

![Innstillinger – oversikt over sidene](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/innstillinger.png)

*Innstillinger – oversikt over sidene*

- [Installering og oppdatering](#install)

## Installering og oppdatering

### Hvilken Mac passer pakken til?

Denne pakken er laget for Mac med Apple-chip i M-serien, fra M1 og nyere, og krever macOS 26 eller nyere. Intel-Mac støttes ikke. Kontroller Apple-menyen → Om denne maskinen. Pakken er fysisk prøvd på Apple M4 med 24 GB minne; andre maskiner og alle OS-versjoner er ikke verifisert. Fremtidige chipmodeller er ikke en støttegaranti.

### Last ned, dra og åpne

Hent DMG-filen fra DSSA Tale Mac-utgivelsene på GitHub. Ingen GitHub-konto trengs. Åpne filen fra Nedlastinger, dra DSSA Tale til Applications / Programmer og vent på kopieringen. Åpne appen fra Programmer. Ikonet med dra til Programmer på skrivebordet er en montert installasjonsdisk; løs den ut i Finder etterpå. Ikke velg Source code.

### Apples varsel ved første åpning

Testutgaven er ikke Developer ID-signert eller Apple-notarisert. Hvis Apple ikke kan kontrollere appen for skadevare, velg Ferdig. Hvis du stoler på denne utgaven: Systeminnstillinger → Personvern og sikkerhet → Åpne likevel, og bekreft selv med passord eller Touch ID. Ikke slå av Gatekeeper. Hvis varselet sier at appen vil skade maskinen eller er skadet, stopp og kontakt utgiveren. En administrert jobb-Mac kan kreve IT-hjelp.

### Oppdater uten å slette data

Avslutt DSSA Tale med ⌘Q før du erstatter den samme appen i Programmer med en nyere DMG-utgave. Ikke slett brukermappen eller nedlastede modeller. Notater, modeller og valg beholdes normalt ved oppdatering av samme app. Eksporter viktige notater først. Automatiske OpenWhispr-oppdateringer er slått av. Ny testutgave kan kreve at innlimingstillatelsen fornyes.

- [Diktering og notatblokk](#dictation)

## Diktering og notatblokk

### Tekst der markøren står

La DSSA Tale være åpen. Klikk i et skrivbart felt i Word, Outlook, Mail, Teams eller et annet program. Start opptaket med aktiv hurtigtast, snakk og stopp opptaket. Teksten behandles og settes inn etterpå hvis automatisk innliming er på og Mac-tillatelsen er gitt. Tale vises ikke nødvendigvis fortløpende i målfeltet. Kontroller særlig navn og tall.

### Notatblokk og historikk på Hjem

Automatisk notatblokk samler ferdige dikteringer når lokal historikk er tillatt. Samme notat finnes under Notater; det er ikke en ekstra, uavhengig kopi. Kopier notatet kopierer hele blokken. Tøm notatblokken tømmer bare denne blokken. Angre tømming kan hente den tilbake. Dette endrer ikke tekst i andre apper eller dikteringshistorikken under blokken.

### Mikrofon, høyttaler og tester

Innstillinger → Tale og mikrofon: velg standardinngangen eller en bestemt mikrofon. BlackHole mottar bare lyd som er rutet dit; det er ikke en fysisk mikrofon. Høyttalervalget gjelder appens testlyd og dikteringslyder, ikke all Mac-lyd. Test valgt mikrofon tar opp fem sekunder og prøver talegjenkjenning. Test i et tomt dokument bruker en fast tekst og tester innliming, ikke mikrofonen.

![Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/hurtigtaster.png)

*Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden*

![Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/mikrofon.png)

*Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett*

- [Talemodell og språk](#models)

## Talemodell og språk

### To utgaver av samme Large-modell

Assistent → Tale til tekst – start her: Full presisjon er standard og lastes ned som 3,10 GB. q5_0 lastes ned som 1,08 GB og bruker vanligvis mindre minne. Begge er NB-Whisper Large, videre trent for norsk av Nasjonalbiblioteket med utgangspunkt i OpenAIs Whisper. De er ikke småmodeller. Filstørrelse er diskplass, ikke totalt RAM-behov.

### Bokmål, nynorsk og menyspråk

Målform under Assistent velger bokmål eller nynorsk for transkripsjonen. Menyspråk under Innstillinger → Utseende og språk velger bokmål, nynorsk eller engelsk i grensesnittet og denne hjelpen. Når du velger bokmål eller nynorsk i ett av disse språkvalgene, følger både transkripsjon, menyer og hjelp det valget. Engelske menyer endrer ikke målformen for transkripsjon. Valgene beholdes etter omstart. Nynorsk krever ingen ekstra LLM. Kontroller at etterarbeid eller eksport ikke har endret målformen.

### Last ned, velg og avinstaller

Last ned henter og kontrollerer modellen. Bruk denne modellen velger den til diktering, lydimport og møtetranskripsjon. Valgt modell betyr ikke at den kjører akkurat nå; se Aktiv talemotor. Kontroller modeller oppdaterer status. Avinstaller modell sletter bare modellfilen etter bekreftelse. Velg en annen installert talemodell før du avinstallerer den valgte.

### Akselerasjon og Silero VAD

Automatisk og Metal bruker Apple Silicon-grafikken; CPU er et alternativ som kan være tregere. Endret akselerasjon gjelder etter omstart. Aktiv talemotor viser motorens faktiske status når ressursmålingen er på. Silero VAD finner tale og stillhet, ikke forskjellige talere. Egne brytere gjelder diktering og felles lydimport/notatopptak. VAD kan klippe korte eller nølende ytringer; slå det av hvis ord forsvinner.

![NB-Whisper-modeller, målform og akselerasjon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/assistent.png)

*NB-Whisper-modeller, målform og akselerasjon*

- [Valgfritt tekstetterarbeid](#cleanup)

## Valgfritt tekstetterarbeid

### Valgfritt etterarbeid – ikke talegjenkjenning

Andre språkmodeller – tekstbehandling ligger under Assistent. Disse LLM-ene arbeider med ferdig tekst: opprydding, formatering, spørsmål eller oppsummering. De hører ikke lyd og skiller ikke stemmer. De er unødvendige for vanlig diktering og manuell tekstredigering. Prøv NB-Whisper alene først. Ekstra behandling kan gi lengre ventetid og endre ord eller mening.

### Modellvalg er ikke en på-bryter

Last ned en valgfri tekstmodell, velg Bruk denne tekstmodellen, og slå bare på Rydd diktering automatisk hvis du ønsker dette. Modellvalg og nedlasting skal ikke slå på opprydding. Statusen Tekstopprydding: av/på viser valget. Ny installasjon starter med av; et uttrykkelig lagret valg beholdes. Rydd teksten, Formater notat og Spør lokal assistent er handlinger du selv starter på tekst.

### Råd for bokmål og nynorsk

Qwen3 4B Q4 er en første kandidat å prøve, Qwen3.5 2B Q4 et mindre alternativ, og Gemma 3 4B Q4 et sammenligningsalternativ. Dette er ikke en målt rangering av norsk kvalitet. Ingen av dem er dokumentert som best på nynorsk i denne utgaven. Kontroller navn, tall og målform; behold originalen. Ved nynorsk anbefales rå NB-Whisper-tekst først. Hugging Face er nedlastingsstedet; Qwen og Google er modellutviklerne.

### Små modeller og minne

De foreslåtte Q4-filene er omtrent 1,40 GB for Qwen3.5 2B, 2,50 GB for Qwen3 4B og 2,49 GB for Gemma 3 4B. Dette er nedlastingsstørrelser, ikke reservert RAM. Sammenhengslengde, mellomlagring og motoren krever mer minne. Store 8B/9B-modeller foreslås ikke for nye nedlastinger. En absolutt RAM-grense på 10 GB er ikke dokumentert eller håndhevet; se Minne, CPU og personvern.

![Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstmodeller.png)

*Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering*

- [Notater og dokumenteksport](#notes)

## Notater og dokumenteksport

### Hjem og Notater

Hjem viser dikteringshistorikk og den automatiske notatblokken. Notater er arbeidsflaten for navngitte dokumenter, mapper, opptak og etterarbeid. Den automatiske blokken vises begge steder som samme notat. Søk-knappen søker i notater og transkripsjoner. Klikk et resultat for å åpne det. Bruk Nytt notat for et eget dokument, gi det en tittel og organiser det i mapper.

### Transkripsjon, notater og KI-handlinger

Transkripsjon viser den gjenkjente talen; Notater er teksten du redigerer. Handlinger kan formatere eller oppsummere med en valgt lokal tekstmodell. Du kan lage en egen handling ved å gi den navn og instruksjon. Uten installert tekstmodell er KI-valgene utilgjengelige. Et KI-referat er et utkast som må kontrolleres mot kilden, særlig vedtak, oppgaver og hvem som sa hva.

### Word, PDF, tekst og lyd

Eksportvalgene lar deg lagre Word-dokument, PDF eller ren tekst. Velg selv om tidsstempler og talernavn eller talernummer skal være med. Kopier teksten legger teksten i utklippstavlen. Lagre lydfil lagrer tilgjengelig kildelyd separat. Kontroller eksporten før deling. Et dokument lagret under Notater er ikke automatisk en Word- eller PDF-fil i Finder.

### Sletting og historikk

Søppelkasseknapper gjelder elementet eller området de står ved. Les bekreftelsen før du sletter alle eller fjerner et dokument. Tøm notatblokken er noe annet enn å slette dikteringshistorikk. Vis forkastede viser forkastede opptak der de er bevart. Eksporter viktige dokumenter før en testoppdatering eller større opprydding.

![Notater – førstegangsvisning med Kom i gang og valgfri systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/notathandlinger.png)

*Notater – førstegangsvisning med Kom i gang og valgfri systemlyd*

- [Møter og talermerking](#meetings)

## Møter og talermerking

### 1. Velg notatet

Åpne Notater i venstremenyen. Velg et eksisterende notat, eller Nytt notat, og gi det en tittel. Nytt notat alene starter ikke opptak. Møtesnarveien og godkjent automatisk møtestart kan derimot opprette et notat og starte opptaket direkte: se etter Opptak pågår.

### 2. Start møteopptaket

Trykk Start møteopptak nederst i notatet. Knappen endres til Stopp møteopptak. Hold appen åpen. Du kan bytte side under opptaket; opptaket fortsetter og en status med vei tilbake til notatet vises.

### 3. Mikrofon og møtelyd

Velg mikrofon i Innstillinger → Tale og mikrofon. Start Teams eller den andre møteappen selv. DSSA Tale prøver å ta opp valgt mikrofon og systemlyden fra andre apper på Mac-en; dette er ikke en Teams-bot. Tillat Mikrofon og opptak av systemlyd når macOS spør. Under Systeminnstillinger → Personvern og sikkerhet ligger Mikrofon og opptak av skjerm/systemlyd (navnet varierer med macOS). Førstegangsoppsettet for Notater har også Systemlyd. Uten tilgang til systemlyd kan opptaket bli bare mikrofonen. Tilgjengelighet gjelder innliming i andre apper, ikke møtelyden. BlackHole er en virtuell inngang og hører bare det som allerede rutes til den. Ta et kort prøveopptak med lyd fra begge sider før et viktig møte; systemlyd kan også ta med andre appers lyder.

### 4. Underveis eller etter møtet

Før opptaket: Innstillinger → Opptak og innliming → Møtebehandling. Ta opp først, transkriber etterpå (standard) lagrer midlertidige lydbiter og behandler dem etter stopp. Transkriber under møtet bygger teksten opp mens du snakker; de siste lydbitene behandles etter stopp. Begge bruker valgt NB-Whisper-modell lokalt. La appen arbeide til lagringen er bekreftet.

### 5. Stopp og følg framdriften

Trykk Stopp møteopptak når møtet er ferdig. Opptaket stanser, men Transkriberer lyden … blir stående mens motoren arbeider. Etteropptak viser ferdig behandlet lyd mot total lydmengde og prosent, oppdatert etter hver ferdige lydbit. Mikrofon og systemlyd behandles hver for seg; summen kan være større enn møtets varighet. Stillhet som er kontrollert og hoppet over, teller som behandlet. Tid brukt og resttid vises i minutter og sekunder; resttid er et anslag for tekstfasen og vises først etter målbar framdrift. Talerfordeling og lagring er egne trinn uten oppdiktet prosent. Ikke avslutt appen før Ferdig – utskriften er lagret, eller en tydelig feil vises.

### 6. Finn og eksporter utskriften

Åpne det samme notatet under Notater og velg Transkripsjon. Utskriften lagres automatisk lokalt i dette notatet. Vis tekstfil i Finder åpner plasseringen til samtalens lokale tekstfil. Lagre Word, Lagre PDF eller Lagre TXT lager et dokument der du velger; tidsstempler og talernavn er valgfrie. Fanen Notater er egne skrevne notater og er ikke det samme som utskriften. Ved feil vises hva som mislyktes; brukbar tekst beholdes selv om talerfordelingen feiler.

### Stemmer og personnavn

Stemmeskille grupperer lignende stemmer. Kontroller personnavn og rett talermerkingen; Ukjent taler kan bli stående. Dette lover ikke ett separat lydspor per deltaker eller sikker automatisk navngiving. Community-1-valget gjelder lydimport; det er ikke en automatisk Community-1-kobling til direkte møteopptak.

### Informer deltakerne

Lokalt opptak varsler ikke nødvendigvis møtedeltakerne automatisk. Informer deltakerne om opptaket før du starter.

### Skill talere ved lydimport

Lydfiler → Skill talere: Community-1 er en valgfri lokal talermodell, ikke en LLM. Automatisk antall har øvre grense 15; det tvinges ikke fram 15 stemmer. Du godkjenner modelltilgang og vilkår selv hos Hugging Face. Appen kan hente kjøremiljøet automatisk og lagrer nøkkelen i macOS Keychain. CPU og MPS er separate valg; MPS er merket utprøving. Eksisterende sherpa-onnx er et alternativ.

### Community-1 krever egen modelltilgang

Community-1 er valgfri stemmeutskillelse. Den trenger en Hugging Face-konto og en Hugging Face-lesetilgangsnøkkel for modellnedlastingen. Dette er ikke en OpenAI-API-nøkkel. Vanlig NB-Whisper-diktering trenger ikke dette.

### 1. Godkjenn modelltilgang

Åpne modellvilkårene nedenfor. Logg inn eller opprett en Hugging Face-konto, les vilkårene og godkjenn selv tilgang til pyannote/speaker-diarization-community-1. Modellsiden opplyser også hvilke kontoopplysninger som deles med modellutgiveren. Bruk den samme kontoen når du lager nøkkelen.

### 2. Opprett en nøkkel med lesetilgang

Klikk Opprett Hugging Face-nøkkel. Velg Fine-grained og et navn, for eksempel DSSA Tale Mac. Under Repositories trenger du lesing av offentlige modeller med godkjenningskrav: «Read access to contents of all public gated repos you can access». Dette gir ikke tilgang før modellvilkårene er godkjent på kontoen. Ikke velg Write, private lagre, organisasjonsadministrasjon, betaling eller Inference. En vanlig Read-nøkkel kan også brukes, men gir bredere lesetilgang til kontoens lagre.

### 3. Lim nøkkelen inn i DSSA Tale

Kopier nøkkelen som begynner med hf_. Gå tilbake til Lydfiler → Skill talere med lokal talermodell → Community-1. Lim den i feltet «Hugging Face-lesetilgangsnøkkel» i Community-1-oppsettet. Sett først opp kjøremiljøet med knappen nedenfor hvis det mangler. Kryss av at du selv har godkjent modellvilkårene, og klikk Hent modellen separat. Vent på bekreftelsen før du importerer lyd med Community-1.

### Sikker nøkkel og lokal analyse

Nøkkelen lagres i macOS Nøkkelring og brukes bare ved modellnedlasting. Ikke lim den inn i chat, e-post eller notater. Når modellen er hentet, skjer taleranalysen lokalt uten lydopplasting. Du kan administrere eller tilbakekalle nøkkelen hos Hugging Face.

### Hvis nedlastingen mangler tilgang

Ved manglende tilgang (401/403): kontroller at vilkårene er godkjent på samme konto som nøkkelen, at modelltilgangen er innvilget og at nøkkelen tillater lesing av offentlige gated-modeller. Mer skrive- eller betalingstilgang løser ikke manglende modellgodkjenning.

### Kanaler, ordtider og usikkerhet

Undersøk først ser på originalens kanaler. Velg én kanal eller nedmiksing til mono hvis nødvendig; originalen endres ikke. Automatisk sammenkobling av uavhengige mikrofonkanaler er ikke implementert. Standard ordtider er raskere. WhisperX krever egne modeller for bokmål/nynorsk og mer tid og minne. Talere kobles med tidsdata; Ukjent taler beholdes når koblingen er usikker. Gi navn og korriger manuelt. Stemmer er ikke verifiserte personidentiteter.

![Møter – lokal lyd fra mikrofon og systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moter.png)

*Møter – lokal lyd fra mikrofon og systemlyd*

![Møteveiledningen i den installerte appen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moteveiledning.png)

*Møteveiledningen i den installerte appen*

- [Lydfiler, mapper og kø](#files)

## Lydfiler, mapper og kø

### Filtyper som kan velges

Mappe- og flervalg støtter MP3, WAV, M4A, M4B, FLAC, OGG/OGA, Opus, AIF/AIFF, WebM og lyd fra MP4, MOV og MKV. En bestemt kodek, skadet fil eller kopibeskyttelse kan likevel hindre lesing. WMA er ikke med i denne importlisten. Originalen beholdes; appen lager en arbeidskopi for talegjenkjenning.

### Flere filer eller en hel mappe

Klikk Lydfiler i venstremenyen. Velg lydfiler gir flervalg; Velg mappe med lydfiler leser en mappe. Kryss av Ta med undermapper før mappevalget hvis alt lenger ned også skal med. Start transkribering behandler én fil om gangen og lagrer et eget dokument under Notater før neste starter. Ingen fast grense på antall filer eller abonnementskvote; disk, minne og tid begrenser i praksis.

### Fremdrift, stopp og fortsett

Status viser opptakslengde, tid brukt, behandlet lyd og anslått resttid i minutter og sekunder. Transkripsjon og talerfordeling er ulike trinn. En ferdig transkripsjon betyr ikke at hele jobben er lagret. Du kan bytte side mens appen kjører. La appen være åpen: kølisten gjenopprettes ikke etter avslutning. Stopp køen pauser; Fortsett køen starter videre. Feilede filer kan legges tilbake i køen.

### Lagring, rydding og Taleopptak

Automatisk kølagring krever tillatt lokal historikk. Ved lagringsfeil pauses køen og teksten beholdes. Tøm kølisten fjerner bare filvalg og status, ikke originalfiler eller dokumenter. Word, PDF og tekstfil eksporteres separat fra dokumentene. Åpne Apple Taleopptak åpner Apples app; del eller eksporter opptaket til en tilgjengelig mappe og velg filen her. Skymappeknappene åpner den faste mappen i Finder.

![Lydfiler – flervalg, mapper, undermapper og eksport](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/lydfiler.png)

*Lydfiler – flervalg, mapper, undermapper og eksport*

- [Ordliste og tekstsnutter](#dictionary)

## Ordliste og tekstsnutter

### Ordliste

Ordliste i venstremenyen lar deg legge inn navn, faguttrykk og forkortelser som er vanskelige å kjenne igjen. Legg til egne ord eller importer en ordliste. Fjern feil eller uønskede oppføringer med slettevalget. Ordene hjelper gjenkjenningen, men garanterer ikke riktig skrivemåte. Bruk nøytrale eksempler og unngå å dele private ordlister uten kontroll.

### Tekstsnutter

Fanen Tekstsnutter er for faste tekster du bruker ofte. Opprett en kort utløsende frase og teksten den skal erstattes med, for eksempel en standardhilsen. Rediger eller slett snutten når den ikke skal brukes lenger. En tekstsnutt er en lagret tekstregel, ikke en ekstra KI-modell.

![Ordliste – navn, fagord og forkortelser](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/ordliste.png)

*Ordliste – navn, fagord og forkortelser*

![Tekstsnutter – korte fraser blir til lagret tekst](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstsnutter.png)

*Tekstsnutter – korte fraser blir til lagret tekst*

- [Kalender, skylagring og e-post](#integrations)

## Kalender, skylagring og e-post

### Kalender og møteapper

Integrasjoner → Kalender har valg for Apple Kalender/FaceTime, Microsoft-kalender/Teams og Google Kalender/Meet. Valgene viser veiledning; de logger deg ikke inn eller gir tilgang. Legg kontoen til i Apples Kalender-app først. Tillat deretter lesing av Mac-ens kalendere i DSSA Tale hvis ønskelig. Dette kan omfatte flere kontoer. Kalenderlesing oppretter ikke møter eller starter opptak av seg selv.

### Google Disk, OneDrive/SharePoint og iCloud

Under Skymapper: Logg inn / administrer konto åpner leverandørens oppsett. En nettsideinnlogging alene lager ikke en mappe i Finder. For Google Disk: logg inn i Google Disk for Mac, trykk Finn Google Disk-mappen og Bruk denne mappen. Eller velg en fast mappe selv. Åpne mappe åpner Finder. Fjern mappevalg sletter ingen filer og logger deg ikke ut. Kontroller tilgangen på nytt oppdaterer lokal mappestatus, ikke nettsynkronisering.

### E-post og deling

E-post-fanen forklarer diktering i Mail, Outlook og andre tekstfelt. Sett markøren i meldingen og dikter; du sender selv. Appen leser ikke innboksen i denne utgaven. Dokumenter du selv lagrer i en synkronisert sky- eller Teams-mappe, kan lastes opp av den tjenesten. Dette er separat fra lokal talegjenkjenning. Passord og kontoer håndteres av Apple, Google eller Microsoft.

![Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/kalender.png)

*Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging*

![Skymapper – tjenesten må være tilgjengelig i Finder](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/skymapper.png)

*Skymapper – tjenesten må være tilgjengelig i Finder*

![E-post – diktering i tekstfelt, ikke innbokslesing](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/epost.png)

*E-post – diktering i tekstfelt, ikke innbokslesing*

- [Hurtigtaster og innstillinger](#settings)

## Hurtigtaster og innstillinger

### Hurtigtaster og opptaksmåte

Innstillinger → Hurtigtaster: klikk tastefeltet og trykk ønsket kombinasjon. Legg til en hurtigtast gir flere alternativer. Aktiv hurtigtast viser hva som faktisk ble registrert; en lagret tast er ikke alltid tilgjengelig. Trykk starter og stopper med to trykk. Hold inne tar opp mens tastene holdes. Møtesnarveien åpner møteopptak og kan fjernes separat. Unngå snarveier Mac-en eller andre apper allerede bruker.

### Opptak og innliming

Maksimal dikteringstid kan være 5, 10 eller 30 minutter, eller Stopp manuelt. Dette gjelder mikrofondiktering, ikke en kvote for importerte lydfiler. Automatisk innliming sender teksten til det aktive skrivefeltet. Behold teksten i utklippstavlen gir manuell ⌘V som reserve. Lyd ved start og stopp styrer tonesignaler. Skjul dikteringsikonet automatisk skjuler det flytende ikonet når det er inaktivt.

### Utseende, tekststørrelse og vindu

Utseende og språk: velg lyst, mørkt eller Følg Mac-en. Tekststørrelse 100–150 % viser en forhåndsvisning og lagres automatisk. Aksentfarge endrer fargepreget; rødt for sletting og egne tjenestefarger beholdes. Menyspråk er separat fra transkripsjonens målform. Bruk de vanlige røde, gule og grønne Mac-knappene for lukk, minimer og fullskjerm. Lukk vinduet er ikke nødvendigvis Avslutt appen; ⌘Q avslutter.

### System og lokal logging

System viser appversjonen og at oppdatering er manuell. Detaljert feilsøkingslogging lagrer ekstra lokale opplysninger. Slå den på bare ved feilsøking og av etterpå. Åpne loggmappe viser filene i Finder. Ikke send hele logger uten å kontrollere private opplysninger. Start ved innlogging kan settes i macOS: Systeminnstillinger → Generelt → Påloggingsobjekter, legg til den installerte appen fra Programmer.

![Opptak og innliming – automatisk innliming og møtebehandling](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/opptak.png)

*Opptak og innliming – automatisk innliming og møtebehandling*

![Utseende og språk – tema, skriftstørrelse og menyspråk](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/utseende.png)

*Utseende og språk – tema, skriftstørrelse og menyspråk*

![System – versjon og lokal feilsøkingslogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/system.png)

*System – versjon og lokal feilsøkingslogging*

- [Minne, CPU og personvern](#memory)

## Minne, CPU og personvern

### Diskplass er ikke reservert RAM

En nedlastet modell bruker diskplass. Den reserverer ikke samme mengde arbeidsminne hele tiden. Når den lastes og brukes, trengs vekter, mellomlagring og arbeidsbuffere. En varm motor kan beholde modellen en stund for raskere neste bruk. NB-Whisper og en valgfri LLM kan bruke minne samtidig. Apple Silicon har fellesminne for CPU og GPU; det er ikke en separat VRAM-pott som skal legges til RAM-tallet.

### App CPU og App RAM nederst

App CPU viser appen og modellmotorenes bruk som andel av hele Mac-ens CPU-kapasitet. App RAM viser deres samlede RSS mot Mac-ens totale minne, ikke hele systemets bruk. Delte minnesider kan telles flere ganger i summen. Dette er en arbeidsindikator, ikke en eksakt unik minnefordeling. Filstørrelsen på modellkortet er et annet tall.

### GPU, bytteminne og minnepress

Mac GPU gjelder hele Mac-en, ikke bare DSSA Tale. Bytteminne er systemets bruk av disk som ekstra minne; mye swap sammen med høyt minnepress kan gjøre alt tregere. Minnepress oppsummerer systemets minnesituasjon. Skjul CPU og minne skjuler tallene og stopper appens periodiske ressursmåling. Vis CPU og minne slår den på igjen. Dette endrer ikke modellvalget eller transkripsjonen.

### Lokalt arbeid og valgfrie nettjenester

Talegjenkjenning og eventuell lokal tekstopprydding kjører på Mac-en. Lyd og transkripsjoner lastes ikke opp for behandling. Nett trengs for å hente talemodell, valgfrie tekstmodeller og eventuelt kjøremiljø/talermodell. Hjelpelenker og konto-/kalendertjenester kan bruke nett når du velger dem. Lagrer du selv i iCloud, Google Disk, OneDrive eller Teams-mapper, kan leverandøren synkronisere filene. Lokal historikk og notater ligger på denne Mac-en.

- [Kontakt DSSA Tale](#support)

## Kontakt DSSA Tale

### Kontakt for denne DSSA-utgaven

Bruk e-postknappen nedenfor for å åpne en kladd til stein@haldendemensforening.no i e-postprogrammet ditt. Ingenting sendes før du selv velger Send. Oppgi DSSA-versjonen, Mac-modell, macOS-versjon og hva du prøvde. Ikke legg ved private opptak, transkripsjoner, nøkler eller passord. OpenWhisprs generelle brukerstøtte er ikke ansvarlig for denne tilpasningen.

### Hva er fortsatt under utprøving?

Dette er en testutgave. Den lange filkøprøven dokumenterer lagring, ikke feilfri språkgjenkjenning. Alle Mac-modeller, møteapper, mange samtidige talere og hjelpemodellenes bokmåls-/nynorskkvalitet er ikke fullstendig kontrollert. Apples Developer ID-signering og notarisation mangler fortsatt. Se teststatus ved nedlastingen for presise målinger og begrensninger.

- [Feilsøking og feilrapport](#bugs)

## Feilsøking og feilrapport

### Ingen lyd eller ingen tekst

Kontroller valgt mikrofon under Tale og mikrofon og prøv femsekunderstesten. Tillat mikrofon under Systeminnstillinger → Personvern og sikkerhet → Mikrofon. En pipelyd betyr ikke at mikrofonen mottar tale. BlackHole er bare riktig hvis lyd allerede sendes dit. Sjekk også at talemodellen viser Klar til bruk.

### Teksten kommer bare med ⌘V

Slå på automatisk innliming i Opptak og innliming. Bruk knappen Tilgjengelighet og innliming under Tale og mikrofon for å åpne Mac-siden. Slå på DSSA Tale under Tilgjengelighet, kalt Enhetskontroll og datatilgang på den testede macOS-utgaven. Avslutt med ⌘Q og start igjen. Etter en testoppdatering kan gammel oppføring måtte fjernes og den eksakte appen fra Programmer legges til på nytt. Endre bare DSSA-oppføringen.

### Treg behandling eller feil i køen

Prøv uten automatisk tekstopprydding og kontroller Metal under Assistent. Første modellinnlasting kan ta lengre tid. Se minnepress og ledig diskplass. En ødelagt lydfil kan feile mens andre fortsetter. Lagringsfeil pauser køen; kontroller plassen og fortsett uten å slette teksten. Ikke avslutt en aktiv kø hvis du vil beholde kølisten.

### Rapporter feil til riktig prosjekt

Knappen nedenfor åpner DSSA Tale Mac sitt GitHub-prosjekt, ikke Windows-prosjektet eller OpenWhisprs feilside. En GitHub-feilrapport er offentlig. Oppgi versjon, trinn og anonymisert feilmelding; ikke last opp private lydfiler eller dokumenter. Bruk e-post under Kontakt hvis du er usikker på hva du kan dele.

- [Opphav og rettigheter](#rights)

## Opphav og rettigheter

### Opphav og lisens

DSSA Tale er en uavhengig Mac-tilpasning av OpenWhispr 1.9.2, som har MIT-lisens. NB-Whisper fra Nasjonalbiblioteket bygger på OpenAIs Whisper og har Apache-2.0-lisens. Dette er ikke et offisielt produkt fra OpenWhispr, Nasjonalbiblioteket eller Apple. Opphavslenkene nedenfor er kreditering, ikke en annen brukerstøtte for appen.

### Medfølgende komponenter og valgfrie modeller

Lisensopplysninger følger appen i Contents/Resources/legal: blant annet FFmpeg/Opus, Eigen, whisper.cpp, llama.cpp og øvrige komponenter. FFmpeg er et eget LGPL-bygg uten GPL/nonfree; påkrevde kilder følger med. Community-1-modellen har CC-BY-4.0 og pyannote.audio MIT. Valgfrie Qwen- og Gemma-modeller har egne vilkår ved kilden. Ingen LLM- eller NB-Whisper-vekter følger denne installasjonsfilen.

