# 🛡️ Advanced Phishing & Threat Detection Platform

An enterprise-grade, full-stack web application designed to analyze URLs and email payloads for malicious phishing attempts. The platform features real-time threat telemetry, role-based access control (RBAC), and a dedicated Admin Command Center for global platform governance.

## ✨ Key Features

### 👤 Standard User (Threat Intelligence)
* **Dual-Engine Scanning:** Analyze both suspicious URLs and raw email contents for phishing threats.
* **Risk Categorization:** Instantly categorizes threats into `HIGH`, `MEDIUM`, or `LOW` risk levels.
* **Personal Dashboard:** View personal scan history and live system telemetry.
* **Secure Authentication:** JWT-based stateless authentication with encrypted password storage.

### 🔐 Root Admin (Command Center)
* **System Override Registration:** Secure, secret-key-protected route (`/system-override`) to register Root Admin accounts.
* **Global Telemetry:** Monitor total platform scans, aggregate threats blocked, and active user counts.
* **Account Governance:** View, manage, and permanently delete consumer profiles.
* **Threat Feed Management:** Review global malicious payloads and purge false positives from the database.
* **Strict RBAC:** Dedicated frontend and backend guards to prevent unauthorized access to the Command Center.

---

## 💻 Tech Stack

**Frontend (Client)**
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **HTTP Client:** Axios
* **Deployment:** Vercel

**Backend (API Server)**
* **Framework:** FastAPI (Python)
* **ORM:** SQLAlchemy
* **Authentication:** JWT (JSON Web Tokens), Passlib (Bcrypt)
* **Data Validation:** Pydantic
* **Deployment:** Render (Web Service)

**Database**
* **Provider:** Supabase
* **Engine:** PostgreSQL
* **Connection:** IPv4 Transaction/Session Pooler (Compatible with Render)

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your respective `.env` files.

### Backend (`backend/.env`)

# Database Connection (Use Supabase Session Pooler URL for IPv4 compatibility)
DATABASE_URL="postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region][.pooler.supabase.com:6543/postgres](https://.pooler.supabase.com:6543/postgres)"

# JWT Security
SECRET_KEY="generate_a_strong_random_secret_string_here"

# Admin Setup Security
ADMIN_SETUP_SECRET="your_master_secret_key_for_override"


Frontend (frontend/.env.local)

# Point this to your Render backend URL in production, or localhost in dev
NEXT_PUBLIC_API_URL="[http://127.0.0.1:10000](http://127.0.0.1:10000)"

🚀 Local Development Setup
1. Backend Setup
Navigate to the backend directory and set up your Python environment:

cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
Start the FastAPI server:

uvicorn main:app --reload --port 10000
The backend will be running at http://127.0.0.1:10000

2. Frontend Setup
Open a new terminal, navigate to the frontend directory:

cd frontend
npm install
Start the Next.js development server:

npm run dev
The frontend will be running at http://localhost:3000

🗺️ Application Routes
Frontend Routes
/ - User Login

/register - Standard User Registration

/dashboard - User Threat Intelligence Dashboard

/admin - Admin Gateway & Command Center

/system-override - Secure Admin Registration

Key API Endpoints
POST /auth/register - Register standard user

POST /auth/system-override - Register admin (requires admin_secret)

POST /auth/login - Authenticate & receive JWT

POST /scan/url - Analyze URL payload

POST /scan/email - Analyze email payload

GET /analytics/history - Fetch user-specific scan history

GET /admin/telemetry - Fetch global platform statistics (Admin Only)

GET /admin/users - Fetch all platform users (Admin Only)

DELETE /admin/users/{id} - Delete a user account (Admin Only)

# Admin Setup Security
ADMIN_SETUP_SECRET="your_master_secret_key_for_override"
