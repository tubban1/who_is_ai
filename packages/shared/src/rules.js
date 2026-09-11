export const MAX_ROUNDS = 5;
export const GUESS = Object.freeze({ HUMAN: 'human', AI: 'ai', NOT_SURE: 'not_sure' });

export function scoreGuess(guess, targetType) {
  if (guess === GUESS.NOT_SURE) return 0;
  return guess === targetType ? 1 : -1;
}

export function canSendRound(conversation) {
  return !conversation.revealed && conversation.roundsUsed < MAX_ROUNDS;
}

export function sanitizeTarget(target) {
  return {
    id: target.id,
    displayName: target.displayName,
    x: target.x,
    z: target.z,
    rotation: target.rotation ?? 0,
    status: target.status ?? 'available'
  };
}

export function makeLocalizedMessage({ originalText, sourceLanguage, translatedText, targetLanguage, senderId, at = Date.now() }) {
  return { originalText, sourceLanguage, translatedText, targetLanguage, senderId, at };
}

export function sortLeaderboard(rows) {
  return [...rows].sort((a, b) =>
    (b.score - a.score) ||
    (b.decisionRate - a.decisionRate) ||
    (b.correct - a.correct) ||
    a.displayName.localeCompare(b.displayName)
  );
}
