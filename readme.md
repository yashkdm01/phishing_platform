# 🛡️ ThreatDefend: AI Phishing Detection & SOC Platform

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![VirusTotal](https://img.shields.io/badge/VirusTotal_API-394EFF?style=for-the-badge&logo=virustotal&logoColor=white)

A full-stack, enterprise-grade Threat Detection Platform designed to identify phishing URLs and malicious email payloads. It features a scalable backend engine, seamless user authentication, and a highly secure Security Operations Center (SOC) Admin Dashboard for real-time telemetry and user management.

## 🚀 Live Demo
* **Frontend Application:** *https://phishing-platform-three.vercel.app/*
* **Backend API Docs (Swagger UI):** *https://phishing-platform-5n3u.onrender.com/docs*

---

## ✨ Key Features

### 🔍 Threat Detection Engine
* **URL Scanner:** Integrates the **VirusTotal API** for global vendor consensus, backed by a custom local heuristics engine for real-time risk assessment (Safe, Suspicious, Malicious).
* **Email/Payload Analyzer:** NLP-based scanning of email text to identify urgency triggers, typosquatting, and social engineering patterns.

### 🔐 Enterprise Security & RBAC (Role-Based Access Control)
* **JWT Authentication:** Secure login sessions with encrypted tokens.
* **Role Verification:** Strict routing that actively intercepts and destroys unauthorized tokens attempting to access restricted areas.
* **Master Secret Architecture:** Admin accounts cannot be created publicly. They require a hidden `/system-override` portal and a matching server-side Environment Variable (`ADMIN_SETUP_SECRET`).

### 🎛️ SOC Command Center (Admin Gateway)
* **Global Telemetry:** Real-time metrics on Total Scans, Active Agents, and Critical Threats Blocked.
* **User Management:** View all registered users and permanently delete accounts.
* **Threat Logs:** Review historical global scan data and clear benign or outdated logs.
* **Optimistic UI:** Lightning-fast, zero-lag interface that processes deletions instantly on the frontend while syncing silently with the database.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** Next.js (App Router)
* **Language:** TypeScript / React
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Data Fetching:** Axios
* **Hosting:** Vercel

### Backend (Server)
* **Framework:** FastAPI (Python)
* **Database:** SQLite (SQLAlchemy ORM)
* **Authentication:** PyJWT, Passlib, Bcrypt
* **External APIs:** VirusTotal API v3
* **Hosting:** Render

---

## ⚙️ Local Installation & Setup

### Prerequisites
* Python 3.9+
* Node.js 18+
* Git

### 1. Clone the Repository
```bash
git clone [https://github.com/yashkdm01/phishing_platform.git](https://github.com/yashkdm01/phishing_platform.git)
cd phishing_platform

** Backend Setup
cd backend
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (.env)
echo "VIRUSTOTAL_API_KEY=your_api_key_here" >> .env
echo "ADMIN_SETUP_SECRET=your_master_secret_here" >> .env
echo "SECRET_KEY=your_jwt_secret_here" >> .env

# Run the FastAPI server
uvicorn main:app --reload

** Frontend Setup
cd ../frontend

# Install dependencies
npm install

# Set up environment variables (.env.local)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local

# Run the development server
npm run dev


🔒 How to Test the Admin Dashboard
Set the Master Secret: Ensure ADMIN_SETUP_SECRET is configured in your backend environment variables.

Access the Override Portal: Navigate to /system-override.

Register: Create a new account and input your Master Secret into the authorization field.

Access the SOC: Navigate to /admin to log in with your new administrator credentials. Standard users attempting to access this route will have their session terminated.

👨‍💻 Author
Yash

LinkedIn: (linkedin.com/in/yash-kadam-96a09535b)

GitHub: @yashkdm01
