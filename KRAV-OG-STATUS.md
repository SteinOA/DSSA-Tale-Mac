# Avtalt leveranse og faktisk status

Oppdatert 28. oktober 2026. Dette er arbeidskrav, ikke en erklæring om at alt er ferdig.

## Målet

DSSA Tale skal være en lokal norsk Mac-app som vanlige brukere kan installere fra en DMG. Egen Mac-kildekode på GitHub, Windows-utgaven bevart. Ingen Terminal, Homebrew, Python eller manuell modellkonfigurering for mottakeren.

## Avtalte funksjoner

- Bevar OpenWhisprs funksjoner og det godkjente Canva-uttrykket. Fast sidepanel, Hjem overalt, ryddige undersider, korte menyer og få lange rulleflater. Lyst/mørkt og fargevalg. Synlig faktisk versjonsnummer.
- Norsk bokmål som grensesnittstandard, engelsk valgfritt. Bokmål/nynorsk som transkripsjonsvalg. Valgene beholdes etter omstart.
- Begge NB-Whisper Large-modeller inkludert og kontrollert: full presisjon som standard, q5_0 som minnebesparende alternativ. Metal for Apple Silicon, CPU valgfritt. Ingen irrelevante NVIDIA-valg.
- Markør i et vanlig tekstfelt i Word, Teams, e-post eller chat skal motta diktering på stedet. Valgbar hurtigtast, som nå er Command+Shift+Space, og valg mellom trykk start/stopp og hold. Separat møtesnarvei. Over 30 sekunders opptak, tydelig konfigurerbar grense.
- Valg av mikrofon og høyttaler blant faktiske enheter, inkludert BlackHole 2ch når tilgjengelig, samt systemstandard. Lagret valg skal beholdes ved omstart og frakobling. Test lyd uten å endre Macens globale ruting.
- Lokal språkmodell for valgfri dikteringsopprydding, notatformatering og tekstassistent. Av som standard. Få relevante modeller, faktisk fungerende nedlasting, filkontroll, fremdrift, feil og minneoversikt.
- Møteopptak med mikrofon og møtelyd fra Teams. Velg live transkribering eller opptak først og transkribering etterpå. Valgfri automatisk Teams-oppdagelse, med ærlig beskrivelse av faktisk støtte.
- Ett løpende, lokalt samtaledokument og en tekstfil per samtale/møte. Tidsstempler og talerfordeling, navnekorrigering. Eksport til Word, PDF og tekst med valgfrie tidsstempler og talernavn/nummer.
- Lydimport via filvalg og dra-og-slipp, inkludert MP3, M4A fra Taleopptak og WAV. Praktisk tilgang fra lokale og valgte synkroniserte mapper.
- Praktiske koblinger mot Teams, kalender og SharePoint/OneDrive for møter, lydfiler og dokumenter. Også iCloud Drive/Google Drive der de er tilgjengelige. Lokal behandling fungerer uten disse kontoene. E-postkoblingens leverandør og omfang er ikke avklart.
- Ingen nødvendig konto, API-nøkkel, abonnement, betalingssider eller prøveperiode. Ingen valg som utilsiktet bytter fra lokal NB-Whisper til en skytjeneste. Lokal Mac-profil. Ingen automatisk upstream-oppdatering som overskriver tilpasningen. Manuell oppdatering bevarer data.
- Lyd beholdes lokalt som standard; ingen automatisk opplasting. Skytjenester brukes bare etter brukerens valg.
- Bevar Tailscale, RustDesk, Deskflow og eksisterende lydruting. Ingen kjøp eller forespørsel om hemmeligheter i chat.

## Implementert i denne kildegrenen

- Begrenset modellnedlastingssesjon uten brukercookies, med uendret standard nettfilter.
- Endringer i native innliming og kontroll av mottakertekst, pluss automatisk åpning av et eget testdokument.
- Hjem-kort og velkomstside i godkjent lys/mørk visuell retning.
- Høyttalervalg, testtone og dikteringslyd til valgt utgang; lokal lagring og tydelig manglende-enhet-status. Eksisterende mikrofonvalg bevares.
- Samtalefil per notat med atomisk lagring og eksport til Word/PDF/TXT. Import av en bokmålslydfil med full NB-modell er prøvd gjennom notat og samtale-TXT; eksportfilene er teknisk validert. Visuell kontroll av siste eksport gjenstår.
- 49 målrettede tester bestått. Native-modulens faktiske binære eksport kontrolleres ved bygging.
- Installert 1.9.6 har igjen satt norsk testtekst med æøå inn automatisk i Tekstredigering, bekreftet både i appen og målprogrammet (testmarkør 1793159324615). Dette var testinnliming, ikke hele kjeden fra tale via fysisk hurtigtast.
- Native testlyd mot Mac mini-utgangen fikk lydcallback. Brukerens bekreftelse på hørbar lyd mangler. Modellbytte ble prøvd uten heng i Nøkkelring.

## Ikke sluttverifisert / gjenstår

- Hele kjeden tale → fysisk hurtigtast → aktivt tekstfelt i vanlige apper og denne chatten. Den separate innlimingstesten i Tekstredigering er bestått, men erstatter ikke dette.
- Fysisk hørbar test av valgt høyttaler og valgte mikrofoner, inkludert faktisk BlackHole-signal.
- Samtaledokument under et ekte møte, visuell eksportkontroll og alle eksportvalg gjennom møteflyten.
- Kjent begrensning: Hvis en tidligere ikke-tom transkripsjon tømmes helt, kan den gamle samtale-TXT-filen bli liggende med tidligere tekst. Sletting av selve notatet har egen filopprydding.
- q5_0 og Nynorsk er observert i live app, men kontrollert nynorsk-lydprøve i siste versjon er ikke fullført.
- End-to-end Teams-opptak, automatisk oppdagelse, live/etterbehandling og talerfordeling.
- Kalender/SharePoint-koblinger med faktisk innhenting og lagring. En knapp eller lokal synkronisert mappe er ikke bevis på en full integrasjon.
- Ny DMG pakkes. Verifisering av den endelige DMG-en, installeringsrunde, omstartskontroll og oppdatert offentlig nedlasting gjenstår.
- Apple Developer ID og notarisation mangler. Endret usignert bygg kan kreve ny appspesifikk Mac-tillatelse. Ingen Intel-pakke er testet.
- Migrering fra upstream v1.9.2 til v1.10.4 er undersøkt, men ikke gjennomført.

## Ferdigkriterier

Test DMG-installert app uavhengig av byggemappe, begge NB-modellene, bokmål/nynorsk, markørinnsetting, snarveier, lydvalg, møteopptak, import/eksport og omstart. Lever DMG, SHA-256, kort norsk installasjonstekst og ærlig testmatrise. Verifiser lisenser og publiser kun godkjente leveranser. Ingen GitHub-release ennå.
