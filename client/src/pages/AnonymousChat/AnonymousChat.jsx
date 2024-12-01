// src/pages/AnonymousChat.js
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import NavBar from "../NavBar/NavBar";
import "./AnonymousChat.css";

function AnonymousChat() {
  const [rooms] = useState([
    "General",
    "Technology",
    "Sports",
    "Music",
    "Movies",
  ]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const selectedRoomRef = useRef(selectedRoom);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO connection only once
    if (!socketRef.current) {
      const newSocket = io(`${import.meta.env.VITE_API_BASE_URL}`);
      socketRef.current = newSocket;

      newSocket.on("receive-anonymous-message", (data) => {
        if (data.room === selectedRoomRef.current) {
          setMessages((prevMessages) => [...prevMessages, data]);
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
  }, []);

  useEffect(() => {
    // Keep the selectedRoom ref updated
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    // Scroll to the latest message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const joinRoom = (room) => {
    if (socketRef.current) {
      if (selectedRoom) {
        socketRef.current.emit("leave-room", selectedRoom);
      }
      setSelectedRoom(room);
      socketRef.current.emit("join-room", room);
      fetchMessages(room);
    }
  };

  const fetchMessages = (room) => {
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/anonymous-chats?room=${room}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setMessages(data.chats);
        } else {
          console.error("Failed to fetch messages");
        }
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
      });
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedRoom) {
      const messageData = {
        room: selectedRoom,
        message: newMessage,
        timestamp: new Date().toISOString(),
      };

      socketRef.current.emit("send-anonymous-message", messageData);
      setNewMessage("");
    }
  };

  return (
    <>
      <NavBar />
      <div className="anonymous-chat-container">
        <div className="room-list">
          <h2>Chat Rooms</h2>
          {rooms.map((room, index) => (
            <div
              key={index}
              className={`room-item ${selectedRoom === room ? "selected" : ""}`}
              onClick={() => joinRoom(room)}
            >
              {room}
            </div>
          ))}
        </div>

        <div className="chat-window">
          <h2>{selectedRoom ? `Room: ${selectedRoom}` : "Select a Room"}</h2>
          {selectedRoom ? (
            <>
              <div className="messages">
                {messages.map((msg, index) => {
                  const currentMessageDate = new Date(
                    msg.timestamp
                  ).toDateString();
                  const previousMessageDate =
                    index > 0
                      ? new Date(messages[index - 1].timestamp).toDateString()
                      : null;
                  const showDateHeader =
                    currentMessageDate !== previousMessageDate;

                  return (
                    <React.Fragment key={index}>
                      {showDateHeader && (
                        <div className="date-header">
                          <strong>{currentMessageDate}</strong>
                        </div>
                      )}
                      <div className="message">
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
            <p>Please select a chat room to start chatting anonymously.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default AnonymousChat;
