# Installer DSSA Tale Test 1.9.20 på Mac

Dette er en testutgave for Apple Silicon. Faktisk prøvd: M4, 24 GB, macOS 27.0.1. Teknisk minimum macOS 26.0, andre maskiner ikke fysisk verifisert. Intel støttes ikke.

1. Last ned `.dmg` fra utgivelsen i dette repoet. Du trenger ikke GitHub-konto.
2. Avslutt en eventuell gammel **DSSA Tale Test** med ⌘Q. Avslutt også vanlig DSSA Tale mens du tester.
3. Åpne DMG-filen. Dra appikonet til **Applications / Programmer** i samme vindu. Dette kopierer appen; mappen er en snarvei til Programmer.
4. Vent på kopieringen. Åpne **Programmer** i Finder, og start **DSSA Tale Test** derfra. Løs ut installasjonsdisken i Finder; disken på skrivebordet er ikke den installerte appen.
5. Last ned ønsket NB-Whisper Large-modell i førstegangsoppsettet eller under Tale og mikrofon. Full presisjon er standard. q5_0 er et mindre nedlastingsvalg. Begge bruker internett kun ved nedlasting, og filene kontrolleres med SHA-256.
6. Velg bokmål eller nynorsk, mikrofon og høyttaler. Valgene skal beholdes til du selv endrer dem.
7. Gi mikrofontilgang når du vil diktere. For innliming: **Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet**, legg til testappen fra Programmer og slå på. På enkelte macOS-utgaver brukes navnet **Enhetskontroll og datatilgang**. Følg navnene på din Mac. Ved oppdatering kan macOS kreve ny godkjenning.
8. Plasser markøren i et tekstfelt og bruk snarveien som faktisk står valgt i appen. Test en kort setning før lange opptak. I denne testutgaven er automatisk innliming ikke sluttgodkjent; ved feil ligger teksten fortsatt i appen og kan kopieres manuelt.

## Apple blokkerer åpning

Pakken er ad hoc-signert, men ikke Developer ID-signert eller notarisert. Bare hvis du stoler på denne kilden: prøv å åpne appen én gang, velg Ferdig, og gå til **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel**. Bekreft selv med vanlig Mac-godkjenning. Ikke slå av Gatekeeper og ikke bruk Terminal-kommandoer for å fjerne beskyttelsen. En fremtidig signert utgave krever utviklerkonto og sertifikat; ingen dato er lovet.

## Oppdater eller fjern

Er appen i bruk, avslutt den før du erstatter den. Erstatning av bare appen i Programmer bevarer innstillinger, notater og nedlastede modeller. Testappen bruker egen profil og endrer ikke den vanlige appen. For å avinstallere appen: avslutt den og flytt den fra Programmer til Papirkurv. Dette sletter ikke automatisk profil eller dokumenter.

Ingen Homebrew, Python, Terminal eller utviklingsfiler trengs for å bruke den ferdige appen. Nett trengs for modellnedlasting og eventuelle kontotjenesters egen synkronisering.
