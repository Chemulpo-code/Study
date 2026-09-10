export function selectContinueModule(modules, lastModuleId) {
  const available = modules.filter((module) => module.totalCards > 0 && module.id !== 'error-box');
  return available.find((module) => module.id === lastModuleId) || available[0] || null;
}
