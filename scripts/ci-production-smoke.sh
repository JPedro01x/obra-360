#!/usr/bin/env bash
set -euo pipefail

# Dedicated GitHub Actions runner. This exercise creates and deletes only its own volumes.
[[ ${GITHUB_ACTIONS:-} == true && -d ${RUNNER_TEMP:-} ]] || {
  echo 'Use este ensaio em um runner dedicado do GitHub Actions.' >&2
  exit 1
}
cd "$(dirname "${BASH_SOURCE[0]}")/.."
umask 077
work=$(mktemp -d "$RUNNER_TEMP/obra360.XXXXXXXX")
run_id=$(openssl rand -hex 6)
export COMPOSE_PROJECT_NAME="obra360-ci-$run_id"
restored="obra360-restore-$run_id"
export OBRA360_COMPOSE_ENV="$work/compose.env"
export OBRA360_BACKUP_DIR="$work/backups"
touch "$OBRA360_COMPOSE_ENV"
export APP_DOMAIN=localhost
export POSTGRES_PASSWORD=$(openssl rand -hex 24)
export JWT_SECRET=$(openssl rand -hex 48)
export EMAIL_ENABLED=false

compose=(docker compose --env-file "$OBRA360_COMPOSE_ENV" -f deploy/compose.production.yml)
active=$COMPOSE_PROJECT_NAME
cleanup() {
  local result=$?
  if [[ $result != 0 ]]; then "${compose[@]}" -p "$active" logs --tail=100 || true; fi
  "${compose[@]}" -p "$restored" down -v || true
  "${compose[@]}" -p "$COMPOSE_PROJECT_NAME" down -v || true
  docker image rm "$COMPOSE_PROJECT_NAME-app" "$restored-app" >/dev/null 2>&1 || true
}
trap cleanup EXIT
stack() { "${compose[@]}" -p "$active" "$@"; }

stack config --quiet
stack build app
stack up -d --wait db
export OP_ACTION=criar-empresa OP_DATA_ENVIRONMENT=HOMOLOGACAO
export OP_COMPANY_NAME='Piloto isolado Obra360' OP_LEGAL_NAME='Piloto isolado Obra360'
export OP_CNPJ=12345678000190 OP_ADMIN_NAME='Administrador de teste'
export OP_ADMIN_EMAIL=admin@compose.example.invalid OP_ADMIN_PASSWORD=$(openssl rand -hex 24)
export OP_LIMIT_USERS=10 OP_LIMIT_PROJECTS=10 OP_LIMIT_MODELS=10
options=()
for name in OP_ACTION OP_DATA_ENVIRONMENT OP_COMPANY_NAME OP_LEGAL_NAME OP_CNPJ OP_ADMIN_NAME \
  OP_ADMIN_EMAIL OP_ADMIN_PASSWORD OP_LIMIT_USERS OP_LIMIT_PROJECTS OP_LIMIT_MODELS; do
  options+=(-e "$name")
done
stack run --rm --no-deps -T "${options[@]}" app --spring.profiles.active=prod,operador --spring.main.web-application-type=none

https() {
  curl --silent --show-error --fail --max-time 10 --noproxy localhost \
    --resolve localhost:443:127.0.0.1 --cacert "$work/caddy.crt" "$@"
}
start_https() {
  stack up -d --no-build --wait --wait-timeout 160
  for (( attempt=0; attempt<30; attempt++ )); do
    if stack cp proxy:/data/caddy/pki/authorities/local/root.crt "$work/caddy.crt" 2>/dev/null &&
      https 'https://localhost/actuator/health/readiness' 2>/dev/null | jq -e '.status == "UP"' >/dev/null; then
      return
    fi
    sleep 1
  done
  echo 'Prontidão HTTPS pelo proxy não confirmada.' >&2
  return 1
}
api=https://localhost/api/v1
json() {
  local route=$1 payload=$2
  shift 2
  https -H 'Content-Type: application/json' -d "$payload" "$@" "$api/$route"
}
login() {
  json auth/login "$(jq -nc '{email:env.OP_ADMIN_EMAIL,senha:env.OP_ADMIN_PASSWORD}')" | jq -er .token
}

start_https
https https://localhost/ > "$work/index.html"
grep -q '/assets/' "$work/index.html"
https "$api/instalacao" | jq -e '.necessaria == false' >/dev/null
token=$(login)
auth=(-H "Authorization: Bearer $token")
engineer=$(json auth/cadastrar "$(jq -nc --arg senha "$(openssl rand -hex 24)" \
  '{nome:"Engenheiro de teste",email:"engenheiro@compose.example.invalid",senhaHash:$senha,perfil:"ENGENHEIRO",ativo:true}')" "${auth[@]}" | jq -er .id)
project=$(json workspace/projetos "$(jq -nc --argjson engineer "$engineer" \
  '{nome:"Obra de teste",engenheiroResponsavelId:$engineer,vgvEstimado:10000,areaTotalM2:75,dataInicio:"2026-01-01",dataPrevisaoFim:"2027-01-01"}')" "${auth[@]}" | jq -er .id)
printf 'Arquivo do ensaio de restauração\n' > "$work/original.txt"
document=$(https "${auth[@]}" -F "projetoObraId=$project" -F titulo=Restauracao -F tipoDocumento=RELATORIO \
  -F "arquivo=@$work/original.txt" "$api/workspace/documentos" | jq -er .id)
echo 'Aplicação e arquivo gravados por HTTPS.'

npm run backup:production -- --janela-de-manutencao
backup_dirs=("$OBRA360_BACKUP_DIR"/*/)
[[ ${#backup_dirs[@]} == 1 && -d ${backup_dirs[0]} ]]
backup=${backup_dirs[0]}
npm run backup:production -- --verify "$backup"
stack down

active=$restored
docker image tag "$COMPOSE_PROJECT_NAME-app" "$restored-app"
stack up -d --wait db
stack exec -T db pg_restore -U obra360 -d obra360 --single-transaction --exit-on-error --no-owner --no-acl < "$backup/postgres.dump"
stack run --rm --no-deps -T --entrypoint tar app -xzf - -C /app/data < "$backup/documentos.tar.gz"
start_https
token=$(login)
https -H "Authorization: Bearer $token" "$api/workspace/documentos/$document/arquivo" > "$work/recuperado.txt"
cmp "$work/original.txt" "$work/recuperado.txt"
echo 'Backup lógico restaurado em volumes novos e documento conferido via HTTPS.'
