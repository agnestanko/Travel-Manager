# 🌍 The Travelers – Travel Manager App

## 📌 Overview

**The Travelers** is a web application for discovering attractions and booking tickets.
Users can search for destinations, view details, explore galleries, and reserve tickets.

The project is built using:

* **Frontend:** React
* **Backend:** .NET (C# API)
* **Database:** (to be integrated)

---

## ✨ Features

### 🔍 Search & Filtering

* Search attractions by keyword
* Filter by location and price
* Sort results

### 🎫 Ticket Booking

* Buy tickets for attractions
* Select number of tickets
* Choose entry date
* Automatic total price calculation

### 🖼️ Galleries

* Attraction image gallery (with navigation arrows)
* Home page gallery (all attractions)
* Related attractions (horizontal scroll)

### 👤 Authentication

* Login / Register
* User session handling
* Protected actions (buy ticket, profile)

### 📄 My Profile

* View personal data
* View tickets:

  * Active tickets
  * Expired tickets
* (Edit profile – prepared for backend)

---

## 🧱 Project Structure

```
Travel-Manager/
│
├── frontend (React)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend (.NET API)
│   ├── Controllers/
│   ├── Models/
│   └── Services/
│
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Clone repository

```bash
git clone https://github.com/your-username/travel-manager.git
cd travel-manager
```

---

### 2️⃣ Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

### 3️⃣ Run Backend (.NET)

```bash
cd backend
dotnet run
```

Backend runs on:

```
https://localhost:xxxx
```

---

## 🔗 API Endpoints (planned / partial)

### 🔐 Auth

```
POST /api/Auth/login
POST /api/Auth/register
```

### 🎫 Tickets

```
POST /api/Tickets
GET  /api/Tickets/my-tickets
```

### 🏝️ Attractions

```
GET /api/Search
GET /api/Attractions/{id}
GET /api/Attractions/{id}/available-dates
```

---

## 🎨 UI Highlights

* Responsive layout (flex + grid)
* Fixed header with menu and user info
* Scrollable result list (no layout shifting)
* Modern card-based design
* Interactive galleries

---

## 🚧 Future Improvements

* Calendar with available/unavailable dates
* Payment integration
* Recommendation system
* Image upload for attractions
* Admin dashboard
* Full backend integration

---

## 👨‍💻 Authors

* Takacs Andras Csaba
* Tanko Agnes Maria
* Hanes Razvan
* Vonica Alessia

---

## 📄 License

This project is for educational purposes.
