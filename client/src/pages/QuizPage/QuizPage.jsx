// src/pages/QuizPage.js
import React, { useState } from "react";
import NavBar from "../NavBar/NavBar";
import "./QuizPage.css";

function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [category, setCategory] = useState("JavaScript");
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = () => {
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/questions?category=${category}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
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
    questions.forEach((q) => {
      if (userAnswers[q._id] === q.answer) {
        correct += 1;
      }
    });
    setScore(correct);
  };

  return (
    <>
      <NavBar />
      {!quizStarted ? (
        <div className="quiz-selection">
          <h2 className="quiz-selection-title">
            Select a Category to Start the Quiz
          </h2>
          <select
            className="quiz-selection-dropdown"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="JavaScript">JavaScript</option>
            <option value="C">C</option>
          </select>
          <button className="quiz-selection-button" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      ) : score === null ? (
        <div className="quiz">
          <div className="quiz-questions">
            {questions.map((q, index) => (
              <div key={q._id} className="quiz-question">
                <h4 className="quiz-question-title">
                  {index + 1}. {q.question}
                </h4>
                {q.options.map((option, idx) => (
                  <div key={idx} className="quiz-option">
                    <input
                      type="radio"
                      className="quiz-option-radio"
                      name={`question-${q._id}`}
                      value={option}
                      onChange={() => handleOptionChange(q._id, option)}
                    />
                    <label className="quiz-option-label">{option}</label>
                  </div>
                ))}
              </div>
            ))}
            <button className="quiz-submit-button" onClick={handleSubmit}>
              Submit Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="quiz-score">
          <h2 className="quiz-score-title">
            Your score: {score} / {questions.length}
          </h2>
        </div>
      )}
    </>
  );
}

export default QuizPage;
