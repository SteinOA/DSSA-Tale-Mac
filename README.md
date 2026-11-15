# DSSA Tale for Mac

**Lokal norsk diktering, møteopptak og transkripsjon på Mac.** Hele formålet med DSSA Tale er lokal behandling. Appen bruker Nasjonalbibliotekets NB-Whisper til å gjøre tale om til tekst på Mac-en. Når modellen er lastet ned, kan diktering, møtebehandling og lydimport gjøres uten konto, abonnement, API-nøkkel eller en skytjeneste som behandler innholdet.

DSSA Tale er en uavhengig tilpasning av OpenWhispr. Dette er ikke et offisielt eller sertifisert produkt fra OpenWhispr, Nasjonalbiblioteket eller Apple.

### Testfunksjon for Teams uten integrering

DSSA Tale kan brukes som en lokal testløsning for å ta opp Teams-samtaler møte etter møte. Det krever ingen Teams-bot, Microsoft-innlogging, tillegg i Teams, Teams-API eller tilgang til Teams-kontoen. DSSA Tale kobler seg ikke til Teams-skyen. Du starter og stopper opptaket i DSSA Tale, og hvert møte lagres lokalt som et eget notat. Appen styrer ikke Teams og sender ingen opptaksvarsling til deltakerne. Den som starter opptaket må derfor informere deltakerne og få et tydelig muntlig samtykke før hvert møteopptak.

## Last ned

**[Last ned DSSA Tale 1.9.45 for Apple Silicon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/DSSA-Tale-1.9.45-Apple-Silicon.dmg)**

[Les om utgivelsen og installasjonen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.45-beta.1). Dette er en offentlig testutgave. Installasjon og ny installasjon er gjennomført hundrevis av ganger i utviklings- og testarbeidet, og appen fungerer i det kontrollerte Mac-oppsettet. Apple har ikke kontrollert og godkjent appen for vanlig automatisk installasjon, så macOS kan fortsatt spørre om ekstra godkjenning første gang du åpner den.

## Innhold

