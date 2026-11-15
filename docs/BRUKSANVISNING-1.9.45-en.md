# DSSA Tale for Mac – user guide

Versjon 1.9.45 · 15.11.2026 · English

For Mac version 1.9.45. Screenshots show the Bokmål interface and this Mac’s settings. BlackHole and Ctrl + Command + Down are personal choices, not requirements. Select your own microphone and check the active shortcut. The ordinary app is named DSSA Tale, without Test; some old in-app help still uses the Test name. No extra LLM is needed for NB-Whisper. Private notes and recordings are excluded. This beta is not Developer ID signed or notarized. Screenshots document the interface; they are not a new end-to-end feature test.

[Last ned appen og les teststatus](https://github.com/SteinOA/DSSA-Tale-Mac/releases/tag/v1.9.45-beta.1)

Buttons and fields described in this guide are in the DSSA Tale app. This page does not change settings.

[Community-1 – modellvilkår](https://huggingface.co/pyannote/speaker-diarization-community-1) · [Hugging Face – tilgangsnøkler](https://huggingface.co/settings/tokens) · [E-post til DSSA](mailto:stein@haldendemensforening.no) · [Feilrapporter på GitHub](https://github.com/SteinOA/DSSA-Tale-Mac/issues)

## Innhold

- [Getting started](#getting-started)
- [Installation and updates](#installation-and-updates)
- [Dictation and notebook](#dictation-and-notebook)
- [Speech model and language](#speech-model-and-language)
- [Optional text processing](#optional-text-processing)
- [Notes and document export](#notes-and-document-export)
- [Meetings and speaker labels](#meetings-and-speaker-labels)
- [Audio files, folders and queue](#audio-files-folders-and-queue)
- [Dictionary and snippets](#dictionary-and-snippets)
- [Calendar, cloud folders and email](#calendar-cloud-folders-and-email)
- [Shortcuts and settings](#shortcuts-and-settings)
- [Memory, CPU and privacy](#memory-cpu-and-privacy)
- [Contact DSSA Tale](#contact-dssa-tale)
- [Troubleshooting and bug reports](#troubleshooting-and-bug-reports)
- [Credits and licences](#credits-and-licences)


## Getting started

### You can finish later

The setup header offers Open the app – finish setup later. This opens notes and the rest of the app without claiming dictation is ready. Home shows Continue setup. Use the standard Mac title bar to move the window and drag its edges to resize. A fresh profile follows the Mac's default microphone/output and uses Hold to talk. Select specific devices only when needed.

### 1. Three steps on first launch

Open Finder → Applications → DSSA Tale. Setup has three steps: Speech model, Microphone, and Pasting and test. Each step explains its status and next action. Download one NB-Whisper Large model in step 1 and wait for Ready to use. In step 2, allow microphone access in macOS and choose your microphone. In step 3, open paste permission under Privacy & Security → Device Control and Data Access (Accessibility on earlier macOS), enable DSSA Tale, or add it from Applications if missing. Return and check status. Restart DSSA Tale preserves this step. Test automatic pasting opens a separate TextEdit document without using the microphone; check that the text arrived. Finish with Open DSSA Tale for dictation. Help → Run setup again opens this guide without deleting models or notes.

### Audio files without microphone access

To transcribe existing audio files only, download one speech model and choose Open for audio files only – pasting off. Microphone and paste permissions are not required. Automatic pasting stays off in this mode. To enable dictation later, use Help → Run setup again and complete microphone and paste access.

### 2. Find the speech model in the menu

After opening the app, click Assistant in the left menu. Under Speech to text – start here, find NB-Whisper from the National Library of Norway. Download Large full precision (3.10 GB), or q5_0 (1.08 GB) for lower memory use. Wait for Ready to use. Model weights are downloaded separately; only one is needed.

### 3. Choose a microphone and try it

Choose Settings → Speech and microphone, select your actual microphone and run the five-second microphone test. Open a blank TextEdit document, place the cursor in it and use the dictation shortcut. By default, hold ⌘ + ⇧ + Space while speaking and release to stop. Shortcuts shows the active combination and whether to hold or tap.

### 4. Start without an extra LLM

NB-Whisper turns audio into written text, normally including punctuation. No extra LLM is needed for dictation or manual editing. Leave cleanup off. Speech recognition and optional local text processing run on the Mac without an account, subscription, API key or audio upload for processing.

![Innstillinger – oversikt over sidene](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/innstillinger.png)

*Innstillinger – oversikt over sidene*


## Installation and updates

### Which Macs can use this package?

This package targets Macs with Apple M-series chips, starting with M1, and requires macOS 26 or later. Intel Macs are not supported. Check Apple menu → About This Mac. Physical testing was on Apple M4 with 24 GB; other machines and every OS version have not been verified. Future chips are not guaranteed.

### Download, drag and open

Download the DMG from DSSA Tale Mac releases on GitHub; no GitHub account is needed. Open it from Downloads, drag DSSA Tale into Applications and wait for copying. Launch from Applications. The drag-to-Applications desktop icon is the mounted installer disk; eject it in Finder afterwards. Do not choose Source code.

### Apple warning on first launch

This test edition is not Developer ID signed or Apple notarized. If Apple cannot check it for malware, choose Done. If you trust this edition, open System Settings → Privacy & Security → Open Anyway and authenticate yourself. Do not disable Gatekeeper. Stop and contact the publisher if the warning says the app will damage your computer or is damaged. A managed work Mac may require IT assistance.

### Update without deleting data

Quit DSSA Tale with ⌘Q before replacing the same app in Applications from a newer DMG. Do not delete the user folder or downloaded models. Updating the same app normally preserves notes, models and settings; export important notes first. Automatic OpenWhispr updates are disabled. A test update may require renewed text insertion permission.


## Dictation and notebook

### Text at the cursor

Keep DSSA Tale open. Click an editable field in Word, Outlook, Mail, Teams or another app. Start with your active shortcut, speak and stop. Text is processed and then inserted if automatic paste and Mac permission are enabled. Text does not necessarily stream into the target field while speaking. Check names and numbers.

### Notebook and history on Home

The automatic notebook collects completed dictations when local history is allowed. The same note appears in Notes; it is not an independent duplicate. Copy note copies the block. Clear notebook only clears this block, and Undo clear can restore it. These actions do not change text in other apps or dictation history below.

### Microphone, speaker and tests

Settings → Speech and microphone lets you choose the system input or a specific microphone. BlackHole only receives audio routed into it; it is not a physical microphone. The speaker choice controls app test and dictation sounds, not all Mac sound. The microphone test records five seconds and transcribes speech. The empty-document test inserts fixed text; it does not test microphone speech.

![Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/hurtigtaster.png)

*Hurtigtaster – bildet viser en personlig valgt snarvei, ikke fabrikkstandarden*

![Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/mikrofon.png)

*Tale og mikrofon – BlackHole er denne maskinens spesielle lydoppsett*


## Speech model and language

### Two versions of the Large model

Assistant → Speech to text – start here: full precision is the default, with a 3.10 GB download. q5_0 is 1.08 GB and usually needs less memory. Both are NB-Whisper Large, adapted to Norwegian by the National Library of Norway from OpenAI Whisper. Neither is a small model. File size is storage, not total RAM usage.

### Bokmål, Nynorsk and interface language

Written language in Assistant selects Bokmål or Nynorsk for transcription. Interface language in Settings → Appearance and language selects Bokmål, Nynorsk or English for menus and this guide. Selecting Bokmål or Nynorsk in either control updates transcription, menus and help together. English menus do not change the Norwegian written language. Choices persist after restarting. Nynorsk needs no additional LLM. Check that editing or export has preserved your chosen written language.

### Download, select and uninstall

Download retrieves and verifies a model. Use this model selects it for dictation, imports and meetings. Selected does not mean currently running; see Active speech engine. Check models refreshes status. Uninstall model deletes only its weights after confirmation. Select another installed speech model before uninstalling the selected one.

### Acceleration and Silero VAD

Automatic and Metal use Apple Silicon graphics; CPU can be slower. Acceleration changes take effect after restarting. Active speech engine shows actual engine status when resource polling is on. Silero VAD detects speech versus silence, not speakers. Separate switches cover dictation and combined audio import/note recording. It may clip short or hesitant speech; disable it if words disappear.

![NB-Whisper-modeller, målform og akselerasjon](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/assistent.png)

*NB-Whisper-modeller, målform og akselerasjon*


## Optional text processing

### Optional editing, not speech recognition

Other language models – text processing is in Assistant. These LLMs work on completed text for cleanup, formatting, questions or summaries. They do not hear audio or separate voices, and are unnecessary for ordinary dictation or manual editing. Try NB-Whisper alone first. Extra processing can delay results and change words or meaning.

### Selecting a model does not enable cleanup

Download an optional text model, choose Use this text model, and enable automatic dictation cleanup only if wanted. Selection or downloading must not enable cleanup. Cleanup: off/on shows the current setting. New installations default to off; explicit saved choices persist. Clean text, Format note and Ask local assistant are actions you start yourself.

### Guidance for Bokmål and Nynorsk

Qwen3 4B Q4 is a first candidate to try, Qwen3.5 2B Q4 a smaller alternative and Gemma 3 4B Q4 a comparison candidate. This is not a measured Norwegian-quality ranking. None is demonstrated best for Nynorsk in this edition. Check names, numbers and written language; retain the original. Start with raw NB-Whisper for Nynorsk. Hugging Face hosts downloads; Qwen and Google develop the models.

### Small models and memory

Suggested Q4 downloads are approximately 1.40 GB for Qwen3.5 2B, 2.50 GB for Qwen3 4B and 2.49 GB for Gemma 3 4B. These are file sizes, not reserved RAM. Context length, caches and the engine use additional memory. Large 8B/9B models are not suggested for new downloads. An absolute 10 GB RAM limit is not documented or enforced; see Memory, CPU and privacy.

![Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstmodeller.png)

*Valgfrie tekstmodeller – ingen ekstra LLM er nødvendig for diktering*


## Notes and document export

### Home and Notes

Home shows dictation history and the automatic notebook. Notes is the workspace for named documents, folders, recording and editing. The automatic notebook is the same note in both places. Search finds notes and transcripts; open a result to read it. New note creates a separate document, which can be named and organized into folders.

### Transcript, notes and AI actions

Transcript shows recognized speech; Notes is editable text. Actions can format or summarize using a selected local text model. Custom actions have a name and instruction. AI actions are unavailable without an installed text model. AI meeting minutes are drafts: check decisions, tasks and attribution against the source.

### Word, PDF, text and audio

Export can save Word, PDF or plain text. Choose whether timestamps and speaker names or numbers are included. Copy text places text on the clipboard. Save audio saves available source audio separately. Review exported documents before sharing. Saving in Notes does not automatically create an external Word or PDF file.

### Deletion and history

Trash controls apply to the nearby item or area. Read confirmations before deleting all items or a document. Clearing the notebook differs from deleting dictation history. Show discarded displays discarded recordings where retained. Export important documents before test updates or large cleanups.

![Notater – førstegangsvisning med Kom i gang og valgfri systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/notathandlinger.png)

*Notater – førstegangsvisning med Kom i gang og valgfri systemlyd*


## Meetings and speaker labels

### 1. Choose the note

Open Notes in the sidebar. Choose an existing note or New note and give it a title. New note alone does not start recording. The meeting shortcut or enabled automatic meeting start can create a note and start recording directly: look for Recording in progress.

### 2. Start meeting recording

Press Start meeting recording at the bottom of the note. It becomes Stop meeting recording. Keep the app open. You may navigate away; recording continues and a status provides a route back to the note.

### 3. Microphone and meeting audio

Select the microphone in Settings → Speech and microphone. Start Teams or your meeting app yourself. DSSA Tale attempts to capture that microphone plus other apps' system audio on the Mac; it is not a Teams bot. Allow Microphone and system audio recording when macOS asks. System Settings → Privacy & Security has Microphone and screen/system audio recording (the name varies by macOS). Notes onboarding also includes System audio. Without system audio permission, only the microphone may be recorded. Accessibility concerns pasting into other apps, not meeting sound. BlackHole only receives audio already routed to that virtual input. Make a short test with both sides before an important meeting; system audio may include other apps' sounds.

### 4. During or after the meeting

Before recording: Settings → Recording and paste → Meeting processing. Record first, transcribe afterwards (default) stores temporary audio chunks for processing after stop. Transcribe during the meeting builds text while recording; the final chunks still finish after stop. Both use the selected NB-Whisper model locally. Wait for saving to be confirmed.

### 5. Stop and follow progress

Press Stop meeting recording when finished. Capture stops but Transcribing audio … remains while the engine works. Deferred recording shows processed audio against total audio and a percentage, updated after each completed chunk. Microphone and system audio are processed separately, so their sum can exceed meeting duration. Checked and skipped silence counts as processed. Elapsed and remaining time use minutes and seconds; remaining time is an estimate for transcription only, shown after measurable progress. Speaker analysis and saving are separate stages without invented percentages. Keep the app open until Finished – transcript saved, or a clear error appears.

### 6. Find and export the transcript

Open the same note under Notes and select Transcript. The transcript is automatically saved locally to this note. Show text file in Finder reveals the conversation's local text file. Save Word, Save PDF or Save TXT creates a document at a location you choose; timestamps and speaker names are optional. The Notes tab contains your own written notes, separately from the transcript. Failures identify the failed stage; usable text remains if speaker analysis fails.

### Voices and names

Speaker separation groups similar voices. Check names and correct speaker labels; Unknown speaker can remain. It does not promise a separate audio track per participant or reliable automatic naming. Community-1 is an audio-import option, not an automatic Community-1 connection to live meeting recording.

### Inform participants

Local recording does not necessarily notify meeting participants automatically. Inform participants before recording.

### Separate speakers during import

Audio files → Separate speakers: Community-1 is an optional local speaker model, not an LLM. Automatic speaker count is capped at 15; it does not force 15 voices. Approve model access and terms yourself at Hugging Face. The app can download its runtime and stores the token in macOS Keychain. CPU and MPS are separate choices; MPS is experimental. Existing sherpa-onnx is an alternative.

### Community-1 needs separate model access

Community-1 is optional speaker separation. Model downloads need a Hugging Face account and a Hugging Face read-access token. This is not an OpenAI API key. Ordinary NB-Whisper dictation needs neither.

### 1. Accept model access conditions

Open the model conditions below. Sign in or create a Hugging Face account, read the conditions and personally accept access to pyannote/speaker-diarization-community-1. The model page also describes account information shared with its publisher. Create the token with that same account.

### 2. Create a read-access token

Choose Create Hugging Face token. Select Fine-grained and a name such as DSSA Tale Mac. Under Repositories, allow «Read access to contents of all public gated repos you can access». This only works after your account has accepted the model conditions. Do not enable Write, private repositories, organization administration, billing or Inference. A regular Read token also works but grants broader read access to your account's repositories.

### 3. Paste the token into DSSA Tale

Copy the token starting with hf_. Return to Audio files → Separate speakers using a local speaker model → Community-1. Paste it into the Hugging Face read-access token field in the Community-1 setup. Use the runtime setup button first if the runtime is missing. Confirm that you personally accepted the model conditions, then choose Download model separately. Wait for confirmation before importing audio with Community-1.

### Secure token and local analysis

The token is stored in macOS Keychain and only used for model downloads. Do not paste it into chat, email or notes. Once downloaded, speaker analysis runs locally without uploading audio. You can manage or revoke the token on Hugging Face.

### If download access is denied

For access errors (401/403), check that the token's account accepted the conditions, model access was granted and the token allows reading public gated models. Write or billing permissions do not replace model approval.

### Channels, word times and uncertainty

Inspect first examines original channels. Select a channel or mono downmix if required; the original is preserved. Automatic merging of independent microphone channels is not implemented. Native word timing is faster. WhisperX needs separate Bokmål/Nynorsk models and more time and memory. Speaker labels use timing data, retaining Unknown speaker when uncertain. Name and correct groups manually; they are not verified identities.

![Møter – lokal lyd fra mikrofon og systemlyd](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moter.png)

*Møter – lokal lyd fra mikrofon og systemlyd*

![Møteveiledningen i den installerte appen](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/moteveiledning.png)

*Møteveiledningen i den installerte appen*


## Audio files, folders and queue

### Selectable file types

Folder and multiple-file import accepts MP3, WAV, M4A, M4B, FLAC, OGG/OGA, Opus, AIF/AIFF, WebM and audio from MP4, MOV and MKV. A particular codec, damaged file or copy protection may still prevent decoding. WMA is not in this import list. Originals are preserved; processing uses a working copy.

### Multiple files or a whole folder

Click Audio files in the left menu. Choose audio files allows multiple selection; Choose folder scans a folder. Enable Include subfolders before choosing a folder to include its descendants. Start transcription processes files sequentially, saving each as a separate note before proceeding. There is no fixed file-count limit or subscription quota; storage, memory and time remain practical limits.

### Progress, stop and resume

Progress shows duration, elapsed time, processed audio and estimated remaining time in minutes and seconds. Transcription and speaker analysis are separate stages; completed transcription does not mean the whole job is saved. You may navigate while processing, but keep the app open: the queue is not restored after quitting. Stop queue pauses it; Continue resumes. Failed files can be requeued.

### Saving, clearing and Voice Memos

Automatic queue saving requires local history permission. Saving failures pause the queue and retain text. Clear queue only removes selections and status, not originals or saved documents. Export Word, PDF or text separately. Open Apple Voice Memos launches Apple's app; share or export a recording to an accessible folder, then select it here. Cloud-folder buttons open the saved folder in Finder.

![Lydfiler – flervalg, mapper, undermapper og eksport](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/lydfiler.png)

*Lydfiler – flervalg, mapper, undermapper og eksport*


## Dictionary and snippets

### Dictionary

Dictionary in the left menu stores names, specialist terms and abbreviations that are difficult to recognize. Add words or import a list. Delete unwanted entries using their delete control. Dictionary terms help recognition but do not guarantee spelling. Review private dictionaries before sharing.

### Snippets

Snippets stores text you use often. Create a short trigger phrase and its replacement text, such as a standard greeting. Edit or delete it when no longer needed. A snippet is a stored text rule, not another AI model.

![Ordliste – navn, fagord og forkortelser](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/ordliste.png)

*Ordliste – navn, fagord og forkortelser*

![Tekstsnutter – korte fraser blir til lagret tekst](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/tekstsnutter.png)

*Tekstsnutter – korte fraser blir til lagret tekst*


## Calendar, cloud folders and email

### Calendar and meeting apps

Integrations → Calendar offers Apple Calendar/FaceTime, Microsoft calendar/Teams and Google Calendar/Meet guidance. Selection does not sign you in or grant access. Add the account in Apple's Calendar app first, then optionally allow DSSA Tale to read calendars exposed by macOS, potentially across several accounts. Calendar reading does not create meetings or automatically record them.

### Google Drive, OneDrive/SharePoint and iCloud

Under Cloud folders, Sign in / manage account opens provider setup. Signing in on a website alone does not create a Finder folder. For Google Drive, sign in to Drive for Mac, choose Find Google Drive folder, then Use this folder, or choose one manually. Open folder opens Finder. Removing a selection deletes no files and does not sign you out. Check access refreshes local availability, not cloud synchronization status.

### Email and sharing

The Email tab explains dictation in Mail, Outlook and other text fields. Put the cursor in the message and dictate; you send it yourself. This edition does not read your inbox. Documents you save in synchronized cloud or Teams folders may be uploaded by that service, separately from local speech recognition. Apple, Google or Microsoft handle passwords and accounts.

![Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/kalender.png)

*Kalender – leverandørvalg viser veiledning, ikke automatisk innlogging*

![Skymapper – tjenesten må være tilgjengelig i Finder](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/skymapper.png)

*Skymapper – tjenesten må være tilgjengelig i Finder*

![E-post – diktering i tekstfelt, ikke innbokslesing](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/epost.png)

*E-post – diktering i tekstfelt, ikke innbokslesing*


## Shortcuts and settings

### Shortcuts and activation mode

Settings → Shortcuts: click the field and press your combination. Add a shortcut allows alternatives. Active shortcut shows what registered successfully; a saved shortcut may be unavailable. Tap starts and stops with separate presses. Hold records while keys are held. The meeting shortcut opens meeting recording and can be cleared separately. Avoid existing macOS and app shortcuts.

### Recording and paste

Maximum dictation time can be 5, 10 or 30 minutes, or Stop manually. This applies to microphone dictation, not an imported-file quota. Automatic paste inserts into the active editable field. Keep transcript in clipboard provides manual ⌘V fallback. Start/stop sounds control tones. Auto-hide hides the floating dictation icon while idle.

### Appearance, text size and window

Appearance and language offers light, dark or Follow the Mac. Text size 100–150% has a preview and saves automatically. Accent color changes emphasis while destructive and provider colors remain distinct. Interface language is separate from transcription language. Standard red, yellow and green Mac controls close, minimize and enter fullscreen. Closing a window may not quit the app; ⌘Q quits.

### System and local logging

System shows the version and manual update status. Detailed debug logging records extra local information; enable for troubleshooting and disable afterwards. Open log folder shows files in Finder. Review logs for private information before sharing. To launch at login, use macOS System Settings → General → Login Items and add the installed app from Applications.

![Opptak og innliming – automatisk innliming og møtebehandling](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/opptak.png)

*Opptak og innliming – automatisk innliming og møtebehandling*

![Utseende og språk – tema, skriftstørrelse og menyspråk](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/utseende.png)

*Utseende og språk – tema, skriftstørrelse og menyspråk*

![System – versjon og lokal feilsøkingslogging](https://github.com/SteinOA/DSSA-Tale-Mac/releases/download/v1.9.45-beta.1/system.png)

*System – versjon og lokal feilsøkingslogging*


## Memory, CPU and privacy

### Storage is not reserved RAM

A downloaded model occupies storage, not a permanent equal RAM reservation. Loading and running it requires weights, caches and working buffers. A warm engine can retain it briefly for faster reuse. NB-Whisper and an optional LLM may use memory simultaneously. Apple Silicon shares memory between CPU and GPU; do not add a separate VRAM amount to the RAM figure.

### App CPU and App RAM in the footer

App CPU shows the app and its model processes as a share of total Mac CPU capacity. App RAM shows their summed RSS against total Mac memory, not total system usage. Shared pages may be counted more than once, so this is an indicator rather than exact unique allocation. Model-card download sizes are a different measurement.

### GPU, swap and memory pressure

Mac GPU covers the entire Mac, not only DSSA Tale. Swap is disk used as additional system memory; high swap with memory pressure can slow everything. Memory pressure summarizes system conditions. Hide CPU and memory hides the footer metrics and stops periodic resource polling; Show enables it again. Model selection and transcription are unchanged.

### Local processing and optional online services

Speech recognition and optional local text processing run on the Mac; audio and transcripts are not uploaded for processing. Internet is needed to download speech models, optional text models and speaker runtimes/models. Help links and optional account/calendar services can use the network when selected. Files you save in iCloud, Drive, OneDrive or Teams folders may be synchronized by those providers. Local notes and history stay on this Mac.


## Contact DSSA Tale

### Contact for this DSSA edition

The email button opens a draft to stein@haldendemensforening.no in your mail app. Nothing is sent until you choose Send. Include DSSA version, Mac model, macOS version and reproduction steps. Do not attach private recordings, transcripts, keys or passwords. OpenWhispr support is not responsible for this adaptation.

### What remains experimental?

This is a test edition. The long import test demonstrates saving, not flawless recognition. Not every Mac, meeting app, large speaker group or helper model's Bokmål/Nynorsk quality has been fully validated. Developer ID signing and Apple notarization are still missing. Release test-status documents describe exact measurements and limitations.


## Troubleshooting and bug reports

### No sound or no text

Check the selected microphone in Speech and microphone and run its five-second test. Allow microphone access in System Settings → Privacy & Security → Microphone. A beep does not prove speech input. BlackHole is appropriate only when sound is routed into it. Also check the speech model says Ready to use.

### Text only appears with ⌘V

Enable automatic paste in Recording and paste. Use Accessibility and paste in Speech and microphone to open Mac settings. Enable DSSA Tale under Accessibility, named device control and data access on the tested macOS version. Quit with ⌘Q and reopen. After a test update, remove the stale DSSA entry and add the exact app from Applications again if necessary. Do not change other apps' permissions.

### Slow processing or queue failures

Try with cleanup off and check Metal in Assistant. Initial model loading can take longer. Check memory pressure and free storage. A damaged file can fail while other files continue. Saving failures pause the queue: check storage and resume without deleting text. Do not quit an active queue if you need to retain its list.

### Report bugs to the correct project

The button opens DSSA Tale Mac's GitHub project, not Windows or upstream OpenWhispr issues. GitHub issue reports are public. Include version, steps and anonymized errors; do not upload private recordings or documents. Use Contact email if unsure what can be shared.


## Credits and licences

### Credits and licences

DSSA Tale is an independent Mac adaptation of OpenWhispr 1.9.2 (MIT). The National Library of Norway's NB-Whisper builds on OpenAI Whisper and uses Apache-2.0. This is not an official OpenWhispr, National Library or Apple product. Attribution links below credit contributors; they are not support channels for this app.

### Bundled components and optional models

The app includes licence information in Contents/Resources/legal for FFmpeg/Opus, Eigen, whisper.cpp, llama.cpp and other components. FFmpeg is an LGPL build without GPL/nonfree, with required sources included. Community-1 weights use CC-BY-4.0 and pyannote.audio uses MIT. Optional Qwen and Gemma models have their own source terms. This installer contains no NB-Whisper or LLM weights.

