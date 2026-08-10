# De Stampertjes v2.22.1 — Portal Fix

Gebaseerd op de werkende v2.22 Admin Portal.

Opgelost:
- bestaande admin-login en DOM blijven intact;
- nieuw dashboard staat binnen het beveiligde #portal en verschijnt dus pas na succesvolle login;
- get_public_stats wordt correct via `stats.totals` uitgelezen;
- bestaande spelers-, Café-, Teddy-, event- en verwijderfuncties blijven werken;
- nieuwe v2.22 analytics, Hall of Fame en optionele merchandise-samenvatting worden daarnaast geladen.

Geen nieuwe SQL nodig naast reeds gebruikte SQL 006, 007 en optioneel 008.
