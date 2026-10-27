# Installere DSSA Tale på Mac

> **Testversjon – signert utgave er planlagt.**
> Developer ID-signering og notarisation mangler foreløpig. Det finnes ingen bekreftet dato for en signert utgave. Gatekeeper kan derfor stoppe en nedlastet kopi. Dette dokumentet anbefaler ikke å slå av eller omgå macOS-beskyttelsen. Vent på en signert og notarisert utgave hvis du trenger vanlig installasjon uten ekstra sikkerhetshindringer.

## Krav

- Mac med **Apple Silicon**. Intel støttes ikke.
- **macOS 26.0 eller nyere** som teknisk minstekrav. Bare Apple M4 med macOS 27.0.1 er faktisk prøvd.
- Ledig plass til appen, begge medfølgende NB Large-modeller og egne opptak. Valgfrie språkmodeller trenger ekstra plass og minne.

## Nedlasting

[Last ned DMG-en](https://drive.google.com/file/d/1Yc2fbrEaWW--HwV1ppyJn7f-Wry2Vgy8/view?usp=drivesdk). Filen er ca. 3,6 GB og inneholder begge modellene. [Kontrollsummer](SHA256SUMS.txt). Ingen GitHub-konto er nødvendig. Google kan vise en ekstra nedlastingsbekreftelse for store filer.

## Enkel installasjon når nedlastingen er tilgjengelig

1. Last ned DMG-filen fra lenken i README. Hvis Google viser «Last ned likevel», skyldes det at filen er for stor til Googles virussjekk. Knappen starter nedlastingen av testpakken; Google har ikke virusskannet den.
2. Åpne DMG-filen.
3. Dra **DSSA Tale** til **Programmer** i vinduet.
4. Løs ut diskbildet og åpne appen fra Programmer.
5. Gi mikrofontilgang. Tilgjengelighet-tilgang trengs dersom appen skal lime tekst inn i andre programmer. Møteopptak kan også kreve systemlydtilgang.
6. Velg mikrofon og prøv en kort lydfil før vanlig bruk.

**Hvis macOS blokkerer appen:** denne testpakken er ikke friksjonsfri å installere. Vent på den planlagte signerte og notariserte utgaven dersom du trenger installasjon uten slike hindringer. Offentlig nedlasting uten konto fjerner ikke Gatekeeper-kontrollen.

Bokmål og NB-Whisper Large med full presisjon er standard. Nynorsk og den mer minnebesparende q5_0-modellen velges i appen. Ingen Terminal, Homebrew, Python, konto eller API-nøkkel skal være nødvendig for mottakeren.

## Hva du må prøve selv foreløpig

Lokal talegjenkjenning er testet. Velg en mikrofon som faktisk mottar lyd. BlackHole er en virtuell inngang og krever en lydkilde som sender lyd til den. Teams-møter, fysisk hurtigtast og automatisk innliming er ikke sluttverifisert. Talerseparasjon kan gi feil og må kontrolleres. Et langt lydfilforsøk er heller ikke en full test av et langt møteopptak.

## Manuell oppdatering og egne data

Appen oppdaterer seg ikke automatisk. Når en ny versjon er tilgjengelig, avslutter du appen og erstatter appen i Programmer. Innstillinger og lokale data ligger separat i `~/Library/Application Support/OpenWhispr-NB` og skal ikke slettes ved vanlig oppdatering. Ta sikkerhetskopi før en større oppgradering; ikke slett datamappen for å oppdatere.

Du kan velge en lokal mappe eller en synkronisert Finder-mappe når du lagrer dokumenter og lyd. En skymappe kan laste opp filen gjennom iCloud, OneDrive eller Google Drive. iCloud Drive er synkronisering og erstatter ikke en uavhengig sikkerhetskopi.
