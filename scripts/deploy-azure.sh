#!/usr/bin/env bash
# Deploys the API or the speech service to Azure without overlap.
#
#   scripts/deploy-azure.sh api      # build the API here, upload it ready to run
#   scripts/deploy-azure.sh speech   # bundle Linux packages here, upload them with the code
#
# Two lessons from 15-16 Nov 2026 shape this script:
# - Building on Azure's B1 machine (npm/pip install) ran out of time and memory.
#   So everything is built on this computer and Azure only unpacks it.
# - During a normal deploy Azure keeps the old copy running until the new one answers.
#   Two copies of the 600 MB speech model don't fit in memory, so the app is stopped
#   first and started after the upload. Users see about a minute of downtime.
#
# Needs: az login, and Python 3.13 for the speech packages.
set -euo pipefail

GROUP=ganira-rg
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

case "${1:-}" in
  api)
    APP=ganira-api-eh
    (cd "$ROOT/api" && rm -rf dist && npm run build >/dev/null)
    mkdir "$WORK/pkg"
    cp -R "$ROOT/api/dist" "$ROOT/api/db" "$ROOT/api/package.json" "$ROOT/api/package-lock.json" "$WORK/pkg/"
    (cd "$WORK/pkg" && npm ci --omit=dev --ignore-scripts >/dev/null)
    ;;
  speech)
    APP=ganira-speech-eh
    mkdir -p "$WORK/pkg/packages"
    cp "$ROOT"/speech/{server.py,transcriber.py,features.py,model_files.py,requirements.txt,README.md} "$WORK/pkg/"
    # Linux wheels for Azure's Python 3.13, unpacked next to the code (see PYTHONPATH below).
    python3.13 -m pip install --quiet --target "$WORK/pkg/packages" --only-binary=:all: \
      --platform manylinux2014_x86_64 --platform manylinux_2_28_x86_64 --python-version 3.13 \
      -r "$ROOT/speech/requirements.txt"
    az webapp config appsettings set -g "$GROUP" -n "$APP" -o none --settings \
      SCM_DO_BUILD_DURING_DEPLOYMENT=false ENABLE_ORYX_BUILD=false PYTHONPATH=/home/site/wwwroot/packages
    ;;
  *)
    echo "usage: $0 api|speech" >&2
    exit 1
    ;;
esac

# The package must never carry secrets: they live in Azure's App Settings.
if find "$WORK/pkg" -name ".env*" | grep -q .; then
  echo "refusing: a .env file is in the package" >&2
  exit 1
fi
(cd "$WORK/pkg" && zip -qr "$WORK/app.zip" .)
echo "package: $(du -h "$WORK/app.zip" | cut -f1)"

az webapp stop -g "$GROUP" -n "$APP" -o none
az webapp deploy -g "$GROUP" -n "$APP" --src-path "$WORK/app.zip" --type zip --restart false -o none
az webapp start -g "$GROUP" -n "$APP" -o none
until curl -s -m 20 "https://$APP.azurewebsites.net/health" | grep -q '"ok"'; do sleep 10; done
echo "$APP is up"
