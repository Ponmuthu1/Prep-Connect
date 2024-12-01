import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import PersonalChat from "./pages/PersonalChat/PersonalChat";
import AnonymousChat from "./pages/AnonymousChat/AnonymousChat";
import AddQuestionPage from "./pages/Question/AddQuestionPage/AddQuestionPage";
import QuestionPage from "./pages/Question/QuestionPage/QuestionPage";
import QuestionListPage from "./pages/Question/QuestionListPage/QuestionListPage";
import QuizPage from "./pages/QuizPage/QuizPage";
import Home from "./pages/Home/Home";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<PersonalChat />} />
          <Route path="/chatroom" element={<AnonymousChat />} />
          <Route path="/questions" element={<QuestionListPage />} />
          <Route path="/question/:id" element={<QuestionPage />} />
          <Route path="/add-question" element={<AddQuestionPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
