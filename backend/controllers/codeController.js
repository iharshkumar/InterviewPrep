const { callLLM, parseLLMResponse } = require('../utils/llm');
const Interview = require('../models/Interview');

/**
 * Evaluate coding DSA answers
 */
const evaluateCoding = async (req, res) => {
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

      // Save coding interview result to MongoDB
      if (req.user && req.user.uid && !result.error) {
        const typeStr = submissions.length === 1 
          ? `Coding: ${submissions[0].questionTitle}`
          : 'Coding Test (DSA)';

        const interview = new Interview({
          userUid: req.user.uid,
          role: role || 'Software Developer',
          score: result.overallScore || 0,
          type: typeStr,
          feedback: result.generalFeedback || '',
          details: result.detailedResults || []
        });
        await interview.save();
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
};

/**
 * Simulates running coding test cases
 */
const runCode = async (req, res) => {
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
};

module.exports = {
  evaluateCoding,
  runCode
};
