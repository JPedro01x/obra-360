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
export SHARED_USAGE_LIMITS_SECRET=$(openssl rand -hex 48)
export EMAIL_ENABLED=false

compose=(docker compose --env-file "$OBRA360_COMPOSE_ENV" -f deploy/compose.production.yml)
if [[ ${OBRA360_COMPOSE_MESSAGING:-false} == true ]]; then
  compose+=(-f deploy/compose.production.messaging.yml)
fi
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
stack run --rm --no-deps -T -e MESSAGING_ENABLED=false "${options[@]}" app --spring.profiles.active=prod,operador --spring.main.web-application-type=none

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
engineer_password=$(openssl rand -hex 24)
engineer=$(json auth/cadastrar "$(jq -nc --arg senha "$engineer_password" \
  '{nome:"Engenheiro de teste",email:"engenheiro@compose.example.invalid",senhaHash:$senha,perfil:"ENGENHEIRO",ativo:true}')" "${auth[@]}" | jq -er .id)
today=$(TZ=America/Sao_Paulo date +%F)
deadline=$(TZ=America/Sao_Paulo date -d '+90 days' +%F)
project=$(json workspace/projetos "$(jq -nc --argjson engineer "$engineer" --arg today "$today" --arg deadline "$deadline" \
  '{nome:"Obra de teste",engenheiroResponsavelId:$engineer,vgvEstimado:10000,areaTotalM2:75,dataInicio:$today,dataPrevisaoFim:$deadline}')" "${auth[@]}" | jq -er .id)
if [[ ${OBRA360_COMPOSE_MESSAGING:-false} == true ]]; then
  supplier=$(json workspace/fornecedores '{"cnpj":"12345678000190","razaoSocial":"Fornecedor de teste","categoriaFornecimento":"INSUMOS"}' "${auth[@]}" | jq -er .id)
  team=$(json workspace/equipes "$(jq -nc --argjson project "$project" --argjson engineer "$engineer" \
    '{projetoObraId:$project,liderEncarregadoId:$engineer,nomeEquipe:"Equipe do ensaio",especialidade:"Teste",quantidadeOperarios:1}')" "${auth[@]}" | jq -er .id)
  contract=$(json workspace/contratos "$(jq -nc --argjson project "$project" --argjson supplier "$supplier" --arg today "$today" --arg deadline "$deadline" \
    '{projetoObraId:$project,fornecedorB2bId:$supplier,numeroContrato:"CI-OS-1",valorTotal:100,retencaoTecnicaPct:0,tempoLimiteSlaHoras:24,dataInicio:$today,dataTermino:$deadline}')" "${auth[@]}" | jq -er .id)
  json workspace/ordens "$(jq -nc --argjson contract "$contract" --argjson team "$team" \
    '{contratoServicoId:$contract,equipeTrabalhoId:$team,descricao:"Notificacao do ensaio",prioridade:"MEDIA",exigeMaterial:false}')" "${auth[@]}" >/dev/null
  engineer_token=$(json auth/login "$(jq -nc --arg password "$engineer_password" '{email:"engenheiro@compose.example.invalid",senha:$password}')" | jq -er .token)
  notified=false
  for (( attempt=0; attempt<30; attempt++ )); do
    if https -H "Authorization: Bearer $engineer_token" "$api/workspace/notificacoes" | jq -e '.items | length > 0' >/dev/null; then notified=true; break; fi
    sleep 1
  done
  [[ $notified == true ]] || { echo 'Notificação Kafka não persistida.' >&2; exit 1; }
fi
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
