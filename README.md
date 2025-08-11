# 🚀 ChatsApp Backend

A secure, real-time chat application backend built with Node.js, Express, MongoDB, and Socket.IO featuring JWT authentication, message encryption, and comprehensive user privacy protection.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-blue?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?style=flat-square&logo=socket.io)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange?style=flat-square)

## ✨ Features

### 🔐 Security & Authentication

- **JWT-based Authentication** with token verification
- **Role-based Access Control** for all API endpoints
- **Message Privacy Protection** - Users can only access their own conversations
- **Input Validation & Sanitization** on all endpoints
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests

### 📡 Real-time Communication

- **Socket.IO Integration** for instant messaging
- **Real-time Online Status** tracking with proper user management
- **Message Delivery Confirmations** (sent, delivered, read)
- **Typing Indicators** for enhanced user experience
- **Room-based Chat System** with user isolation
- **Automatic Reconnection** with fallback mechanisms

### 💬 Message Management

- **Secure Message Storage** with MongoDB
- **Message Encryption** and content protection
- **Conversation Threading** between users
- **Message Status Tracking** (sent/delivered/read)
- **Message Search Functionality** within conversations
- **File Upload Support** for media messages

### 👥 User Management

- **User Registration & Login** with secure password hashing
- **Profile Management** with validation
- **Online/Offline Status** tracking
- **User Search & Discovery** with privacy controls
- **Account Security** features

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO 4.x
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Environment**: dotenv for configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB running (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   git clone project_url
   cd chatsapp-backend

2. **Install dependencies**
   npm install

3. **Environment Configuration**
   Create .env file

4. **Configure environment variables**
   Server Configuration
   PORT=3000
   NODE_ENV=development

Database
MONGODB_URI=mongodb://localhost:27017/chatsapp

5. **Start the Project**

node app.js
