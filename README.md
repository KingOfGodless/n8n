# 🕸️ WebSpyder | Certificate Generation System
> **A Cyberpunk-themed Certificate Management System built with Vanilla JS & Firebase.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Click_Here-00f3ff?style=for-the-badge&logo=vercel&logoColor=black)](https://web-spyder-certificate.vercel.app/) 
[![Tech Stack](https://img.shields.io/badge/Tech-HTML5_%7C_CSS3_%7C_Firebase-ff0055?style=for-the-badge)](https://firebase.google.com/)

---

## ⚡ Overview

**WebSpyder** is a robust, full-stack web application designed to generate, manage, and verify digital certificates. Built with a **"Meka-Cyber" Neon UI**, it features real-time database management, PDF generation with QR codes, and a public verification portal.

### 🌟 Key Features

#### 🛡️ Admin Console (Restricted)
*   **Secure Authentication:** Firebase Email/Password login.
*   **Analytics Dashboard:** Real-time counters for issued certificates and active courses.
*   **Single Minting:** Generate individual certificates with Start/End dates.
*   **Bulk Generation:** 📂 Upload a `.CSV` file to mint hundreds of certificates instantly.
*   **PDF Engine:** Auto-generates high-res PDFs with **QR Codes** for verification.
*   **Email Integration:** One-click `mailto` button to send certificates to students.
*   **Database Management:** Search, Filter, View, Download, and Delete records.

#### 🌍 Public Verification
*   **Instant Verification:** Validate certificates using a unique **Certificate ID**.
*   **QR Scan Support:** Scanned QR codes redirect immediately to the verification result.
*   **Authenticity Check:** Displays student details, course duration, and photo validation.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Glassmorphism/Neon), JavaScript (ES6+) |
| **Backend** | Firebase Authentication, Firestore (NoSQL DB) |
| **Libraries** | `jspdf`, `html2canvas`, `qrcode.js` |
| **Hosting** | Vercel / Firebase Hosting |

---

## 📸 Screenshots

| Admin Dashboard | Certificate Preview |
| :---: | :---: |
| <img src="https://via.placeholder.com/400x200/000000/00f3ff?text=Admin+Console" alt="Admin Dashboard" width="400"> | <img src="https://via.placeholder.com/400x200/000000/00f3ff?text=Generated+PDF" alt="Certificate" width="400"> |

> *Note: Replace the placeholder links above with actual screenshots of your application.*

---

## 🚀 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/web-spyder.git
    cd web-spyder
    ```

2.  **Configure Firebase**
    *   Create a project at [Firebase Console](https://console.firebase.google.com/).
    *   Enable **Authentication** (Email/Password).
    *   Create a **Firestore Database**.
    *   Copy your config keys into `firebase-config.js`.

3.  **Run Locally**
    *   Since this project uses ES6 Modules (`import/export`), you must use a local server.
    *   **VS Code:** Install "Live Server" extension -> Right-click `admin.html` -> "Open with Live Server".
    *   **Python:** `python -m http.server 8000`

---

## 📂 File Structure

```text
/WebSpyder
├── admin.html          # Admin Dashboard (Login, Gen, Stats)
├── index.html          # Public Verification Portal
├── style.css           # Meka-Cyber CSS Theme
├── app.js              # Core Logic (PDF, QR, CSV, UI)
└── firebase-config.js  # Firebase API Keys (Not verified in git)
