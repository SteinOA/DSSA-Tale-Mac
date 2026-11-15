# Teststatus – DSSA Tale Test 1.9.20

Dato: 29. oktober 2026. Maskin: Apple M4, 24 GB, macOS 27.0.1. Dette er en testutgave. Ingen påstand om at alle kombinasjoner er feilfrie.

## Faktisk kontrollert i denne runden

| Område | Resultat og avgrensning |
| --- | --- |
| Hele automatiske testsuiten | 3494 tester: 3308 bestått, 0 feil, 185 hoppet over, 1 todo. Omfatter også upstream-kode som ikke er eksponert i den lokale appen; testantallet alene beviser ikke hele produktet. |
| Typekontroll og rendererbygg | Bestått. Vite varsler om store kodebunter; dette er ikke en kjørefeil. |
| Begge NB-nedlastinger fra tom mappe | Faktiske q5_0- og fullpresisjonsfiler lastet ned gjennom Electron med appens standard nettverksfilter aktivt. Eksakt størrelse og SHA-256 bestått. Ingen konto brukt. |
| Avbrutt nedlasting og reparasjon | Faktisk nettverksavbrudd etterlot ingen delvise modeller. Tester dekker korrupsjon, atomisk erstatning etter verifisering, kansellering og bevaring av originalfil ved feil. |
| Valgfrie språkmodeller | Alle fire kuraterte nedlastingsruter ga GGUF-header; Qwen3.5 2B ble fullstendig lastet ned og kontrollert med SHA-256. Tidligere lokal kjøring av de fire modellene er ikke en garanti for norsk kvalitet. |
| Nettverksavgrensning | Standard sesjon blokkerer eksterne forespørsler. Modelltransport tillater kuraterte GET-nedlastinger og bestemte CDN-er; POST og skytranskripsjonsendepunkt ble avvist også etter vellykket modellnedlasting. |
| Faktisk norsk tale | Begge ny-nedlastede NB-modeller kjørt med den pakkede Metal-serveren på offentlige NPSC-prøver, både bokmål- og nynorskvalg. Norsk tekst ble produsert; det forekom ordfeil og linjedeling. Ingen feilfrihets- eller ettsekundsgaranti. |
| Lengre import / avbryt / gjenoppta | Faktisk 65-sekunders nynorsk prøve avbrutt etter én del. Verifisert checkpoint, gjenopptatt med to nye deler og samme tekst som en fersk fullkjøring. Kildens SHA uendret og midlertidige arbeidsmapper ryddet. Gjentatt offentlig testlyd, ikke et ekte møte. |
| Word/PDF/TXT | 36 filer: 3 språk × 4 uavhengige kombinasjoner av taler/tid × 3 formater. DOCX ZIP/CRC/XML/språkkode og PDF tekst lest tilbake. Nynorsk PDF visuelt kontrollert. Syntetisk tekst, ikke ekte tale-/møtekvalitetstest. |
| Talermodellnedlasting | Faktisk tom profil, tre kuraterte assets, kontroll av SHA/størrelse og avgrenset uttrekk av ONNX/lisens. Native sherpa kjørte på norsk prøve med én taler. Ikke kvalitetsbevis for flere talere. |
| Kalender-/møtelenker | Automatiske tester for Teams/Meet/FaceTime og avvisning av utrygge/lignende URL-er. Kalenderleverandørvalg i faktisk 1.9.18-GUI kontrollert uten å gi tilgang. Ingen faktisk konto, samtale eller automatisk møtestart verifisert. |
| CPU/RAM og innstillinger | Tester for appens prosessfamilie, CPU-normalisering, feil/oppstartstilstand og mappevalg. Tidligere faktisk GUI-omstart beholdt valgt mappe; dette er ikke bevis for fungerende skysynkronisering. |
| Pakkesjekk | Endelig 1.9.20 er 227 838 891 byte (ca217 MiB), DMG-kontroll og streng ad hoc-signaturkontroll bestått. Ingen NB-, Core ML-, taler-, VAD- eller embeddingvekter i ressursmappene. Installert fra selve DMG-en til Programmer og startet som 1.9.20. Begge Large-modeller faktisk lastet ned med GUI-knappene og vist klare. Nynorsk grensesnitt beholdt etter omstart; målform, fullmodell og BlackHole-valg var beholdt. Grensesnittet prøvd på NB/NN/EN og satt tilbake til opprinnelig bokmål. Ingen nye tillatelser gitt. |

## Ikke sluttgodkjent

- Mikrofon og Tilgjengelighet for den separate testappen er utsatt etter brukerens valg. Fysisk snarvei, langvarig mikrofondiktering og automatisk innliming ved faktisk markør er derfor **ikke sluttverifisert i denne pakken**. Tidligere live innliming i en eldre utgave er ikke erstatning for dette.
- BlackHole vises som et tilgjengelig valg i tidligere faktisk test, men ingen ny ende-til-ende-lydtest eller endring av lydruting er gjort.
- Ekte Teams/Meet/FaceTime-møte med begge lydsider, talerkvalitet og kalender-/konto-/SharePoint-tilgang er ikke verifisert. Leverandørknapper er oppsettsveiledning; appen blir ikke automatisk en møtebot eller et Teams-tillegg.
- Talerseparasjonens tre modellfiler er faktisk lastet ned og verifisert fra tom profil. Native motor ga segmenter med én taler på offentlig norsk prøve. Dette dokumenterer ikke korrekt skille mellom flere personer; kvalitet med flere faktiske talere og møteinnhold gjenstår.
- Semantisk notatsøk med en separat embeddingmodell er ikke sluttverifisert uten modellvekter. Vanlige notater og tekst er egne funksjoner.
- Ingen Apple Developer ID eller notarisering. Gatekeeper kan blokkere oppstart. Kun ad hoc-signatur er kontrollert.
- Kun M4/macOS 27.0.1 er fysisk prøvd. Minimum 26.0 kommer fra byggekonfigurasjonen. Intel og andre maskiner er ikke verifisert.
- Ingen løfte om feilfri norsk, korrekt referat eller innliming samme sekund. Bruk kontrollert testtekst og mål faktisk tastslipp-til-tekst på din maskin.

Noen generelle nedlastingsvarsler og enkelte hjelpetekster kan fortsatt vises på et annet språk enn valgt grensesnitt. Dette er en kjent oversettelsesbegrensning.

Ingen personlige lydopptak eller brukerdokumenter inngår i testmaterialet som publiseres. Originalappen, dens profil og Windows-repoet er beholdt.
