// utils/testScoring.js
export function calculateTestScore(testContent, responses) {
  try {
    let totalScore = 0;
    let totalPossiblePoints = 0;

    console.log('Calculating score for responses:', responses);
    console.log('Test content:', testContent);

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
        const responseKey = `${parseInt(sectionNum)-1}-${parseInt(questionNum)-1}`; // Adjust index to 0-based
        const studentAnswer = responses[responseKey];
        
        const correctAnswer = question[7];
        const pointsValue = parseInt(question[8]) || 1;
        
        console.log(`Checking question ${responseKey}:`, {
          studentAnswer,
          correctAnswer,
          pointsValue
        });

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
            console.log(`Correct answer for ${responseKey}! +${pointsValue} points`);
          }
        }
      });
    });

    const result = {
      score: totalScore,
      totalPoints: totalPossiblePoints,
      percentage: Math.round((totalScore / totalPossiblePoints) * 100)
    };

    console.log('Final score calculation:', result);
    return result;

  } catch (error) {
    console.error('Error calculating test score:', error);
    throw new Error(`Failed to calculate test score: ${error.message}`);
  }
}