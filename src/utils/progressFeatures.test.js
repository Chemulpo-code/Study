import { describe, expect, test } from 'vitest';
import { filterCards, getAchievementIds, getDailyPlan, getLocalDateKey } from './progressFeatures';

describe('progress features', () => {
  test('uses the learner timezone for the daily plan date', () => {
    expect(getLocalDateKey(new Date('2026-09-10T15:30:00Z'), 'Asia/Vladivostok')).toBe('2026-09-11');
  });

  test('marks the daily plan complete after ten answers and one trainer', () => {
    expect(getDailyPlan({ cardsAnswered: 10, trainerCompleted: true })).toMatchObject({ complete: true, cardsRemaining: 0 });
    expect(getDailyPlan({ cardsAnswered: 9, trainerCompleted: true }).complete).toBe(false);
  });

  test('returns each achievement only once', () => {
    const ids = getAchievementIds({ cardsAnswered: 1, streak: 7, learnedCards: 100, dailyComplete: true, travelComplete: true, unlocked: ['first-card'] });
    expect(ids).toEqual(['streak-7', 'learned-100', 'daily-plan', 'travel-ready']);
  });

  test('filters cards by text, learned status and favorite flag', () => {
    const results = filterCards([
      { id: '1', characters: '咖啡', pinyin: 'kāfēi', translation: 'кофе', status: 'know', moduleId: 'food', favorite: true },
      { id: '2', characters: '酒店', pinyin: 'jiǔdiàn', translation: 'отель', status: 'new', moduleId: 'travel', favorite: false }
    ], { query: 'коф', status: 'know', favoriteOnly: true });

    expect(results.map(card => card.id)).toEqual(['1']);
  });
});
