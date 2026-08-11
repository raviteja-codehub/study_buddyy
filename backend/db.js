const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studybuddy';
const client = new MongoClient(MONGODB_URI);
const dbPath = path.join(__dirname, 'data', 'db.json');

let db;
let users;
let problems;
let focusSessions;
let isFallback = false;

// Fallback JSON DB Helpers
function readJsonDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { users: [], problems: [], focusSessions: [] };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.focusSessions) {
      parsed.focusSessions = [];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading fallback JSON DB:', err);
    return { users: [], problems: [], focusSessions: [] };
  }
}

function writeJsonDb(data) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing fallback JSON DB:', err);
  }
}

async function initialize() {
  if (db || isFallback) return;
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    db = client.db();
    users = db.collection('users');
    problems = db.collection('problems');
    focusSessions = db.collection('focusSessions');

    await users.createIndex({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
    await users.createIndex({ email: 1 }, { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } });
    await problems.createIndex({ userId: 1 });
    await problems.createIndex({ id: 1 }, { unique: true });
    await focusSessions.createIndex({ userId: 1 });
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to local JSON database:', err.message);
    isFallback = true;
  }
}

// ---- Spaced Revision Rule ----
// Every problem is revised N times (default 3: Day 1, Day 3, Day 7 after it
// was logged - the classic "1-3-7 rule"). Users can customize both N
// (1 to 5 revisions) and the day-offset of each stage from Settings. Each
// problem SNAPSHOTS the pattern that was active when it was logged, so a
// later change to the user's default pattern only affects newly logged
// problems - it never silently reshuffles due dates on problems already in
// the queue.
const DEFAULT_REVISION_PATTERN = [1, 3, 7];

function sanitizeRevisionPattern(pattern) {
  if (!Array.isArray(pattern) || pattern.length === 0) return DEFAULT_REVISION_PATTERN;
  const cleaned = pattern
    .map(n => Math.round(Number(n)))
    .filter(n => Number.isFinite(n) && n >= 1 && n <= 365)
    .slice(0, 5);
  if (cleaned.length === 0) return DEFAULT_REVISION_PATTERN;
  // Keep strictly increasing so "next due date" always moves forward.
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i] <= cleaned[i - 1]) cleaned[i] = cleaned[i - 1] + 1;
  }
  return cleaned;
}

