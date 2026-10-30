# Community-1 i DSSA Tale Mac 1.9.24

Valgfri lokal talerfordeling ved lydimport. NB-Whisper, bokmål/nynorsk,
diktering og eksisterende sherpa-onnx beholdes. Community-1 er en talermodell;
en språkmodell/LLM er ikke en erstatning. Windows-resultater fra PR 1 er
referansegrunnlag, ikke Mac-målinger eller identitetsfasit.

## Bruk og separat oppsett

På denne Mac-en er modellen hentet gjennom brukerens innloggede Safari etter
at siden viste godkjent tilgang. De fem filene samsvarer med den låste revisjonen
`3533c8cf8e369892e6b79ff1bf80f7b0286a54ee` og hver sin SHA-256. Ingen token ble brukt.

Python 3.11+ kreves utenfor appen. På Apple Silicon opprettes et separat miljø:

```sh
bash scripts/meeting-engine/setup-mac.sh /absolutt/sti/til/python3
```

Det bruker den testede låsfilen, ikke et Windows- eller CUDA-miljø. I appens
Lydfiler: slå på talerfordeling, velg Community-1, velg miljøets `bin/python`
og CPU eller MPS. For en ny modellnedlasting godkjenner brukeren vilkårene selv
hos Hugging Face. En eventuell lesetilgangsnøkkel skrives i appens maskerte felt
og lagres i macOS Keychain, aldri i profil-JSON, Git, kommandolinje eller logger.
Nedlastingsprosessen får nøkkelen bare over stdin. Inference bruker bare lokale,
kontrollsummerte modellfiler, med HF offline og telemetri deaktivert.

Modell og runtime følger ikke DMG. Oppdatering beholder profil, notater, modeller,
ordliste og øvrige brukerdata. Testapp bruker fortsatt `OpenWhispr-NB-Test` og
`no.steinoa.openwhispr.nb.test`; ordinær app bruker `OpenWhispr-NB`.

## Lyd, tidsstempler og usikkerhet

Originalen åpnes kun for lesing. En unik arbeidsmappe inneholder mono 16 kHz
PCM16-kopien og ryddes etterpå. Før nedmiksing undersøkes originalens kanalmetadata.
For stereo analyseres opptil 30 sekunder med kanalkorrelasjon og RMS. Dette kan
vise mulig uavhengighet, men identifiserer ikke mikrofoner eller personer.
Ved flere/ukjente kanaler stopper standardvalget og ber om valg av enkeltkanal
eller uttrykkelig nedmiksing. Krysskobling av personer mellom separate mikrofoner
er ikke implementert. Første 30 sekunder kan ikke bevise forhold i resten av filen.

NB-Whisper returnerer faktiske segmenttider gjennom `verbose_json` og
`no_timestamps=false` bare på den tidsbaserte importveien. Vinduer er da
28 sekunder uten overlapp, med eksakte lydforskyvninger. Gamle tekstkontrollpunkter
blandes ikke med denne dekoderidentiteten. Vanlig diktering beholder sin eksisterende
JSON-forespørsel. Tekst fordeles aldri etter antall tegn.

`exclusive_speaker_diarization` kobles til ASR-segmentenes tidsintervaller.
Opprinnelig overlapping i `speaker_diarization` overstyrer en eksklusiv etikett
og gir ukjent/uklar tilordning. Manglende, motstridende eller ufullstendige ASR-tider
beholder hele transkripsjonen uten gjettet kobling. Ordtidsstempler fra whisper.cpp beholdes og brukes når de dekker originalteksten
uten endringer. Ingen manglende ordtider interpoleres. Det er ingen ordjustering
utover tidsdata som ASR faktisk leverer. Et langt ASR-segment over et talerskifte
kan derfor bli ukjent. Nærhets-/dekningsgrenser er konservative regler, ikke
modellens kalibrerte sikkerhet.

Antall grupper velges automatisk med `max_speakers=15`, uten `num_speakers=15`.
Grensen er et tak; ingen tvinges fram. Ikke-talende deltakere skal ikke få grupper.
Usikre segmenter vises som Ukjent taler / Ukjend talar. Taler-IDer er anonyme;
navn, samlet ommerking og korrigering finnes i eksisterende Notater-visning.
Delvis fordeling vises med merket/total og varsel. Bokmål/nynorsk beholdes i teksten;
importens valgte målform følger videre til opprydding, referat og dokumenteksport
selv om talemålformen senere endres. LLM-opprydding er valgfri og må kontrolleres.

