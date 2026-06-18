export const FREE_LIMIT = 5;

// CHANGE THIS to your email
const OWNER_EMAIL = "your@email.com";

export function canUseApp(user, usageCount = 0) {
  if (!user) return false;

  // 🧠 OWNER BYPASS (YOU NEVER GET LOCKED OUT)
  if (user.email === OWNER_EMAIL) return true;

  // 🧠 FREE LIMIT CHECK
  return usageCount < FREE_LIMIT;
}
