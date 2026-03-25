#!/bin/bash
set -e

echo "=== CU-Ask Local Environment Setup Script ==="

# 1. Install nvm and Node.js if not present
echo "[1] Setting up Node.js..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# 2. Install Miniconda if not present
echo "[2] Setting up Python Environment (Miniconda)..."
if ! command -v conda &> /dev/null; then
    mkdir -p ~/miniconda3
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
    bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
    rm ~/miniconda3/miniconda.sh
fi
source ~/miniconda3/bin/activate

# Create conda virtual env for the project and install FastAPI
if ! conda info --envs | grep -q 'cu_ask_env'; then
    conda config --set always_yes yes
    conda config --set auto_activate_base false
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main || true
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r || true
    conda create -n cu_ask_env python=3.10 -y
fi
conda activate cu_ask_env
cd backend && pip install -r requirements.txt && cd ..

# 3. Install frontend dependencies (Vite Root)
echo "[3] Installing Frontend Dependencies..."
npm install

# Check if port is in use and auto-increment or set a clean port
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Warning: Port 3000 is occupied. Vite will automatically pick another port."
fi

# Make gh globally available
grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

echo "=== Setup Complete! ==="
echo "To run the backend: bash -c 'source ~/miniconda3/bin/activate && conda activate cu_ask_env && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload'"
echo "To run the Vite frontend: bash -c 'source ~/.nvm/nvm.sh && nvm use 20 && npm run dev -- --host 127.0.0.1'"
