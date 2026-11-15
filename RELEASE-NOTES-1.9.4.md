# DSSA Tale 1.9.4 – synlig versjonsnummer

Appnavn og faktisk versjonsnummer vises fast nederst i sidemenyen. Nummeret hentes fra den kjørende appen, slik at en gammel installasjon ikke viser et nyere nummer fra nedlastingssiden.

Modellnedlasting, filkontroll og innlimingsmotor er de samme som i 1.9.3. En full Qwen3.5 2B-nedlasting med korrekt SHA-256 og lokal norsk tekstopprydding er testet. Qwen2.5 1.5B i eksisterende cache er kontrollert. De større 4B/8B-modellene er ikke kjørt gjennom en full nedlasting og inferensprøve.

Se [installasjon](INSTALLASJON.md) og [teststatus](TESTSTATUS.txt). Apple Developer ID-signering og notarisation mangler fortsatt. Automatisk innliming fra den nye installerte appen må sluttprøves etter riktig Mac-tillatelse.

[Nedlasting av 1.9.4](https://drive.google.com/file/d/1Z9bUyCmgpWfAnj1h4x4uUJAdNLYpQSLL/view?usp=drivesdk) · [SHA-256](SHA256SUMS.txt)
