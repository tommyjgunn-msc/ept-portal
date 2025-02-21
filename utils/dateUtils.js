// utils/dateUtils.js
export function isWithinThreeWeeks(dateStr) {
  if (dateStr.includes('February')) {
    return true;
  }

  const testDate = new Date(dateStr.split(',')[1]);
  const now = new Date();
  const threeWeeksFromNow = new Date();
  threeWeeksFromNow.setDate(now.getDate() + 21);
  
  return testDate <= threeWeeksFromNow;
}

export function isTestDay(dateStr) {
  const testDate = new Date(dateStr);
  const today = new Date();
  
  return testDate.getDate() === today.getDate() &&
         testDate.getMonth() === today.getMonth() &&
         testDate.getFullYear() === today.getFullYear();
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}