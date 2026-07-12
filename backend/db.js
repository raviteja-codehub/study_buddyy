const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studybuddy';
const client = new MongoClient(MONGODB_URI);

let db;
let users;
let problems;

async function initialize() {
  if (db) return;
  await client.connect();
  db = client.db();
  users = db.collection('users');
  problems = db.collection('problems');

  await users.createIndex({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
  await problems.createIndex({ userId: 1 });
  await problems.createIndex({ id: 1 }, { unique: true });
}

function computeNextInterval(confidence, prevInterval) {
  const CONF_BASE = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  const base = CONF_BASE[confidence] || 1;
  if (!prevInterval) return base;
  const mult = confidence >= 4 ? 1.7 : confidence === 3 ? 1.15 : 0.5;
  return Math.min(90, Math.max(base, Math.round(prevInterval * mult)));
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
  async getUserById(id) {
    await initialize();
    return users.findOne({ id });
  },

  async getUserByUsername(username) {
    await initialize();
    return users.findOne({ username: { $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  },

  async createUser(username, passwordHash, targetCompany = '', hoursGoal = 10) {
    await initialize();
    const newUser = {
      id: 'u_' + Math.random().toString(36).slice(2, 11),
      username,
      passwordHash,
      targetCompany,
      hoursGoal,
      createdAt: new Date().toISOString(),
    };
    await users.insertOne(newUser);
    return newUser;
  },

  async updateUserProfile(userId, updates) {
    await initialize();
    const user = await users.findOne({ id: userId });
    if (!user) return null;

    const targetCompany = updates.targetCompany !== undefined ? updates.targetCompany : user.targetCompany;
    const hoursGoal = updates.hoursGoal !== undefined ? Number(updates.hoursGoal) : user.hoursGoal;

    await users.updateOne(
      { id: userId },
      { $set: { targetCompany, hoursGoal } }
    );

    return users.findOne({ id: userId });
  },

  async getProblems(userId) {
    await initialize();
    const rows = await problems.find({ userId }).sort({ createdAt: -1 }).toArray();
    return rows.map(rowToProblem);
  },

  async createProblem(userId, data) {
    await initialize();
    const now = todayStr();
    const interval = computeNextInterval(data.confidence || 5, null);
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
      interval,
      nextReview: addDays(now, interval),
      reviewHistory: data.confidence ? [{ date: now, confidence: data.confidence }] : [],
    };

    await problems.insertOne(newProblem);
    return rowToProblem(newProblem);
  },

  async updateProblem(userId, problemId, data) {
    await initialize();
    const existing = await problems.findOne({ id: problemId, userId });
    if (!existing) return null;

    const updateBody = {
      title: data.title !== undefined ? data.title : existing.title,
      link: data.link !== undefined ? data.link : existing.link,
      description: data.description !== undefined ? data.description : existing.description,
      pattern: data.pattern !== undefined ? data.pattern : existing.pattern,
      difficulty: data.difficulty !== undefined ? data.difficulty : existing.difficulty,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      mistakes: data.mistakes !== undefined ? data.mistakes : existing.mistakes,
      summary: data.summary !== undefined ? data.summary : existing.summary,
    };

    await problems.updateOne(
      { id: problemId, userId },
      { $set: updateBody }
    );

    return rowToProblem(await problems.findOne({ id: problemId, userId }));
  },

  async deleteProblem(userId, problemId) {
    await initialize();
    const result = await problems.deleteOne({ id: problemId, userId });
    return result.deletedCount > 0;
  },

  async addReview(userId, problemId, confidence) {
    await initialize();
    const existing = await problems.findOne({ id: problemId, userId });
    if (!existing) return null;

    const today = todayStr();
    const nextInterval = computeNextInterval(confidence, existing.interval);
    const reviewHistory = Array.isArray(existing.reviewHistory) ? existing.reviewHistory : [];
    reviewHistory.push({ date: today, confidence });

    await problems.updateOne(
      { id: problemId, userId },
      {
        $set: {
          interval: nextInterval,
          nextReview: addDays(today, nextInterval),
          reviewHistory,
        },
      }
    );

    return rowToProblem(await problems.findOne({ id: problemId, userId }));
  },
};
