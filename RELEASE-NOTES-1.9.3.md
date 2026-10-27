# DSSA Tale 1.9.3 – testversjon

> **Ny testpakke. Signert utgave er planlagt.**
> Pakken er bygd og integritetskontrollert. Apple Developer ID-signering og notarisation mangler.

Denne versjonen retter seg mot to problemer fra brukertesten av 1.9.2: språkmodeller som så ut til ikke å bli lastet ned, og `PasteError` ved automatisk innliming selv med synlig Tilgjengelighet-tillatelse.

## Endringer

- Modellvelgeren bruker gyldige modellvalg, og nedlasting får tydeligere fremdrift.
- Automatisk innliming flyttes til appens egen prosess for å unngå problemet med macOS-tillit til en separat hjelpeprosess.
- En norsk innlimingstest gir fem sekunder til å sette markøren i ønsket tekstfelt.

Endringene er **ikke ennå bekreftet gjennom en full brukertest fra den nye DMG-en**. Endelig tillatelse på Mac-en og praktisk innliming kan fortsatt gjenstå. Se [teststatus](TESTSTATUS.txt).

Begge NB Large-modellene følger fortsatt med. Full presisjon og Bokmål er standard på nye installasjoner; eksisterende brukerinnstillinger beholdes. Ingen automatisk oppdatering, konto eller betalingsplan er innført.

Oppdater manuelt ved å avslutte appen og dra **DSSA Tale-appen inne i DMG-vinduet** til Programmer, og erstatte den gamle appen. Behold datamappen `~/Library/Application Support/OpenWhispr-NB`. Nytt usignert bygg kan kreve ny appgodkjenning og Tilgjengelighet-tillatelse. Se [installasjon](INSTALLASJON.md).

Apple Silicon, teknisk minimum macOS 26.0. Testarbeidet er utført på M4 med macOS 27.0.1; ingen Intel-støtte er verifisert. Ekte Teams-møter, fysisk hurtigtast med innliming og brukerens PC/Mac-lydkjede er fortsatt ikke sluttverifisert.

Verifisert: 72 målrettede tester, typecheck og renderer; faktisk 2B-nedlasting med korrekt SHA-256 og lokal norsk opprydding; begge NB-modeller med Metal på bokmål og nynorsk fra 1.9.3-DMG. Automatisk innliming har nye regresjonstester, men synlig tekst i et annet program fra den nye Finder-installerte appen gjenstår.

[Nedlasting av 1.9.3](https://drive.google.com/file/d/1NI0DErDFLwx0aYQK6v7aiqMD2iim0rkz/view?usp=drivesdk) · [SHA-256](SHA256SUMS.txt)
