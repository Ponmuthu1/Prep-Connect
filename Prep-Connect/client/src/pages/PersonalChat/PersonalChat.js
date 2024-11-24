// src/pages/PersonalChat.js
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./PersonalChat.css";

function PersonalChat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const loggedInUserId = token
    ? JSON.parse(atob(token.split(".")[1])).id.toString()
    : null;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Initialize Socket.IO connection only once
    if (!socketRef.current) {
      const newSocket = io("http://localhost:5000");
      socketRef.current = newSocket;

      newSocket.emit("register-user", loggedInUserId);

      newSocket.on("receive-message", (data) => {
        if (data.from === selectedUser) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: data.from.toString(),
              message: data.message,
              timestamp: data.timestamp,
            },
          ]);
        }
      });

      console.log("Socket connected:", newSocket.id);
    }

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("Socket disconnected");
      }
    };
  }, [navigate, token, loggedInUserId, selectedUser]);

  useEffect(() => {
    fetch("http://localhost:5000/api/users", {
      headers: { "x-access-token": token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          const otherUsers = data.users.filter(
            (user) => user._id !== loggedInUserId
          );
          setUsers(otherUsers);
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [token, navigate, loggedInUserId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadChat = (userId) => {
    setSelectedUser(userId);

    fetch(
      `http://localhost:5000/api/chats?user1=${loggedInUserId}&user2=${userId}`,
      {
        headers: { "x-access-token": token },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setMessages(
            data.chats.map((chat) => ({
              sender: chat.from.toString(),
              message: chat.message,
              timestamp: chat.timestamp,
            }))
          );
        }
      });
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      const messageData = {
        from: loggedInUserId,
        to: selectedUser,
        message: newMessage,
      };

      socketRef.current.emit("send-message", messageData);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: loggedInUserId,
          message: newMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <><NavBar />
    <div className="chat-container">
      
      <div className="user-list">
        <h2>Available Users</h2>
        {users.map((user) => (
          <div
            key={user._id}
            className={`user-item ${
              selectedUser === user._id ? "selected" : ""
            }`}
            onClick={() => loadChat(user._id)}
          >
            {user.name}
          </div>
        ))}
      </div>

      <div className="chat-window">
        <h2>Chat</h2>
        {selectedUser ? (
          <>
            <div className="messages">
              {messages.map((msg, index) => {
                const currentMessageDate = new Date(msg.timestamp).toDateString();
                const previousMessageDate =
                  index > 0
                    ? new Date(messages[index - 1].timestamp).toDateString()
                    : null;
                const showDateHeader = currentMessageDate !== previousMessageDate;

                return (
                  <React.Fragment key={index}>
                    {showDateHeader && (
                      <div className="date-header">
                        <strong>{currentMessageDate}</strong>
                      </div>
                    )}
                    <div
                      className={`message ${
                        msg.sender === loggedInUserId ? "sent" : "received"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className="time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p>Select a user to start chatting</p>
        )}
      </div>
    </div>
    </>
  );
}

export default PersonalChat;