## Jobb, fremdrift og avbryting

Importjobben eies utenfor React-visningen og fortsetter ved navigasjon.
Transkripsjon og talerfordeling har separate faser. ASR 100 % betyr ikke ferdig jobb.
Visningen viser opptakslengde, tid brukt, behandlet lyd i gjeldende trinn og anslått
resttid for trinnet når det finnes målegrunnlag; lasting/gruppering kan være ubestemt.
Hele jobbens resttid er ikke kjent på forhånd. Prosent pr. analysefase er et
arbeidsanslag, ikke ferdiggrad for hele importen.

Community-1 kjører etter ASR for å begrense samtidig minnebruk. Avbryting terminerer
Python-prosessgruppen med TERM og KILL-eskalering; FFmpeg-kopien har egen gruppe.
Når importens egen Whisper-dekoding er aktiv, stoppes den eide serveren før kølåsen
frigis. Avbryting under talerfordeling stopper ikke en senere, separat diktering.
Talerfeil/avbryting etter ASR beholder brukbar tekst. Tidligere notater overskrives ikke.

## Lokale målinger 30. oktober 2026

Mac mini M4, 24 GB, macOS 27.0.1 arm64. Python 3.12.14, torch/torchaudio 2.8.0,
pyannote.audio 4.0.3. Faktisk modellkjøring på både CPU og MPS; ingen CUDA.
MPS-fallback er deaktivert. Kald oppstart/filsystem-/Metal-cache påvirker tallene.

Offentlig NPSC, låst datasett-revisjon `e862cba896ef8f8c7190be21bdb485a9491679a4`.
Fire kjente taler-IDer, fem turer, ekte nynorsk tale satt sammen til 47,794 sekunder.
Det er en konstruert prøve, ikke et naturlig møte. Begge enheter fant fire grupper,
og ga første stemme samme etikett ved gjenkomst. Ingen virkelige navn ble tildelt.

| Enhet | Modellasting | Analyse | Sum i arbeider | Maks RSS i Python |
|---|---:|---:|---:|---:|
| CPU | 2,77 s | 11,16 s | 13,93 s | 2,73 GB |
| MPS | 3,02 s | 5,13 s | 8,15 s | 0,65 GB |

MPS rapporterte i tillegg 1,79 GB driverallokering etter kjøring. Dette er ikke
maks GPU-minne eller total appbruk og skal ikke summeres med RSS som om målene
var uavhengige. En tidligere prøve hadde tregere MPS-oppstart enn CPU.
Tallene er ingen garanti for lange filer eller andre maskiner.

Reell kildebro med NB-Whisper q5_0, nynorsk ASR og CPU Community-1:
14 tekstsegmenter, 13 merket, 1 ukjent; ordene og rekkefølgen uendret.
ASR 10,38 s, talerarbeider 15,41 s, hele broen 26,47 s.

En separat prøve med et 1,2 sekunders innlegg og konstruert overlapp ga bare to
grupper fra fire kildepersoner. ASR hadde 11 segmenter, 8 merket og 3 ukjente;
ordene ble beholdt uendret. Dette avdekker en kvalitetsbegrensning, ikke bestått
identitetsgjenkjenning. Ingen tuning tvinger antallet opp til forventede fire.

Faktisk Python-avbryting under segmentering: AbortError, arbeider borte,
9 ms fra avbrudd til prosess avsluttet i denne prøven. Separat OS-test avslutter
også en underprosess. Stereo med to forskjellige NPSC-klipp ga korrelasjon 0,0063
og krav om kanalvalg, uten å endre originalfilen.

## Gjenstående verifikasjon

Et naturlig langt møte med 10–14 personer på Mac, manuelt scoret DER,
robusthet ved korte innspill/overlapp og andre Mac-er er ikke validert. Stemmegrupper
er ikke personidentitet. Pakke-/GUI-/eksportstatus føres separat i utgivelsesmanifestet.
Ingen private opptak, transkripsjoner, modeller eller nøkler legges i Git eller testnotatet.
Se [CREDITS](../CREDITS.md) for kode- og modellvilkår.

