# Visitor Pass Management System (VPMS)

A production-ready full-stack MERN (MongoDB, Express, React, Node.js) web application designed to replace physical paper visitor logbooks in commercial offices and institutions. It digitizes the entire visitor management lifecycle from public pre-registration, automated approval workflows, and digital QR badge generation, to live webcam-based gate scanning, role-based access control (RBAC), and historical audit logging.

---

## Live Deployments

- **Frontend (Vercel):** [https://visitor-pass-management-system-murex.vercel.app](https://visitor-pass-management-system-murex.vercel.app/)
- **Backend API (Render):** `https://visitor-pass-management-system-nq1z.onrender.com`
- **Database:** MongoDB Atlas (Multi-cluster cloud database)

### Demo Credentials

- ### **Click here for** [Demo Video](https://drive.google.com/file/d/1qZTkjb7QYSnQcu_7zxjAGRQKTT-O5sHk/view?usp=sharing)

| Role               | Email             | Password       | Access Scope                                                                                                                                   |
| :----------------- | :---------------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Admin**   | `admin@vpms.com`  | `Admin@123456` | Full system control, pending approval queue, pass generation, gate operations, audit logs                                                      |
| **Security Guard** | `guard@vpms.com`  | `Guard@123456` | Gate operations only (webcam QR scanner, active passes, live check-in/check-out, audit logs). _Pending approval queue is strictly restricted._ |
| **Public Visitor** | _No login needed_ | _N/A_          | Self-service 2-step registration on `/` to schedule visits                                                                                     |

---

## Core System Architecture

```text
[ Public Visitor ] ─────────► [ Landing Page: / ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        Step 1: Visitor Info                   Step 2: Date & Time
       (Name, Host, Purpose, Photo)           (AM/PM, 15-min Intervals)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                      [ POST /api/visitors & appointments ]
                                     │
                      (Find-or-Create Visitor + Create Pending Visit)
                                     ▼
[ Security / Admin ] ◄─────── [ Dashboard: /admin ] ◄─────── [ MongoDB Database ]
        │
(Click "Approve" - Admin Only)
        ▼
[ Backend / Controller ] ───┬─► [ QRCode Engine ] ──────► Base64 QR Matrix
                            ├─► [ PDFKit Engine ] ──────► Memory Buffer Badge (Name, Host, Purpose)
                            ├─► [ Nodemailer 587 ] ────► Direct Email with Attached PDF
                            └─► [ Twilio SMS ] ────────► Gate SMS Notification
```

---

## Key Features

1. **Public Visitor Portal (`/`)**:
   - **Interactive 2-Step Workflow:**
     - **Step 1 (Visitor Details):** Self-service entry for Full Name, Email, Phone, Purpose of Visit, Host Name, and Photo capture/upload.
     - **Step 2 (Schedule Appointment):** Select visit date with an intuitive AM/PM period toggle, hour selection, and 15-minute time intervals (`00`, `15`, `30`, `45`).
     - **Step 3 (Confirmation Summary):** Displays scheduled date/time and pending status.
   - **Returning Visitor Optimization:** Uses a Find-or-Create query on email, eliminating MongoDB `E11000` duplicate key errors while maintaining historical records.
   - Open access with zero login friction for reception kiosks and mobile visitors.

2. **Role-Based Security & Administration Hub (`/admin`)**:
   - **Strict Role-Based Access Control (RBAC):**
     - **Security Guards:** Automatically default to and are locked inside the _Active Passes & Gate Operations_ view. They cannot view, approve, or reject pending requests.
     - **Admins / Hosts:** Have exclusive access to the _Pending Approvals_ queue and approval pipeline.
   - **Pending Approvals Queue:** Review visit requests with visitor photos, host details, and scheduled timestamps.
   - **Automated Approval Pipeline:** Approving a pass generates a cryptographically verifiable QR code, dynamic PDF badge, and dispatches email and SMS alerts.

3. **Hardware Integration & Gate Operations**:
   - **Webcam / Mobile Camera QR Scanner:** Powered by `react-qr-reader`, allowing guards to scan smartphone-displayed or printed QR badges directly from the browser.
   - **Concurrency-Safe, Idempotent Check-In / Check-Out:**
     - Uses atomic MongoDB status transitions (`findOneAndUpdate`) to ensure a pass can never be checked in or out twice.
     - In-flight request locking on UI buttons (`processingLogId`) prevents rapid double-click submissions.
     - Video track debounce prevents camera frame decoding races during scanner unmount.

4. **Digital Pass Delivery**:
   - **Vector PDF Badges:** Generated in-memory using PDFKit, styled with organization headers, visitor photo, QR code, host name, purpose, and validity window.
   - **Direct Email Dispatch:** Delivered directly to visitor inboxes via SMTP STARTTLS on Port 587 (configured with defensive `.trim()` to eliminate cloud connection timeouts).

5. **Audit Logging & CSV Export (`/audit-logs`)**:
   - Relational audit trail tracking Visitor, Host, Security Guard, Check-In, and Check-Out timestamps.
   - Built-in deduplication and one-click client-side CSV report export.

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

# Twilio SMS Notifications
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### Frontend Configuration (`frontend/src/config.js`)

The frontend automatically detects whether it is running on `localhost` or in production:

- **Localhost (`localhost` / `127.0.0.1`):** Connects to `http://localhost:5000`
- **Production (Vercel / Cloud):** Connects to `https://visitor-pass-management-system-nq1z.onrender.com`

You can optionally override this by creating `frontend/.env`:

```env
VITE_API_URL=https://visitor-pass-management-system-nq1z.onrender.com
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

1. **Visitor Self-Registration (Public Portal)**:
   - Open `http://localhost:5173/` (No login required).
   - **Step 1:** Enter your name, email, phone number, select a purpose, enter the host name (e.g., `Dr. Robert`), and upload a photo. Click **Register Visitor**.
   - **Step 2:** Select your preferred date, choose **AM** or **PM**, select the hour and minute (15-min intervals), and click **Schedule Appointment**.
   - **Step 3:** A confirmation summary confirms your request is awaiting host/admin approval.
2. **Staff Approval (Admin Portal)**:
   - Click **Staff Login** in the top navigation and sign in with `admin@vpms.com` / `Admin@123456`.
   - On the **Security Dashboard** (`/admin`), locate the request under the **Pending Approvals** tab.
   - Click **Approve & Issue Pass**.
3. **Automated Notification**:
   - The backend renders the PDF pass with QR code, host name, and purpose, and emails it directly to the visitor's inbox.
4. **Gate Entry & Check-In (Security Guard)**:
   - Sign in as `guard@vpms.com` / `Guard@123456`. The dashboard directly opens to **Active Passes & Gate Operations**.
   - Click **📷 Scan QR Pass** to activate the webcam/camera scanner and align the visitor's QR badge, or click **Check In**.
   - The pass updates to `Checked In` atomically in real-time.
5. **Gate Exit & Audit**:
   - Click **Check Out** when the visitor leaves the premises.
   - Navigate to **Audit Logs** (`/audit-logs`) to view the complete gate activity and click **Download Logs** for CSV export.

---

## Project Structure

```text
Visitor Pass Management System/
├── backend/
│   ├── controller/
│   │   ├── appointmentController.js   # Appointment lifecycle & status transitions
│   │   ├── checklogController.js      # Atomic gate logs & deduplicated audit queries
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
        │   ├── AppointmentForm.jsx    # Date & time selection (AM/PM, 15-min intervals)
        │   ├── Navbar.jsx             # Role-aware navigation bar
        │   └── VisitorForm.jsx        # Public visitor registration form with hostName
        ├── context/                   # AuthContext & PassContext
        ├── hooks/                     # Custom data fetch & mutation hooks
        ├── config.js                  # Dynamic API base URL resolver (localhost vs. Render)
        └── pages/
            ├── AdminDashboard.jsx     # Security & Admin hub (Approvals, Active Passes, QR Scanner)
            ├── AuditLogs.jsx          # Security audit trail with CSV export
            ├── Login.jsx              # Staff authentication
            ├── PublicPortal.jsx       # Public 2-step visitor registration page (Route: /)
            └── Signup.jsx             # Staff registration
```
