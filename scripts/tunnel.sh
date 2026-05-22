#!/usr/bin/env bash
# Avvia ngrok + Expo dev server in tunnel per testare da fuori rete.
# Uso: ./scripts/tunnel.sh
# Richiede:
#   - ngrok v3 installato (brew install ngrok)
#   - authtoken già configurato (ngrok config add-authtoken <token>)
set -euo pipefail

cd "$(dirname "$0")/.."

cleanup() {
  echo
  echo "→ chiudo ngrok e Expo…"
  if [[ -n "${NGROK_PID:-}" ]]; then kill "$NGROK_PID" 2>/dev/null || true; fi
  if [[ -n "${EXPO_PID:-}" ]]; then kill "$EXPO_PID" 2>/dev/null || true; fi
  exit 0
}
trap cleanup INT TERM

echo "→ avvio ngrok su porta 8081…"
ngrok http 8081 --log=stdout --log-format=logfmt > /tmp/iocisono-ngrok.log 2>&1 &
NGROK_PID=$!

# Aspetta che l'API locale di ngrok risponda
echo "→ attendo URL pubblico…"
for _ in $(seq 1 30); do
  if curl -s --max-time 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -q public_url; then
    break
  fi
  sleep 1
done

PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['tunnels'][0]['public_url'])")
HOST=${PUBLIC_URL#https://}

if [[ -z "$HOST" ]]; then
  echo "✘ ngrok non ha restituito un URL pubblico. Vedi /tmp/iocisono-ngrok.log"
  exit 1
fi

echo "→ ngrok pronto: $PUBLIC_URL"
echo "→ avvio Expo con hostname pubblico…"
echo

REACT_NATIVE_PACKAGER_HOSTNAME="$HOST" EXPO_OFFLINE=1 npx expo start --lan --port 8081 &
EXPO_PID=$!

echo
echo "════════════════════════════════════════════════════════════"
echo " Expo Go: incolla questo URL"
echo "   exp://$HOST"
echo
echo " Dev tools nel browser:"
echo "   $PUBLIC_URL"
echo
echo " Lascia questa finestra aperta. Ctrl+C per chiudere tutto."
echo "════════════════════════════════════════════════════════════"

wait "$EXPO_PID"
