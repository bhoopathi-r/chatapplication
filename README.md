# ChatApp | Production-Grade Real-Time Private Messaging

A full-stack, real-time private messaging application built with NestJS, React, and PostgreSQL.

## 🚀 Features

- **Real-Time Messaging**: Instant 1-to-1 chat using Socket.IO.
- **User Presence**: Live online/offline status tracking.
- **Typing Indicators**: Real-time feedback when the other user is typing.
- **Secure Auth**: JWT-based authentication and Bcrypt password hashing.
- **Premium UI**: 3-panel dashboard layout with responsive design.
- **Database**: Persistent storage with PostgreSQL and TypeORM.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Context API, Lucide React, Framer Motion.
- **Backend**: NestJS, TypeORM, PostgreSQL, Socket.io, Passport JWT.

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 2. Clone the Repository
```bash
git clone https://github.com/bhoopathi-r/chatapplication.git
cd chatapplication
```

### 3. Backend Setup
```bash
cd backend
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `backend` folder:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_postgres_user
DATABASE_PASS=your_postgres_password
DATABASE_NAME=chatapp
JWT_SECRET=your_super_secret_key
PORT=3000
```

**Create Database:**
```sql
CREATE DATABASE chatapp;
```

**Run Backend:**
```bash
npm run start:dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

**Run Frontend:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port specified in your terminal).

---

## 📁 3-Panel Dashboard Layout
- **Left Panel**: User search and your conversation list.
- **Center Panel**: Active chat window with message history.
- **Right Panel**: Detailed profile of the selected user.
