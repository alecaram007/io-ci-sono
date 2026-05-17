# Product Contract - Io ci sono

## Capability

Gli utenti 18+ scoprono dove andare la sera guardando luoghi curati da admin, conteggi aggregati e segnali social limitati agli amici. Ogni utente puo avere una sola presenza attiva per finestra serale.

## Invarianti

- `nightly_presences` ha `unique(user_id, night_key)`.
- `night_key` si basa sul fuso del luogo e resetta alle 06:00 locali.
- Spostare presenza aggiorna la riga esistente, non crea duplicati.
- Il conteggio pubblico non rivela identita.
- Gli avatar visibili su un luogo sono solo amici accettati e non bloccati.
- Admin e determinato da `auth.jwt().app_metadata.role = admin`.

## Surfaces

- Onboarding/login OTP + demo locale.
- Discover: lista, filtri geografici, mappa, dettaglio luogo.
- Content: dataset iniziale Sicilia con copertura di Palermo, Catania, Messina, Trapani, Agrigento, Caltanissetta, Enna, Siracusa e Ragusa.
- Friends: QR/link invito, richieste, amici accettati.
- Admin: creazione luoghi, attivazione/disattivazione, report.

## Acceptance

- Primo click `Io ci sono!` aumenta il conteggio.
- Click su un altro luogo nella stessa notte sposta la presenza.
- Un non amico vede solo il totale, non avatar o nickname.
- Permesso posizione negato non blocca lista o mappa manuale.
