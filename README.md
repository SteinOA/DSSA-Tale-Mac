# DSSA Tale for Mac

Lokal norsk tale til tekst for Apple Silicon, med NB-Whisper Large fra Nasjonalbiblioteket. Uavhengig tilpasning av OpenWhispr.

> **Utviklingsstatus: 1.9.6 er under arbeid.** Kildeendringene er tilgjengelige på denne grenen. Den er ikke en ferdig sluttverifisert installasjonsutgave. Innliming, lydvalg og møte-/kontorintegrasjoner må ikke tolkes som ferdig testet bare fordi knapper eller innstillinger finnes.

## Hva som inngår

- Bokmål som standard, med valg av nynorsk og lagrede språkinnstillinger.
- NB-Whisper Large i full presisjon (standard) og q5_0. Modellene pakkes med Mac-utgaven; de store binærfilene ligger ikke i Git.
- Lokal transkribering, Metal/CPU, ingen nødvendig konto eller betalt plan.
- Valgfri lokal tekstopprydding, av som standard.
- Synlig sidemeny, Hjem-knapp og visuell retning fra det godkjente Canva-designet.
- Mikrofonvalg, app-lokalt høyttalervalg, testtone og lagring av enhetsvalg.

## Pågående rettelser

1. Modellnedlasting: egen begrenset sesjon for de fire valgte modellfilene; resten av appens nettfilter beholdes. Full Qwen3.5 2B-nedlasting og kontrollsum er testet med pakket 1.9.5-kode og det faktiske nettfilteret.
2. Innliming: prosessrettet innsetting, kontroll av mottakertekst når tilgjengelig, og bevart utklippstavle ved usikkert resultat. Ny test åpner et eget dokument i Tekstredigering. Endelig test fra sluttpakken gjenstår.
3. Utseende: ny Hjem-visning og et kortere, sammenhengende førstegangsoppsett.

[Full krav- og statusoversikt](KRAV-OG-STATUS.md) · [Teststatus](TESTSTATUS.txt) · [Byggenotater](BUILD-NOTES.txt)

## Nedlasting

Det er foreløpig ingen publisert, sluttverifisert 1.9.6-pakke. Tidligere usignerte testpakker finnes i [den avtalte Drive-mappen](https://drive.google.com/drive/folders/1V9J05FTCdjoR99HIYa_fC-wkxrPEnKVd). **1.9.4 har kjent feil med nedlasting av AI-hjelpemodeller.** Ingen GitHub-release publiseres i denne arbeidsrunden.

Pakkene mangler Apple Developer ID-signering og notarisation. Nedlasting uten innlogging betyr ikke at Gatekeeper godkjenner appen. Intel-støtte er ikke verifisert.

## Utgangspunkt og lisenser

Koden bygger fortsatt på OpenWhispr v1.9.2. [OpenWhispr v1.10.4](https://github.com/OpenWhispr/openwhispr/releases/tag/v1.10.4) er hentet og sammenlignet; denne grenen er **ikke** allerede migrert til 1.10.4. [Windows-oppsettet](https://github.com/SteinOA/openwhispr-nb-whisper) er separat og endres ikke.

Se LICENSE og resources/legal for lisensopplysninger. Modellkilder og kontroller skal bevares i bygge- og leveransedokumentasjonen.
