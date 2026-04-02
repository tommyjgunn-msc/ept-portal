// utils/testScoring.js — Server-side only test scoring
export function calculateTestScore(testContent, responses) {
  let totalScore = 0;
  let totalPossiblePoints = 0;

  const questionsBySection = testContent.reduce((acc, question) => {
    const sectionNum = question[1];
    if (!acc[sectionNum]) {
      acc[sectionNum] = [];
    }
    acc[sectionNum].push(question);
    return acc;
  }, {});

  Object.entries(questionsBySection).forEach(([sectionNum, questions]) => {
    questions.forEach(question => {
      const questionNum = question[4];
      const responseKey = `${parseInt(sectionNum) - 1}-${parseInt(questionNum) - 1}`;
      const studentAnswer = responses[responseKey];

      const correctAnswer = question[7];
      const pointsValue = parseInt(question[8]) || 1;

      totalPossiblePoints += pointsValue;

      if (studentAnswer && correctAnswer) {
        let isCorrect = false;

        if (Array.isArray(correctAnswer)) {
          isCorrect = correctAnswer.some(answer =>
            answer.toString().trim().toLowerCase() === studentAnswer.toString().trim().toLowerCase()
          );
        } else {
          isCorrect = correctAnswer.toString().trim().toLowerCase() ===
                     studentAnswer.toString().trim().toLowerCase();
        }

        if (isCorrect) {
          totalScore += pointsValue;
        }
      }
    });
  });

  return {
    score: totalScore,
    totalPoints: totalPossiblePoints,
    percentage: totalPossiblePoints > 0 ? Math.round((totalScore / totalPossiblePoints) * 100) : 0,
  };
}
