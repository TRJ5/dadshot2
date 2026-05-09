// All scoring & relegation logic in one place

const DAY = 86400000;

// ── Individual stats from a user's posts ────────────────────────────────────
export function userStats(userPosts) {
  const sorted = [...userPosts].sort((a, b) => a.ts - b.ts);
  const totalPoints = sorted.reduce((sum, p) => sum + (p.points || 2), 0);
  const totalPosts = sorted.length;

  // Current streak: count back from latest post, days where each post was within 48h of next
  let streak = 0;
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    const sinceLast = Date.now() - last.ts;
    if (sinceLast <= 2 * DAY) {
      streak = 1;
      for (let i = sorted.length - 1; i > 0; i--) {
        const gap = sorted[i].ts - sorted[i - 1].ts;
        if (gap <= 2 * DAY) streak++;
        else break;
      }
    }
  }

  // Posts in last 7 days
  const cutoff = Date.now() - 7 * DAY;
  const last7 = sorted.filter(p => p.ts > cutoff).length;

  // Days since last post
  const lastPost = sorted[sorted.length - 1];
  const daysSinceLast = lastPost ? (Date.now() - lastPost.ts) / DAY : Infinity;

  // Relegated if 3+ days since last post
  // Escape: 5 posts in last 7 days
  const isRelegated = daysSinceLast >= 3;
  const escapingRelegation = isRelegated && last7 >= 5;

  return { totalPoints, totalPosts, streak, last7, daysSinceLast, isRelegated, escapingRelegation };
}

// ── Group points: aggregate over all days the group has existed ─────────────
export function groupStats(memberIds, allPosts, groupCreatedAt) {
  const startDay = Math.floor(groupCreatedAt / DAY);
  const todayDay = Math.floor(Date.now() / DAY);

  let totalGroupPoints = 0;
  let perfectDays = 0; // 100% participation
  let halfDays = 0; // 50%+ participation

  for (let d = startDay; d <= todayDay; d++) {
    const dayStart = d * DAY;
    const dayEnd = dayStart + DAY;
    const postersToday = new Set(
      allPosts
        .filter(p => p.ts >= dayStart && p.ts < dayEnd && memberIds.includes(p.userId))
        .map(p => p.userId)
    );
    const ratio = memberIds.length > 0 ? postersToday.size / memberIds.length : 0;
    if (ratio >= 1) { totalGroupPoints += 2; perfectDays++; }
    else if (ratio >= 0.5) { totalGroupPoints += 1; halfDays++; }
  }

  // Apply relegation penalties: -5 for each currently-relegated member
  const relegatedCount = memberIds.filter(id => {
    const userPosts = allPosts.filter(p => p.userId === id);
    return userStats(userPosts).isRelegated;
  }).length;

  const penalties = relegatedCount * 5;
  const finalScore = totalGroupPoints - penalties;

  return { totalGroupPoints, finalScore, perfectDays, halfDays, relegatedCount, penalties };
}

// ── Calculate points for a new post ─────────────────────────────────────────
export function calcPostPoints(userPosts) {
  if (userPosts.length === 0) return 2; // first ever post = 2
  const sorted = [...userPosts].sort((a, b) => b.ts - a.ts);
  const last = sorted[0];
  const sinceLast = Date.now() - last.ts;
  if (sinceLast <= DAY) return 2; // on time
  if (sinceLast <= 2 * DAY) return 1; // late
  return 2; // missed window entirely, but still rewarded for posting
}

// ── Time helpers ────────────────────────────────────────────────────────────
export function msUntilNextPost(userPosts) {
  if (userPosts.length === 0) return 0;
  const sorted = [...userPosts].sort((a, b) => b.ts - a.ts);
  return Math.max(0, sorted[0].ts + DAY - Date.now());
}

export function fmtCountdown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Generate join code: 6 chars, no ambiguous characters
export function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Match scoring: points per day average over the match window ─────────────
export function matchScore(memberIds, allPosts, matchStartTs, matchEndTs) {
  const startDay = Math.floor(matchStartTs / DAY);
  const endDay = Math.floor(Math.min(matchEndTs, Date.now()) / DAY);
  const totalDays = Math.max(1, endDay - startDay + 1);

  let totalPoints = 0;
  for (let d = startDay; d <= endDay; d++) {
    const dayStart = d * DAY;
    const dayEnd = dayStart + DAY;
    const posters = new Set(
      allPosts
        .filter(p => p.ts >= dayStart && p.ts < dayEnd && memberIds.includes(p.userId))
        .map(p => p.userId)
    );
    const ratio = memberIds.length > 0 ? posters.size / memberIds.length : 0;
    if (ratio >= 1) totalPoints += 2;
    else if (ratio >= 0.5) totalPoints += 1;
  }

  // Subtract relegation penalties
  const relegatedCount = memberIds.filter(id => {
    const userPosts = allPosts.filter(p => p.userId === id && p.ts >= matchStartTs && p.ts <= matchEndTs);
    return userStats(userPosts).isRelegated;
  }).length;

  const penalties = relegatedCount * 5;
  const rawScore = totalPoints - penalties;
  const avgPerDay = totalDays > 0 ? rawScore / totalDays : 0;

  return {
    totalPoints,
    penalties,
    rawScore,
    avgPerDay: Math.round(avgPerDay * 100) / 100,
    totalDays,
    isComplete: Date.now() >= matchEndTs,
  };
}
