export function isWithinThreeWeeks(dateStr) {
  const currentYear = new Date().getFullYear();
  const [dayOfWeek, restOfDate] = dateStr.split(', ');
  const [day, month] = restOfDate.split(' ');
  const testDate = new Date(`${month} ${day}, ${currentYear}`);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const threeWeeksFromNow = new Date();
  threeWeeksFromNow.setDate(now.getDate() + 21);
  threeWeeksFromNow.setHours(23, 59, 59, 999);
  
  return testDate >= now && testDate <= threeWeeksFromNow;
}

export function isFutureDate(dateStr) {
  const currentYear = new Date().getFullYear();
  
  const [dayOfWeek, restOfDate] = dateStr.split(', ');
  const [day, month] = restOfDate.split(' ');
  
  const testDate = new Date(`${month} ${day}, ${currentYear}`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return testDate >= now;
}