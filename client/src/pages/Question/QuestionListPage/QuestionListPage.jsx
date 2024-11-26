import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../NavBar/NavBar";
import "./QuestionListPage.css";

function QuestionListPage() {
  const [questions, setQuestions] = useState([]);
  const [category, setCategory] = useState("JavaScript");
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/questions?category=${category}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setQuestions(data.questions);
        }
      });
  }, [category]);

  return (
    <>
      <NavBar />
      <div className="question-list-page">
        <h2>Questions</h2>
        <div>
          <label>Select Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="JavaScript">JavaScript</option>
            <option value="C">C</option>
          </select>
        </div>
        {isLoggedIn && (
          <button onClick={() => navigate("/add-question")}>
            Add New Question
          </button>
        )}
        <div className="question-list-container">
          <ul>
            {questions.map((question) => (
              <li key={question._id}>
                <Link to={`/question/${question._id}`}>
                  {question.question}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default QuestionListPage;
