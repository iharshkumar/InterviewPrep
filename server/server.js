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
  const { resumeText, role, difficulty, section } = req.body;
  
  if (!resumeText || !role || !section) {
    return res.status(400).json({ error: 'Missing resume text, role, or section' });
  }

  const prompt = `You are an expert technical interviewer. I will provide you with a candidate's resume text and the role they are applying for.
  
Role: ${role}
Difficulty: ${difficulty || 'mid'}
Interview Section: ${section}

Resume:
${resumeText.substring(0, 3000)} // Truncating to avoid massive token counts if necessary

  Task:
  Generate exactly 5 questions specifically for the ${section} phase of the interview.
  The questions should be highly relevant to this specific section and the candidate's experience.
  Mix Multiple Choice Questions (mcq) and Subjective questions.

  Return ONLY a valid JSON object containing a 'questions' array. Do not return any other text, markdown blocks, or explanation.
  Each question MUST include a 'section' field indicating its category: "${section}".
  {
    "questions": [
      {
        "type": "mcq",
        "section": "${section}",
        "question": "The question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      },
      {
        "type": "subjective",
        "section": "${section}",
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
  2. MCQ SCORING: If the answer is exactly correct according to the 'correctAnswer', it is "Correct". Otherwise, it is "Incorrect".
  3. SUBJECTIVE SCORING: Evaluate technical depth, accuracy, and length. 
     - DO NOT give random marks. Base the score STRICTLY on the length and detail of the answer.
     - The more relevant words and detail, the more marks. 
     - If the answer is fully wrong, completely irrelevant, or empty, you MUST give exactly 0/10.
     - If the answer is very short (few words), give it a low mark (1/10 to 3/10) even if it is somewhat correct.
     - If the answer is long, detailed, and explains 'how' and 'why', give it a high mark (7/10 to 10/10).
  
  Return ONLY a valid JSON object with the following structure. Do NOT include an overall score, just the detailed results and general feedback:
  {
    "generalFeedback": "A sharp, honest, and professional critique of the candidate's performance.",
    "detailedResults": [
      {
        "question": "The original question",
        "userAnswer": "What the user wrote",
        "correctSolution": "A detailed explanation of the ideal answer",
        "score": "Correct" or "Incorrect" (for MCQ) OR "X/10" (for Subjective),
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
      
      // Manually calculate overall score to avoid LLM math hallucinations
      if (result.detailedResults && Array.isArray(result.detailedResults)) {
        let totalPossibleScore = 0;
        let earnedScore = 0;
        
        result.detailedResults.forEach(item => {
          if (item.score === "Correct") {
            totalPossibleScore += 1;
            earnedScore += 1;
          } else if (item.score === "Incorrect") {
            totalPossibleScore += 1;
          } else if (typeof item.score === 'string' && item.score.includes('/10')) {
            // Subjective questions carry a weight of 4
            totalPossibleScore += 4;
            const numericScore = parseFloat(item.score.split('/')[0]);
            if (!isNaN(numericScore)) {
              earnedScore += (numericScore / 10) * 4;
            }
          }
        });
        
        // Calculate percentage
        if (totalPossibleScore > 0) {
          result.overallScore = Math.round((earnedScore / totalPossibleScore) * 100);
        } else {
          result.overallScore = 0;
        }
      } else {
        result.overallScore = 0;
      }
      
    } catch (e) {
      console.error('Failed to parse Ollama JSON:', ollamaData.response);
      result = { error: "Evaluation failed to generate valid JSON", raw: ollamaData.response, overallScore: 0 };
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
