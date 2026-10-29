# DSSA Tale 1.9.5 – rettet nedlasting av lokale AI-modeller

Tidligere brukte modellnedlastingen samme nettverkssesjon som appens lokale transkribering. Appens eget nettfilter blokkerte derfor Hugging Face med `ERR_BLOCKED_BY_CLIENT`, selv om nedlastingsmotoren fungerte i en prøve uten dette filteret.

1.9.5 bruker en egen, ikke-persistent nedlastingssesjon for de fire bestemte modellfilene. Bare HTTPS/GET til disse filene og nødvendige Hugging Face-CDN-omdirigeringer tillates. Sesjonen bruker ikke brukercookies. Modellfilene kontrolleres fortsatt mot filstørrelse, GGUF og SHA-256. Appens øvrige nettfilter er uendret; skyforespørsler og POST-opplasting forblir blokkert i testene.

## Verifisert fra ferdig pakket 1.9.5-kode

- Testen lastet hovedappens faktiske nettfilter og modellmanager fra den ferdige `app.asar`.
- Standardtransporten gjenskapte den gamle blokkeringen.
- Den rettede transporten nådde alle fire modellene og fikk en gyldig GGUF-header.
- Hele Qwen3.5 2B ble lastet ned: 1 396 198 496 byte, korrekt SHA-256.
- Standardtransportens blokkering bestod også etter nedlastingen. POST og andre skytjenester ble fortsatt blokkert.
- 44 målrettede regresjonstester, typecheck og produksjonsrenderer bestått.

Dette er en test av pakket backend med det faktiske filteret, ikke en full GUI-prøve med alle fire komplette modellfiler. 4B/8B har ikke full nedlastings-/inferensprøve. Automatisk innliming trenger fortsatt endelig prøve fra Finder-installert app med korrekt Mac-tillatelse.

Appnavn/versjon i sidemenyen, begge NB Large-modeller, Bokmål/Nynorsk, manuell oppdatering og lokal brukerprofil er beholdt. Ingen nye kontoer, API-nøkler eller betalingsplaner. Apple Developer ID-signering og notarisation mangler fortsatt.

[Nedlasting](https://drive.google.com/drive/folders/1V9J05FTCdjoR99HIYa_fC-wkxrPEnKVd) · [Installasjon](INSTALLASJON.md) · [Teststatus](TESTSTATUS.txt)
