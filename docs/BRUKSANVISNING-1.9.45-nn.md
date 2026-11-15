# DSSA Tale for Mac – brukarrettleiing

Versjon 1.9.45 · 15.11.2026 · nynorsk

Denne rettleiinga gjeld Mac-utgåva 1.9.45. Bileta viser bokmålsmenyar og lokale val frå testmaskina. BlackHole og Ctrl + ⌘ + pil ned er personlege val, ikkje krav. Vel eigen mikrofon og sjå aktiv snøggtast. Appen heiter DSSA Tale utan «Test»; eldre hjelpetekstar kan ha feil namn. NB-Whisper treng ingen ekstra LLM. Private notat og opptak er ikkje tekne med. Betaen manglar Apple Developer ID/notarisering. Skjermbilete er dokumentasjon, ikkje ein ny full funksjonstest.

[Last ned appen og les teststatus](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.45-beta.1)

Knappane og felta som er omtalte i teksten, finst i DSSA Tale-appen. Denne nettsida endrar ingen innstillingar.

[Community-1 – modellvilkår](https://huggingface.co/pyannote/speaker-diarization-community-1) · [Hugging Face – tilgangsnøkler](https://huggingface.co/settings/tokens) · [E-post til DSSA](mailto:stein@haldendemensforening.no) · [Feilrapporter på GitHub](https://github.com/SteinOA/DSSA-Tale-Mac/issues)

## Innhold

- [Kom i gang](#kom-i-gang)
- [Installering og oppdatering](#installering-og-oppdatering)
- [Diktering og notatblokk](#diktering-og-notatblokk)
- [Talemodell og språk](#talemodell-og-språk)
- [Valfritt tekstetterarbeid](#valfritt-tekstetterarbeid)
- [Notat og dokumenteksport](#notat-og-dokumenteksport)
- [Møte og talarmerking](#møte-og-talarmerking)
- [Lydfiler, mapper og kø](#lydfiler-mapper-og-kø)
- [Ordliste og tekstsnuttar](#ordliste-og-tekstsnuttar)
- [Kalender, skylagring og e-post](#kalender-skylagring-og-e-post)
- [Snøggtastar og innstillingar](#snøggtastar-og-innstillingar)
- [Minne, CPU og personvern](#minne-cpu-og-personvern)
- [Kontakt DSSA Tale](#kontakt-dssa-tale)
- [Feilsøking og feilrapport](#feilsøking-og-feilrapport)
- [Opphav og rettar](#opphav-og-rettar)


## Kom i gang

### Du kan fullføre seinare

Øvst i oppsettet finst Opne appen – fullfør oppsettet seinare. Han opnar notat og resten av appen utan å påstå at diktering er klar. Heim viser Hald fram med oppsettet. Du kan alltid flytte vindauget i den vanlege Mac-tittellinja og dra kanten for å endre storleik. Fyrste gong bruker appen standardmikrofonen og standardutgangen på Mac-en, og Hald inne for å snakke. Vel eigne einingar berre om du ønskjer det.

### 1. Tre steg ved fyrste opning

Opne Finder → Program → DSSA Tale. Oppsettet har tre steg: Talemodell, Mikrofon og Innliming og test. Kvart steg viser status og kva du skal gjere vidare. Last ned éin NB-Whisper Large-modell i steg 1 og vent til Klar til bruk. I steg 2: Gi mikrofontilgang, vel Tillat frå macOS og vel rett mikrofon. I steg 3: Opne innlimingsløyvet. Under Personvern og tryggleik heiter sida Enhetskontroll og datatilgang på nyare macOS, elles Tilgjengelighet. Slå på DSSA Tale; manglar appen, legg han til frå Program. Gå tilbake og kontroller status. Start DSSA Tale på nytt bevarer steget. Test automatisk innliming opnar eit eige testdokument utan mikrofon. Kontroller at teksten faktisk kom inn. Trykk til slutt Opne DSSA Tale for diktering. Hjelp → Gå gjennom oppsettet opnar rettleiinga igjen utan å slette modellar eller notat.

### Berre lydfiler utan mikrofon

Om du berre vil transkribere ferdige lydfiler, last ned éin talemodell og vel Opne berre for lydfiler – innliming av. Du treng då ikkje mikrofon- eller innlimingsløyve. Automatisk innliming er avslått i denne modusen. Når du seinare vil diktere, bruk Hjelp → Gå gjennom oppsettet og fullfør mikrofon og innliming.

### 2. Finn talemodellen i menyen

Når programmet er ope, klikk Assistent i venstremenyen. Under Tale til tekst – start her finn du NB-Whisper frå Nasjonalbiblioteket. Klikk Last ned ved Large – full presisjon (3,10 GB), eller q5_0 (1,08 GB) for mindre minnebruk. Vent til Klar til bruk. Desse filene følgjer ikkje installasjonsfila. Du treng berre éin av dei.

### 3. Vel mikrofon og prøv

Vel Innstillingar → Tale og mikrofon. Vel mikrofonen du faktisk bruker, og prøv Test vald mikrofon i 5 sekund. Opne deretter eit tomt dokument i Tekstredigering, set markøren i dokumentet og bruk dikteringssnøggtasten. Standard er å halde ⌘ + ⇧ + mellomrom inne medan du snakkar og sleppe når du er ferdig. Sjå Snøggtastar for den aktive kombinasjonen og opptaksmåten.

### 4. Prøv utan ekstra LLM fyrst

NB-Whisper er talemodellen som gjer lyd til skriven tekst, normalt med teiknsetjing. Du treng ikkje ein annan LLM for å diktere eller redigere teksten sjølv. Lat tekstopprydding vere av. Tale og eventuell lokal tekstopprydding blir handsama på Mac-en, utan konto, abonnement, API-nøkkel eller opplasting av lyd for handsaming.

![Innstillinger – oversikt over sidene](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/innstillinger.png)

*Innstillinger – oversikt over sidene*


## Installering og oppdatering

### Kva Mac passar pakken til?

Denne pakken er laga for Mac med Apple-chip i M-serien, frå M1 og nyare, og krev macOS 26 eller nyare. Intel-Mac er ikkje støtta. Kontroller Apple-menyen → Om denne maskina. Pakken er fysisk prøvd på Apple M4 med 24 GB minne; andre maskiner og alle OS-versjonar er ikkje verifiserte. Framtidige chipmodellar er ikkje ein støttegaranti.

### Last ned, dra og opne

Hent DMG-fila frå DSSA Tale Mac-utgivingane på GitHub. Ingen GitHub-konto trengst. Opne fila frå Nedlastingar, dra DSSA Tale til Applications / Program og vent på kopieringa. Opne appen frå Program. Ikonet med dra til Program på skrivebordet er ein montert installasjonsdisk; løys han ut i Finder etterpå. Ikkje vel Source code.

### Apple-varselet ved fyrste opning

Testutgåva er ikkje Developer ID-signert eller Apple-notarisert. Dersom Apple ikkje kan kontrollere appen for skadevare, vel Ferdig. Dersom du stolar på denne utgåva: Systeminnstillingar → Personvern og tryggleik → Opne likevel, og stadfest sjølv med passord eller Touch ID. Ikkje slå av Gatekeeper. Dersom varselet seier at appen vil skade maskina eller er skadd, stopp og kontakt utgivaren. Ein administrert jobb-Mac kan krevje IT-hjelp.

### Oppdater utan å slette data

Avslutt DSSA Tale med ⌘Q før du erstattar den same appen i Program med ei nyare DMG-utgåve. Ikkje slett brukarmappa eller nedlasta modellar. Notat, modellar og val blir normalt bevarte ved oppdatering av same app. Eksporter viktige notat fyrst. Automatiske OpenWhispr-oppdateringar er slått av. Ei ny testutgåve kan krevje fornya innlimingsløyve.


## Diktering og notatblokk

### Tekst der markøren står

Lat DSSA Tale vere open. Klikk i eit skrivbart felt i Word, Outlook, Mail, Teams eller eit anna program. Start opptaket med aktiv snøggtast, snakk og stopp opptaket. Teksten blir handsama og sett inn etterpå dersom automatisk innliming er på og Mac-løyvet er gitt. Tale kjem ikkje nødvendigvis fortløpande i målfeltet. Kontroller særleg namn og tal.

### Notatblokk og historikk på Heim

Automatisk notatblokk samlar ferdige dikteringar når lokal historikk er tillaten. Same notat finst under Notater; det er ikkje ein ekstra, uavhengig kopi. Kopier notatet kopierer heile blokka. Tøm notatblokka tømmer berre denne blokka. Angre tømming kan hente henne tilbake. Dette endrar ikkje tekst i andre appar eller dikteringshistorikken under blokka.

### Mikrofon, høgtalar og testar

Innstillingar → Tale og mikrofon: vel standardinngangen eller ein bestemt mikrofon. BlackHole tek berre imot lyd som er ruta dit; det er ikkje ein fysisk mikrofon. Høgtalarvalet gjeld testlyden og dikteringslydane til appen, ikkje all Mac-lyd. Test vald mikrofon tek opp fem sekund og prøver talegjenkjenning. Test i eit tomt dokument bruker ein fast tekst og testar innliming, ikkje mikrofonen.

![Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/hurtigtaster.png)

*Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden*

![Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/mikrofon.png)

*Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett*


## Talemodell og språk

### To utgåver av same Large-modell

Assistent → Tale til tekst – start her: Full presisjon er standard og blir lasta ned som 3,10 GB. q5_0 blir lasta ned som 1,08 GB og bruker vanlegvis mindre minne. Begge er NB-Whisper Large, vidare trent for norsk av Nasjonalbiblioteket med utgangspunkt i OpenAI sin Whisper. Dei er ikkje småmodellar. Filstorleik er diskplass, ikkje totalt RAM-behov.

### Bokmål, nynorsk og menyspråk

Målform under Assistent vel bokmål eller nynorsk for transkripsjonen. Menyspråk under Innstillingar → Utsjånad og språk vel bokmål, nynorsk eller engelsk i grensesnittet og denne hjelpa. Når du vel bokmål eller nynorsk i eitt av desse språkvala, følgjer både transkripsjon, menyar og hjelp det valet. Engelske menyar endrar ikkje målforma for transkripsjon. Vala blir bevarte etter omstart. Nynorsk krev ingen ekstra LLM. Kontroller at etterarbeid eller eksport ikkje har endra målforma.

### Last ned, vel og avinstaller

Last ned hentar og kontrollerer modellen. Bruk denne modellen vel han til diktering, lydimport og møtetranskripsjon. Vald modell tyder ikkje at han køyrer akkurat no; sjå Aktiv talemotor. Kontroller modellar oppdaterer status. Avinstaller modell slettar berre modellfila etter stadfesting. Vel ein annan installert talemodell før du avinstallerer den valde.

### Akselerasjon og Silero VAD

Automatisk og Metal bruker Apple Silicon-grafikken; CPU er eit alternativ som kan vere tregare. Endra akselerasjon gjeld etter omstart. Aktiv talemotor viser faktisk motorstatus når ressursmålinga er på. Silero VAD finn tale og stille, ikkje ulike talarar. Eigne brytarar gjeld diktering og felles lydimport/notatopptak. VAD kan klippe korte eller nølande ytringar; slå det av om ord forsvinn.

![NB-Whisper-modeller, målform og akselerasjon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/assistent.png)

*NB-Whisper-modeller, målform og akselerasjon*


## Valfritt tekstetterarbeid

### Valfritt etterarbeid – ikkje talegjenkjenning

Andre språkmodellar – teksthandsaming ligg under Assistent. Desse LLM-ane arbeider med ferdig tekst: opprydding, formatering, spørsmål eller oppsummering. Dei høyrer ikkje lyd og skil ikkje stemmer. Dei trengst ikkje for vanleg diktering og manuell tekstredigering. Prøv NB-Whisper åleine fyrst. Ekstra handsaming kan gi lengre ventetid og endre ord eller meining.

### Modellval er ikkje ein på-brytar

Last ned ein valfri tekstmodell, vel Bruk denne tekstmodellen, og slå berre på Rydd diktering automatisk dersom du ønskjer dette. Modellval og nedlasting skal ikkje slå på opprydding. Statusen Tekstopprydding: av/på viser valet. Ny installasjon startar med av; eit uttrykkeleg lagra val blir bevart. Rydd teksten, Formater notat og Spør lokal assistent er handlingar du sjølv startar på tekst.

### Råd for bokmål og nynorsk

Qwen3 4B Q4 er ein fyrste kandidat å prøve, Qwen3.5 2B Q4 eit mindre alternativ, og Gemma 3 4B Q4 eit samanlikningsalternativ. Dette er ikkje ei målt rangering av norsk kvalitet. Ingen av dei er dokumentert som best på nynorsk i denne utgåva. Kontroller namn, tal og målform; bevar originalen. Ved nynorsk er rå NB-Whisper-tekst tilrådd fyrst. Hugging Face er nedlastingsstaden; Qwen og Google er modellutviklarane.

### Små modellar og minne

Dei føreslåtte Q4-filene er om lag 1,40 GB for Qwen3.5 2B, 2,50 GB for Qwen3 4B og 2,49 GB for Gemma 3 4B. Dette er nedlastingsstorleikar, ikkje reservert RAM. Samanhengslengd, mellomlagring og motoren krev meir minne. Store 8B/9B-modellar blir ikkje føreslått for nye nedlastingar. Ei absolutt RAM-grense på 10 GB er ikkje dokumentert eller handheva; sjå Minne, CPU og personvern.

![Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstmodeller.png)

*Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering*


## Notat og dokumenteksport

### Heim og Notater

Heim viser dikteringshistorikk og den automatiske notatblokka. Notater er arbeidsflata for namngitte dokument, mapper, opptak og etterarbeid. Den automatiske blokka kjem fram begge stader som same notat. Søk-knappen søkjer i notat og transkripsjonar. Klikk eit treff for å opne det. Bruk Nytt notat for eit eige dokument, gi det ein tittel og organiser det i mapper.

### Transkripsjon, notat og KI-handlingar

Transkripsjon viser den attkjende talen; Notater er teksten du redigerer. Handlingar kan formatere eller oppsummere med ein vald lokal tekstmodell. Du kan lage ei eiga handling ved å gi henne namn og instruksjon. Utan installert tekstmodell er KI-vala utilgjengelege. Eit KI-referat er eit utkast som må kontrollerast mot kjelda, særleg vedtak, oppgåver og kven som sa kva.

### Word, PDF, tekst og lyd

Eksportvala lèt deg lagre Word-dokument, PDF eller rein tekst. Vel sjølv om tidsstempel og talarnamn eller talarnummer skal vere med. Kopier teksten legg teksten på utklippstavla. Lagre lydfil lagrar tilgjengeleg kjeldelyd separat. Kontroller eksporten før deling. Eit dokument lagra under Notater er ikkje automatisk ei Word- eller PDF-fil i Finder.

### Sletting og historikk

Søppelkasseknappar gjeld elementet eller området dei står ved. Les stadfestinga før du slettar alle eller fjernar eit dokument. Tøm notatblokka er noko anna enn å slette dikteringshistorikk. Vis forkasta viser forkasta opptak der dei er bevarte. Eksporter viktige dokument før ei testoppdatering eller større opprydding.

![Notater – førstegangsvisning med Kom i gang og valgfri systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/notathandlinger.png)

*Notater – førstegangsvisning med Kom i gang og valgfri systemlyd*


## Møte og talarmerking

### 1. Vel notatet

Opne Notat i venstremenyen. Vel eit eksisterande notat, eller Nytt notat, og gi det ein tittel. Nytt notat åleine startar ikkje opptak. Møtesnarvegen og godkjend automatisk møtestart kan derimot opprette eit notat og starte opptaket direkte: sjå etter Opptak går føre seg.

### 2. Start møteopptaket

Trykk Start møteopptak nedst i notatet. Knappen blir Stopp møteopptak. Hald appen open. Du kan byte side under opptaket; opptaket held fram og ein status med veg tilbake til notatet blir vist.

### 3. Mikrofon og møtelyd

Vel mikrofon i Innstillingar → Tale og mikrofon. Start Teams eller den andre møteappen sjølv. DSSA Tale prøver å ta opp vald mikrofon og systemlyden frå andre appar på Mac-en; dette er ikkje ein Teams-bot. Tillat Mikrofon og opptak av systemlyd når macOS spør. Under Systeminnstillingar → Personvern og tryggleik ligg Mikrofon og opptak av skjerm/systemlyd (namnet varierer med macOS). Fyrstegongsoppsettet for Notat har òg Systemlyd. Utan tilgang til systemlyd kan opptaket bli berre mikrofonen. Tilgjenge gjeld innliming i andre appar, ikkje møtelyden. BlackHole er ein virtuell inngang og høyrer berre det som allereie blir ruta til han. Ta eit kort prøveopptak med lyd frå begge sider før eit viktig møte; systemlyd kan òg ta med lyd frå andre appar.

### 4. Undervegs eller etter møtet

Før opptaket: Innstillingar → Opptak og innliming → Møtehandsaming. Ta opp fyrst, transkriber etterpå (standard) lagrar mellombelse lydbitar og handsamar dei etter stopp. Transkriber under møtet byggjer teksten opp medan du snakkar; dei siste lydbitane blir handsama etter stopp. Begge bruker vald NB-Whisper-modell lokalt. Lat appen arbeide til lagringa er stadfesta.

### 5. Stopp og følg framdrifta

Trykk Stopp møteopptak når møtet er ferdig. Opptaket stansar, men Transkriberer lyden … står medan motoren arbeider. Etteropptak viser ferdig handsama lyd mot total lydmengd og prosent, oppdatert etter kvar ferdige lydbit. Mikrofon og systemlyd blir handsama kvar for seg; summen kan vere større enn møtet si lengd. Stille som er kontrollert og hoppa over, tel som handsama. Tid brukt og resttid blir viste i minutt og sekund; resttid er eit anslag for tekststeget og blir fyrst vist etter målbar framdrift. Talarfordeling og lagring er eigne steg utan oppdikta prosent. Ikkje avslutt appen før Ferdig – utskrifta er lagra, eller ein tydeleg feil blir vist.

### 6. Finn og eksporter utskrifta

Opne det same notatet under Notat og vel Transkripsjon. Utskrifta blir lagra automatisk lokalt i dette notatet. Vis tekstfil i Finder opnar plasseringa til samtalen si lokale tekstfil. Lagre Word, Lagre PDF eller Lagre TXT lagar eit dokument der du vel; tidsstempel og talarnamn er valfrie. Fana Notat er eigne skrivne notat og er ikkje det same som utskrifta. Ved feil blir det vist kva som mislykkast; brukbar tekst blir bevart sjølv om talarfordelinga feilar.

### Stemmer og personnamn

Stemmeskilje grupperer liknande stemmer. Kontroller personnamn og rett talarmerkinga; Ukjend talar kan bli ståande. Dette lovar ikkje eitt separat lydspor per deltakar eller sikker automatisk namngiving. Community-1-valet gjeld lydimport; det er ikkje ei automatisk Community-1-kopling til direkte møteopptak.

### Informer deltakarane

Lokalt opptak varslar ikkje nødvendigvis møtedeltakarane automatisk. Informer deltakarane om opptaket før du startar.

### Skil talarar ved lydimport

Lydfiler → Skil talarar: Community-1 er ein valfri lokal talarmodell, ikkje ein LLM. Automatisk tal har øvre grense 15; det blir ikkje tvinga fram 15 stemmer. Du godkjenner modelltilgang og vilkår sjølv hos Hugging Face. Appen kan hente køyremiljøet automatisk og lagrar nøkkelen i macOS Keychain. CPU og MPS er separate val; MPS er merkt utprøving. Eksisterande sherpa-onnx er eit alternativ.

### Community-1 krev eigen modelltilgang

Community-1 er valfri stemmeutskiljing. Han treng ein Hugging Face-konto og ein Hugging Face-lesetilgangsnøkkel for modellnedlastinga. Dette er ikkje ein OpenAI-API-nøkkel. Vanleg NB-Whisper-diktering treng ikkje dette.

### 1. Godkjenn modelltilgang

Opne modellvilkåra nedanfor. Logg inn eller opprett ein Hugging Face-konto, les vilkåra og godkjenn sjølv tilgang til pyannote/speaker-diarization-community-1. Modellsida opplyser òg kva kontoopplysningar som blir delte med modellutgivaren. Bruk den same kontoen når du lagar nøkkelen.

### 2. Opprett ein nøkkel med lesetilgang

Klikk Opprett Hugging Face-nøkkel. Vel Fine-grained og eit namn, til dømes DSSA Tale Mac. Under Repositories treng du lesing av offentlege modellar med godkjenningskrav: «Read access to contents of all public gated repos you can access». Dette gir ikkje tilgang før modellvilkåra er godkjende på kontoen. Ikkje vel Write, private lager, organisasjonsadministrasjon, betaling eller Inference. Ein vanleg Read-nøkkel kan òg brukast, men gir breiare lesetilgang til kontoen sine lager.

### 3. Lim nøkkelen inn i DSSA Tale

Kopier nøkkelen som byrjar med hf_. Gå tilbake til Lydfiler → Skil talarar med lokal talarmodell → Community-1. Lim han i feltet «Hugging Face-lesetilgangsnøkkel» i Community-1-oppsettet. Set fyrst opp køyremiljøet med knappen nedanfor om det manglar. Kryss av at du sjølv har godkjent modellvilkåra, og klikk Hent modellen separat. Vent på stadfestinga før du importerer lyd med Community-1.

### Trygg nøkkel og lokal analyse

Nøkkelen blir lagra i macOS Nøkkelring og brukt berre ved modellnedlasting. Ikkje lim han inn i chat, e-post eller notat. Når modellen er henta, skjer talaranalysen lokalt utan lydopplasting. Du kan administrere eller trekkje tilbake nøkkelen hos Hugging Face.

### Om nedlastinga manglar tilgang

Ved manglande tilgang (401/403): kontroller at vilkåra er godkjende på same konto som nøkkelen, at modelltilgangen er innvilga og at nøkkelen tillèt lesing av offentlege gated-modellar. Meir skrive- eller betalingstilgang løyser ikkje manglande modellgodkjenning.

### Kanalar, ordtider og uvisse

Undersøk fyrst ser på kanalane i originalen. Vel éin kanal eller nedmiksing til mono ved behov; originalen blir ikkje endra. Automatisk samankopling av uavhengige mikrofonkanalar er ikkje implementert. Standard ordtider er raskare. WhisperX krev eigne modellar for bokmål/nynorsk og meir tid og minne. Talarar blir kopla med tidsdata; Ukjend talar blir bevart når koplinga er uviss. Gi namn og korriger manuelt. Stemmer er ikkje verifiserte personidentitetar.

![Møter – lokal lyd fra mikrofon og systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moter.png)

*Møter – lokal lyd fra mikrofon og systemlyd*

![Møteveiledningen i den installerte appen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moteveiledning.png)

*Møteveiledningen i den installerte appen*


## Lydfiler, mapper og kø

### Filtypar som kan veljast

Mappe- og fleirval støttar MP3, WAV, M4A, M4B, FLAC, OGG/OGA, Opus, AIF/AIFF, WebM og lyd frå MP4, MOV og MKV. Ein bestemt kodek, skadd fil eller kopivern kan likevel hindre lesing. WMA er ikkje med i denne importlista. Originalen blir bevart; appen lagar ein arbeidskopi for talegjenkjenning.

### Fleire filer eller ei heil mappe

Klikk Lydfiler i venstremenyen. Vel lydfiler gir fleirval; Vel mappe med lydfiler les ei mappe. Kryss av Ta med undermapper før mappevalet dersom alt lenger ned òg skal med. Start transkribering handsamar éi fil om gongen og lagrar eit eige dokument under Notater før neste startar. Ingen fast grense på talet på filer eller abonnementskvote; disk, minne og tid avgrensar i praksis.

### Framdrift, stopp og hald fram

Status viser opptakslengd, tid brukt, handsama lyd og anslått resttid i minutt og sekund. Transkripsjon og talarfordeling er ulike steg. Ein ferdig transkripsjon tyder ikkje at heile jobben er lagra. Du kan byte side medan appen køyrer. Lat appen vere open: kølista blir ikkje gjenoppretta etter avslutning. Stopp køen pausar; Hald fram med køen startar vidare. Feila filer kan leggjast tilbake i køen.

### Lagring, rydding og Taleopptak

Automatisk kølagring krev tillaten lokal historikk. Ved lagringsfeil blir køen pausa og teksten bevart. Tøm kølista fjernar berre filval og status, ikkje originalfiler eller dokument. Word, PDF og tekstfil blir eksporterte separat frå dokumenta. Opne Apple Taleopptak opnar Apple sin app; del eller eksporter opptaket til ei tilgjengeleg mappe og vel fila her. Skymappeknappane opnar den faste mappa i Finder.

![Lydfiler – flervalg, mapper, undermapper og eksport](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/lydfiler.png)

*Lydfiler – flervalg, mapper, undermapper og eksport*


## Ordliste og tekstsnuttar

### Ordliste

Ordliste i venstremenyen lèt deg leggje inn namn, faguttrykk og forkortingar som er vanskelege å kjenne att. Legg til eigne ord eller importer ei ordliste. Fjern feil eller uønskte oppføringar med slettevalet. Orda hjelper attkjenninga, men garanterer ikkje rett skrivemåte. Bruk nøytrale døme og unngå å dele private ordlister utan kontroll.

### Tekstsnuttar

Fana Tekstsnuttar er for faste tekstar du bruker ofte. Opprett ein kort utløysande frase og teksten han skal bytast ut med, til dømes ei standardhelsing. Rediger eller slett snutten når han ikkje skal brukast lenger. Ein tekstsnutt er ein lagra tekstregel, ikkje ein ekstra KI-modell.

![Ordliste – navn, fagord og forkortelser](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/ordliste.png)

*Ordliste – navn, fagord og forkortelser*

![Tekstsnutter – korte fraser blir til lagret tekst](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstsnutter.png)

*Tekstsnutter – korte fraser blir til lagret tekst*


## Kalender, skylagring og e-post

### Kalender og møteappar

Integrasjonar → Kalender har val for Apple Kalender/FaceTime, Microsoft-kalender/Teams og Google Kalender/Meet. Vala viser rettleiing; dei loggar deg ikkje inn eller gir tilgang. Legg kontoen til i Apple sin Kalender-app fyrst. Tillat deretter lesing av kalenderane på Mac-en i DSSA Tale om ønskjeleg. Dette kan omfatte fleire kontoar. Kalenderlesing opprettar ikkje møte eller startar opptak av seg sjølv.

### Google Disk, OneDrive/SharePoint og iCloud

Under Skymapper: Logg inn / administrer konto opnar leverandøren sitt oppsett. Innlogging berre på ei nettside lagar ikkje ei mappe i Finder. For Google Disk: logg inn i Google Disk for Mac, trykk Finn Google Disk-mappa og Bruk denne mappa. Eller vel ei fast mappe sjølv. Opne mappe opnar Finder. Fjern mappeval slettar ingen filer og loggar deg ikkje ut. Kontroller tilgangen på nytt oppdaterer lokal mappestatus, ikkje nettsynkronisering.

### E-post og deling

E-post-fana forklarer diktering i Mail, Outlook og andre tekstfelt. Set markøren i meldinga og dikter; du sender sjølv. Appen les ikkje innboksen i denne utgåva. Dokument du sjølv lagrar i ei synkronisert sky- eller Teams-mappe, kan bli lasta opp av den tenesta. Dette er separat frå lokal talegjenkjenning. Passord og kontoar blir handterte av Apple, Google eller Microsoft.

![Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/kalender.png)

*Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging*

![Skymapper – tjenesten må være tilgjengelig i Finder](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/skymapper.png)

*Skymapper – tjenesten må være tilgjengelig i Finder*

![E-post – diktering i tekstfelt, ikke innbokslesing](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/epost.png)

*E-post – diktering i tekstfelt, ikke innbokslesing*


## Snøggtastar og innstillingar

### Snøggtastar og opptaksmåte

Innstillingar → Snøggtastar: klikk tastefeltet og trykk ønskt kombinasjon. Legg til ein snøggtast gir fleire alternativ. Aktiv snøggtast viser kva som faktisk blei registrert; ein lagra tast er ikkje alltid tilgjengeleg. Trykk startar og stoppar med to trykk. Hald inne tek opp medan tastane er haldne. Møtesnøggtasten opnar møteopptak og kan fjernast separat. Unngå kombinasjonar Mac-en eller andre appar alt bruker.

### Opptak og innliming

Maksimal dikteringstid kan vere 5, 10 eller 30 minutt, eller Stopp manuelt. Dette gjeld mikrofondiktering, ikkje ei kvote for importerte lydfiler. Automatisk innliming sender teksten til det aktive skrivefeltet. Behald teksten på utklippstavla gir manuell ⌘V som reserve. Lyd ved start og stopp styrer tonesignal. Gøym dikteringsikonet automatisk gøymer det flytande ikonet når det er inaktivt.

### Utsjånad, tekststorleik og vindauge

Utsjånad og språk: vel lyst, mørkt eller Følg Mac-en. Tekststorleik 100–150 % viser ei førehandsvising og blir lagra automatisk. Aksentfarge endrar fargepreget; raudt for sletting og eigne tenestefargar blir bevarte. Menyspråk er separat frå målforma til transkripsjonen. Bruk dei vanlege raude, gule og grøne Mac-knappane for lukk, minimer og fullskjerm. Lukk vindauget er ikkje nødvendigvis Avslutt appen; ⌘Q avsluttar.

### System og lokal logging

System viser appversjonen og at oppdatering er manuell. Detaljert feilsøkingslogging lagrar ekstra lokale opplysningar. Slå henne på berre ved feilsøking og av etterpå. Opne loggmappe viser filene i Finder. Ikkje send heile loggar utan å kontrollere private opplysningar. Start ved innlogging kan setjast i macOS: Systeminnstillingar → Generelt → Påloggingsobjekt, legg til den installerte appen frå Program.

![Opptak og innliming – automatisk innliming og møtebehandling](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/opptak.png)

*Opptak og innliming – automatisk innliming og møtebehandling*

![Utseende og språk – tema, skriftstørrelse og menyspråk](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/utseende.png)

*Utseende og språk – tema, skriftstørrelse og menyspråk*

![System – versjon og lokal feilsøkingslogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/system.png)

*System – versjon og lokal feilsøkingslogging*


## Minne, CPU og personvern

### Diskplass er ikkje reservert RAM

Ein nedlasta modell bruker diskplass. Han reserverer ikkje same mengd arbeidsminne heile tida. Når han blir lasta og brukt, trengst vekter, mellomlagring og arbeidsbufferar. Ein varm motor kan halde modellen ei stund for raskare neste bruk. NB-Whisper og ein valfri LLM kan bruke minne samtidig. Apple Silicon har fellesminne for CPU og GPU; det er ikkje ei separat VRAM-pott som skal leggjast til RAM-talet.

### App CPU og App RAM nedst

App CPU viser appen og modellmotorane sin bruk som del av heile CPU-kapasiteten til Mac-en. App RAM viser samla RSS for dei mot det totale minnet, ikkje bruken til heile systemet. Delte minnesider kan teljast fleire gonger i summen. Dette er ein arbeidsindikator, ikkje ei eksakt unik minnefordeling. Filstorleiken på modellkortet er eit anna tal.

### GPU, byteminne og minnepress

Mac GPU gjeld heile Mac-en, ikkje berre DSSA Tale. Byteminne er systemet sin bruk av disk som ekstra minne; mykje swap saman med høgt minnepress kan gjere alt tregare. Minnepress oppsummerer minnesituasjonen i systemet. Gøym CPU og minne gøymer tala og stoppar den periodiske ressursmålinga. Vis CPU og minne slår henne på att. Dette endrar ikkje modellvalet eller transkripsjonen.

### Lokalt arbeid og valfrie nettenester

Talegjenkjenning og eventuell lokal tekstopprydding køyrer på Mac-en. Lyd og transkripsjonar blir ikkje lasta opp for handsaming. Nett trengst for å hente talemodell, valfrie tekstmodellar og eventuelt køyremiljø/talarmodell. Hjelpelenkjer og konto-/kalendertenester kan bruke nett når du vel dei. Lagrar du sjølv i iCloud, Google Disk, OneDrive eller Teams-mapper, kan leverandøren synkronisere filene. Lokal historikk og notat ligg på denne Mac-en.


## Kontakt DSSA Tale

### Kontakt for denne DSSA-utgåva

Bruk e-postknappen nedanfor for å opne ein kladd til stein@haldendemensforening.no i e-postprogrammet ditt. Ingenting blir sendt før du sjølv vel Send. Oppgi DSSA-versjonen, Mac-modell, macOS-versjon og kva du prøvde. Ikkje legg ved private opptak, transkripsjonar, nøklar eller passord. OpenWhispr si generelle brukarstøtte har ikkje ansvar for denne tilpassinga.

### Kva er framleis under utprøving?

Dette er ei testutgåve. Den lange filkøprøva dokumenterer lagring, ikkje feilfri språkattkjenning. Alle Mac-modellar, møteappar, mange samtidige talarar og bokmåls-/nynorskkvaliteten til hjelpemodellane er ikkje fullstendig kontrollerte. Apple Developer ID-signering og notarisation manglar framleis. Sjå teststatus ved nedlastinga for presise målingar og avgrensingar.


## Feilsøking og feilrapport

### Ingen lyd eller ingen tekst

Kontroller vald mikrofon under Tale og mikrofon og prøv femsekunderstesten. Tillat mikrofon under Systeminnstillingar → Personvern og tryggleik → Mikrofon. Ein pipelyd tyder ikkje at mikrofonen tek imot tale. BlackHole er berre rett om lyd alt blir send dit. Sjekk òg at talemodellen viser Klar til bruk.

### Teksten kjem berre med ⌘V

Slå på automatisk innliming i Opptak og innliming. Bruk knappen Tilgjenge og innliming under Tale og mikrofon for å opne Mac-sida. Slå på DSSA Tale under Tilgjenge, kalla Enhetskontroll og datatilgang på den testa macOS-utgåva. Avslutt med ⌘Q og start att. Etter ei testoppdatering kan gammal oppføring måtte fjernast og den nøyaktige appen frå Program leggjast til på nytt. Endre berre DSSA-oppføringa.

### Treg handsaming eller feil i køen

Prøv utan automatisk tekstopprydding og kontroller Metal under Assistent. Fyrste modellinnlasting kan ta lengre tid. Sjå minnepress og ledig diskplass. Ei skadd lydfil kan feile medan andre held fram. Lagringsfeil pausar køen; kontroller plassen og hald fram utan å slette teksten. Ikkje avslutt ein aktiv kø om du vil bevare kølista.

### Rapporter feil til rett prosjekt

Knappen nedanfor opnar GitHub-prosjektet til DSSA Tale Mac, ikkje Windows-prosjektet eller feilsida til OpenWhispr. Ein GitHub-feilrapport er offentleg. Oppgi versjon, steg og anonymisert feilmelding; ikkje last opp private lydfiler eller dokument. Bruk e-post under Kontakt om du er usikker på kva du kan dele.


## Opphav og rettar

### Opphav og lisens

DSSA Tale er ei uavhengig Mac-tilpassing av OpenWhispr 1.9.2, som har MIT-lisens. NB-Whisper frå Nasjonalbiblioteket byggjer på OpenAI sin Whisper og har Apache-2.0-lisens. Dette er ikkje eit offisielt produkt frå OpenWhispr, Nasjonalbiblioteket eller Apple. Opphavslenkjene nedanfor er kreditering, ikkje ei anna brukarstøtte for appen.

### Medfølgjande komponentar og valfrie modellar

Lisensopplysningar følgjer appen i Contents/Resources/legal: mellom anna FFmpeg/Opus, Eigen, whisper.cpp, llama.cpp og andre komponentar. FFmpeg er eit eige LGPL-bygg utan GPL/nonfree; påkravde kjelder følgjer med. Community-1-modellen har CC-BY-4.0 og pyannote.audio MIT. Valfrie Qwen- og Gemma-modellar har eigne vilkår ved kjelda. Ingen LLM- eller NB-Whisper-vekter følgjer denne installasjonsfila.

