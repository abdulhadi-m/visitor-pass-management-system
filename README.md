# Visitor Pass Management System (VPMS)

A simple full-stack MERN web app to replace manual paper visitor logbooks. It lets visitors register, schedule appointments with hosts, get approved, receive digital QR-code visitor pass badges via email, and allows security guards to track check-ins and check-outs.

---

## What It Does

1. **Visitor Registration:** Visitors can register their details (name, email, phone, purpose, photo).
2. **Appointment Scheduling:** Book an appointment with a host employee.
3. **Admin Approval:** Admins/Hosts can review pending appointment requests and approve or reject them.
4. **Pass & QR Code Generation:** Once approved, the system automatically creates a visitor pass with a unique QR code and a downloadable PDF badge.
5. **Email Notifications:** The visitor receives an email with their approved appointment time and their PDF pass attached.
6. **Guard Check-In / Check-Out:** Security guards can check visitors in and out.
7. **Audit Logs:** A clean security log table showing who visited, who hosted them, which guard checked them in, and timestamps.
8. **Role-Based Login:** Built-in JWT authentication for Admin and Security accounts.

---

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, React Hot Toast
- **Backend:** Node.js, Express.js, JWT (jsonwebtoken), bcrypt, Nodemailer, PDFKit, QRCode
- **Database:** MongoDB (Mongoose)

---

## Getting Started

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- A MongoDB connection string (MongoDB Atlas or local MongoDB)

---

### 2. Backend Setup

1. Open a terminal and go into the `backend` folder:

   ```bash
   cd backend
   ```

2. Install backend dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   SECRET=your_jwt_secret_key

   # Optional: For sending real emails via Gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_char_app_password
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

---

### 3. Frontend Setup

1. Open a new terminal and go into the `frontend` folder:

   ```bash
   cd frontend
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Live Demo

## [Try it out here](https://visitor-pass-management-system-murex.vercel.app/) 

To explore the pre-populated dashboard, use the following seeded demo accounts. (Alternatively, you can create a new account via the Sign Up page).

**Admin / Host Access (Full Dashboard & Approvals)**
* Email: `admin@vpms.com`
* Password: `Admin@123456`

**Security Guard Access (Front Desk & Check-in)**
* Email: `guard@vpms.com`
* Password: `Guard@123456`

### How to Try the Full Flow
1. **Register a Visitor**: Log in as Security and fill in visitor details on the home page.
2. **Book Appointment**: Select a 15-minute time slot for the visitor.
3. **Approve (Admin)**: Log out, log in as Admin, go to **Admin Portal**, and click **Approve**.
4. **Check Email / Pass**: A real email with a scannable PDF pass is sent to the visitor's email.
5. **Check In / Out**: Log back in as Security to check the visitor in and out.
6. **Audit Logs**: Log in as Admin to view the full tracking history on the Audit Logs page.
---

## Project Structure

```text
Visitor Pass Management System/
├── backend/
│   ├── controller/      # Route controllers (appointments, passes, logs, users)
│   ├── middleware/      # Auth middleware (JWT verification)
│   ├── models/          # Mongoose schemas (User, Visitor, Appointment, Pass, CheckLog)
│   ├── routes/          # Express API routes
│   └── server.js        # Express app entry point
│
└── frontend/
    └── src/
        ├── components/  # Navbar, VisitorForm, AppointmentForm
        ├── context/     # Auth and Pass React context
        ├── hooks/       # Custom React hooks
        └── pages/       # Home, AdminDashboard, AuditLogs, Login, Signup
```
