# CU-Ask Chatbot Platform

Welcome to the CU-Ask project repository! This platform aims to provide support and resources to students dealing with cyberbullying, featuring an interactive chatbot interface.

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, TailwindCSS, React Router
- **Backend**: Python 3.10, FastAPI, Uvicorn
- **Environment Management**: Miniconda, NVM (Node Version Manager)

## 🚀 Getting Started

To ensure everyone on the team has the exact same development environment without dealing with system permission issues, we use an automated setup script.

### 1. Clone the repository
```bash
git clone <your-github-repo-url>
cd cu-ask
```

### 2. Run the Setup Script
Simply run the setup script to install Node.js, Miniconda, and all necessary dependencies:
```bash
bash setup_env.sh
```
*(Note: It might ask you to accept Conda's Term of Service during your first run. The script tries to handle it automatically.)*

### 3. Running the Application locally

**Terminal 1: Start the Backend**
```bash
source ~/miniconda3/bin/activate
conda activate cu_ask_env
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2: Start the Frontend**
```bash
source ~/.nvm/nvm.sh
nvm use 20
npm run dev -- --host 127.0.0.1 --port 3005
```

### 4. Viewing the Application in VS Code
Because the server is hosted remotely, you need to use VS Code's **Port Forwarding**:
1. Open the `Ports` tab in the VS Code terminal panel.
2. Click `Add Port` and enter `3005` (for Frontend) and `8000` (for Backend API).
3. Open your local browser and navigate to `http://127.0.0.1:3005`.
   - `/` : Landing Page
   - `/chat` : Chatbot interface
   - `/test` : Backend connection test page

## 📂 Project Structure
```text
cu-ask/
├── backend/               # FastAPI Python Backend
│   ├── main.py            # Main API router and logic
│   └── requirements.txt   # Python dependencies
├── src/                   # React Frontend Source Code
│   ├── pages/             # Page components (Landing, Chat, BackendTest)
│   ├── App.jsx            # React Router setup
│   └── main.jsx           # Frontend entry point
├── setup_env.sh           # 🌟 Automated environment setup script
├── package.json           # Node.js dependencies
├── tailwind.config.cjs    # Tailwind styling config
└── vite.config.js         # Vite bundler config
```

Happy Coding! 🚀
