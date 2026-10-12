# NexusRank AI — Competitor Intelligence & Autonomous Cold Outreach Engine

Fullstack SaaS platform: Kisi bhi website ka URL enter karein, system automatically niche detect karke **50 related competitors**, unka **monthly traffic**, **Google keywords ranking** (Achi ranking % vs Low ranking %), **contact emails**, **Show More (Next 50)** pagination, **Mass Email Outreach**, **AI Auto-Responder Bot**, **PDF & CSV Export**, **Daily 200 Free Emails Quota**, **User Authentication**, aur **Live Remote Public Sharing Link** provide karta hai.

---

## 🌟 Features Overview

### 1. 🔍 Backend & Intelligence Architecture
* **Real Node.js & Express REST Backend (`server.js`)**:
  - `services/nicheDetector.js`: Target URL ke HTML meta tags, title, aur headings ko parse karke exact industry vertical detect karta hai.
  - `services/competitorEngine.js`: 250+ categorized niche domains database aur mathematical modeling ke zariye 50 competitors per batch (aur "Show More" par next 50) generate karta hai.
  - `services/emailService.js`: Nodemailer SMTP engine + safe sandbox simulation mode for batch cold emailing with dynamic tags (`{{company}}`, `{{domain}}`, `{{traffic}}`, `{{high_rank_percent}}`).
  - `services/aiReplyBot.js`: Incoming client replies ka sentiment aur commercial intent detect karta hai aur context-aware intelligent auto-replies send karta hai.
  - `services/authService.js`: User accounts, session login/signup, aur daily 200 free email quota enforcement.

### 2. 📄 PDF & CSV Export
* **CSV Export**: Spreadsheet format me all 50 (ya 100+) competitors ka complete data download hota hai.
* **Executive PDF Report**: `jsPDF` + `AutoTable` ke zariye branded, colorful, multi-page client-ready PDF report download hoti hai jisme target summary boxes aur detailed competitor table shamil hoti hai.

### 3. 💎 Pricing System & Daily 200 Free Emails Limit
* **Free Starter ($0/mo)**: Default plan har bande ke liye rozana **200 Free Emails** allow karta hai.
* **Growth Pro ($49/mo)**: 2,500 Emails / day.
* **Agency Elite ($99/mo)**: Unlimited emails / day.
* Navbar me real-time visual quota tracker: `Free Plan: 198 / 200 Left Today`.

### 4. 👤 Authentication (Sign In & Sign Up)
* Real registration aur login system.
* 1-Click Fast Demo Accounts:
  - `demo@nexusrank.io` (Free 200 limit)
  - `agency@nexusrank.io` (Agency Pro unlimited)

### 5. 🌐 Remote Public Sharing Link (Client Demo)
* Built-in public HTTPS tunnel: Website ko direct apne client ya kisi ke sath share kar sakte hain!
* Terminal me ya top banner me live public URL nazar aata hai.

---

## 🚀 How to Run

### Option A: Local Run
```bash
node server.js
```
*(Ya simply `start.bat` par double click karein)* -> Open `http://localhost:3000`

### Option B: Remote Public Sharing (Client ko bhejne ke liye)
```bash
node server.js --tunnel
```
*(Ya simply `share.bat` par double click karein)* -> Terminal me public HTTPS URL show hoga jo direct client ko send kar sakte hain!
