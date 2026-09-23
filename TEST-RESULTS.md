# v2.26 — testresultaten (23 september 2026)

## Uitgevoerd

- **33/33 lokale controles geslaagd** met `npm test`: assets, JavaScript/DOM-regressies, veilige opslag, netwerkuitval, vaste simulatiesnelheid, scoreweergave, oefenmodus en statische SQL-autorisatiecontroles.
- **24/24 echte browsertests geslaagd** in GitHub Actions: zes scenario’s in desktop Chromium, mobiel Chromium (Pixel 7-profiel), desktop Firefox en mobiel WebKit (iPhone 13-profiel).
- Browserbewijs voor de laatste spelcode: https://github.com/gjgaal-blip/de-stampertjes/actions/runs/35849225294 (commit e7a51e785475783da248fb541741de5e9d0d3174). Daarna zijn uitsluitend SQL, documentatie, screenshots en de extra SQL-regressietest toegevoegd.
- Screenshots van het menu, de atlas en de bibliotheekkamer zijn visueel beoordeeld en staan in `docs/screenshots/`.

## Browserscenario’s

1. Hoofdmenu en alle onderdelen openen zonder JavaScript-fouten.
2. Alle tien oefenkamers renderen; oefenen blijft gescheiden van records.
3. Pauzeren en hervatten met toetsenbord/Escape behouden het spel.
4. Smalle schermen en landschap: bediening past binnen het scherm.
5. Netwerkuitval: lokale scores worden als fallback aangeduid; het menu blijft speelbaar.
6. Beheerportaal: ongeldige code wordt afgewezen en netwerkuitval wordt opgevangen met gemockte serverantwoorden.

De eerste browserronde vond onder meer ontbrekende offline feedback en testproblemen rond verborgen mobiele bediening. Deze zijn verholpen; twee daaropvolgende volledige browserrondes slaagden. De workflow herhaalt beide suites bij wijzigingen aan de pull request en bewaart het Playwright-rapport en screenshots.

## Grenzen en publicatie

Alle externe browserverzoeken zijn gemockt voordat de pagina opent. Er zijn geen echte scores, berichten, analytics of beheerlogins naar Supabase verstuurd. De tests bewijzen dus geen live databasebeveiliging of serverpersistentie. Mobiele profielen zijn emulatie, geen fysieke telefoons. Geluid is niet op gehoor getest.

SQL 014 is statisch gecontroleerd, maar niet uitgevoerd op PostgreSQL/Supabase. Controleer deze migratie in staging, vervang de eerder openbaar gemaakte beheercode en pas SQL 014 toe vóór productie. Zie `SECURITY-NOTES.md`. De bestaande live site is niet gewijzigd.
