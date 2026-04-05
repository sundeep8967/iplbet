# 🏏 ChaiBet — The Ultimate Squad Betting Platform

ChaiBet is a premium, real-time IPL betting dashboard designed specifically for squads who take their matches seriously. Built with a "Mobile-First" philosophy and a "Premium Minimalism" dark theme, it handles the entire betting lifecycle from match scheduling to automated pot settlement.

## 🌟 Key Features

### ⏱️ Automated Betting Lifecycle
- **Precision Lockout**: Bets are locked **exactly 31 minutes** before a match starts to ensure integrity.
- **Heartbeat Sync**: A 5-second internal heartbeat ensures the "Live" status triggers with zero delay.
- **Live Dashboard**: A dedicated 🔴 LIVE dashboard appears as soon as bets lock, showing the entire squad's picks.

### 🕵️ Squad Transparency & Audit
- **Public Audit Logs**: Every squad member can see the **🏃 SQUAD PICK LOG**—a rolling 3-day history showing exactly when each friend placed or changed their bet.
- **Real-Time Indicators**: Status tags (`UPCOMING`, `LIVE`, `DONE`) and professional IPL acronyms (RCB, CSK, LSG, etc.) keep the interface professional and easy to scan.

### 🏆 Advanced Admin Dashboard
- **Intelligent Settle**: Admins can settle matches manually via a one-click team selector (no text entry!) or use the **🤖 Auto Settle** feature to fetch results via API.
- **Safety Locks**: A mandatory **4-hour lock** prevents premature settlement, ensuring matches are fully completed before pots are distributed.
- **User Management**: Simple tools to manage squad admins and email preferences.

### 💰 Economics of the Squad
- **Automatic Deductions**: ₹10 is automatically deducted for every match, even if you forget to pick (promoting active participation!).
- **Winner-Takes-All**: The total pot is shared equally among those who picked the winning team.

---

## 🛠️ Technical Stack
- **Frontend**: React + Vite + Vanilla CSS (Dynamic Design System)
- **Database**: Firebase Cloud Firestore (Real-time sync)
- **Auth**: Firebase Google Authentication
- **Alerts**: GitHub Actions + Vercel Functions (Automated email reminders)
- **Time Math**: `date-fns` for high-precision lockout logic

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project with Firestore and Google Auth enabled

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase credentials (see `src/services/firebase.js`)
4. Run locally: `npm run dev`

---

## 📈 Roadmap & Next Steps
- [x] High-precision 5-second lockout heartbeat
- [x] Public Squad Pick Logs with acronyms/dates
- [x] 4-hour settlement lockout safety rule
- [ ] Push notifications for match results
- [ ] Multi-season point leaderboards

---

> [!NOTE]
> ChaiBet is built for transparency. Check the **Profile** tab to see exactly when your friends last changed their picks! 🕵️🏏
