# ⚡ FLEXI Enterprise Suite - MERN Application

**Student Name:** Utkarsh Ratnaparkhi  
**PRN:** 25070521321  
**Section:** SEC-C  
**Course Assignment:** CA-03 Full-Stack MERN Project  

---

## 📌 Project Overview
FLEXI is a modern, enterprise-grade full-stack task and record management web application built with the **MERN** stack (MongoDB, Express, React, Node.js). It features secure user authentication, interactive dashboard metrics, real-time search & filtering, and full CRUD data persistence directly connected to a local MongoDB instance.

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Modern CSS-in-JS, LocalStorage session handling
- **Backend:** Node.js, Express.js, RESTful API architecture, CORS, Dotenv
- **Database:** MongoDB Community Server (via Mongoose ODM and MongoDB Compass)

---

## ✨ Key Features

1. **User Authentication:** Sign up and login workflows with database validation.
2. **Interactive KPI Dashboard:** Real-time counters calculating total items, active progress, completed tasks, and an automated progress rate bar.
3. **Full CRUD Support:**
   - **Create:** Add records with titles, categories, and priority statuses.
   - **Read:** Fetch sorted collections dynamically from the database.
   - **Update:** Inline/modal editing of item status and details.
   - **Delete:** Remove documents with instant UI and database sync.
4. **Search & Multi-Filter:** Client-side search by title with category and status dropdown filtering.

---

## 🚀 Local Setup & Installation

### 1. Database Setup
- Start MongoDB Community Server locally on port `27017`.
- Connect via MongoDB Compass to URI: `mongodb://localhost:27017/flexi_db`.

### 2. Backend Setup
```bash
cd server
npm install
node server.js
# Runs on http://localhost:5000