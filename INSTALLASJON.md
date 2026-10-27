# Installere DSSA Tale på Mac

> **Testversjon – signert utgave er planlagt.**
> DMG 1.9.4 og kontrollsum er tilgjengelige i README. Apple Developer ID-signering og notarisation mangler; denne testpakken gir derfor ikke en friksjonsfri førstegangsinstallasjon for alle.

Du trenger en Mac med **Apple Silicon** og macOS **26 eller nyere**. Pakken er prøvd på M4 med macOS 27.0.1; macOS 26 er et teknisk minstekrav, ikke en ferdig testet plattform. Intel støttes ikke. Terminal, Homebrew og Python er ikke nødvendig.

## Installere eller oppdatere manuelt

1. Avslutt DSSA Tale hvis den kjører. Last ned riktig DMG fra [README](README.md). Velg **1.9.4**.
2. Åpne DMG-filen. Dra **selve DSSA Tale-appen inne i vinduet** til **Programmer**. Ikke dra diskikonet fra skrivebordet. Ved oppdatering velger du å erstatte den gamle appen.
3. Mat ut installasjonsdisken. Åpne DSSA Tale fra **Programmer**.
4. Gi mikrofontillatelse når du blir spurt. Automatisk innliming trenger også **Tilgjengelighet**. Opptak av systemlyd kan kreve egen tillatelse.
5. Velg ønsket mikrofon og kontroller at den faktisk får lyd. Bokmål og NB-Whisper Large med full presisjon er standard; Nynorsk og q5_0 kan velges.

Appens innstillinger og data ligger separat i `~/Library/Application Support/OpenWhispr-NB`. Behold denne mappen når du erstatter appen. Den skal ikke slettes for å oppdatere. Det finnes ingen automatisk appoppdatering.

## Hvis macOS stopper testappen

Denne utgaven er ikke signert med Apple Developer ID eller notarisert. Du kan vente på en signert utgave. Hvis du selv velger å prøve testpakken og er sikker på kilden, kan macOS etter et åpningsforsøk tilby **Åpne likevel** under **Systeminnstillinger → Personvern og sikkerhet**. Dette lager et unntak for denne appen; det er ikke en godkjenning fra Apple. Følg [Apples beskrivelse av å åpne en app](https://support.apple.com/no-no/102445).

Ikke slå av Gatekeeper globalt. Hvis macOS sier at appen er skadelig eller skadet, eller alternativet ikke finnes, stopp og meld fra fremfor å tvinge den åpen.

En ny usignert testutgave kan også kreve ny tillatelse. Under **Personvern og sikkerhet → Tilgjengelighet** kontrollerer du DSSA Tale fra **Programmer**, og gir tillatelsen til den aktuelle appen. Avslutt og åpne appen igjen etterpå. Se [Apples veiledning om Tilgjengelighet](https://support.apple.com/no-no/guide/mac-help/mh43185/mac). Et aktivt valg i listen beviser ikke alene at innliming fungerer.

## Før du begynner å diktere

Gå til **Innstillinger → Tale og mikrofon → Test innliming om 5 sekunder**: start testen, og plasser markøren i et tomt dokument i for eksempel Tekstredigering innen fem sekunder. Kontroller at testteksten faktisk kommer inn. Synlig innliming fra den nye installerte appen avventer sluttverifisering. Backend for modellnedlasting er prøvd med en full Qwen3.5 2B-nedlasting og korrekt SHA-256.

Begge NB-modellene følger med. Valgfrie språkmodeller for tekstopprydding lastes ned separat; opprydding er avslått som standard. BlackHole er en virtuell mikrofon og må få et lydsignal fra oppsettet ditt. Appen løser ikke automatisk lyd fra en annen PC, og ekte Teams-møter er ikke sluttverifisert.

Lydfiler kan importeres fra Finder, også filer eksportert fra Apple Taleopptak. Lagre i en lokal mappe hvis du vil beholde filene lokalt. En mappe i iCloud Drive, OneDrive eller Google Drive kan laste opp filene gjennom synkronisering; det er ditt valg. Synkronisering alene er ikke en full sikkerhetskopi.

For vanlig diktering klikker du først i tekstfeltet i målappen og bruker den valgte dikteringssnarveien (standard ⌘ ⇧ mellomrom) for å starte og stoppe. Knappen «Test valgt mikrofon i 5 sekunder» viser bare tekst inne i DSSA Tale og limer ikke automatisk inn i andre apper.

Velg en valgfri språkmodell på **Assistent**-siden. Velg modellen i listen, trykk **Last ned valgt modell** og vent til fremdriften er ferdig og «Modellen er klar» vises. Deretter kan du bruke **Rydd teksten** eller **Formater notat**. Automatisk opprydding må slås på særskilt dersom du ønsker det.

Versjonsnummeret står fast nederst i sidemenyen som **DSSA Tale · versjon 1.9.4**. Tallet kommer fra den kjørende appen. Ser du et eldre tall, kjører du fremdeles en eldre appkopi.
