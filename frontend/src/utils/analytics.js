/**
 * Study Buddy Performance Analytics Utilities
 * Contains pure functions to aggregate, calculate, and format study metrics.
 */

// Helper to get today's date string (YYYY-MM-DD) in local time
export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Helper to add or subtract days from a YYYY-MM-DD date string
export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Helper to determine if a date is in the current week (Monday to Sunday)
export function isThisWeek(dateStr) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return date >= startOfWeek && date < endOfWeek;
  } catch {
    return false;
  }
}

// Helper to determine if a date was in the last week (previous Monday to Sunday)
export function isLastWeek(dateStr) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    return date >= startOfLastWeek && date < startOfWeek;
  } catch {
    return false;
  }
}

// Helper to format YYYY-MM-DD into a more readable chart date label (e.g. "Jul 20")
export function formatChartDate(dateStr) {
  try {
    const [, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  } catch {
    return dateStr;
  }
}

// Helper to check if a date is within the last N days (inclusive of today)
export function isWithinLastNDays(dateStr, n) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - (n - 1));
    
    return date >= cutoff && date <= today;
  } catch {
    return false;
  }
}

// Helper to check if a date is within a specific range of days ago (e.g., 7 to 13 days ago)
export function isWithinDaysAgoRange(dateStr, startDaysAgo, endDaysAgo) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startCutoff = new Date(today);
    startCutoff.setDate(today.getDate() - endDaysAgo);
    
    const endCutoff = new Date(today);
    endCutoff.setDate(today.getDate() - startDaysAgo);
    
    return date >= startCutoff && date <= endCutoff;
  } catch {
    return false;
  }
}

/**
 * 1. Confidence Trend over time (grouped by day)
 * Calculates the average confidence score for each day that has logged reviews.
 * Returns an array sorted by date.
 */
