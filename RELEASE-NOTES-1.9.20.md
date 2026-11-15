Norsk tale til tekst lokalt på Apple Silicon, med NB-Whisper Large. **Testutgave – ikke Developer ID-signert eller notarisert.**

Last ned **DSSA-Tale-Test-1.9.20-Apple-Silicon.dmg** under Assets. Du trenger ikke GitHub-konto. Åpne filen, dra **DSSA Tale Test** til **Applications/Programmer**, og åpne appen fra Programmer. Testappen har egen profil; avslutt vanlig DSSA Tale før testing.

**Ingen modellvekter følger med.** Last ned fullpresisjon (standard, ca3,10GB) eller q5_0 (ca1,08GB) i appen. Begge er NB-Whisper Large. Nedlastingene kontrolleres med SHA-256. Valgfrie lokale Qwen- og talermodeller lastes også ned ved behov. Etter nedlasting foregår tale- og tekstbehandlingen lokalt uten konto, API-nøkkel eller lydopplasting. Automatisk opprydding er av ved ny installasjon.

- Grensesnitt på bokmål, nynorsk og engelsk; målformvalg lagres separat.
- Tydeligere blå knapper, bedre avstand, forklaringer på modeller og appens CPU/RAM nederst.
- Reparasjon av ødelagte modellfiler, kontrollert nedlasting og skrivbar modellmappe utenfor appen.
- Lange lydfiler med avbryt/gjenoppta. Word/PDF/TXT, med valgfrie tid-/taleropplysninger.
- Kalender-/møtelenker og skymapper er valgfrie. Leverandørvalg viser oppsettsveiledning, ikke automatisk konto- eller Teams-botkobling.

**Faktisk testmaskin:** Mac mini M4,24GB,macOS27.0.1. Pakken er arm64 med teknisk minimum macOS26.0. Andre maskiner/OS-versjoner ikke fysisk verifisert. Ingen Intel-støtte. Metal/CPU; ingen CoreML-encodervekter i pakken.

**Kontrollert:** 3308 automatiske tester bestått,0 feil,185 hoppet over,1 todo; typekontroll og bygg. Begge NB-modeller faktisk lastet ned og verifisert, norsk tale med bokmål-/nynorskvalg, faktisk modellnedlasting i installert app,36 eksportvarianter, lang filimport med avbryt/gjenoppta, talermodellnedlasting og motorstart. Se vedlagt teststatus for avgrensningene.

**Gjenstår:** testappens mikrofon-/Tilgjengelighetstillatelser er utsatt etter brukerens valg. Fysisk snarvei, automatisk innliming ved faktisk markør og ekte møter er ikke sluttgodkjent. Talernøyaktighet og språk-/referatkvalitet kan variere. Ingen ettsekundsgaranti. Kalenderkonto-/skysynkronisering er ikke verifisert.

Apple kan blokkere første åpning. Bare hvis du stoler på kilden: bruk selv **Systeminnstillinger → Personvern og sikkerhet → Åpne likevel** etter et blokkert forsøk. Ikke slå av Gatekeeper. Sertifikat/notarisering må ordnes før vanlig verifisert distribusjon uten dette ekstra steget; ingen dato er lovet.

App:MIT. NB-modeller:Apache-2.0. FFmpeg:LGPL-2.1+ med kilde-/byggeopplysninger. Andre komponenter beholder egne lisenser. Se vedlagt **BRUK-OG-RETTIGHETER.md** og appens **Contents/Resources/legal/**. Uavhengig tilpasning av OpenWhispr v1.9.2, ikke offisielt godkjent av OpenWhispr eller Nasjonalbiblioteket. Windows-repoet er separat og uendret.
