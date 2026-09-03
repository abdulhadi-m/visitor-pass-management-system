# Visitor Pass Management System (VPMS)

A production-ready full-stack MERN (MongoDB, Express, React, Node.js) web application designed to replace physical paper visitor logbooks in commercial offices and institutions. It digitizes the visitor management lifecycle from public pre-registration, automated approval workflows, and digital QR badge generation, to live webcam-based gate scanning and historical audit logging.

---

## Live Deployments

- **Frontend (Vercel):** [https://visitor-pass-management-system-murex.vercel.app](https://visitor-pass-management-system-murex.vercel.app/)
- **Backend API (Render):** `https://visitor-pass-management-system-nq1z.onrender.com`
- **Database:** MongoDB Atlas (Multi-cluster cloud database)

### Pre-Configured Demo Credentials
| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@vpms.com` | `Admin@123456` | Full system control, approval queue, pass generation, audit logs |
| **Security Guard** | `guard@vpms.com` | `Guard@123456` | Gate scanner, live check-in/check-out, active passes, audit logs |
| **Public Visitor** | *No login needed* | *N/A* | Open access on `/` to register visits |

---

## Core System Architecture

```text
[ Public Visitor ] ─────────► [ Landing Page: / ] ─────────► [ POST /api/visitors ]
                                                                     │
                                                      (Find-or-Create Visitor + Create Pending Visit)
                                                                     ▼
[ Security / Admin ] ◄─────── [ Dashboard: /admin ] ◄─────── [ MongoDB Database ]
        │
(Click "Approve")
        ▼
[ Backend / Controller ] ───┬─► [ QRCode Engine ] ──────► Base64 QR Matrix
                            ├─► [ PDFKit Engine ] ──────► Memory Buffer Badge (Name, Host, Purpose)
                            ├─► [ Nodemailer 587 ] ────► Direct Email with Attached PDF
                            └─► [ Twilio SMS ] ────────► Gate SMS Notification
```

---

## Key Features

1. **Public Visitor Portal (`/`)**:
   - Frictionless self-service registration for office reception tablets or mobile devices.
   - Captures Visitor Name, Email, Phone, Purpose, Host Name, and Photo.
   - **Returning Visitor Optimization:** Uses a Find-or-Create query on email, eliminating MongoDB `E11000` duplicate key errors while preserving unique identity records.
   - Does not require authentication or trigger premature notifications.

2. **Security & Administration Hub (`/admin`)**:
   - **Pending Approvals Queue:** Review incoming visit requests with photos and host details.
   - **Automated Approval Pipeline:** Approving a pass generates a cryptographically verifiable QR code, dynamic PDF badge, and dispatches email and SMS alerts.
   - **Active Passes Operations:** Real-time visibility into all issued passes, expiration countdowns, and physical gate status.

3. **Hardware Integration & Gate Operations**:
   - **Webcam / Mobile Camera QR Scanner:** Powered by `react-qr-reader`, enabling security staff to scan physical or smartphone-displayed QR badges directly from their browser.
   - **Live Gate Tracking:** One-click Check In and Check Out with automated timestamping.

4. **Digital Pass Delivery**:
   - **Vector PDF Badges:** Generated in-memory using PDFKit, styled with organization headers, visitor photo, QR code, host name, purpose, and validity window.
   - **Email Dispatch:** Delivered directly to visitor inboxes via SMTP STARTTLS on Port 587.

5. **Audit Logging & CSV Export (`/audit-logs`)**:
   - Deeply populated relational audit log tracking Visitor, Host, Security Guard, Check-In, and Check-Out timestamps.
   - One-click client-side CSV export for regulatory and compliance reporting.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

```env
# Server
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/vpms?retryWrites=true&w=majority
SECRET=your_jwt_strong_secret_key

# Nodemailer Email Delivery (Gmail or custom SMTP)
# Uses Port 587 with STARTTLS (secure: false) to prevent cloud connection timeouts
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_google_app_password

# Twilio SMS Notifications (Optional / Sandbox)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB instance (Local or Atlas)
- Git

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file and add credentials
cp .env.example .env

# Start development server with nodemon
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## End-to-End Walkthrough

1. **Visitor Self-Registration**:
   - Open `http://localhost:5173/` (No login required).
   - Enter your name, email, phone number, select a purpose, enter the host name (e.g. `Dr. Robert`), and upload/snap a photo.
   - Click **Register Visitor**. A pending visit record is created instantly.
2. **Staff Approval**:
   - Click **Staff Login** in the top right and sign in with `admin@vpms.com` / `Admin@123456`.
   - On the **Security Dashboard** (`/admin`), locate the pending card under **Pending Approvals**.
   - Click **Approve & Issue Pass**.
3. **Automated Notification**:
   - The backend renders the PDF pass with QR code, host name, and purpose, and emails it directly to the visitor's email address.
4. **Gate Entry & Check-In**:
   - Navigate to the **Approved & Active Passes** tab or click **📷 Scan QR Pass** to activate the camera scanner.
   - Scan the visitor's QR code or click **Check In**. The pass status updates in real-time.
5. **Gate Exit & Audit**:
   - Click **Check Out** when the visitor departs.
   - Navigate to **Audit Logs** in the top navigation to view the permanent entry/exit log and export the report to CSV.

---

## Project Structure

```text
Visitor Pass Management System/
├── backend/
│   ├── controller/
│   │   ├── appointmentController.js   # Appointment lifecycle & status transitions
│   │   ├── checklogController.js      # Gate logs & deep population audit queries
│   │   ├── passController.js          # QR matrix, PDFKit vector badge & SMTP/Twilio dispatch
│   │   ├── userController.js          # JWT authentication (Admin/Security)
│   │   └── visitorController.js       # Find-or-create visitor identity & visit initiation
│   ├── middleware/
│   │   ├── requireAuth.js             # Bearer token verification
│   │   ├── requireRole.js             # Role-based access control (Admin/Security)
│   │   └── upload.js                  # Multer disk storage for visitor photos
│   ├── models/
│   │   ├── appointmentModel.js        # Visit details (hostName, purpose, status, dateTime)
│   │   ├── checklogModel.js           # Audit logs (passId, guardId, checkIn, checkOut)
│   │   ├── passModel.js               # Issued passes (qrCode, pdfUrl, validUntil, status)
│   │   ├── userModel.js               # Staff credentials & roles
│   │   └── visitorModel.js            # Permanent visitor identity (name, email, phone, photo)
│   ├── routes/                        # Express route declarations
│   ├── seed.js                        # Automated database seeder
│   └── server.js                      # Express application entrypoint
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.jsx             # Role-aware navigation bar
        │   └── VisitorForm.jsx        # Public visitor registration form with hostName
        ├── context/                   # AuthContext & PassContext
        ├── hooks/                     # Custom data fetch & mutation hooks
        └── pages/
            ├── AdminDashboard.jsx     # Security & Admin hub (Approvals, Active Passes, QR Scanner)
            ├── AuditLogs.jsx          # Security audit trail with CSV export
            ├── Login.jsx              # Staff authentication
            ├── PublicPortal.jsx       # Public visitor self-check-in landing page (Route: /)
            └── Signup.jsx             # Staff registration
```