- [Hva kan DSSA Tale gjøre?](#hva-kan-dssa-tale-gjøre)
- [Hva trenger du?](#hva-trenger-du)
- [Installer appen](#installer-appen)
- [Gjør appen klar første gang](#gjør-appen-klar-første-gang)
- [Dikter i Word, Outlook, Teams og andre programmer](#dikter-i-word-outlook-teams-og-andre-programmer)
- [Ta opp og transkriber et møte](#ta-opp-og-transkriber-et-møte)
- [Lag tekst fra lydfiler og mapper](#lag-tekst-fra-lydfiler-og-mapper)
- [Notater, søk og eksport](#notater-søk-og-eksport)
- [Modeller og språk](#modeller-og-språk)
- [Personvern og lokal behandling](#personvern-og-lokal-behandling)
- [Oppdater appen](#oppdater-appen)
- [Teststatus og kjente begrensninger](#teststatus-og-kjente-begrensninger)
- [Bruksanvisning, kilder og hjelp](#bruksanvisning-kilder-og-hjelp)

## Hva kan DSSA Tale gjøre?

| Område | Dette kan du gjøre |
| --- | --- |
| Diktering | Hold inne en hurtigtast mens du snakker. Når du slipper, blir talen gjort om til tekst og limt inn der markøren står. |
| Bokmål og nynorsk | Velg ønsket målform før opptak eller filimport. Menyene finnes også på engelsk. |
| Møteopptak | Ta opp mikrofon og systemlyd, og lag en utskrift underveis eller etter møtet. |
| Teams | Ta opp Teams-samtaler lokalt, møte etter møte, uten bot, tillegg, Microsoft-innlogging eller annen integrering i Teams. Valgfri automatisk start finnes som en utprøvingsfunksjon. |
| Lydimport | Velg én fil, flere filer eller en mappe med undermapper. Hver ferdige fil lagres som et eget lokalt notat. |
| Lange opptak | Behandle lange lydopptak uten en fast timegrense. Ledig plass, maskinens kapasitet og filens tilstand setter de praktiske grensene. |
| Notater | Samle diktater i notatblokken, lag egne møte- og arbeidsnotater, organiser i mapper og bruk søk. |
| Eksport | Kopier teksten eller eksporter til tekst, Word eller PDF når valget finnes i notatet. |
| Ordliste og tekstsnutter | Legg inn navn og fagord som ofte blir feil, eller bruk en kort talefrase til å sette inn en fast tekst. |
| Talermerking | Bruk valgfri lokal stemmegruppering. Appen kan gruppere stemmer, men du må kontrollere navn og usikre resultater. |
| Tekstopprydding | Bruk en valgfri lokal språkmodell til å rydde teksten eller lage et referat. Dette er av ved ny installasjon. |

## Hva trenger du?

- En nyere Mac med Apple-prosessor, for eksempel M1, M2, M3 eller M4. Det finnes ingen utgave for eldre Intel-Mac-er.
- macOS 26 eller nyere. Den faktiske betatesten er gjort på en Mac mini M4.
- Internett første gang for å laste ned appen og talemodellen.
- Minst omtrent 3,1 GB ekstra diskplass for den anbefalte talemodellen, i tillegg til plass for app, arbeidsfiler og egne opptak.
- Mikrofontilgang. Automatisk innliming trenger også tillatelse under **Personvern og sikkerhet**.

Du trenger ikke Terminal, Homebrew eller kunnskap om programmering for vanlig bruk.

## Installer appen

1. Klikk på DMG-lenken øverst på denne siden. Ikke velg GitHubs «Source code».
2. Avslutt en eldre DSSA Tale hvis den kjører.
3. Åpne den nedlastede DMG-filen.
4. Dra **DSSA Tale** til mappen **Programmer**.
5. Åpne **Programmer** og dobbeltklikk **DSSA Tale**.
6. Hvis Apple blokkerer appen, åpner du **Systeminnstillinger → Personvern og sikkerhet**. Finn meldingen om DSSA Tale og velg **Åpne likevel** dersom du stoler på nedlastingen.

Ikke slå av den vanlige Mac-beskyttelsen. Godkjenn bare appen du lastet ned fra denne GitHub-utgivelsen.

## Gjør appen klar første gang

1. Velg språk for menyene.
2. Velg den anbefalte NB-Whisper-modellen og vent til den er ferdig lastet ned.
3. Gi DSSA Tale tilgang til mikrofonen.
4. Velg mikrofonen og gjennomfør lydtesten.
5. Gi appen lov til å lime inn tekst: bruk knappen i veiviseren og slå på DSSA Tale under **Personvern og sikkerhet → Tilgjengelighet**. På nyere macOS kan området hete **Enhetskontroll og datatilgang**.
6. Kjør testen for automatisk innliming.
7. Fullfør oppsettet og prøv et kort diktat i et tomt dokument.

Hvis en gammel DSSA Tale står i tillatelseslisten, men innliming ikke virker, fjerner du bare den gamle oppføringen. Legg deretter inn den aktuelle appen fra **Programmer** på nytt og start appen igjen. Modellen og notatene skal beholdes.

## Dikter i Word, Outlook, Teams og andre programmer

1. Klikk i feltet der teksten skal stå.
2. Hold inne `⌘ + ⇧ + mellomrom` mens du snakker. Hvis du har endret hurtigtasten, bruker du den som vises i appen.
3. Slipp tastene når du er ferdig.
4. Vent mens DSSA Tale lager teksten og limer den inn.
5. Les gjennom teksten og rett navn, tall eller fagord.

Hvis teksten ikke limes inn, ligger den fortsatt i DSSA Tale og i utklippstavlen. Lim den inn selv med `⌘ + V`. Noen beskyttede felt tillater ikke automatisk innliming.

## Ta opp og transkriber et møte

1. Informer deltakerne om opptaket.
2. Opprett eller åpne et notat i DSSA Tale.
3. Velg **Start møteopptak**.
4. Kontroller at opptakstiden går og at både mikrofon og systemlyd er med.
5. Velg om teksten skal lages underveis eller etter møtet.
6. Trykk **Stopp møteopptak** når møtet er slutt.
7. La appen stå åpen til opptak, transkripsjon og lagring er ferdig.
8. Kontroller utskriften og hvem som snakker før du bruker eller eksporterer teksten.

Diktering i et Teams-tekstfelt er vanlig innliming. Møteopptak er en egen funksjon. DSSA Tale endrer ikke Mac-ens globale lydruting, og systemlyd krever riktige macOS-tillatelser eller et lydoppsett som allerede virker.

Under **Innstillinger → Opptak og innliming** finnes automatisk start når Teams bruker mikrofonen. Dette er en valgfri utprøvingsfunksjon og er av ved ny installasjon. Gjør alltid et kort prøveopptak før et viktig møte.

Når ett møte er ferdigbehandlet, kan du opprette neste notat og starte et nytt lokalt opptak. Dette er fortsatt en testfunksjon. Kontroller lyd og opptaksindikator hver gang. DSSA Tale varsler ikke deltakerne, så be om og få et tydelig muntlig samtykke før hvert opptak. Følg også rutinene som gjelder i virksomheten din.

## Lag tekst fra lydfiler og mapper

1. Åpne lydimporten.
2. Velg én fil, flere filer eller en mappe.
3. Velg om undermapper skal tas med.
4. Velg bokmål eller nynorsk og eventuell talermerking.
5. Start importen og la appen være åpen.
6. Hver ferdige fil blir lagret som et eget notat.

Appen støtter vanlige formater som WAV, MP3, M4A, M4B, MP4, MOV, WebM, MKV, OGG, Opus, FLAC og AIFF når lydkodeken også kan leses. WMA og rå AAC-filer støttes ikke. AAC-lyd i M4A eller MP4 kan brukes. Originalfilene endres ikke.

Køen fortsetter automatisk mens appen er åpen. Den gjenopprettes ikke automatisk hvis appen avsluttes.

## Notater, søk og eksport

**Hjem** viser diktater og automatisk notatblokk. **Møter og notater** brukes til møteutskrifter og lengre notater. Du kan lage mapper og bruke søkefeltet til å finne lagret innhold.

En trygg arbeidsmåte er:

1. Gi notatet et tydelig navn.
2. Les råutskriften.
3. Rett navn, tall og talermerking.
4. Bruk valgfri tekstopprydding eller referatfunksjon.
5. Les resultatet på nytt.
6. Kopier eller eksporter den ferdige teksten.

## Modeller og språk

| Valg | Størrelse | Passer for |
| --- | ---: | --- |
| NB-Whisper Large, full presisjon | ca. 3,10 GB | Anbefalt når best mulig norsk resultat er viktigst. |
| NB-Whisper Large, mindre utgave | ca. 1,08 GB | Bruker mindre plass og vanligvis mindre minne. |

Begge modellene støtter bokmål og nynorsk. Modellfilene følger ikke med DMG-en; du laster ned én av dem i appen. Mac-en bruker Apple Silicon og Metal til lokal behandling.

En talemodell gjør lyd om til tekst. En valgfri språkmodell rydder eller bearbeider teksten etterpå. Du trenger ikke språkmodellen for vanlig diktering. Tekstopprydding er av ved ny installasjon.

Valgfri talermerking kan lastes ned separat. Community-1 krever at du godtar modellvilkår og kan kreve en Hugging Face-konto og tilgangsnøkkel. Dette er ikke nødvendig for vanlig NB-Whisper-diktering.

## Personvern og lokal behandling

Diktering, møtebehandling, lydimport, notater og lokal tekstopprydding skjer på Mac-en. Lyd og tekst sendes ikke til en KI-tjeneste for denne behandlingen. Ingen Teams-bot, Teams-API eller skytranskripsjon brukes.

Internett brukes til å laste ned appen og modellene og til lenker du selv åpner. Filer du selv legger i en mappe som synkroniseres av en annen app, kan naturligvis bli lastet opp av den andre appen. DSSA Tale trenger ikke en slik mappe for lokal bruk.

## Oppdater appen

1. Vent til alle opptak og importer er ferdige.
2. Avslutt DSSA Tale.
3. Last ned den nye DMG-filen fra dette repoets utgivelse.
4. Dra den nye appen til **Programmer** og erstatt den gamle når macOS spør.
5. Start appen og prøv et kort diktat.

En vanlig oppdatering av samme app skal beholde profil, modell, notater og innstillinger. Ikke slett brukerdata for å oppdatere. Ta vare på viktige eksporterte dokumenter.

## Teststatus og kjente begrensninger

DSSA Tale 1.9.45 er en beta for Apple Silicon. Installasjon, ny installasjon og oppdatering er gjennomført hundrevis av ganger i utviklings- og testarbeidet. Pakken fungerer i det kontrollerte Mac-oppsettet. Versjonsnavn, kontrollsum, oppstart, modellbevaring, automatisk innliming, filimport og relevante automatiske tester er kontrollert. Automatisk innliming i andre programmer er bekreftet av brukeren.

De mange installasjonene viser at pakken og installasjonsmåten fungerer. De betyr ikke at alle Mac-modeller, programmer, lydformater, dialekter, møter eller talere er prøvd. En ny bruker må fortsatt godkjenne appen og gi mikrofon- og innlimingstillatelse. Automatisk Teams-start og begge lydretninger i et virkelig møte er ikke sluttverifisert. Kontroller alltid navn, tall, taleridentitet og tekst som er bearbeidet automatisk.

## Bruksanvisning, kilder og hjelp

- [Enkel trinnvis bruksanvisning](docs/BRUKSANVISNING-MAC.md)
- [Nettverk som kan brukes ved modellnedlasting og valgfrie tjenester](docs/network-allowlist.md)
- [OpenWhispr-opphav og teknisk bakgrunn](docs/UPSTREAM-README.md)
- [Kontrollsum for installasjonsfilen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/DSSA-Tale-1.9.45-Apple-Silicon.dmg.sha256)

Koden er MIT-lisensiert. NB-Whisper og andre komponenter og modeller har egne vilkår. Se [LICENSE](LICENSE) og lisensfilene som følger appen.

Meld feil under [Issues](https://github.com/SteinOA/DSSA-Tale-Mac/issues). Oppgi DSSA Tale-versjon, macOS-versjon, Mac-modell, modellvalg og hva du prøvde å gjøre. Ikke publiser private opptak, transkripsjoner, passord eller tilgangsnøkler.
