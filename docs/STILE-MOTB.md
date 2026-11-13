# Stile MOTB (@manofthebet11) — come devono essere i video

Ricavato analizzando 4 video del canale (13/11/2026): fotogrammi uno per uno, tagli, animazioni
a 10 fps, trascrizione della voce parola per parola (Whisper) e misura di ritmo e volumi.
**Ogni nuovo video del canale segue queste regole.**

---

## 1. Formato

| | |
|---|---|
| Formato | verticale 1080×1920, 30 fps, H.264 + AAC 44,1 kHz stereo |
| Durata | **17–27 s** (massimo ~42 s se ci sono due partite). Mai oltre i 45 s |
| Voce | parte a **0,0 s**, senza silenzio iniziale; finisce ~1,3 s prima della fine del video |
| Coda | dopo l'ultima parola resta la schermata finale (~1,3 s) con musica bassa |
| File finale | ~25 MB (due passate, ~4,5 Mbit/s). Va in `video/` così si scarica da GitHub |

Non rifare il watermark "TikTok @manofthebet11": lo aggiunge TikTok quando si scarica il video.

## 2. Struttura del testo (sempre la stessa)

1. **Gancio (0–3 s)**: una frase che apre una domanda senza risposta.
   - "Ritardi statistici di cui non sapevi di avere bisogno."
   - "Stasera in Champions una di queste due serie si spezza, e nessuno ne parla."
   - "In Spagna una squadra non pareggia da 46 partite, e stasera potrebbe succedere. Chi è? Lo scopri alla fine."
   - "20 partite di campionato senza un cartellino, strano per uno come Mancini."
2. **Contesto (1 frase)**: "Tre numeri stasera per Venezia-Udinese." / "Intanto, oggi c'è Napoli-Lazio".
3. **2–4 dati**, ognuno in 3–5 s, sempre con la stessa forma:
   *chi* (nome giocatore o squadra) → *cosa* ("non segna da", "non pareggia da", "nessun cartellino da") → *numero* ("13 partite").
   Se sono numerati si dice "Uno… Due… Tre…" e in alto compare il contatore 1-2-3.
4. **Chiusura del cerchio**: si risponde al gancio ("E la squadra spagnola? È il Barcellona…").
5. **Domanda al pubblico**: "Quale ritardo cade per primo?" / "Quale si spezza stasera?" / "Tu come la vedi?"
6. **Invito all'azione** (uno dei due):
   - **"Commenta ANALISI."** (il più usato: 3 video su 4)
   - **"Se volete capire come sfruttare queste statistiche, sapete dove trovarmi."** + pulsante Telegram

Lessico: frasi brevi, parlate, in seconda persona. Parole chiave del canale: *ritardo, serie, si spezza,
numeri, statistiche, analisi, stasera, nessuno ne parla, dettaglio*. **Mai** parole da scommessa
(scommessa, quota, giocata, puntare, schedina, bet, vincita, bonus, "sicuro"). Il canale parla di
"ritardi" e "statistiche", non di pronostici espliciti.

## 3. Ritmo del parlato (misurato)

| video | durata parlato | parole/s | **sillabe/s** | pause > 0,25 s |
|---|---|---|---|---|
| Champions (2 partite) | 40,7 s | 3,39 | **6,3** | 8 (0,31 s) |
| Venezia-Udinese | 22,5 s | 2,80 | **5,7** | 8 (0,33 s) |
| Roma/Parma/Torino | 15,9 s | 2,77 | **5,9** | 5 (0,49 s) |
| 46 partite / Barcellona | 25,4 s | 2,79 | **5,6** | 10 (0,32 s) |
| *il nostro Óskarsson (da evitare)* | *45,0 s* | *2,62* | *5,1* | *16 (0,35 s)* |

Obiettivo: **5,7–6,3 sillabe al secondo**, una pausa breve (~0,3 s) solo tra un dato e l'altro,
nessuna pausa dentro la frase. Testo da ~45–75 parole per 17–27 s.
Su ElevenLabs: voce giovane ed espressiva; se il testo letto supera i ~27 s, aumentare la velocità
(~1,1) o accorciare il testo, non lasciare pause lunghe. Numeri scritti in lettere nel testo per la voce.

