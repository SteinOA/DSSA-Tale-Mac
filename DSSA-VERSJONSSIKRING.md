# Sikre lokale Mac-versjoner på GitHub

Dette verktøyet sikrer **kildekoden fra Mac-en der appen ble bygget**. Det lager ikke en ny app, retter ikke innliming, og laster ikke opp en installasjonspakke.

GitHub har ved opprettelsen av denne veiledningen kildekode/utgivelse for 1.9.20. Stein oppgir at 1.9.23 er bygget lokalt på Mac. **Den lokale 1.9.23-koden er ikke sikret av at dette verktøyet legges i GitHub.** Sikringen skjer først når verktøyet kjøres på den Mac-en og melder SIKRET med lenke og commit.

## På Mac-en

1. Last ned og pakk ut `tools/DSSA-Mac-Versjonssikring.zip`.
2. Åpne `DSSA-Mac-Versjonssikring.command`. Velg **prosjektmappen med kildekoden**, ikke `.app` i Programmer. Mac-en må ha Git, Node.js og innlogging med skrivetilgang til GitHub-prosjektet. Ingen nye nøkler bygges inn i verktøyet. Hvis macOS stopper filen, bruk den lokale kodeassistenten til å kjøre hjelpefilen; ikke slå av macOS-beskyttelsen.
3. Verktøyet viser **DIN TUR**, gir et lydsignal og bruker Mac-ens tale når du må velge mappen eller lese resultatet. Det endrer ikke Mac-ens lydstyrke; lyd kan utebli hvis enheten er dempet. Varslene gjelder dette lokale verktøyet, ikke meldinger i ChatGPT.
4. Vent på **SIKRET**, versjonsnummer, GitHub-lenke og kildecommit. Åpne lenken og kontroller at det er riktig versjon. Ved feil vises STOPPET; ikke anta at det finnes en sikker kopi.

En lokal kodeassistent kan i stedet kjøre:

```sh
node "/sti/til/DSSA-sikre-mac-versjon.cjs" --project "/sti/til/DSSA-Tale-Mac" --push
```

Uten `--push` utføres bare lokal forhåndskontroll. Ingen Terminal-kommandoer trengs når Mac-filen kan åpnes direkte.

## Hva som sikres

- En ny `backup/mac-source-v<versjon>-<tid>-<tilfeldig>`-gren og et tilsvarende versjonsmerke. Eksisterende grener, tagger og utgivelser erstattes ikke. GitHub må støtte atomisk push; ellers stopper verktøyet.
- Kildekode, konfigurasjonsmaler, dokumentasjon og vanlige bilde-/fontressurser fra kjente prosjektmapper. `DSSA-source-checkpoint.json` angir versjon og SHA-256 per kildefil. Minste tillatte prosjektversjon er 1.9.23, slik at en gammel 1.9.20-mappe ikke gis nytt versjonsnummer ved et uhell.
- Ingen lokal commit, checkout, staging eller endring i prosjektmappen. Sikringen bruker en midlertidig mappe og arver bare den offentlige GitHub-historikken. Private lokale commits lastes ikke opp som historie. Filene kontrolleres igjen før push, slik at samtidig redigering stopper opplastingen.
- Profil, innstillinger, modeller, lyd/video, nøkler, databaser, byggmapper og vanlige avhengighetsmapper utelates. Mulige nøkler i tekstfiler stopper opplastingen. Dette er en avgrenset kontroll, ingen garanti mot alle former for hemmeligheter eller personopplysninger i kildekode. Kontroller hva som legges i prosjektmappen. Store filer og symbolske kildelenker må vurderes separat.

**Kontrollpunktet er ikke en full kopi av hele utviklingsmaskinen eller et bevis på at appen virker.** Tester kjøres ikke og ferdigbygde `.app`-/DMG-filer lastes ikke opp. Endringer på en sikringsgren skal gjennomgås før de eventuelt flettes til `main`.

## Videre utgivelsesløp

Når den faktiske 1.9.23-koden er sikret, undersøkes feilen med automatisk innliming mot den koden. Etter retting og passende tester bygges en ny Mac-utgave. Installasjonspakken legges ved riktig GitHub-utgivelse med versjon, kildecommit, SHA-256, endringsnotat og ærlig teststatus. Ikke bruk en gammel pakke med et nytt versjonsnummer. Innstillinger og lokale data skal bevares når appen oppdateres.
