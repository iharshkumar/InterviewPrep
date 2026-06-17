const config = require('../config/config');

/**
 * Helper to call LLM (Groq with fallback to local Ollama llama3.2)
 */
async function callLLM(prompt, temperature = 0.1, responseFormat = { type: 'json_object' }) {
  const GROQ_API_KEY = config.groqApiKey;
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

/**
 * Robust JSON parser that handles LLM response anomalies (markdown fences, trailing comments, etc.)
 */
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

module.exports = {
  callLLM,
  parseLLMResponse
};