## 4. Audio

- La voce è il primo piano (circa −21 dB RMS complessivo, picchi −7 dB).
- Sotto c'è sempre **musica di sottofondo + effetti** (fruscii sui cambi scena, "pop" sulle scritte,
  ticchettio quando i numeri contano): nelle pause il livello resta alto (−22/−25 dB), quindi non c'è
  mai silenzio. Musica da sola nella coda finale: ~−35 dB.

## 5. Grafica

### Colori
| uso | colore |
|---|---|
| sfondo (sfumatura verticale) | in alto `#1E2483` → centro `#161A5C` → in basso `#0B0F33`, con raggi di luce morbidi e sfocati in alto |
| riga 1 delle scritte | riquadro **bianco** `#F0F4FF`, testo **blu notte** `#141A5E` |
| riga 2 delle scritte | riquadro **blu** `#1B2170`, testo **giallo** `#FFD404`, sottolineatura ciano `#46D9E6` |
| numeri grandi | **giallo** `#FFD404` |
| icone negative | quadratini rossi `#E5263F` con ✕ bianca (o ≠) |
| icone positive | quadratini verdi `#1FBF6A` con ✓ / pallone |
| riquadro dei dati | blu scurissimo `#10123F`, angoli arrotondati, linea ciano in basso |

### Carattere
Bastoni condensato molto spesso, TUTTO MAIUSCOLO (nel progetto: **Anton**). Le sottoscritte piccole
nei riquadri dati: stesso carattere, ~22 px, bianco.

### Elementi fissi (coordinate su 1080×1920)
- **Barra in alto** (y ≈ 240–290), due "linguette" inclinate affiancate:
  - a sinistra, blu con triangolino azzurro: `▲ CHAMPIONS · 4ª` / `▲ SERIE A · 11ª` / `▲ OGGI · 20:45`;
  - a destra, bianca, con gli stemmi: `[stemma] FENER – LIVERPOOL [stemma]`. Cambia quando cambia partita.
- **Contatore dei dati** (solo se si dice "uno, due, tre"): tre quadratini 1-2-3 sotto la barra a sinistra
  (y ≈ 300–375), quello corrente giallo, gli altri blu. All'inizio compaiono grandi al centro.

### Scritte (sottotitoli "a cartellino")
- Due righe al massimo, centrate. Riquadri a **parallelogramma** (inclinati di ~−12°).
- Nelle schermate di grafica stanno a **y ≈ 29–35 %** (≈ 560–680 px); sopra le clip stanno a
  **metà schermo** (≈ 1000–1100 px) o sulla linea di divisione degli schermi divisi.
- **Compaiono parola per parola mentre vengono dette** (il riquadro si allarga con il testo).
  La riga 1 dice il soggetto/l'azione, la riga 2 (gialla) il numero o il dettaglio.
- Non c'è mai la trascrizione completa: solo le parole chiave della frase.

### Riquadro dei dati (sotto la scritta, y ≈ 940–1220, largo ~730 px)
- Numero giallo enorme a sinistra o al centro che **conta da 0 al valore in ~0,5 s**.
- Accanto, una griglia di icone (una per partita) che **si riempie una alla volta** insieme al numero:
  ✕ rosse = sconfitte/partite senza, ✓ verdi = risultati utili, quadratini gialli = partite senza pareggio,
  palloni = gol, cartellini gialli vuoti = partite senza ammonizione.
- Varianti: tre cartoncini bianchi con risultato e anno ("1-0 / 2025 / GALATASARAY"); barra 0'→45' con i
  palloni nel punto dei gol; cartellino giallo gigante col numero; cerchio bianco col "?" per il mistero.

### Clip
- **Sempre filmati veri** delle squadre/giocatori citati, inquadrature strette, spesso al rallentatore,
  leggero zoom. Il giocatore compare in clip quando viene nominato.
- **Schermo diviso** in due (sopra/sotto) per le domande o per confrontare due partite, scritta sulla linea centrale.
- Alternanza: clip (nome) → grafica (dato) → clip → grafica… Ogni inquadratura dura **1,5–3 s**.

