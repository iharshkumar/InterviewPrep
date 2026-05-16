const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 1. Upload and parse resume
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = path.join(__dirname, req.file.path);
    const dataBuffer = fs.readFileSync(filePath);
    
    const data = await pdfParse(dataBuffer);
    
    // Optionally delete the file after parsing if we don't need to keep it
    // fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      text: data.text,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// 2. Generate Questions using local Ollama model
app.post('/api/generate-questions', async (req, res) => {
  const { resumeText, role, difficulty } = req.body;
  
  if (!resumeText || !role) {
    return res.status(400).json({ error: 'Missing resume text or role' });
  }

  const prompt = `You are an expert technical interviewer. I will provide you with a candidate's resume text and the role they are applying for.
  
Role: ${role}
Difficulty: ${difficulty || 'mid'}

Resume:
${resumeText.substring(0, 3000)} // Truncating to avoid massive token counts if necessary

  Task:
  Generate exactly 8 Multiple Choice Questions (MCQs) and 7 Subjective questions (15 questions total) based on the candidate's experience and the role. 
  The questions should test their specific skills mentioned in the resume.

  Return ONLY a valid JSON object containing a 'questions' array. Do not return any other text, markdown blocks, or explanation.
  {
    "questions": [
      {
        "type": "mcq",
        "question": "The question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      },
      {
        "type": "subjective",
        "question": "The question text"
      }
    ]
  }
  `;

  try {
    console.log('Sending request to Ollama...');
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          num_predict: 4096
        }
      })
    });

    const ollamaData = await ollamaResponse.json();
    console.log('Ollama Response:', ollamaData.response);
    
    let parsedData;
    try {
      parsedData = JSON.parse(ollamaData.response);
    } catch (e) {
      console.log('Failed to parse JSON, raw:', ollamaData.response);
      parsedData = { questions: [] };
    }

    const questionsArray = Array.isArray(parsedData) ? parsedData : (parsedData.questions || []);
    
    if (!questionsArray || questionsArray.length === 0) {
       console.log("No valid questions array found");
       return res.status(500).json({ error: 'Failed to generate valid questions' });
    }

    res.json({ questions: questionsArray });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// 3. Evaluate Answers
app.post('/api/evaluate', async (req, res) => {
  const { answers, questions, role } = req.body;
  
  // Pair the questions and answers for clearer context
  const pairedData = questions.map((q, index) => ({
    question: q.question,
    type: q.type,
    options: q.options || null,
    correctAnswer: q.correctAnswer || null,
    userAnswer: answers[index] || "No answer provided"
  }));

  const prompt = `You are a BRUTALLY HONEST, ELITE technical interviewer for a ${role} position.
  Your goal is to accurately assess the candidate and weed out those who are unqualified, lazy, or providing nonsense answers.
  
  EVALUATION DATA (Question and Candidate's Answer pairs):
  ${JSON.stringify(pairedData, null, 2)}

  STRICT SCORING RULES:
  1. RELEVANCE & GIBBERISH CHECK: If the userAnswer is "I don't know", gibberish (e.g., "asdf", "random text"), completely unrelated to the question (e.g., answering with "apple" to a coding question), or extremely short/evasive, you MUST give it a score of 0 or "Incorrect" IMMEDIATELY.
  2. MCQ SCORING: If the answer is exactly correct according to the 'correctAnswer', it is "Correct". Otherwise, it is "Incorrect" (0 points).
  3. SUBJECTIVE SCORING: Evaluate technical depth, accuracy, and professionalism. 
     - A "good" answer must explain 'how' and 'why'. 
     - Generic or "textbook only" definitions get a maximum of 4/10. 
     - Real-world examples or deep technical insights get 8/10+.
     - Empty or nonsense answers get 0/10.
  4. OVERALL SCORE CALCULATION: The 'overallScore' MUST be the mathematical average of all individual question scores. Do NOT inflate this number. If the candidate fails most questions, the score must be very low (e.g., 0-20).
  
  Return ONLY a valid JSON object with the following structure:
  {
    "overallScore": number (0-100),
    "generalFeedback": "A sharp, honest, and professional critique of the candidate's performance.",
    "detailedResults": [
      {
        "question": "The original question",
        "userAnswer": "What the user wrote",
        "correctSolution": "A detailed explanation of the ideal answer",
        "score": "Correct/Incorrect OR X/10",
        "reasoning": "A brief explanation of why you gave this specific score based on the candidate's input."
      }
    ]
  }
  `;

  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1 // Lower temperature for more consistent, strict scoring
        }
      })
    });

    const ollamaData = await ollamaResponse.json();
    let result;
    try {
      result = JSON.parse(ollamaData.response);
    } catch (e) {
      console.error('Failed to parse Ollama JSON:', ollamaData.response);
      result = { error: "Evaluation failed to generate valid JSON", raw: ollamaData.response };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error evaluating answers:', error);
    res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
