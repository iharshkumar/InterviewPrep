# MockPrep AI

MockPrep AI is a premium, full-stack AI-powered interview preparation web application. It is designed to provide users with personalized, rigorous, and immersive mock interview simulations based on their uploaded resumes, helping candidates prepare for real-world job interviews.

## Features

- **AI-Driven Interview Simulations:** Utilizes advanced LLMs (such as Gemini 3.1 Pro or Groq API with Llama 3 models) to conduct highly dynamic, ChatGPT-style conversational interviews.
- **Resume Parsing & Personalization:** Extracts key details from uploaded PDF resumes to dynamically generate tailored interview questions that match a candidate's experience and applied role.
- **Live Video & Proctoring Environment:** Integrates a live webcam feed with `face-api.js` for facial tracking, creating a secure and professional interview setting.
- **Voice-to-Text Dictation:** Captures candidates' verbal responses via the browser's speech recognition API for seamless interaction.
- **3D Animated Guide:** Features an interactive 3D guide powered by `Three.js` and `@react-three/fiber` to lead users through the 60-minute interview flow.
- **Performance Dashboard:** A responsive user dashboard that provides post-interview feedback, performance analytics, and actionable insights.
- **Serverless Ready:** Configured for Vercel deployment with serverless API routes and memory storage for handling file uploads smoothly.

## Tech Stack

**Frontend:**
- React 19 (via Vite)
- Three.js & React Three Fiber (for 3D elements)
- Framer Motion (for smooth animations)
- face-api.js (for facial tracking)
- Lucide React (for UI icons)
- React Router DOM

**Backend:**
- Node.js & Express
- Multer (Memory Storage for Serverless environments)
- PDF-Parse (for processing resumes)
- CORS

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- API Keys for your preferred AI models (e.g., Groq API, Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "mockPrep AI Gemini"
   ```

2. **Setup the Frontend**
   Install the necessary dependencies for the React application:
   ```bash
   npm install
   ```

3. **Setup the Backend**
   Navigate to the `server` directory and install backend dependencies:
   ```bash
   cd server
   npm install
   ```

### Environment Variables

You will need to configure your environment variables. 
- Create a `.env` file in the root directory (for Vite/Frontend variables like `VITE_API_URL`).
- Create a `.env` file in the `server` directory containing your AI API keys (e.g., `GROQ_API_KEY` or `GEMINI_API_KEY`) and backend port configurations.

### Running Locally

1. **Start the Backend Server**
   ```bash
   cd server
   npm start
   ```
   *The backend typically runs on `http://localhost:5000` or the port specified in your env file.*

2. **Start the Frontend Development Server**
   In a new terminal window (from the project root):
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com).
The `vercel.json` file in the root directory specifies the rewrites for the Express backend to operate as serverless functions, and the build scripts handle the frontend Vite build. 

To deploy, simply link the repository to a new Vercel project and ensure all environment variables are added in the Vercel project settings.

## Project Structure

```
mockPrep AI Gemini/
├── public/               # Static assets
├── server/               # Express backend application
│   ├── server.js         # Entry point for backend
│   └── package.json      # Backend dependencies
├── src/                  # React frontend source code
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (Dashboard, InterviewRoom, etc.)
│   ├── App.jsx           # Main React component
│   └── main.jsx          # Entry point for React
├── vercel.json           # Vercel deployment configuration
├── package.json          # Frontend dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # Project documentation
```
