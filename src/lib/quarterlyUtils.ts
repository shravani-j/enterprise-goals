export function getActiveQuarterWindow(date = new Date()): "Q1" | "Q2" | "Q3" | "Q4" | null {
  const month = date.getMonth() + 1; // 1-12
  if (month === 7) return "Q1";
  if (month === 10) return "Q2";
  if (month === 1) return "Q3";
  if (month === 3 || month === 4) return "Q4";
  
  // For testing purposes during development, you can uncomment below to simulate an active window:
  // return "Q1";
  
  return null;
}
