export const ACHIEVEMENTS = [
  { id: 'first-card', title: 'Первый шаг', description: 'Ответьте на первую карточку.' },
  { id: 'streak-7', title: 'Неделя в ритме', description: 'Занимайтесь 7 дней подряд.' },
  { id: 'learned-100', title: 'Сто слов', description: 'Освойте 100 карточек.' },
  { id: 'daily-plan', title: 'План выполнен', description: 'Закройте план дня.' },
  { id: 'travel-ready', title: 'Готов к поездке', description: 'Пройдите любой сценарий поездки.' }
];

export function getDateKey(timeZone = 'UTC', date = new Date()) {
  const values = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${values.year}-${values.month}-${values.day}`;
}

export function getTimeKey(timeZone = 'UTC', date = new Date()) {
  const values = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${values.hour}:${values.minute}`;
}

export function getPlanSummary(plan = {}) {
  const cardsAnswered = Math.min(10, Math.max(0, plan.cardsAnswered || 0));
  const trainerCompleted = Boolean(plan.trainerCompleted);
  return { cardsAnswered, cardsRemaining: Math.max(0, 10 - cardsAnswered), trainerCompleted, complete: cardsAnswered >= 10 && trainerCompleted };
}
