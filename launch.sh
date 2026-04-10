#!/usr/bin/env bash

PORT=8765
DIR="$(cd "$(dirname "$0")" && pwd)"

if lsof -ti tcp:"$PORT" > /dev/null 2>&1; then
  echo "Erro: a porta $PORT já está em uso. Encerre o processo que está usando-a e tente novamente."
  exit 1
fi

python3 "$DIR/server.py" > /dev/null 2>&1 &
SERVER_PID=$!

trap "kill $SERVER_PID 2>/dev/null; echo 'Servidor encerrado.'; exit" INT TERM

echo "Servidor iniciado em http://localhost:$PORT"
echo "Abrindo Firefox..."
firefox "http://localhost:$PORT/index.html" > /dev/null 2>&1 &

echo "Pressione Ctrl+C para encerrar o servidor."
wait $SERVER_PID
