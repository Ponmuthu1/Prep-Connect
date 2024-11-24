// src/pages/AddQuestionPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';

function AddQuestionPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('JavaScript');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleAddQuestion = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': token },
      body: JSON.stringify({ question, options, answer, category }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          alert('Question added successfully');
          navigate('/questions');
        } else {
          alert(data.error || 'Error adding question');
        }
      });
  };

  return (
    <><NavBar />
    <div className="add-question-page">
      <h2>Add a New Question</h2>
      <form onSubmit={handleAddQuestion}>
        <div>
          <label>Category:</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="JavaScript">JavaScript</option>
            <option value="C">C</option>
          </select>
        </div>
        <div>
          <label>Question:</label>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} required />
        </div>
        <div>
          <label>Options:</label>
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={e => {
                const newOptions = [...options];
                newOptions[idx] = e.target.value;
                setOptions(newOptions);
              }}
              placeholder={`Option ${idx + 1}`}
              required
            />
          ))}
        </div>
        <div>
          <label>Answer:</label>
          <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} required />
        </div>
        <button type="submit">Add Question</button>
      </form>
    </div>
    </>
  );
}

export default AddQuestionPage;