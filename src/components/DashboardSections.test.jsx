import { selectContinueModule } from '../utils/dashboard';

test('selectContinueModule prefers the last non-empty module', () => {
  const modules = [
    { id: 'first', totalCards: 4 },
    { id: 'last', totalCards: 8 }
  ];

  expect(selectContinueModule(modules, 'last')).toEqual(modules[1]);
});

test('selectContinueModule falls back to the first non-empty regular module', () => {
  const modules = [
    { id: 'error-box', isVirtual: true, totalCards: 3 },
    { id: 'empty', totalCards: 0 },
    { id: 'ready', totalCards: 6 }
  ];

  expect(selectContinueModule(modules, 'missing')).toEqual(modules[2]);
});

test('selectContinueModule returns null when no module can be studied', () => {
  expect(selectContinueModule([{ id: 'empty', totalCards: 0 }], null)).toBeNull();
});
