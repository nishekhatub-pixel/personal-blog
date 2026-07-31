#!/usr/bin/env bash

set -Eeuo pipefail
umask 027

APP_ROOT="${APP_ROOT:-/var/www/r7-blog}"
STORAGE_ROOT="${STORAGE_ROOT:-/var/www/r7-blog-storage}"
REPO_URL="${REPO_URL:?Set REPO_URL to the Git repository URL.}"
BRANCH="${BRANCH:-main}"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$$"
RELEASES_DIR="${APP_ROOT}/releases"
SHARED_DIR="${APP_ROOT}/shared"
LOG_DIR="${SHARED_DIR}/logs"
ENV_FILE="${SHARED_DIR}/.env.production"
CURRENT_LINK="${APP_ROOT}/current"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREVIOUS_RELEASE=""

for command_name in git node npm pm2 curl; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command is missing: ${command_name}" >&2
    exit 1
  fi
done

if [[ -e "${CURRENT_LINK}" && ! -L "${CURRENT_LINK}" ]]; then
  echo "${CURRENT_LINK} exists but is not a symbolic link. Stop to avoid overwriting it." >&2
  exit 1
fi

if [[ -L "${CURRENT_LINK}" ]]; then
  PREVIOUS_RELEASE="$(readlink -f "${CURRENT_LINK}")"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing production environment file: ${ENV_FILE}" >&2
  exit 1
fi

mkdir -p \
  "${RELEASES_DIR}" \
  "${LOG_DIR}" \
  "${STORAGE_ROOT}/images" \
  "${STORAGE_ROOT}/photos" \
  "${STORAGE_ROOT}/music" \
  "${STORAGE_ROOT}/avatars" \
  "${STORAGE_ROOT}/temp"

echo "Creating release ${RELEASE_ID}"
git clone --branch "${BRANCH}" --depth 1 "${REPO_URL}" "${RELEASE_DIR}"
ln -s "${ENV_FILE}" "${RELEASE_DIR}/.env.production"

cd "${RELEASE_DIR}"

# Install on Linux itself so Sharp selects Linux/libvips binaries. The
# repository also keeps pnpm for local development, while package-lock.json
# makes this npm server workflow reproducible. Never reuse Windows node_modules.
npm ci --include=dev --include=optional --no-audit --no-fund

PRISMA_CLI="./node_modules/.bin/prisma"
if [[ ! -x "${PRISMA_CLI}" ]]; then
  echo "Project-local Prisma CLI is missing after npm ci." >&2
  exit 1
fi

"${PRISMA_CLI}" --version
"${PRISMA_CLI}" generate

# Production migrations are append-only. Never replace this with migrate reset.
"${PRISMA_CLI}" migrate deploy
npm run build

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

export R7_APP_ROOT="${CURRENT_LINK}"
export R7_ENV_FILE="${ENV_FILE}"
export R7_LOG_ROOT="${LOG_DIR}"
pm2 startOrReload "${CURRENT_LINK}/ecosystem.config.cjs" \
  --only r7-blog \
  --env production \
  --update-env

if ! curl --fail --silent --show-error \
  --retry 8 \
  --retry-delay 2 \
  --retry-connrefused \
  "http://127.0.0.1:3000/" >/dev/null; then
  echo "Health check failed." >&2
  if [[ -n "${PREVIOUS_RELEASE}" && -d "${PREVIOUS_RELEASE}" ]]; then
    echo "Restoring previous application release: ${PREVIOUS_RELEASE}" >&2
    ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}"
    pm2 startOrReload "${CURRENT_LINK}/ecosystem.config.cjs" \
      --only r7-blog \
      --env production \
      --update-env
  fi
  exit 1
fi

pm2 save
pm2 status r7-blog

echo "Deployment completed: ${RELEASE_DIR}"
if [[ -n "${PREVIOUS_RELEASE}" ]]; then
  echo "Previous release retained for rollback: ${PREVIOUS_RELEASE}"
fi
