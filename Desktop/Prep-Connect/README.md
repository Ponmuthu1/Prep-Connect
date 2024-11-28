# PrepConnect

PrepConnect is a comprehensive social networking platform designed to foster connections among users, providing a suite of interactive features such as anonymous chat, personal messaging, a question-and-answer forum, and engaging quizzes. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js), PrepConnect aims to deliver a seamless and enriching user experience.

## Table of Contents

- Project Structure
- Features
- Installation
- Usage
- Scripts
- API Endpoints
- Contributing
- License
- Contact

## Project Structure

```
PrepConnect/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── AnonymousChat/
│   │   │   │   ├── AnonymousChat.jsx
│   │   │   │   └── AnonymousChat.css
│   │   │   ├── PersonalChat/
│   │   │   ├── Question/
│   │   │   ├── QuizPage/
│   │   │   ├── Register/
│   │   │   ├── Login/
│   │   │   ├── Home/
│   │   │   └── Dashboard/
│   │   └── components/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── server.js
│   ├── package.json
│   └── .env
├── README.md
└── LICENSE
```

## Features

### User Authentication

- **Registration and Login**: Secure user authentication using JWT tokens.
- **Data Validation**: Ensures data integrity and security during user input.

### Anonymous Chat

- **Anonymity**: Engage with others without revealing your identity.
- **Real-Time Messaging**: Instant communication powered by Socket.io.

### Personal Chat

- **Direct Messaging**: One-on-one conversations with other users.
- **Message History**: Access past conversations anytime.

### Question and Answer Forum

- **Community Engagement**: Post questions and receive answers from others.
- **Search and Filter**: Easily find topics of interest.

### Quizzes

- **Interactive Quizzes**: Test your knowledge on various subjects.
- **Score Tracking**: Keep track of your performance over time.

### Dashboard

- **User Overview**: Get insights into your activity on the platform.
- **Notifications**: Stay updated with the latest interactions.

### Home Page

- **Introduction**: Learn about the platform's mission and values.
- **Navigation**: Access all main features from a central hub.

## Installation

### Prerequisites

- **Node.js**: Version 14 or higher.
- **MongoDB**: Ensure MongoDB is installed and running.
- **Git**: Version control system to clone the repository.

### Setup Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Ponmuthu1/Prep-Connect
   cd Prep-Connect
   ```

2. **Install Server Dependencies**

   Navigate to the

server

directory and install the necessary packages.

```bash
   cd server
   npm install
```

3. **Configure Environment Variables**

   Create a `.env` file in the

server

directory with the following content:

```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/prepconnect
   JWT_SECRET=your_jwt_secret
```

4. **Install Client Dependencies**

   Navigate to the

client

directory and install the packages.

```bash
   cd ../client
   npm install
```

## Usage

### Running the Server

Start the backend server from the

server

directory:

```bash
cd server
npm run dev
```

- The server will run on `http://localhost:5000`.

### Running the Client

Start the frontend application from the

client

directory:

```bash
cd client
npm run dev
```

- The client will run on `http://localhost:3000`.

### Accessing the Application

Open your web browser and navigate to `http://localhost:3000` to start using PrepConnect.

## Scripts

### Server Scripts

- **Start Server**

  ```bash
  npm start
  ```

- **Development Mode**

  ```bash
  npm run dev
  ```

### Client Scripts

- **Start Client**

  ```bash
  npm run dev
  ```

- **Build Client**

  ```bash
  npm run build
  ```

- **Preview Production Build**

  ```bash
  npm run preview
  ```

## API Endpoints

### Authentication Routes

- **Register User**

  ```
  POST /api/auth/register
  ```

- **Login User**

  ```
  POST /api/auth/login
  ```

### Chat Routes

- **Get Anonymous Chats**

  ```
  GET /api/chats/anonymous
  ```

- **Send Message**

  ```
  POST /api/chats/message
  ```

### Forum Routes

- **Get Questions**

  ```
  GET /api/questions
  ```

- **Post Question**

  ```
  POST /api/questions
  ```

## Contributing

We welcome contributions to enhance PrepConnect!

### Steps to Contribute

1. **Fork the Repository**

   Click the "Fork" button on the repository page to create a personal copy.

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/your-username/Prep-Connect.git
   ```

3. **Create a New Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**

   Implement your feature or fix.

5. **Commit Changes**

   ```bash
   git commit -am 'Add new feature'
   ```

6. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

   Go to the original repository and open a pull request from your fork.

## License

This project is licensed under the MIT License.

Thank you for using PrepConnect! We hope you enjoy connecting and collaborating on our platform.