### Transizioni
- Tra clip e grafica: dissolvenza **sfocata** velocissima (~0,2 s) con un piccolo lampo.
- Le scritte escono sfocandosi; quelle nuove entrano con una "tendina" da sinistra.

### Schermata finale
- **Commenta ANALISI**: stemmi delle squadre in quadrati bianchi arrotondati con alone ciano, uniti da
  un rombo blu "VS" (una riga per partita), sotto il riquadro `COMMENTA "ANALISI"` con il fumetto giallo.
- **Telegram**: le righe "SE VOLETE CAPIRE / COME SFRUTTARE / QUESTE STATISTICHE / SAPETE DOVE TROVARMI"
  e una pillola bianca con l'icona Telegram, il numero di iscritti che sale da 0 a **3.350** in ~1 s,
  il pulsante "UNISCITI" e una manina che lo tocca.

## 6. Cosa serve per fare un video

1. Testo (lo scrivo io in questo formato, 45–75 parole) → voce ElevenLabs dell'utente.
2. **Clip vere** delle squadre e dei giocatori (le fornisce l'utente: da questo ambiente i siti video non si raggiungono).
3. Stemmi delle squadre (Wikimedia: `upload.wikimedia.org` è raggiungibile dall'ambiente *provavideotiktok*).
4. Allineamento della voce con Whisper (`huggingface.co` è raggiungibile dall'ambiente *provavideotiktok*,
   con `HF_HUB_DISABLE_XET=1`) per far comparire le parole nel momento esatto.

---

## Trascrizioni dei video di riferimento (con tempi)

**Venezia-Udinese (24 s)**
```
 0.00  Ritardi statistici di cui non sapevi di avere bisogno.
 3.14  Tre numeri stasera per Venezia-Udinese.
 5.70  Uno. Davis, in campionato, non segna da 13 partite.
 9.38  Due. Zaniolo non fa un assist da 9 partite.
12.40  Tre. Sempre Zaniolo, in trasferta, non segna da 8.
15.44  E in più, il Venezia non pareggia da più di 10 partite.
19.14  Venezia-Udinese può essere la partita giusta.
21.64  Commenta analisi.
```
**46 partite / Barcellona (27 s)**
```
 0.00  In Spagna una squadra non pareggia da 46 partite, e stasera potrebbe succedere.
 5.28  Chi è? Lo scopri alla fine.
 7.08  Intanto, oggi c'è Napoli-Lazio, la Lazio non perde da 9 partite.
11.44  Poi Inter-Como, Perrone non prende un cartellino da 17 partite,
15.96  e Dimarco, in casa, non segna da 9 partite.
19.18  E la squadra spagnola? È il Barcellona, stasera sul campo dell'Atlético.
23.20  Quale ritardo cade oggi? Commenta analisi.
```
**Roma/Parma/Torino (17 s)**
```
 0.00  20 partite di campionato senza un cartellino, strano per uno come Mancini.
 4.76  Stasera, contro il Sassuolo, starà a uomo su Laurienté.
 7.84  Ferguson col Parma non lo prende da 16,
10.46  e il Lecce col Torino non pareggia da 14.
13.44  Quale ritardo cade per primo? Commenta analisi!
```
**Champions (42 s)**
```
 0.00  Stasera in Champions una di queste due serie si spezza, e nessuno ne parla.
 4.18  Liverpool, in Europa non pareggia da 46 partite,
 7.38  ma in Turchia ha perso le ultime tre trasferte, tutte 1-0.
10.98  Slavia Praga, non vince in Champions da 22 partite,
14.14  e l'Arsenal contro le ceche non ha mai perso, 9 vittorie e 2 pareggi.
18.22  Quale si spezza stasera?
19.36  C'è un dettaglio sul Lens-Como che nessuno sta guardando. Il primo tempo.
23.30  Il Como ha segnato nel primo tempo in tutte e tre le sue partite di Champions. Tutte e tre.
27.90  E il Lens? In campionato ha già preso tre gol tra il 31° e il 45°, proprio a ridosso dell'intervallo.
33.86  Stasera il Como colpisce ancora prima della pausa? Tu come la vedi?
36.86  Se volete capire come sfruttare queste statistiche, sapete dove trovarmi.
```
