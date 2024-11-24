import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';
import "./QuestionPage.css";

function QuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const token = localStorage.getItem('token');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUserId(decoded.id);
    }
  }, [token]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/questions/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setQuestionData(data.question);
        }
      });

    fetch(`http://localhost:5000/api/comments/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setComments(data.comments);
        }
      });
  }, [id]);

  const handleAddComment = () => {
    fetch('http://localhost:5000/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': token },
      body: JSON.stringify({ questionId: id, comment: newComment }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setComments([...comments, { comment: newComment, username: decoded.name, timestamp: new Date().toISOString() }]);
          setNewComment('');
        }
      });
  };

  const handleDeleteQuestion = () => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      fetch(`http://localhost:5000/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-access-token': token },
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok') {
            alert('Question deleted successfully');
            navigate('/questions');
          } else {
            alert(data.error || 'Error deleting question');
          }
        });
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
              <p>{questionData.answer}</p>
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
                    <small>{new Date(comment.timestamp).toLocaleString()}</small>
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
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write your comment here..."
                    ></textarea>
                    <button onClick={handleAddComment}>Submit</button>
                  </>
                ) : (
                  <p>Please <a href="/login">login</a> to add comments.</p>
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
