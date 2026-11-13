# 🎄 Tombola Napoletana · Natale in ufficio

Un'idea di **Michele De Angelis** · [mdeangelis.me](https://mdeangelis.me) · v1.0.0

Una tombola napoletana online per 140 e più colleghi. Ognuno gioca dal proprio telefono, senza bisogno di registrarsi.

- **Avatar:** 178 personaggi tra cui scegliere. Ci sono le 90 figure della smorfia, 32 personaggi del presepe e del folklore, 28 pastori moderni e 28 figure del Natale. Ogni personaggio può averlo una persona sola.
- **Cartelle:** quelle vere, con 15 numeri su 3 righe e ogni colonna dedicata a una decina. Si segnano da sole.
- **Cartellone virtuale:** mostra il tabellone 1–90, la figura della smorfia e la sua storiella. Una voce le legge ad alta voce. Si può estrarre a mano o in automatico.
- **Premi:** ambo, terno, quaterna, cinquina, tombola e poi **tombolino**. Il premio di ogni categoria viene scelto a caso dalla lista del banco.
- **Pari merito:** quando più persone vincono insieme decide il **Tribunale della Smorfia**. I premi in euro si dividono. Per gli altri gira la ruota, e chi resta senza premio riceve un "risarcimento" simpatico.
- **Animazioni e reazioni:** splash screen, neve, coriandoli e fuochi d'artificio che crescono con l'importanza della vincita. Le reazioni con le emoji arrivano a tutti in diretta.
- **Più partite nella stessa serata:** a ogni partita le cartelle sono nuove, mentre la classifica della serata resta.

## Indirizzi

| Pagina | Indirizzo | Chi la usa |
|---|---|---|
| Giocatori | `/` | tutti, dal telefono |
| Cartellone del banco | `/banco` | chi tiene il cartellone, meglio se proiettato |

Il PIN predefinito del banco è **1734**, l'anno di nascita della tombola. Puoi cambiarlo con la variabile d'ambiente `HOST_PIN`.

## Pubblicazione su Vercel (gratis)

1. Crea un nuovo progetto su Vercel con questi file. Usa il preset **Other**, senza comando di build.
2. Nel progetto apri **Storage → Create Database → Upstash (Redis)**, scegli il piano gratuito e premi **Connect to project**. Le variabili `KV_REST_API_URL` e `KV_REST_API_TOKEN` vengono aggiunte da sole.
3. Facoltativo: in **Settings → Environment Variables** aggiungi `HOST_PIN` con il tuo PIN.
4. Fai il redeploy e condividi il link.

Per contenere il traffico, lo stato del gioco viene messo in cache sulla CDN per 1 secondo. Così 140 telefoni che si aggiornano ogni 2 secondi pesano poco sul server.

## Prova in locale, o su un PC dell'ufficio

```
node tools/local-server.js
```

Poi apri http://localhost:3000 per giocare e http://localhost:3000/banco per il cartellone. Non serve installare niente, basta Node 18 o successivo. In locale i dati restano in memoria.

## Struttura

```
index.html, banco.html        pagine giocatore e banco
assets/data.js                smorfia (90 numeri e storielle), avatar, premi, crediti
assets/common.js              animazioni, suoni, voce, ruota, finestre di vincita
assets/player.js, banco.js    logica delle due schermate
lib/core.js                   regole: cartelle, estrazioni, vincite, tombolino, Tribunale
lib/store.js                  archivio dati: Upstash Redis oppure memoria
api/t.js                      funzione serverless di Vercel
tools/local-server.js         server locale senza dipendenze
```

© 2026 Michele De Angelis · mdeangelis.me
