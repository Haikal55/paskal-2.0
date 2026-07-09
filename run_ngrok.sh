#!/bin/bash

# Dapatkan path absolute direktori dari script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================="
echo "   Memulai Terowongan Ngrok untuk PASKAL (Port 5173)"
echo "========================================================="
echo "Ngrok akan mengekspos frontend React pada port 5173."
echo "Karena kita menggunakan Vite proxy, semua request API"
echo "ke backend akan otomatis diteruskan secara lokal ke"
echo "Flask Backend (port 5000) tanpa perlu ngrok tambahan!"
echo "========================================================="
echo ""

# Jalankan ngrok
"$DIR/ngrok" http 5173
