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

## Verifisert og rettet i 1.9.7

- Slutt-DMG bygget, kontrollert, installert og startet fra Programmer. Begge NB-modeller og native moduler kontrolleres mot installert app.
- Full testkjøring: 3368 tester, 3182 bestått, 0 feil, 185 hoppet over og 1 todo. Disse erstatter ikke fysiske tester.
- Begge NB-modeller × bokmål/nynorsk transkribert med pakket motor og Metal. I installert 1.9.7: M4A/full/bokmål og hele 85,5 sekunders MP3/q5/nynorsk importert og lagret.
- Fire valgfrie LLM-filer SHA256-kontrollert og kjørt lokalt. 2B/4B/8B faktisk lastet ned i appen. Fremdriftsvisningens to-arguments IPC-feil rettet med regresjonstest.
- Word/PDF/TXT kontrollert; Word og PDF rendret og visuelt vurdert.
- Rettet foreldet samtale-TXT etter tømming, tekstimport med tom segmentliste, talernummerering, modellvalg på tvers av førstegangsoppsett og kalendertilgangens feilstatus. Automatisk upstream-oppdateringskode er erstattet av lokal stub.
- Nynorsk/q5 og mikrofon/høyttaler beholdt etter installasjon og omstart; brukerens bokmål/full og opprinnelige LLM-/oppryddingsvalg gjenopprettet etter testen.

## Ikke godkjent som ferdig produkt

- Fornyet 1.9.7-innlimingstillatelse er godkjent lokalt, og automatisk testinnliming i Tekstredigering er bestått i 1.9.7. Fysisk hurtigtast og tale til markør på tvers av programmer gjenstår.
- Kontrollert BlackHole-avspilling og appens faktiske femsekunders mikrofonopptak med lokal transkripsjon er nå bestått. Hørbar høyttalertest og brukerens komplette eksterne lydkjede gjenstår.
- Taleranalyse fullførte på en kontrollert fil med to stemmer, men fant feil antall og ga dårlig oppdeling. Manuell vurdering kreves. Ingen sikker personidentifikasjon loves.
- Ekte Teams-møte, automatisk oppdagelse, live/etterbehandling, ny kalender-/systemlydtilgang og kontorkoblinger er ikke ferdig verifisert. SharePoint-API og e-postlesing finnes ikke; Finder-synkmapper er ikke slike integrasjoner.
- iCloud Drive viste et rettighets-/synkroniseringsvarsel. Apple-sikkerhetskopi er ikke bekreftet.
- Developer ID/notarisering mangler. ARM64, teknisk macOS 26+, faktisk M4/macOS 27.0.1. Intel og egen macOS 26-maskin er ikke testet. Ren mottaker-Mac gjenstår.
- Koden bygger fortsatt på OpenWhispr 1.9.2; migrering til 1.10.4 er ikke gjennomført. Enkelte avanserte tekster er engelske.

- CPU-motorprøve bestått (14,79 s for 12 s q5_0/Bokmål). Lokal assistent svarte korrekt på kontrollspørsmål. Den minste modellens notatformatering la til en uriktig opplysning i prøven; manuell faktakontroll kreves.

Se [full test og vurdering](FULL-TEST-OG-VURDERING-1.9.7.txt) for bevis, avgrensninger og pakkekontroll. Ingen GitHub-release er publisert.