// Given the createdAt date, the problem's own revision pattern, and the
// current revisionStage (0 = nothing done yet), returns the date string of
// the NEXT due revision, or null once every stage is complete.
function computeNextReviewDate(createdAt, revisionStage, pattern = DEFAULT_REVISION_PATTERN) {
  if (revisionStage >= pattern.length) return null;
  return addDays(createdAt, pattern[revisionStage]);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function rowToProblem(row) {
  if (!row) return null;
  return {
    ...row,
    reviewHistory: Array.isArray(row.reviewHistory) ? row.reviewHistory : [],
  };
}

module.exports = {
  // Expose fallback state for status checks
  getIsFallback() {
    return isFallback;
  },

  async getUserById(id) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      return data.users.find(u => u.id === id) || null;
    }
    return users.findOne({ id });
  },

  async getUserByUsername(username) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      return data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }
    return users.findOne({ username: { $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  },

  async getUserByEmail(email) {
    await initialize();
    if (!email) return null;
    if (isFallback) {
      const data = readJsonDb();
      return data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    return users.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  },

  async createUser(username, passwordHash, targetCompany = '', hoursGoal = 10, email = '') {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      const newUser = {
        id: 'u_' + Math.random().toString(36).slice(2, 11),
        username,
        passwordHash,
        email: email || '',
        targetCompany,
        hoursGoal: Number(hoursGoal),
        revisionPattern: DEFAULT_REVISION_PATTERN,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        createdAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      writeJsonDb(data);
      return newUser;
    }

    const newUser = {
      id: 'u_' + Math.random().toString(36).slice(2, 11),
      username,
      passwordHash,
      email: email || '',
      targetCompany,
      hoursGoal,
      revisionPattern: DEFAULT_REVISION_PATTERN,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      createdAt: new Date().toISOString(),
    };
    await users.insertOne(newUser);
    return newUser;
  },

  async updateUserProfile(userId, updates) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      const idx = data.users.findIndex(u => u.id === userId);
      if (idx === -1) return null;

      const user = data.users[idx];
      const targetCompany = updates.targetCompany !== undefined ? updates.targetCompany : user.targetCompany;
      const hoursGoal = updates.hoursGoal !== undefined ? Number(updates.hoursGoal) : user.hoursGoal;
      const email = updates.email !== undefined ? updates.email : user.email;
      const revisionPattern = updates.revisionPattern !== undefined
        ? sanitizeRevisionPattern(updates.revisionPattern)
        : (user.revisionPattern || DEFAULT_REVISION_PATTERN);

      data.users[idx] = {
        ...user,
        targetCompany,
        hoursGoal,
        email,
        revisionPattern,
      };
      writeJsonDb(data);
      return data.users[idx];
    }

    const user = await users.findOne({ id: userId });
    if (!user) return null;

    const targetCompany = updates.targetCompany !== undefined ? updates.targetCompany : user.targetCompany;
    const hoursGoal = updates.hoursGoal !== undefined ? Number(updates.hoursGoal) : user.hoursGoal;
    const email = updates.email !== undefined ? updates.email : user.email;
    const revisionPattern = updates.revisionPattern !== undefined
      ? sanitizeRevisionPattern(updates.revisionPattern)
      : (user.revisionPattern || DEFAULT_REVISION_PATTERN);

    await users.updateOne(
      { id: userId },
      { $set: { targetCompany, hoursGoal, email, revisionPattern } }
    );

    return users.findOne({ id: userId });
  },

  // ---- Password reset ----
  async setResetToken(userId, tokenHash, expiresAt) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      const idx = data.users.findIndex(u => u.id === userId);
      if (idx === -1) return null;
      data.users[idx] = { ...data.users[idx], resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt };
      writeJsonDb(data);
      return data.users[idx];
    }
    await users.updateOne({ id: userId }, { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt } });
    return users.findOne({ id: userId });
  },

  async getUserByResetTokenHash(tokenHash) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      return data.users.find(u => u.resetTokenHash && u.resetTokenHash === tokenHash) || null;
    }
    return users.findOne({ resetTokenHash: tokenHash });
  },

  async resetPasswordByUserId(userId, passwordHash) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      const idx = data.users.findIndex(u => u.id === userId);
      if (idx === -1) return null;
      data.users[idx] = { ...data.users[idx], passwordHash, resetTokenHash: null, resetTokenExpiresAt: null };
      writeJsonDb(data);
      return data.users[idx];
    }
    await users.updateOne(
      { id: userId },
      { $set: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null } }
    );
    return users.findOne({ id: userId });
  },

  async getProblems(userId) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      return data.problems
        .filter(p => p.userId === userId)
        .map(rowToProblem)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const rows = await problems.find({ userId }).sort({ createdAt: -1 }).toArray();
    return rows.map(rowToProblem);
  },

  async createProblem(userId, data) {
    await initialize();
    const now = todayStr();
    const timeSpent = data.timeSpent !== undefined ? Number(data.timeSpent) : 0;
    const previouslySolved = !!data.previouslySolved;
    const revisionPattern = sanitizeRevisionPattern(data.revisionPattern);
    // Already-known problems skip the revision queue entirely (no Day 1/3/7).
    const revisionStage = previouslySolved ? revisionPattern.length : 0;
    const newProblem = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId,
      title: data.title,
      link: data.link || '',
      description: data.description || '',
      pattern: data.pattern || 'Other',
      difficulty: data.difficulty || 'Medium',
      notes: data.notes || '',
      mistakes: data.mistakes || '',
      summary: data.summary || null,
      createdAt: now,
      revisionStage,
      revisionPattern,
      previouslySolved,
      mastered: previouslySolved,
      nextReview: computeNextReviewDate(now, revisionStage, revisionPattern),
      reviewHistory: data.confidence ? [{ date: now, confidence: data.confidence, timeSpent, stage: 0 }] : [],
      timeSpent,
    };

    if (isFallback) {
      const dbData = readJsonDb();
      dbData.problems.unshift(newProblem);
      writeJsonDb(dbData);
      return rowToProblem(newProblem);
    }

    await problems.insertOne(newProblem);
    return rowToProblem(newProblem);
  },

  async updateProblem(userId, problemId, data) {
    await initialize();
    if (isFallback) {
      const dbData = readJsonDb();
      const idx = dbData.problems.findIndex(p => p.id === problemId && p.userId === userId);
      if (idx === -1) return null;

      const existing = dbData.problems[idx];
      const psChanged = data.previouslySolved !== undefined && !!data.previouslySolved !== !!existing.previouslySolved;
      const previouslySolved = data.previouslySolved !== undefined ? !!data.previouslySolved : existing.previouslySolved;
      const revisionStage = psChanged ? (previouslySolved ? (existing.revisionPattern || DEFAULT_REVISION_PATTERN).length : 0) : existing.revisionStage;
      dbData.problems[idx] = {
        ...existing,
        title: data.title !== undefined ? data.title : existing.title,
        link: data.link !== undefined ? data.link : existing.link,
        description: data.description !== undefined ? data.description : existing.description,
        pattern: data.pattern !== undefined ? data.pattern : existing.pattern,
        difficulty: data.difficulty !== undefined ? data.difficulty : existing.difficulty,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        mistakes: data.mistakes !== undefined ? data.mistakes : existing.mistakes,
        summary: data.summary !== undefined ? data.summary : existing.summary,
        timeSpent: data.timeSpent !== undefined ? Number(data.timeSpent) : existing.timeSpent,
        previouslySolved,
        revisionStage,
        mastered: psChanged ? previouslySolved : existing.mastered,
        nextReview: psChanged ? computeNextReviewDate(existing.createdAt, revisionStage, existing.revisionPattern || DEFAULT_REVISION_PATTERN) : existing.nextReview,
      };
      writeJsonDb(dbData);
      return rowToProblem(dbData.problems[idx]);
    }

    const existing = await problems.findOne({ id: problemId, userId });
    if (!existing) return null;

    const psChanged = data.previouslySolved !== undefined && !!data.previouslySolved !== !!existing.previouslySolved;
    const previouslySolved = data.previouslySolved !== undefined ? !!data.previouslySolved : existing.previouslySolved;
    const revisionStage = psChanged ? (previouslySolved ? (existing.revisionPattern || DEFAULT_REVISION_PATTERN).length : 0) : existing.revisionStage;

    const updateBody = {
      title: data.title !== undefined ? data.title : existing.title,
      link: data.link !== undefined ? data.link : existing.link,
      description: data.description !== undefined ? data.description : existing.description,
      pattern: data.pattern !== undefined ? data.pattern : existing.pattern,
      difficulty: data.difficulty !== undefined ? data.difficulty : existing.difficulty,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      mistakes: data.mistakes !== undefined ? data.mistakes : existing.mistakes,
      summary: data.summary !== undefined ? data.summary : existing.summary,
      timeSpent: data.timeSpent !== undefined ? Number(data.timeSpent) : existing.timeSpent,
      previouslySolved,
      revisionStage,
      mastered: psChanged ? previouslySolved : existing.mastered,
      nextReview: psChanged ? computeNextReviewDate(existing.createdAt, revisionStage, existing.revisionPattern || DEFAULT_REVISION_PATTERN) : existing.nextReview,
    };

    await problems.updateOne(
      { id: problemId, userId },
      { $set: updateBody }
    );

    return rowToProblem(await problems.findOne({ id: problemId, userId }));
  },

  async deleteProblem(userId, problemId) {
    await initialize();
    if (isFallback) {
      const dbData = readJsonDb();
      const lenBefore = dbData.problems.length;
      dbData.problems = dbData.problems.filter(p => !(p.id === problemId && p.userId === userId));
      writeJsonDb(dbData);
      return dbData.problems.length < lenBefore;
    }
    const result = await problems.deleteOne({ id: problemId, userId });
    return result.deletedCount > 0;
  },

  async addReview(userId, problemId, confidence, timeSpent) {
    await initialize();
    const timeSpentNum = timeSpent !== undefined ? Number(timeSpent) : 0;
    if (isFallback) {
      const dbData = readJsonDb();
      const idx = dbData.problems.findIndex(p => p.id === problemId && p.userId === userId);
      if (idx === -1) return null;

      const existing = dbData.problems[idx];
      const pattern = existing.revisionPattern || DEFAULT_REVISION_PATTERN;
      const today = todayStr();
      const prevStage = existing.revisionStage || 0;
      const nextStage = Math.min(pattern.length, prevStage + 1);
      const reviewHistory = Array.isArray(existing.reviewHistory) ? existing.reviewHistory : [];
      reviewHistory.push({ date: today, confidence, timeSpent: timeSpentNum, stage: prevStage });

      dbData.problems[idx] = {
        ...existing,
        revisionStage: nextStage,
        mastered: nextStage >= pattern.length,
        nextReview: computeNextReviewDate(existing.createdAt, nextStage, pattern),
        reviewHistory,
      };
      writeJsonDb(dbData);
      return rowToProblem(dbData.problems[idx]);
    }

    const existing = await problems.findOne({ id: problemId, userId });
    if (!existing) return null;

    const pattern = existing.revisionPattern || DEFAULT_REVISION_PATTERN;
    const today = todayStr();
    const prevStage = existing.revisionStage || 0;
    const nextStage = Math.min(pattern.length, prevStage + 1);
    const reviewHistory = Array.isArray(existing.reviewHistory) ? existing.reviewHistory : [];
    reviewHistory.push({ date: today, confidence, timeSpent: timeSpentNum, stage: prevStage });

    await problems.updateOne(
      { id: problemId, userId },
      {
        $set: {
          revisionStage: nextStage,
          mastered: nextStage >= pattern.length,
          nextReview: computeNextReviewDate(existing.createdAt, nextStage, pattern),
          reviewHistory,
        },
      }
    );

    return rowToProblem(await problems.findOne({ id: problemId, userId }));
  },

  async getFocusSessions(userId) {
    await initialize();
    if (isFallback) {
      const data = readJsonDb();
      const sessions = data.focusSessions || [];
      return sessions
        .filter(s => s.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return focusSessions.find({ userId }).sort({ createdAt: -1 }).toArray();
  },

  async createFocusSession(userId, date, minutes) {
    await initialize();
    const newSession = {
      id: 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId,
      date,
      minutes: Number(minutes),
      createdAt: new Date().toISOString(),
    };

    if (isFallback) {
      const dbData = readJsonDb();
      if (!dbData.focusSessions) {
        dbData.focusSessions = [];
      }
      dbData.focusSessions.unshift(newSession);
      writeJsonDb(dbData);
      return newSession;
    }

    await focusSessions.insertOne(newSession);
    return newSession;
  },
};
