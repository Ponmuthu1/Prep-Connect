// src/pages/QuizPage.js
import React, { useState } from 'react';
import NavBar from '../NavBar/NavBar';

function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [category, setCategory] = useState('JavaScript');
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = () => {
    fetch(`http://localhost:5000/api/questions?category=${category}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          const shuffled = data.questions.sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, 10));
          setQuizStarted(true);
        }
      });
  };

  const handleOptionChange = (questionId, option) => {
    setUserAnswers({ ...userAnswers, [questionId]: option });
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      if (userAnswers[q._id] === q.answer) {
        correct += 1;
      }
    });
    setScore(correct);
  };

  return (
    <><NavBar />
    <div className="quiz-page">
      {!quizStarted ? (
        <>
          <h2>Select a Category to Start the Quiz</h2>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="JavaScript">JavaScript</option>
            <option value="C">C</option>
          </select>
          <button onClick={startQuiz}>Start Quiz</button>
        </>
      ) : score === null ? (
        <>
          {questions.map((q, index) => (
            <div key={q._id}>
              <h4>{index + 1}. {q.question}</h4>
              {q.options.map((option, idx) => (
                <div key={idx}>
                  <input
                    type="radio"
                    name={`question-${q._id}`}
                    value={option}
                    onChange={() => handleOptionChange(q._id, option)}
                  />
                  {option}
                </div>
              ))}
            </div>
          ))}
          <button onClick={handleSubmit}>Submit Quiz</button>
        </>
      ) : (
        <h2>Your score: {score} / {questions.length}</h2>
      )}
    </div>
    </>
  );
}

export default QuizPage;