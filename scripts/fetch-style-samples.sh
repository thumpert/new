#!/usr/bin/env bash
#
# Baixa as cinco imagens de exemplo dos estilos para public/styles/.
#
#   ./scripts/fetch-style-samples.sh
#
# Por que isto é um script e não parte do build: as imagens são fixas. Foram
# geradas uma única vez, com o prompt de cada estilo, todas na mesma cena, para
# poderem ser comparadas lado a lado. Elas ficam versionadas no git — o site
# nunca as gera em tempo de execução.
#
# (A sessão do Claude que gerou as imagens roda num container sem acesso ao CDN
# da Higgsfield, por isso o download acontece aqui.)
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/styles

BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3GNFAU3bl7JWf8AKSp5WZTLExyW/hf_20260815_140303_"

# estilo:job_id — a ordem é a mesma do catálogo (src/lib/catalog.ts).
SAMPLES=(
  "chibi:e59c3f1f-3ec9-4861-837b-8cc10db1871f"
  "coloring-book:edfcb0b5-dd67-47ed-b148-a13fca32453a"
  "superhero-comic:87a3d4e4-6a91-43d5-9c08-434a1e71551c"
  "fine-line:ade84702-5fe5-48d5-ac0b-466d69258648"
  "cartoon:2fac3bad-1700-4149-9ba8-5d5528b3b879"
)

for entry in "${SAMPLES[@]}"; do
  name="${entry%%:*}"
  job="${entry##*:}"
  out="public/styles/$name.png"

  printf '%-18s ' "$name"
  curl -fsS -o "$out" "$BASE$job.png"

  # As originais têm 896x1200. O card mostra ~176px de altura, então 720px de
  # largura já cobre telas retina com folga e corta o peso do arquivo.
  if command -v sips >/dev/null 2>&1; then
    sips --resampleWidth 720 "$out" >/dev/null 2>&1
  fi

  printf 'ok (%s)\n' "$(du -h "$out" | cut -f1)"
done

echo
echo "Pronto. Agora:"
echo "  git add public/styles && git commit -m 'Add the fixed art style samples' && git push"