## Videre kvalitetsprøver

Et nytt klipp med 13 kjente NPSC-talere (nynorsk), 14 turer og 150,788 sekunder
ga automatisk 13 grupper på MPS, uten fast antall. Samme gruppe ved gjenkomst.
Modellasting 4,03 s + analyse 17,36 s = 21,39 s; maks Python-RSS 0,75 GB og
MPS-driverallokering etterpå 1,67 GB. Dette er konstruerte, rene taleturer,
ikke et naturlig 13-personers møte eller en generell identitetsgaranti.

Med samme ASR-tekst reduserte bevarte ordtider andel ukjente ord fra 10/105
(9,5 %) til 4/105 (3,8 %) på firetalerklippet, og fra 20/78 (25,6 %) til 15/78
(19,2 %) på kort-/overlappsprøven. Dette er orddekning, ikke DER eller bevis
for at hver ny etikett er korrekt. Antall grupper i den vanskelige prøven ble
fortsatt bare to; denne svakheten skjules ikke. Tersklene 0,4/0,5/0,6/0,7
ga ingen forbedring der, så modellens anbefalte 0,6 beholdes.

WhisperX 3.8.6 med en separat NbAiLab nynorsk wav2vec2-modell tilbys valgfritt som
akustisk ordjustering. Det er ikke en annen talermodell og forbedrer ikke
automatisk antall stemmegrupper. Stable-ts er også vurdert; prosjektets README
oppgir at utviklingen er satt på pause. Hjelpeforsøk er separate fra runtime
og appens standardvei til faktiske resultater viser en fordel.

## Valgfri WhisperX-ordjustering – faktisk prøvd

WhisperX 3.8.6 er nå prøvd på CPU med en separat, kontrollsummert
`NbAiLab/nb-wav2vec2-1b-nynorsk`, revisjon
`37107327f6af742c008042d8cfdba4276de18f82`. Den erstatter verken ASR eller
Community-1. Med identisk tekst og samme talerintervaller ga den 0/105 ukjente
ord på det rene klippet og 11/78 (14,1 %) på kort-/overlappsprøven.
Nynorskordene var uendret. Ren-prøven tok 13,18 s for justeringen og
Python-prosessen målte maks 4,51 GB RSS. Modellverifikasjon og prosessoppstart
kommer i tillegg. Bokmålsmodellen er separat og kan ikke brukes som skjult
erstatning for nynorsk. Vektene er omtrent 3,6 GB per målform.

Valget «Presis» er frivillig; «Standard» bruker de raskere NB-Whisper-ordtidene.
`interpolate_method=ignore` bevarer manglende ordtider som manglende. Alle ord
kontrolleres mot originaltekst før justeringen brukes. Feil gir fortsatt
brukbar transkripsjon og standardtider med tydelig varsel. Ingen modeller
eller Python-pakker følger DMG. Oppsett:

```sh
bash scripts/meeting-engine/setup-whisperx-mac.sh /absolutt/sti/til/python3
/path/to/alignment-runtime/bin/python scripts/meeting-engine/download-alignment.py --language nn --destination /din/modellmappe
```

Velg miljøet og modellmappen under Ordtider i appen. På Steins Mac gjøres
profilkonfigurasjonen lokalt etter kontroll av de faktiske miljøene. Modellfilene
er låst til revisjon og SHA-256 i `alignment-models.json`. Kode: BSD-2-Clause;
NbAiLab-ordmodeller: Apache-2.0. MPS er testet for Community-1, men WhisperX-
ordjustering er bare testet/aktivert på CPU i denne endringen.

Bokmål: faktisk separat kildetest med NB-Whisper `no` og riktig bokmåls-
ordmodell bevarte teksten uendret. CPU-ordjustering tok 6,58 s og målte
maks 4,48 GB RSS på en 14-sekunders enkeltstemmeprøve. Dette er en separat
funksjonsprøve, ikke sammenlignbar med firetalerklippets kvalitetstall.

Kodekontroll: 3524 tester, 3338 bestått, 0 feil, 185 hoppet over, 1 TODO. Typekontroll og rendererbygg består. Ingen av de hoppede testene regnes som kjørt maskinvarevalidering.
