#!/bin/bash

# Dapatkan path absolute direktori dari script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================="
echo "   Memulai Aplikasi PASKAL (Backend Flask + Frontend React)"
echo "========================================================="

# 1. Jalankan Backend Flask di background
echo "[1/2] Menjalankan Flask Backend..."
"$DIR/backend/venv/bin/python" "$DIR/backend/app.py" &
BACKEND_PID=$!

# Fungsi pembersihan untuk mematikan backend ketika Ctrl+C ditekan
cleanup() {
    echo -e "\n========================================================="
    echo "   Menghentikan semua server..."
    echo "========================================================="
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Trap signal SIGINT (Ctrl+C) dan SIGTERM untuk memicu fungsi cleanup
trap cleanup SIGINT SIGTERM

# Menunggu sebentar untuk memastikan backend Flask sudah inisialisasi
sleep 1

# 2. Jalankan Frontend React (Vite) di foreground
echo "[2/2] Menjalankan React Frontend..."
cd "$DIR/frontend"
npm run dev

# Jika server frontend berhenti, matikan backend juga
cleanup
