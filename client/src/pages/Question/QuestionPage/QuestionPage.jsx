import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../../NavBar/NavBar";
import "./QuestionPage.css";

function QuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUserId(decoded.id);
    }
  }, [token]);

  useEffect(() => {
    // Fetch question details
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/questions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setQuestionData(data.question);
        }
      })
      .catch((err) => console.error("Error fetching question:", err));

    // Fetch comments
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setComments(data.comments);
        }
      })
      .catch((err) => console.error("Error fetching comments:", err));
  }, [id]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-token": token },
      body: JSON.stringify({ questionId: id, comment: newComment }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          setComments([
            ...comments,
            {
              comment: newComment,
              username: decoded.name,
              timestamp: new Date().toISOString(),
            },
          ]);
          setNewComment("");
        }
      })
      .catch((err) => console.error("Error adding comment:", err));
  };

  const handleDeleteQuestion = () => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/questions/${id}`, {
        method: "DELETE",
        headers: { "x-access-token": token },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "ok") {
            alert("Question deleted successfully");
            navigate("/questions");
          } else {
            alert(data.error || "Error deleting question");
          }
        })
        .catch((err) => console.error("Error deleting question:", err));
    }
  };

  const handleExplain = async () => {
    if (!questionData?.question || !questionData?.options) {
      alert("Question data is missing.");
      return;
    }

    setLoadingExplanation(true);
    setExplanation(""); // Clear previous explanation while loading

    try {
      // Construct the combined prompt with question and options
      const combinedPrompt = `
You are an AI that explains answers to questions in detail.
Explain why the answer '${questionData.answer}' is correct for the question: '${
        questionData.question
      }'.
Options: ${questionData.options.join(", ")}
      `.trim();

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/explain/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
          body: JSON.stringify({ prompt: combinedPrompt }), // Send the combined prompt
        }
      );

      const data = await response.json();

      if (data.status === "ok") {
        setExplanation(data.explanation);
      } else {
        console.error("Error fetching explanation:", data.error);
        alert("Failed to retrieve the explanation. Please try again.");
      }
    } catch (error) {
      console.error("Error explaining question:", error);
      alert("An unexpected error occurred while fetching the explanation.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="question-page">
        {questionData && (
          <>
            <h2>{questionData.question}</h2>
            {showAnswer ? (
              <>
                <p>{questionData.answer}</p>
                <button
                  className="invisible"
                  onClick={handleExplain}
                  disabled={loadingExplanation}
                >
                  Explain with AI
                </button>
                {loadingExplanation && <p>Loading explanation...</p>}
                {explanation && (
                  <div>
                    <h3>Explanation:</h3>
                    <p>{explanation}</p>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setShowAnswer(true)}>Show Answer</button>
            )}
            {userId === questionData.createdBy && (
              <button onClick={handleDeleteQuestion}>Delete Question</button>
            )}
            <h3>Comments</h3>
            <div className="comments-section">
              <div className="comments-container">
                {comments.map((comment, index) => (
                  <div key={index} className="comment">
                    <strong>{comment.username}</strong>
                    <p>{comment.comment}</p>
                    <small>
                      {new Date(comment.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))}
              </div>
              <div className="form-wrapper">
                {token ? (
                  <>
                    <label htmlFor="new-comment">Add a Comment:</label>
                    <textarea
                      id="new-comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment here..."
                    ></textarea>
                    <button onClick={handleAddComment}>Submit</button>
                  </>
                ) : (
                  <p>
                    Please <a href="/login">login</a> to add comments.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default QuestionPage;
