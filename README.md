# MockPrep AI

MockPrep AI is a premium, full-stack, AI-powered mock interview and DSA coding assessment platform. It helps candidates prepare for real-world tech interviews by parsing their resumes, generating customized interview questions, evaluating coding submissions, and tracking performance through a gamified leaderboard.

---

## 🌟 Key Features

### 🧑‍💻 Candidate Platform (User Side)
*   **AI-Driven Interviews:** Generates personalized interview questions based on the candidate's resume content, target role, and experience level using LLMs.
*   **Proctored Interview Room:** Integrates browser speech-to-text dictation and face-tracking using `face-api.js` for an immersive and secure environment.
*   **DSA Coding Workspace:** An interactive editor to write, run, compile test cases, and get instant AI feedback on code correctness, edge cases, and time/space complexities.
*   **Platform Profile Sync:** Sync and scrape user stats from popular programming platforms like LeetCode, Codeforces, and HackerRank.
*   **Real-time Leaderboard:** Gamified student progress with global ranking, badges, and top-three highlights.
*   **Performance Reports:** Detailed feedback detailing strengths, weaknesses, suggested answers, and overall ratings.

### 🛡️ Administrative Portal (Admin Side)
*   **Analytical Dashboard:** Displays high-level stats like active user count, average score, and total completed interviews.
*   **User Management:** Complete table list of all candidates with search, profile inspection, and deletion capabilities.
*   **Interview Records:** Audit logs for all completed interview rooms, generated questions, and user answers.
*   **Two-Factor Security Login:** Protected Google OAuth sign-in restricted to whitelisted administrator emails, coupled with a mandatory 4-digit hardware-style PIN overlay.

---

## 📁 Repository Structure

```
mockprepgroq/
├── frontend/           # Vite + React 19 Client application (User side)
├── backend/            # Express.js Server application (User side)
├── adminfrontend/      # Vite + React 19 Admin Dashboard (Admin side)
├── adminbackend/       # Express.js Admin Server (Admin side)
├── package.json        # Root workspace configuration with monorepo scripts
└── README.md           # Documentation
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas Connection URI)
*   [Firebase Project](https://firebase.google.com/) (For Auth)
*   Groq API Key / Gemini API Key (For AI generation & evaluation)

### 1. Install Dependencies
Run the command below in the **root directory** to install all packages for both the client applications and servers:
```bash
npm run install:all
```
*If you are running on Windows PowerShell and get an `Execution_Policies` restriction error, use:*
```powershell
npm.cmd run install:all
```

### 2. Environment Variables (`.env`)
You must define environmental values inside the respective folders.

#### 🔹 User Backend (`backend/.env`)
Create `backend/.env` file with:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
# OR
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

#### 🔹 Admin Backend (`adminbackend/.env`)
Create `adminbackend/.env` file with:
```env
PORT=3002
MONGODB_URI=your_mongodb_connection_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword
JWT_SECRET=your_jwt_secret
ADMIN_GOOGLE_EMAILS=allowed_admin1@gmail.com,allowed_admin2@gmail.com
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

#### 🔹 User Frontend (`frontend/.env`)
Create `frontend/.env` file with:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
...
```

#### 🔹 Admin Frontend (`adminfrontend/.env`)
Create `adminfrontend/.env` file with:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🚀 Running the Applications

Use the helper monorepo scripts in the root directory to start servers:

| Command | Action | URL / Port |
| :--- | :--- | :--- |
| `npm run dev` | Starts User Frontend & User Backend | Frontend: `http://localhost:5173`<br>Backend: `http://localhost:5000` |
| `npm run dev:admin` | Starts Admin Frontend & Admin Backend | Frontend: `http://localhost:5175`<br>Backend: `http://localhost:3002` |
| `npm run dev:all` | Starts User + Admin Frontend/Backend Concurrently | Runs all 4 services at the same time |

*If you are running on Windows PowerShell and get an `Execution_Policies` restriction error, use `.cmd` extension:*
```powershell
# E.g.
npm.cmd run dev:admin
npm.cmd run dev:all
```

---

## 🔒 Admin Credentials & Login

To sign in successfully into the Admin Dashboard at [http://localhost:5175](http://localhost:5175):
1.  **Google Sign In:** Click "Sign In with Google" and authenticate using an email listed in the `ADMIN_GOOGLE_EMAILS` array.
2.  **Security PIN Verification:** Enter the 4-digit security PIN: **`7243`**.
