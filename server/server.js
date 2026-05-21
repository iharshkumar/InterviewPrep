const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Helper to call LLM (Groq with fallback to local Ollama llama3.2)
async function callLLM(prompt, temperature = 0.1, responseFormat = { type: 'json_object' }) {
  const hasGroqKey = GROQ_API_KEY && GROQ_API_KEY.trim() !== '' && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY.startsWith('gsk_');

  if (hasGroqKey) {
    try {
      console.log('Attempting to call Groq...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: responseFormat,
          temperature: temperature
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          return data.choices[0].message.content;
        }
      }
      
      const errData = await response.json().catch(() => ({}));
      console.warn('Groq call failed with status:', response.status, errData);
    } catch (err) {
      console.warn('Error calling Groq, falling back to Ollama:', err);
    }
  }

  console.log('Using local Ollama (llama3.2) as LLM...');
  const ollamaResponse = await fetch('http://localhost:11434/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
      response_format: responseFormat,
      temperature: temperature
    })
  });

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text();
    throw new Error(`Ollama failed: ${ollamaResponse.status} - ${errText}`);
  }

  const data = await ollamaResponse.json();
  return data.choices[0].message.content;
}

// Robust JSON parser that handles LLM response anomalies (markdown fences, trailing comments, etc.)
function parseLLMResponse(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('LLM response is empty or not a string');
  }

  let cleaned = content.trim();

  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/\s*```$/, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Strip single-line and multi-line comments from the JSON string safely
    const commentRegex = /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)|(\/\/.*|\/\*[\s\S]*?\*\/)/g;
    let withoutComments = cleaned.replace(commentRegex, (match, g1, g2, g3, comment) => {
      if (comment) return ''; // remove comments
      return match; // keep strings
    });

    try {
      return JSON.parse(withoutComments.trim());
    } catch (err) {
      console.warn("Failed to parse after stripping comments. Attempting boundary extraction...", err);
    }

    // Try extracting JSON using boundary search (first { to last } or first [ to last ])
    const firstBrace = withoutComments.indexOf('{');
    const lastBrace = withoutComments.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = withoutComments.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (err) {
        // Try stripping comments from candidate too
        const cleanedCandidate = jsonCandidate.replace(commentRegex, (match, g1, g2, g3, comment) => {
          if (comment) return '';
          return match;
        });
        try {
          return JSON.parse(cleanedCandidate);
        } catch (err2) {
          console.error("Boundary extraction failed:", err2);
        }
      }
    }

    // Check for array bracket search
    const firstBracket = withoutComments.indexOf('[');
    const lastBracket = withoutComments.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const jsonCandidate = withoutComments.substring(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (err) {
        const cleanedCandidate = jsonCandidate.replace(commentRegex, (match, g1, g2, g3, comment) => {
          if (comment) return '';
          return match;
        });
        try {
          return JSON.parse(cleanedCandidate);
        } catch (err2) {
          console.error("Boundary bracket extraction failed:", err2);
        }
      }
    }

    throw new Error(`Could not parse LLM response as JSON. Content: ${content}`);
  }
}

app.use(cors());
app.use(express.json());

// Set up multer for file upload using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Upload and parse resume
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const dataBuffer = req.file.buffer;
    
    const data = await pdfParse(dataBuffer);
    
    res.json({ 
      success: true, 
      text: data.text,
      filename: req.file.originalname
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
    const responseContent = await callLLM(prompt, 0.1);
    
    let parsedData;
    try {
      parsedData = parseLLMResponse(responseContent);
    } catch (e) {
      console.log('Failed to parse JSON, raw:', responseContent, e);
      parsedData = { questions: [] };
    }

    const questionsArray = Array.isArray(parsedData) ? parsedData : (parsedData.questions || []);
    
    if (!questionsArray || questionsArray.length === 0) {
       console.log("No valid questions array found");
       return res.status(500).json({ 
         error: 'Failed to generate valid questions', 
         details: 'Invalid API response format' 
       });
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
  
  Return ONLY a valid JSON object with the following structure. Do NOT include an overall score, just the detailed results and general feedback.
  
  Score field format:
  - For Multiple Choice (mcq): "Correct" or "Incorrect".
  - For Subjective: "X/10" (e.g., "7/10"), based strictly on candidate's depth and length.
  
  JSON structure to return:
  {
    "generalFeedback": "A sharp, honest, and professional critique of the candidate's performance.",
    "detailedResults": [
      {
        "question": "The original question",
        "userAnswer": "What the user wrote",
        "correctSolution": "A detailed explanation of the ideal answer",
        "score": "Correct",
        "reasoning": "A brief explanation of why you gave this specific score based on the candidate's input."
      }
    ]
  }
  `;

  try {
    const responseContent = await callLLM(prompt, 0.1);
    let result;
    try {
      result = parseLLMResponse(responseContent);
      
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
      console.error('Failed to parse evaluation response JSON:', responseContent);
      result = { error: "Evaluation failed to generate valid JSON", raw: responseContent, overallScore: 0 };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error evaluating answers:', error);
    res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

// 4. Evaluate Coding Answers
app.post('/api/evaluate-coding', async (req, res) => {
  const { submissions, role, difficulty } = req.body;
  
  if (!submissions || !role) {
    return res.status(400).json({ error: 'Missing submissions or role' });
  }

  const prompt = `You are a professional, senior software engineer and technical interviewer evaluating a candidate's code submission for a ${role} position (difficulty level: ${difficulty || 'mid-level'}).
  
  Evaluate the candidate's solution for 3 DSA coding questions.
  Here are the submissions:
  ${JSON.stringify(submissions, null, 2)}
  
  STRICT SCORING RULES:
  1. CORRECTNESS (TEST CASES PASSED): The score for each question MUST be strictly proportional to the number of test cases passed, as defined in their submission's "testCasesResult".
     - If the code has a Compile Error or passed 0 test cases, the score MUST be 0/10.
     - If the code passed some test cases, the score should reflect that proportion (e.g. 1/3 passed is 3/10, 2/3 passed is 6/10).
     - If the code passed all test cases (e.g. 3/3), the base score is 8/10 to 10/10 depending on efficiency.
  2. EFFICIENCY & CODE QUALITY: Assess the time and space complexity. A solution that passes all test cases but is inefficient (brute force) should be capped at 7/10 or 8/10. The score of 10/10 should be reserved for optimal time and space complexity with clean design.
  3. CODE DESIGN: Look for clean coding practices, naming conventions, and readability.

  Return ONLY a valid JSON object matching this structure. Do NOT include any markdown code blocks, explanations outside the JSON, or extra text.
  
  JSON structure to return:
  {
    "generalFeedback": "A concise, professional critique summarizing their performance, highlighting strengths and weak areas.",
    "overallScore": 75,
    "detailedResults": [
      {
        "questionId": "ID of the question",
        "questionTitle": "Title of the question",
        "language": "Language of the user's submission, e.g., javascript, python, java, cpp, or c",
        "userCode": "The user's submitted code",
        "testCasesResult": "Passed X/Y test cases",
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(1)",
        "score": "X/10",
        "critique": "A detailed explanation of their code efficiency, correctness, edge-case handling, and styling.",
        "optimalCode": "A clean, commented, and fully optimal implementation of the question in the language submitted by the user."
      }
    ]
  }
  `;

  try {
    const responseContent = await callLLM(prompt, 0.2);
    let result;
    try {
      result = parseLLMResponse(responseContent);
      
      // Calculate overallScore programmatically based on detailedResults individual scores
      if (result && Array.isArray(result.detailedResults)) {
        let totalScore = 0;
        let validScoresCount = 0;
        
        result.detailedResults.forEach(r => {
          if (r.score) {
            let val = 0;
            if (typeof r.score === 'number') {
              val = r.score;
            } else {
              const match = r.score.toString().match(/^(\d+)/);
              if (match) val = parseInt(match[1]);
            }
            totalScore += val;
            validScoresCount++;
          }
        });
        
        if (validScoresCount > 0) {
          result.overallScore = Math.round((totalScore / (validScoresCount * 10)) * 100);
        } else {
          result.overallScore = 0;
        }
      }
    } catch (e) {
      console.error('Failed to parse coding feedback JSON:', responseContent);
      result = { error: "Evaluation failed to generate valid JSON", raw: responseContent, overallScore: 0 };
    }
    res.json(result);
  } catch (error) {
    console.error('Error evaluating coding answers:', error);
    res.status(500).json({ error: 'Failed to evaluate coding answers' });
  }
});

// 5. Run/Compile Code for multi-language support (C, C++, Java, Python)
app.post('/api/run-code', async (req, res) => {
  const { language, code, functionName, testCases } = req.body;

  if (!language || !code || !functionName || !testCases) {
    return res.status(400).json({ error: 'Missing language, code, functionName, or testCases' });
  }

  const prompt = `You are a strict, sandboxed code execution engine. Your job is to simulate compiling and running the user's code for a set of test cases.

Language: ${language}
Function Name: ${functionName}

User's Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases to run:
${JSON.stringify(testCases, null, 2)}

Instructions:
1. Parse the user's code for syntax or compilation errors. If there are syntax/compilation errors that prevent compilation/execution, set "success" to false and describe the error in the top-level "error" field.
2. If compilation succeeds, simulate executing the function "${functionName}" for each test case.
3. For each test case:
   a. Extract the arguments from the test case "input".
   b. Execute the code with these arguments. Follow the logic exactly, including loops, recursion, arithmetic, etc.
   c. If there is a runtime crash (like IndexOutOfBounds, NullPointerException, division by zero, stack overflow), catch it and specify it in the "error" field for that testcase, setting "actual" to null.
   d. Otherwise, compute the actual return value, serialize it, and place it in the "actual" field.
   e. Compare the actual return value with the "expected" value. If they are equivalent, set "passed" to true; otherwise false.

Return ONLY a valid JSON object matching the schema below. Do not wrap it in markdown code blocks or add any other text outside the JSON.

Fields description:
- success (boolean): true if compile/syntax succeeds, false if compile/syntax error prevents running.
- error (string or null): description of the compile error if success is false, otherwise null.
- results (array of objects): simulation result for each testcase.
  Each object in the results array must contain:
  - index (integer): 1-based test case index.
  - input (string): stringified inputs, e.g., "[2, 7, 11, 15], 9".
  - expected (string): stringified expected value, e.g., "[0, 1]".
  - actual (string or null): stringified actual returned value, or null if execution failed.
  - passed (boolean): true if actual matches expected, false otherwise.
  - error (string or null): description of the runtime error if one occurred, otherwise null.

JSON Schema to return:
{
  "success": true,
  "error": null,
  "results": [
    {
      "index": 1,
      "input": "",
      "expected": "",
      "actual": "",
      "passed": true,
      "error": null
    }
  ]
}
`;

  try {
    const responseContent = await callLLM(prompt, 0.1);
    let result;
    try {
      result = parseLLMResponse(responseContent);
    } catch (e) {
      console.error('Failed to parse code runner output JSON:', responseContent, e);
      result = {
        success: false,
        error: `Execution failed to generate valid JSON output. Details: ${e.message}`,
        results: []
      };
    }
    res.json(result);
  } catch (error) {
    console.error('Error simulating code execution:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
