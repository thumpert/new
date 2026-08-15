#!/usr/bin/env bash
#
# Baixa as imagens de exemplo dos estilos para public/styles/.
#
#   ./scripts/fetch-style-samples.sh
#
# Por que isto é um script e não parte do build: as imagens são fixas. Foram
# geradas uma única vez, com o prompt de cada estilo, todas na mesma cena, para
# poderem ser comparadas lado a lado. Elas ficam versionadas no git — o site
# nunca as gera em tempo de execução.
#
# Quando um estilo mudar, gere a imagem de novo com a MESMA cena e troque só a
# URL daquela linha — as cinco precisam continuar comparáveis entre si.
#
# PROVENIÊNCIA: as cinco em traço foram desenhadas pelo Nano Banana 2 via
# Higgsfield, em 15/08/2026, antes de o app migrar para a API do Google. Este
# script fica como registro de origem, mas os links do CDN expiram e a
# Higgsfield saiu do projeto: refazer uma amostra hoje é gerar pelo provider do
# Google. Para as coloridas existe `scripts/make-colour-samples.ts`, que passa
# pelo prompt real do app; as em traço ainda não têm equivalente.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/styles

CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3GNFAU3bl7JWf8AKSp5WZTLExyW"

# estilo:arquivo-no-cdn — a ordem é a mesma do catálogo (src/lib/catalog.ts).
SAMPLES=(
  "chibi:hf_20260815_140303_e59c3f1f-3ec9-4861-837b-8cc10db1871f.png"
  "coloring-book:hf_20260815_140303_edfcb0b5-dd67-47ed-b148-a13fca32453a.png"
  "superhero-comic:hf_20260815_143300_cb61786c-21cd-4a6c-9ddd-43ea98b885ab.png"
  "fine-line:hf_20260815_140303_ade84702-5fe5-48d5-ac0b-466d69258648.png"
  "cartoon:hf_20260815_140303_2fac3bad-1700-4149-9ba8-5d5528b3b879.png"
)

for entry in "${SAMPLES[@]}"; do
  name="${entry%%:*}"
  file="${entry##*:}"
  out="public/styles/$name.png"

  printf '%-18s ' "$name"
  curl -fsS -o "$out" "$CDN/$file"

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
