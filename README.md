# De Stampertjes — v2.26

Een Nederlands pixel-arcadespel in een kasteel met tien kamers. Statische HTML, CSS en JavaScript; online scores, Café en statistieken gebruiken Supabase.

## Nieuw

- Kasteelatlas: kies een van de tien kamers om te oefenen. Oefenpotjes veranderen geen records en leveren geen gameplay-analytics op.
- Vernieuwd menu met persoonlijke records, duidelijkere navigatie en warme kasteelkleuren.
- Beter zichtbare held en Appelieten; vijandtypen hebben herkenbare kleuren.
- Toetsenbordvriendelijk pauzemenu, automatisch pauzeren bij focusverlies en duidelijk lokaal score-overzicht als online laden mislukt.

## Lokaal starten

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Het spel heeft geen buildstap nodig. Een gewone lokale start gebruikt de Supabase-configuratie in `config.js`; gebruik de automatische tests voor geïsoleerde controles zonder productieschrijfacties.

## Bediening

Pijltjes: lopen en klimmen. Spatie: stampen. P of Escape: pauzeren/hervatten. M: audio wisselen. Op een touchscreen staan de speelknoppen onder het veld. Stoppen gaat via het pauzemenu met een bevestiging.

## Tests

Node.js 22+ en Python 3:

```sh
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

- `npm test`: DOM- en logicatests, vaste simulatiesnelheid, assetverwijzingen en regressies.
- `npm run test:browser`: Chromium desktop/mobiel, Firefox en iPhone-WebKit. Alle externe verzoeken worden vooraf onderschept; de tests schrijven nooit naar de echte database.
- De GitHub Actions-workflow voert beide suites uit en bewaart screenshots, fouttraces en het HTML-testrapport als artifact.
- De DOM-tests simuleren canvas/audio; alleen de browser-suite controleert echte rendering en browserinteractie. Zie `TEST-RESULTS.md` voor de daadwerkelijk uitgevoerde controles.

## Bestanden

`index.html`, `game.js` en `game.css` bevatten het bestaande spel. `polish.css` bevat de nieuwe presentatie. `castle-atlas.js` voegt de kamerkiezer en focusbediening toe. `runtime.js` bevat opslag-, netwerk- en simulatiehulpfuncties die los worden getest. Oudere genummerde gamebestanden zijn archief; de HTML laadt ze niet.

## Voor publicatie

Lees **SECURITY-NOTES.md**. De oude vaste beheercode stond openbaar in eerdere commits; verwijderen uit bestanden vervangt de code in Supabase niet. Er zijn tijdens deze update geen databasemigraties uitgevoerd. De nieuwe oefenmodus heeft geen nieuwe databasevelden nodig.
