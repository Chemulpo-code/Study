export const DAILY_CARD_GOAL = 10;

export function getLocalDateKey(date = new Date(), timeZone = 'UTC') {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date)
    .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {}).year
    ? new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
    : date.toISOString().slice(0, 10);
}

export function getDailyPlan(plan = {}) {
  const cardsAnswered = Math.max(0, Number(plan.cardsAnswered) || 0);
  const trainerCompleted = Boolean(plan.trainerCompleted);
  const cardsRemaining = Math.max(0, DAILY_CARD_GOAL - cardsAnswered);

  return { cardsAnswered, trainerCompleted, cardsRemaining, complete: cardsRemaining === 0 && trainerCompleted };
}

export function getAchievementIds({ cardsAnswered = 0, streak = 0, learnedCards = 0, dailyComplete = false, travelComplete = false, unlocked = [] }) {
  const existing = new Set(unlocked);
  const candidates = [
    cardsAnswered > 0 && 'first-card',
    streak >= 7 && 'streak-7',
    learnedCards >= 100 && 'learned-100',
    dailyComplete && 'daily-plan',
    travelComplete && 'travel-ready'
  ].filter(Boolean);

  return candidates.filter(id => !existing.has(id));
}

export function filterCards(cards = [], { query = '', moduleId = '', status = '', favoriteOnly = false } = {}) {
  const search = query.trim().toLowerCase();
  return cards.filter((card) => {
    const haystack = `${card.characters || ''} ${card.pinyin || ''} ${card.translation || ''}`.toLowerCase();
    return (!search || haystack.includes(search))
      && (!moduleId || card.moduleId === moduleId)
      && (!status || card.status === status)
      && (!favoriteOnly || card.favorite);
  });
}
