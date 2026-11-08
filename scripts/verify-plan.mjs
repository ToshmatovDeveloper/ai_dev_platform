export function verifyPlan(parts, full) {
  if (full) {
    return { docs: true, dotnet: true, web: true };
  }

  const hasDotnetChanges = Boolean(
    parts && (parts.api || parts.modules || parts.shared || parts.tests),
  );

  return {
    docs: true,
    dotnet: hasDotnetChanges,
    web: Boolean(parts && parts.web),
  };
}