export function calculateTrendData(problems) {
  const reviews = [];
  problems.forEach(p => {
    (p.reviewHistory || []).forEach(r => {
      if (r.date) {
        reviews.push({ date: r.date, confidence: r.confidence });
      }
    });
  });

  if (reviews.length === 0) return { trendData: [], hasEnoughData: false };

  // Group confidence ratings by date
  const grouped = {};
  reviews.forEach(r => {
    if (!grouped[r.date]) {
      grouped[r.date] = { sum: 0, count: 0 };
    }
    grouped[r.date].sum += r.confidence;
    grouped[r.date].count += 1;
  });

  const trendData = Object.entries(grouped)
    .map(([date, val]) => ({
      date,
      formattedDate: formatChartDate(date),
      avgConfidence: parseFloat((val.sum / val.count).toFixed(2))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // A trend requires at least 2 distinct days to form a line chart
  return {
    trendData,
    hasEnoughData: trendData.length >= 2
  };
}

/**
 * 2. Weakest Patterns / Topics
 * Groups problems by topic, calculates their current average confidence (latest rating),
 * sorts ascending, and returns the top 5 weakest topics with their attempt counts.
 */
export function calculateWeakestPatterns(problems) {
  if (!problems || problems.length === 0) return [];
  
  const patternMap = {};
  problems.forEach(p => {
    const pattern = p.pattern || 'Other';
    // Get the most recent review confidence, or default to 5 if none exists
    const lastReview = p.reviewHistory && p.reviewHistory.length > 0
      ? p.reviewHistory[p.reviewHistory.length - 1].confidence
      : 5;
      
    if (!patternMap[pattern]) {
      patternMap[pattern] = { sum: 0, count: 0 };
    }
    patternMap[pattern].sum += lastReview;
    patternMap[pattern].count += 1;
  });

  return Object.entries(patternMap)
    .map(([pattern, val]) => ({
      pattern,
      avgConfidence: parseFloat((val.sum / val.count).toFixed(2)),
      count: val.count // number of problems attempted in this topic
    }))
    .sort((a, b) => a.avgConfidence - b.avgConfidence) // Ascending order (lowest confidence first)
    .slice(0, 5); // Bottom 5
}

/**
 * 3. Weekly Hours Tracking
 * Sums actual study hours for the current week:
 * - Focus Timer session minutes
 * - Time spent on initial problem solves (if tracked)
 * - Time spent on problem revisions (if tracked)
 */
export function calculateWeeklyHours(problems, focusSessions) {
  let totalMinutes = 0;

  // 1. Sum minutes from Focus Timer sessions this week
  if (Array.isArray(focusSessions)) {
    focusSessions.forEach(s => {
      if (s.date && isThisWeek(s.date)) {
        totalMinutes += Number(s.minutes) || 0;
      }
    });
  }

  // 2. Sum minutes spent on problem solves and revisions this week
  problems.forEach(p => {
    // Initial solves
    if (p.createdAt && isThisWeek(p.createdAt)) {
      totalMinutes += Number(p.timeSpent) || 0;
    }
    // Revisions (skip index 0 as it corresponds to the initial solve log)
    if (Array.isArray(p.reviewHistory)) {
      p.reviewHistory.forEach((r, idx) => {
        if (idx > 0 && r.date && isThisWeek(r.date)) {
          totalMinutes += Number(r.timeSpent) || 0;
        }
      });
    }
  });

  return parseFloat((totalMinutes / 60).toFixed(1));
}

/**
 * 4. Streak Tracker
 * Calculates consecutive days studied based on problem logs, reviews, and focus sessions.
 */
export function calculateStreak(problems, focusSessions) {
  const dates = new Set();
  
  // Add problem log & review dates
  problems.forEach(p => {
    if (p.createdAt) dates.add(p.createdAt);
    (p.reviewHistory || []).forEach(r => {
      if (r.date) dates.add(r.date);
    });
  });

  // Add focus session dates
  if (Array.isArray(focusSessions)) {
    focusSessions.forEach(s => {
      if (s.date) dates.add(s.date);
    });
  }

  const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
  const today = getTodayStr();
  const yesterday = addDays(today, -1);

  if (sortedDates.length === 0) return { count: 0, lastActive: null };

  const mostRecent = sortedDates[0];
  // If user hasn't studied today or yesterday, the streak is broken (0)
  if (mostRecent !== today && mostRecent !== yesterday) {
    return { count: 0, lastActive: mostRecent };
  }

  let count = 0;
  let checkDate = mostRecent;

  // Count backwards day-by-day
  while (dates.has(checkDate)) {
    count++;
    checkDate = addDays(checkDate, -1);
  }

  return { count, lastActive: mostRecent };
}

/**
 * 5. Additional Stats & Comparison Metrics
 */
export function calculateAdditionalStats(problems) {
  const today = getTodayStr();
  
  // A. Problems solved this week vs last week
  let solvedThisWeek = 0;
  let solvedLastWeek = 0;
  problems.forEach(p => {
    if (p.createdAt) {
      if (isThisWeek(p.createdAt)) solvedThisWeek++;
      else if (isLastWeek(p.createdAt)) solvedLastWeek++;
    }
  });

  // B. Confidence improvement rate: % change in avg confidence over last 7 vs previous 7 days
  const last7Confidence = [];
  const prev7Confidence = [];
  problems.forEach(p => {
    (p.reviewHistory || []).forEach(r => {
      if (r.date) {
        if (isWithinLastNDays(r.date, 7)) {
          last7Confidence.push(r.confidence);
        } else if (isWithinDaysAgoRange(r.date, 7, 13)) {
          prev7Confidence.push(r.confidence);
        }
      }
    });
  });

  let improvementRate = null;
  if (last7Confidence.length > 0 && prev7Confidence.length > 0) {
    const avgLast7 = last7Confidence.reduce((acc, c) => acc + c, 0) / last7Confidence.length;
    const avgPrev7 = prev7Confidence.reduce((acc, c) => acc + c, 0) / prev7Confidence.length;
    improvementRate = parseFloat((((avgLast7 - avgPrev7) / avgPrev7) * 100).toFixed(1));
  }

  // C. Most Improved Topic
  // We check the topic with the largest positive shift: (topic's latest avg confidence) - (topic's initial avg confidence)
  const topicRatings = {};
  problems.forEach(p => {
    const pattern = p.pattern || 'Other';
    if (p.reviewHistory && p.reviewHistory.length > 0) {
      const first = p.reviewHistory[0].confidence;
      const latest = p.reviewHistory[p.reviewHistory.length - 1].confidence;
      
      if (!topicRatings[pattern]) {
        topicRatings[pattern] = { firstSum: 0, latestSum: 0, count: 0 };
      }
      topicRatings[pattern].firstSum += first;
      topicRatings[pattern].latestSum += latest;
      topicRatings[pattern].count += 1;
    }
  });

  let mostImprovedTopic = 'None';
  let maxImprovement = -Infinity;
  Object.entries(topicRatings).forEach(([topic, val]) => {
    const avgFirst = val.firstSum / val.count;
    const avgLatest = val.latestSum / val.count;
    const diff = avgLatest - avgFirst;
    // Must show positive improvement to qualify
    if (diff > 0 && diff > maxImprovement) {
      maxImprovement = diff;
      mostImprovedTopic = topic;
    }
  });
  if (maxImprovement <= 0) {
    mostImprovedTopic = 'None';
  }

  // D. Most Neglected Topic
  // Find the topic that hasn't had any activity (solve or review) for the longest time
  const topicLastActivity = {};
  
  // Initialize with all unique patterns present in problems
  problems.forEach(p => {
    const pattern = p.pattern || 'Other';
    topicLastActivity[pattern] = null;
  });

  problems.forEach(p => {
    const pattern = p.pattern || 'Other';
    const dates = [p.createdAt];
    (p.reviewHistory || []).forEach(r => {
      if (r.date) {
        dates.push(r.date);
      }
    });
    
    dates.forEach(dStr => {
      if (dStr) {
        if (!topicLastActivity[pattern] || dStr > topicLastActivity[pattern]) {
          topicLastActivity[pattern] = dStr;
        }
      }
    });
  });

  let mostNeglectedTopic = 'None';
  let daysSinceNeglected = -1;
  const todayDate = new Date(today + 'T00:00:00');

  Object.entries(topicLastActivity).forEach(([topic, lastDate]) => {
    if (lastDate) {
      const last = new Date(lastDate + 'T00:00:00');
      const diffDays = Math.round((todayDate - last) / 86400000);
      if (diffDays > daysSinceNeglected) {
        daysSinceNeglected = diffDays;
        mostNeglectedTopic = topic;
      }
    } else {
      // If a topic exists but has absolutely no valid activity date, it is highly neglected
      if (daysSinceNeglected < Infinity) {
        daysSinceNeglected = Infinity;
        mostNeglectedTopic = topic;
      }
    }
  });

  return {
    solvedThisWeek,
    solvedLastWeek,
    improvementRate,
    mostImprovedTopic,
    mostNeglectedTopic,
    daysSinceNeglected
  };
}

/**
 * 6. Checks if there is any data logged at all
 * Used to determine the overall empty state of the page.
 */
export function hasAnyData(problems, focusSessions) {
  const hasProblems = problems && problems.length > 0;
  const hasFocus = focusSessions && focusSessions.length > 0;
  return hasProblems || hasFocus;
}
