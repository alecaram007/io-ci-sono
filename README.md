# Io ci sono

App mobile nativa Expo/React Native per capire dove si muove la serata: luoghi creati da admin, filtri geografici, lista + mappa, login OTP Supabase e presenza unica `Io ci sono!` per notte.

## Cosa c'e gia

- App Expo TypeScript con modalita demo locale pronta da aprire.
- Architettura repository con source `mock` + `supabase` e fallback resiliente.
- UI mobile-first con lista calda, mappa, dettagli luogo con foto, amici, QR invito e console admin.
- Redesign Neo-Mediterraneo con animazioni Reanimated e supporto Reduce Motion.
- Dataset demo Sicilia con luoghi curati in tutte le 9 province, punteggi di affollamento e immagini da Wikimedia Commons.
- Regole dominio testate: reset alle 06:00, una sola presenza per notte, avatar visibili solo agli amici non bloccati.
- Client Supabase opzionale: se le env non sono configurate, l'app resta usabile in demo.
- Schema Supabase in `supabase/schema.sql` con tabelle, RLS e RPC principali.

## Avvio locale

```bash
npm install
npm start
```

Poi apri con Expo Go o con simulatori iOS/Android.

### Avvio online (link pubblico Expo Go)

```bash
npm run start:online
```

Per rete locale (stessa Wi-Fi):

```bash
npm run start:lan
```

## Configurazione Supabase

1. Crea un progetto Supabase.
2. Esegui `supabase/schema.sql` nel SQL editor.
3. Copia `.env.example` in `.env` e imposta:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Abilita Phone Auth nel pannello Supabase e configura un provider SMS.
5. Per rendere un utente admin, imposta `app_metadata.role = "admin"` sull'utente Supabase.

## Script

```bash
npm run typecheck
npm test
npm run check
npm run check:images
npm run report:nightly
npm run report:publish-assets
npm run report:verify-assets
npm run ios
npm run android
npm run web:export
```

`check:images` per default fallisce solo sui `404` (asset mancanti) e non su errori rete temporanei.
Scansiona automaticamente tutti i file TypeScript in `src/data/` (esclusi test e `.d.ts`) per trovare `imageUrl`.

Modalita strict (utile in CI notturna):

```bash
IMAGE_CHECK_STRICT=1 npm run check:images
```

Flag opzionali:
- `IMAGE_CHECK_FAIL_ON_429=1` per fallire anche su rate limit.
- `IMAGE_CHECK_FAIL_ON_5XX=1` per fallire anche su errori server remoti.
- `IMAGE_CHECK_FAIL_ON_NETWORK=1` per fallire su errori DNS/rete.
- `IMAGE_CHECK_FAIL_ON_INCONCLUSIVE=1` per fallire se non arriva nessuna risposta HTTP (verifica non conclusiva).
- `IMAGE_CHECK_CONCURRENCY=6` per aumentare/ridurre controlli URL in parallelo (default `4`).
- `IMAGE_CHECK_INTER_REQUEST_DELAY_MS=200` per regolare la pausa tra richieste successive (default `120` ms).
- `IMAGE_CHECK_RETRY_ATTEMPTS=2` per aggiungere retry su errori transienti (`429`/`5xx`) oltre al primo tentativo (default `1`).
- `IMAGE_CHECK_RETRY_BACKOFF_MS=500` per aumentare/ridurre il backoff progressivo tra retry (default `350` ms).
- `IMAGE_CHECK_RETRY_ON_NETWORK=1` per ritentare anche gli errori di rete (`status=0`), utile solo in ambienti con rete intermittente.
- `IMAGE_CHECK_MAX_LIST_ITEMS=50` per aumentare/ridurre quanti URL vengono stampati per categoria.
- `IMAGE_CHECK_RESULT_JSON_PATH=nightly-report/image-check.json` per salvare il riepilogo strutturato in JSON.

## Pubblicazione web

Export statico:

```bash
npm run web:export
```

Il comando crea `dist/`, pronto da pubblicare su hosting statico (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

Per override manuale del path base (se il sito non e su root dominio):

```bash
EXPO_DEPLOY_BASE_URL=/nome-repo npm run web:export
```

Anteprima locale della build:

```bash
cd dist
python3 -m http.server 4173
```

## CI e deploy automatico

- Workflow CI: `.github/workflows/ci.yml` (typecheck + test + export web su push/PR).
- Workflow deploy: `.github/workflows/deploy-pages.yml` (genera bundle web + report CI e pubblica `dist/` su GitHub Pages a ogni push su `main`).
- Workflow report notturno: `.github/workflows/nightly-ci-report.yml` (esegue quality suite + export + check immagini, pubblica artifact del report e ridistribuisce il sito con report aggiornato ogni notte, cron UTC `01:10`).

Il deploy Pages imposta automaticamente `EXPO_DEPLOY_BASE_URL`:
- root (`/`) se il repository e `owner.github.io`
- `/repo-name` per i repository progetto

Report locale equivalente al workflow notturno:

```bash
npm run report:nightly
```

Output:
- `nightly-report/nightly-ci-report.md`
- `nightly-report/nightly-ci-report.json`
- `nightly-report/nightly-ci-report.html`
- `nightly-report/nightly-ci-status.json`
- `nightly-report/image-check-summary.json`
- `nightly-report/logs/*.log`

Se lo script del report va in errore interno (es. configurazione path non valida), viene comunque prodotto un report di fallback completo con dettagli in `nightly-report/logs/internal-error.log`, cosi la pipeline puo continuare a pubblicare artifact diagnostici.

Il JSON include anche:
- `results[].status` (`PASS`, `WARN`, `FAIL`, `TIMEOUT`)
- `hasWarnings`
- `publicReportUrl` (quando determinabile da ambiente GitHub)

Per pubblicare il report dentro la build web (`dist/nightly-ci/`):

```bash
npm run report:publish-assets
```

Lo script crea anche `dist/.nojekyll` per evitare che GitHub Pages ignori asset/cartelle che iniziano con `_` (es. `_expo/`).

Per validare l'integrita del bundle pubblicato (JSON/HTML/status e file richiesti):

```bash
npm run report:verify-assets
```

Nel CI questa verifica viene eseguita dopo il publish assets, sia nel deploy su push sia nel workflow notturno.

Variabili opzionali per URL pubblico/report:
- `NIGHTLY_REPORT_PUBLIC_SUBDIR=nightly-ci` (subpath pubblico dove copiare il report in `dist/`).
- `NIGHTLY_PUBLIC_REPORT_URL=https://example.com/nightly-ci/` (override esplicito URL da mostrare nel report Markdown/HTML).

In GitHub Actions il report notturno abilita automaticamente il fail su check immagini inconclusivo (nessuna risposta HTTP) usando `NIGHTLY_FAIL_ON_IMAGE_INCONCLUSIVE` (default: attivo quando `CI=true`).

Per attivare GitHub Pages:

1. Apri il repository su GitHub.
2. Vai su **Settings -> Pages**.
3. In **Build and deployment**, imposta **Source: GitHub Actions**.

Dopo il primo deploy riuscito, il sito sara disponibile su `https://<owner>.github.io/<repo>/`.
Il report pubblico e raggiungibile su `https://<owner>.github.io/<repo>/nightly-ci/`.

## Note prodotto

- La posizione GPS viene richiesta solo in foreground per centrare la mappa; non viene salvata come posizione live.
- Il conteggio totale dei luoghi e pubblico; gli avatar/presenze nominative sono visibili solo agli amici accettati.
- La presenza puo essere spostata durante la stessa serata: il vecchio luogo scende e il nuovo sale.
