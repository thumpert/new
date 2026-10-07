#!/bin/bash
# Copies the example book's order JSONs and images onto the production
# Fly volume, which git push/fly deploy never touches (see fly.toml's
# [[mounts]] — the volume is separate from the deployed code).
#
# Run this yourself once: the Claude Code auto-mode classifier blocks
# writing to the production volume over SSH, by design.
#
#   bash scripts/upload-example-to-fly.sh
#
# Safe to re-run: each file is put on its own, a failure (including "already
# exists") is logged and skipped rather than aborting the whole batch, and
# the summary at the end says exactly what did not make it across.
set -uo pipefail
cd "$(dirname "$0")/.."

STAGE=/tmp/fly-example-upload
if [ ! -d "$STAGE" ]; then
  echo "Staging dir $STAGE not found — rebuilding it from .data/ first."
  mkdir -p "$STAGE/orders" "$STAGE/files"
  for id in da927012-8961-4b8f-95bd-1b56de9c4d7f 83e9f136-ee5d-4263-8a5b-0325e92be154 8499922f-30fe-4653-9161-26d269c6e29d; do
    cp ".data/orders/$id.json" "$STAGE/orders/"
    python3 -c "
import json
o=json.load(open('.data/orders/$id.json'))
urls=set()
for c in o.get('covers',[]) or []:
    if c.get('imageUrl'): urls.add(c['imageUrl'])
for r in o.get('renders',[]) or []:
    if r.get('imageUrl'): urls.add(r['imageUrl'])
for ch in o['brief'].get('characters',[]):
    if ch.get('referenceSheetUrl'): urls.add(ch['referenceSheetUrl'])
if o.get('pdfPath'): urls.add(o['pdfPath'])
for u in urls: print(u.split('/')[-1])
" >> "$STAGE/filelist.txt"
  done
  sort -u "$STAGE/filelist.txt" -o "$STAGE/filelist.txt"
  while read -r name; do
    [ -z "$name" ] && continue
    cp ".data/files/$name" "$STAGE/files/$name"
  done < "$STAGE/filelist.txt"
fi

failed=()

put_one() {
  local local_path="$1" remote_path="$2"
  if fly ssh sftp put "$local_path" "$remote_path" -a portintim >/tmp/fly-put.log 2>&1; then
    echo "  ok   $(basename "$local_path")"
  else
    echo "  FALHOU $(basename "$local_path") — $(tail -1 /tmp/fly-put.log)"
    failed+=("$remote_path")
  fi
}

echo "Enviando $(ls "$STAGE/orders" | wc -l) pedidos..."
for f in "$STAGE"/orders/*.json; do
  name=$(basename "$f")
  put_one "$f" "/app/.data/orders/$name"
done

echo "Enviando $(ls "$STAGE/files" | wc -l) imagens..."
for f in "$STAGE"/files/*; do
  name=$(basename "$f")
  put_one "$f" "/app/.data/files/$name"
done

echo
if [ "${#failed[@]}" -eq 0 ]; then
  echo "Tudo enviado. Confira em https://portintim.fly.dev/pt/exemplo"
else
  echo "${#failed[@]} arquivo(s) não foram (rode de novo para tentar só esses):"
  printf '  %s\n' "${failed[@]}"
fi
