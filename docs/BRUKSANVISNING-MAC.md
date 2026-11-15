# Enkel bruksanvisning for DSSA Tale på Mac

Denne veiledningen er skrevet for deg som ønsker konkrete klikk og minst mulig dataspråk. Du trenger ikke bruke Terminal eller kunne programmere. Tale, møteopptak og lydfiler behandles lokalt på Mac-en når du bruker oppsettet i denne veiledningen.

## Innhold

- [Installer DSSA Tale](#installer-dssa-tale)
- [Last ned talemodellen](#last-ned-talemodellen)
- [Gi nødvendige tillatelser](#gi-nødvendige-tillatelser)
- [Dikter i et annet program](#dikter-i-et-annet-program)
- [Ta opp et møte](#ta-opp-et-møte)
- [Lag tekst fra lydfiler](#lag-tekst-fra-lydfiler)
- [Finn og eksporter notater](#finn-og-eksporter-notater)
- [Oppdater appen](#oppdater-appen)
- [Når noe ikke virker](#når-noe-ikke-virker)

## Installer DSSA Tale

Installasjonen og ny installasjon er gjennomført hundrevis av ganger i utviklings- og testarbeidet. Selve pakken og installasjonsmåten fungerer i det kontrollerte Mac-oppsettet. Første gang må du likevel svare på Apples spørsmål og gi appen nødvendige tillatelser.

1. Klikk på nedlastingslenken for **DSSA Tale 1.9.45** på forsiden av repoet.
2. Åpne DMG-filen når den er lastet ned.
3. Dra **DSSA Tale** over til mappen **Programmer**.
4. Åpne **Programmer** og dobbeltklikk appen.
5. Hvis Mac-en blokkerer åpningen, går du til **Systeminnstillinger → Personvern og sikkerhet**.
6. Finn meldingen om DSSA Tale og velg **Åpne likevel** hvis du stoler på filen du lastet ned herfra.

## Last ned talemodellen

Talemodellen er den delen som gjør tale om til tekst.

1. Følg veiviseren som vises første gang.
2. Velg den anbefalte NB-Whisper-modellen hvis du er usikker.
3. Start nedlastingen og vent til den er ferdig.
4. Ikke lukk appen mens modellen lastes ned.

Den største modellen bruker omtrent 3,1 GB diskplass. Den mindre utgaven bruker omtrent 1,08 GB.

## Gi nødvendige tillatelser

### Mikrofon

Når Mac-en spør, velger du at DSSA Tale får bruke mikrofonen. Velg deretter mikrofonen i appen og gjennomfør lydtesten.

### Automatisk innliming

1. Bruk knappen i veiviseren for å åpne riktig systeminnstilling.
2. Finn **DSSA Tale** under **Tilgjengelighet** eller **Enhetskontroll og datatilgang**.
3. Slå på bryteren.
4. Start DSSA Tale på nytt når appen ber om det.
5. Kjør innlimingstesten.

Hvis en gammel DSSA Tale allerede står i listen, men ikke virker, fjerner du den gamle oppføringen. Legg til appen fra **Programmer** på nytt.

## Dikter i et annet program

1. Åpne Word, Outlook, Teams eller et annet program med et skrivefelt.
2. Klikk der teksten skal stå.
3. Hold inne `⌘ + ⇧ + mellomrom` mens du snakker.
4. Slipp tastene når du er ferdig.
5. Vent til teksten blir limt inn.
6. Les gjennom teksten før du sender eller lagrer den.

Hvis innlimingen ikke virker, trykker du `⌘ + V`. DSSA Tale legger den ferdige teksten i utklippstavlen.

## Ta opp et møte

Dette er en lokal testfunksjon uten integrering i Teams. Du trenger ingen Teams-bot, Microsoft-innlogging, tillegg eller kontakt med Teams-API-et. DSSA Tale kobler seg ikke til Teams-skyen for å behandle opptaket. Du kan avslutte ett opptak, la teksten bli ferdig og deretter starte neste samtale som et nytt lokalt notat.

DSSA Tale sender ikke opptaksvarsel til deltakerne. Før hvert opptak må du derfor fortelle at du vil ta opp og få et tydelig muntlig samtykke fra deltakerne. Følg også rutinene som gjelder i virksomheten din.

1. Fortell deltakerne at du tar opp.
2. Opprett eller åpne et notat i DSSA Tale.
3. Trykk **Start møteopptak**.
4. Kontroller at tiden går og at både mikrofon og systemlyd er med.
5. Trykk **Stopp møteopptak** når møtet er ferdig.
6. La appen stå åpen mens den lager teksten.
7. Kontroller navn, tall og hvem som snakker.

Gjør et kort prøveopptak før et viktig møte. Kontroller opptakstid, mikrofon og systemlyd på nytt for hvert møte.

## Lag tekst fra lydfiler

1. Åpne lydimporten.
2. Velg én fil, flere filer eller en mappe.
3. Velg bokmål eller nynorsk.
4. Velg eventuell talermerking.
5. Start importen.
6. La appen stå åpen til alle filene er ferdige.

Hver ferdige fil blir et eget notat. Originalfilen endres ikke.

## Finn og eksporter notater

- **Hjem** viser diktater og automatisk notatblokk.
- **Møter og notater** viser møteutskrifter og andre notater.
- Søkefeltet finner lagret innhold.
- **Kopier** gjør teksten klar til innliming.
- **Eksport** kan lage en tekst-, Word- eller PDF-fil når valget finnes.
- **Rå utskrift** viser teksten før automatisk opprydding.

Les gjennom teksten før du bruker den. Talegjenkjenning kan ta feil av navn, tall og lignende ord.

## Oppdater appen

1. Vent til alle opptak og importer er ferdige.
2. Avslutt DSSA Tale.
3. Last ned den nye DMG-filen.
4. Dra den nye appen til **Programmer**.
5. Velg å erstatte den gamle appen.
6. Start DSSA Tale og prøv et kort diktat.

Ikke slett brukerdata for å oppdatere. En vanlig oppdatering skal beholde modellen, innstillingene og notatene.

## Når noe ikke virker

### Mikrofonen reagerer ikke

Kontroller valgt mikrofon og **Systeminnstillinger → Personvern og sikkerhet → Mikrofon**. Start appen på nytt etter at tillatelsen er gitt.

### Teksten blir ikke limt inn

Kontroller innlimingstillatelsen. Klikk i et vanlig skrivefelt og prøv igjen. Du kan lime inn teksten selv med `⌘ + V`.

### De andre i møtet mangler

Da er systemlyden trolig ikke med. Kontroller lydoppsettet og gjør et kort prøveopptak.

### Det tar lang tid

Lange lydfiler og den største modellen trenger mer tid og minne. La appen stå åpen og avslutt andre tunge programmer hvis Mac-en arbeider sakte.

### Bokmål eller nynorsk blir feil

Velg riktig transkripsjonsspråk før opptaket. Legg viktige navn og fagord i ordlisten. Kontroller teksten manuelt.
