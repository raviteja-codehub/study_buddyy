const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'study-buddy-default-super-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password, targetCompany, hoursGoal } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const existingUser = await db.getUserByUsername(username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const user = await db.createUser(username, passwordHash, targetCompany, hoursGoal);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      targetCompany: user.targetCompany,
      hoursGoal: user.hoursGoal
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await db.getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      targetCompany: user.targetCompany,
      hoursGoal: user.hoursGoal
    }
  });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    targetCompany: user.targetCompany,
    hoursGoal: user.hoursGoal
  });
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { targetCompany, hoursGoal } = req.body;
  const updatedUser = await db.updateUserProfile(req.user.id, { targetCompany, hoursGoal });
  
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: updatedUser.id,
    username: updatedUser.username,
    targetCompany: updatedUser.targetCompany,
    hoursGoal: updatedUser.hoursGoal
  });
});

// Problems Routes
app.get('/api/problems', authenticateToken, async (req, res) => {
  const problems = await db.getProblems(req.user.id);
  res.json(problems);
});

app.post('/api/problems', authenticateToken, async (req, res) => {
  const problem = await db.createProblem(req.user.id, req.body);
  res.status(201).json(problem);
});

app.put('/api/problems/:id', authenticateToken, async (req, res) => {
  const updated = await db.updateProblem(req.user.id, req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Problem not found or unauthorized' });
  }
  res.json(updated);
});

app.delete('/api/problems/:id', authenticateToken, async (req, res) => {
  const success = await db.deleteProblem(req.user.id, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Problem not found or unauthorized' });
  }
  res.json({ message: 'Problem deleted successfully' });
});

app.post('/api/problems/:id/review', authenticateToken, async (req, res) => {
  const { confidence } = req.body;
  if (!confidence || confidence < 1 || confidence > 5) {
    return res.status(400).json({ error: 'Confidence rating must be between 1 and 5' });
  }

  const updated = await db.addReview(req.user.id, req.params.id, confidence);
  if (!updated) {
    return res.status(404).json({ error: 'Problem not found or unauthorized' });
  }
  res.json(updated);
});

// Gemini AI Integration for DSA summarizing
app.post('/api/ai/summarize', authenticateToken, async (req, res) => {
  const { title, description, notes } = req.body;
  
  if (!description && !notes) {
    return res.status(400).json({ error: 'Pasted problem statement or notes are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
  if (!apiKey) {
    // If no API Key is available, return a smart Mock Response based on standard keywords
    console.log('No Gemini API Key provided. Returning keyword-based mock analysis.');
    return res.json(generateFallbackSummary(title, description, notes));
  }

  try {
    const prompt = `You are a Google DeepMind DSA helper. Summarize the following DSA problem for a student.
Respond with ONLY a raw JSON object (no markdown fences, no preamble, no trailing text) with these exact keys:
"pattern": (one of: "Two Pointers", "Sliding Window", "Binary Search", "DFS", "BFS", "Dynamic Programming", "Greedy", "Backtracking", "Heap / Priority Queue", "Union Find", "Trie", "Graph", "Linked List", "Stack", "Queue", "Bit Manipulation", "Math", "Sorting", "Recursion", "Prefix Sum", "Other")
"keyInsight": (1 sentence, the core trick/breakthrough to solve the problem)
"timeComplexity": (e.g. "O(n)")
"spaceComplexity": (e.g. "O(1)")
"summary": (max 2 sentences explaining the algorithm approach)

Title: ${title || 'DSA Problem'}
Problem Description:
${description || ''}
My Approach Notes:
${notes || ''}`;

    // Call Gemini API via fetch (native in modern Node versions)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Empty response from Gemini API');
    }

    const cleanJson = JSON.parse(resultText.trim());
    res.json(cleanJson);
  } catch (err) {
    console.error('Gemini API Error:', err);
    // Graceful fallback instead of failing
    res.json(generateFallbackSummary(title, description, notes));
  }
});

// Helper for offline / local-only mock parsing of DSA problems
function generateFallbackSummary(title = '', description = '', notes = '') {
  const content = (title + ' ' + description + ' ' + notes).toLowerCase();
  
  let pattern = 'Other';
  if (content.includes('sliding window') || content.includes('substring without repeating') || content.includes('longest substring')) {
    pattern = 'Sliding Window';
  } else if (content.includes('two pointers') || content.includes('two sum') || content.includes('palindrome') || content.includes('container with most')) {
    pattern = 'Two Pointers';
  } else if (content.includes('binary search') || content.includes('rotated sorted') || content.includes('median of')) {
    pattern = 'Binary Search';
  } else if (content.includes('dfs') || content.includes('depth first') || content.includes('backtracking') || content.includes('permutations') || content.includes('subset')) {
    pattern = 'Backtracking';
  } else if (content.includes('bfs') || content.includes('breadth first') || content.includes('level order')) {
    pattern = 'BFS';
  } else if (content.includes('dp') || content.includes('dynamic programming') || content.includes('knapsack') || content.includes('climbing stairs')) {
    pattern = 'Dynamic Programming';
  } else if (content.includes('greedy') || content.includes('interval') || content.includes('merge intervals')) {
    pattern = 'Greedy';
  } else if (content.includes('linked list') || content.includes('node') || content.includes('reverse list')) {
    pattern = 'Linked List';
  } else if (content.includes('tree') || content.includes('binary tree') || content.includes('bst')) {
    pattern = 'DFS';
  }

  let timeComplexity = 'O(N)';
  let spaceComplexity = 'O(1)';
  if (pattern === 'Dynamic Programming') {
    spaceComplexity = 'O(N)';
  } else if (pattern === 'DFS' || pattern === 'BFS') {
    spaceComplexity = 'O(H)';
  }

  return {
    pattern,
    keyInsight: 'Break down the input size, identify redundant work, and optimize using appropriate data structures.',
    timeComplexity,
    spaceComplexity,
    summary: `Analyzed title and description context. Recommended pattern: ${pattern}. Solve by traversing elements and managing state efficiently.`
  };
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3001;
const PORT_FALLBACKS = [DEFAULT_PORT, 3002, 3003, 3004];

function startServer(ports, index = 0) {
  const port = ports[index];
  const server = app.listen(port, () => {
    console.log(`Study Buddy Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && index < ports.length - 1) {
      console.warn(`Port ${port} is in use. Trying next available port...`);
      startServer(ports, index + 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(PORT_FALLBACKS);
