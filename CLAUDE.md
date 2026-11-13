# provavideotiktok

Video verticali per TikTok fatti con Remotion (React). Ogni video ha la sua cartella in `src/` e in
`public/`, ed è registrato in `src/Root.tsx`.

## Canale MOTB (@manofthebet11)
I video di statistiche/pronostici sul calcio sono per il canale MOTB.
**Prima di scrivere testo o grafica di un nuovo video leggere `docs/STILE-MOTB.md`** e seguirlo:
durata 17–27 s, voce da 0 s a 5,7–6,3 sillabe/s, gancio → 2–4 "ritardi" → domanda → "Commenta ANALISI",
sfondo blu-viola, scritte a parallelogramma bianco/blu-giallo che compaiono parola per parola,
numeri gialli che contano, clip vere delle squadre. Niente parole da scommessa.

## Flusso di lavoro
- Testo per la voce in `scripts/<nome>_voce.txt`; l'utente lo genera su ElevenLabs e manda l'mp3.
- Tempi delle parole: `scripts/oskarsson_align.py` (pause) o Whisper (vedi lo stile, sezione 6).
- Render: `npx remotion render <Id> <file>`; poi comprimere a ~25 MB (ffmpeg due passate, ~4,5 Mbit/s)
  e mettere il file in `video/` così l'utente lo scarica da GitHub (i file > 100 MB GitHub li rifiuta).
- Ambiente cloud consigliato: *provavideotiktok* (può scaricare da upload.wikimedia.org e huggingface.co).
