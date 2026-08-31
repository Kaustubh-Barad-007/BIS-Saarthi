# 🇮🇳 Bureau of Indian Standards (BIS) — Intelligent Assistant Platform

[![Live Demo](https://img.shields.io/badge/Production-Live%20Demo-003366?style=for-the-badge&logo=vercel)](https://bis-assistant.vercel.app)
[![CI](https://github.com/Kaustubh-Barad-007/bis-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/Kaustubh-Barad-007/bis-assistant/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)


An intelligent conversational AI platform built for the **Bureau of Indian Standards (BIS)**, Ministry of Consumer Affairs, Food & Public Distribution, Government of India.

Designed to guide citizens, consumers, manufacturers, importers, and BIS officers through Indian Standards (IS), Scheme-I & CRS certification procedures, laboratory testing, Hallmarking authenticity verification, and grievance redressal in **12 major Indian languages**.

---

## 🌟 Key Features

### 1. 🤖 GraphRAG & Multi-Modal AI Assistant
- **Gemini 2.5 Intelligence**: Grounded in official Indian Standards (IS), Quality Control Orders (QCOs), and BIS Product Manuals.
- **Multi-Modal Document & Image Inspection**: Upload product packaging, ISI mark emblems, and compliance certificates for automated verification and flaw detection.
- **Voice Recognition & Speech Output**: Ask queries with live voice dictation and listen to responses read aloud.

### 2. 🌐 12 Indian Languages Localization
Complete UI translations and native language AI prompting across:
- **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, **বাংলা (Bengali)**, **தமிழ் (Tamil)**, **తెలుగు (Telugu)**, **ગુજરાતી (Gujarati)**, **ಕನ್ನಡ (Kannada)**, **മലയാളം (Malayalam)**, **ਪੰਜਾਬੀ (Punjabi)**, **ଓଡ଼ିଆ (Odia)**, and **অসমীয়া (Assamese)**.

### 3. 🎨 Dark & Light Mode Design System
- High-contrast, theme-adaptive glassmorphism UI with official BIS Deep Navy (`#003366`) and Sky Blue accents.
- Seamless light and dark mode toggling.

### 4. 🔍 Verification & Discovery Tools
- **Verify ISI & HUID**: Instantly check 7-digit CM/L license codes and 6-digit gold Hallmarking Unique Identification (HUID) numbers.
- **Standards Directory**: Search over 21,000+ Indian Standards with mandatory QCO status indicators.
- **Testing Laboratory Locator**: Find NABL-accredited and BIS-recognized labs across Indian states.
- **Certification Fee Estimator**: Interactive calculator with MSME / Women / Startup concessions.
- **Standards Clubs**: Join or manage student Standards Clubs across educational institutions.

### 5. 🛡️ Complaints & Grievance Redressal
- Real-time grievance filing with tracking IDs and milestone progression (`Submitted` → `Under Review` → `Resolved`).
- Admin review console with status updates and official notes.

### 6. 🔐 Secure Multi-Role Authentication
- **Role-based views**: Citizen/Consumer, Manufacturer/Importer, and BIS Officer/Admin.
- **6-Digit Email OTP Verification**: Official BIS-branded email templates sent via SMTP with anti-spam optimization.
- **OAuth Integration**: One-click Google and GitHub Sign-In.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Vercel Serverless Functions (`/api`), Node.js, Prisma ORM
- **Database**: Neon Serverless PostgreSQL (Cascading relational tables)
- **AI & Vision**: Google Gemini API (`@google/genai`)
- **Email Delivery**: Nodemailer SMTP with SPF/DKIM compliance headers
- **Deployment**: Vercel Edge Network

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/BaradKaustubh/bis-assistant.git
cd bis-assistant
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
GEMINI_API_KEY="your_gemini_api_key"
JWT_SECRET="your_jwt_secret"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_gmail_app_password"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
VITE_GITHUB_CLIENT_ID="your_github_client_id"
```

### 3. Initialize Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📦 Deployment

Deploy seamlessly to Vercel:
```bash
npx vercel --prod
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
