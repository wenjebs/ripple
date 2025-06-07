# XtraReadyProductivity 🎯

> A smart-contract-powered productivity dApp built on the XRP Ledger. Stake XRP, lock tasks, and earn rewards through verified completion — or get slashed if you miss. Powered by decentralized escrow, trustless execution, and real on-chain incentives.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688)](https://fastapi.tiangolo.com/)
[![XRP Ledger](https://img.shields.io/badge/XRP%20Ledger-Testnet-blue)](https://xrpl.org/)

## 🎥 Demo Video

*[Demo video will be added here - showcasing the complete user flow from wallet connection to task completion and XRP staking]*

## 🖼️ Screenshots

### Main Dashboard
*[Screenshot of the main productivity dashboard showing staked goals, task lists, and progress tracking]*

### Wallet Authentication
*[Screenshot of the Xaman wallet authentication flow with QR code]*

### Task Management Interface
*[Screenshot of the task creation and management interface with AI-generated tasks]*

### Photo Submission Modal
*[Screenshot of the task verification system with photo upload functionality]*

### XRP Staking Interface
*[Screenshot of the XRP staking modal and pool visualization]*

## 🔗 XRP Ledger Integration

### How It Works

XtraReadyProductivity leverages the XRP Ledger to create a trustless accountability system:

#### 1. **Wallet Authentication**
- Users authenticate using **Xaman** (formerly XUMM) wallet integration
- Secure challenge-response authentication using XRP wallet signatures
- Supports both browser and xApp environments
- JWT tokens for session management with 7-day expiration

#### 2. **XRP Staking Mechanism**
- Users stake XRP amounts when committing to goals
- Funds are held in a **central pool system** for monthly redistribution
- **Consequence-based rewards**:
  - ✅ **Complete tasks** → Keep deposit + earn bonus from failed users' deposits
  - ❌ **Fail tasks** → Lose entire deposit to community pool

#### 3. **Smart Contract Features**
- **Decentralized escrow** system for holding staked XRP
- **Trustless execution** of reward/penalty logic
- **On-chain transaction verification** for all deposits and withdrawals
- **Transparent pool management** showing total community stake

#### 4. **Transaction Types**
- **Deposit Transactions**: Users stake XRP for goal commitment
- **Reward Distributions**: Monthly automated payouts to successful users
- **Penalty Execution**: Failed users forfeit their stakes to the pool
- **Pool Transparency**: All transactions visible on XRP Ledger

### Technical Implementation

```typescript
// XRP Wallet Integration
const xrpl = require('xrpl')
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")

// Staking Transaction Structure
const stakingTx = {
  TransactionType: "Payment",
  Account: userWallet,
  Destination: POOL_WALLET,
  Amount: xrpl.xrpToDrops(stakeAmount),
  Memos: [{
    Memo: {
      MemoType: "goal_commitment",
      MemoData: goalId
    }
  }]
}
```

## 🎬 Project Explanation Video

*[Video with audio explanation will be added here - A comprehensive Loom-style video covering:]*
- **Project Overview**: How XtraReadyProductivity solves productivity challenges
- **XRP Ledger Integration**: Detailed explanation of staking, rewards, and penalties
- **GitHub Repository Structure**: Code organization and architecture
- **Live Demo**: Complete user flow from onboarding to task completion
- **Technical Architecture**: Frontend, backend, and blockchain components

## 🔍 Block Explorer Links

### XRP Ledger Testnet Transactions

All transactions from our dApp can be viewed on the XRP Ledger Testnet:

- **Pool Wallet Address**: `[POOL_WALLET_ADDRESS]`
- **Recent Staking Transaction**: `[TRANSACTION_HASH_1]`
- **Reward Distribution**: `[TRANSACTION_HASH_2]`
- **Penalty Execution**: `[TRANSACTION_HASH_3]`

**View on XRPL Explorer**: [https://testnet.xrpl.org/](https://testnet.xrpl.org/)

## 🚀 Features

### 🎯 **Goal-Driven Productivity**
- AI-powered task generation using **Google Gemini**
- Progressive difficulty scaling over weeks
- Photo and text-based task verification
- Month/week progress tracking with intuitive navigation

### 💰 **XRP-Powered Incentives**
- Financial commitment through XRP staking
- Community reward pool redistribution
- Real consequences for incomplete goals
- Transparent pool value tracking

### 🔐 **Secure Wallet Integration**
- **Xaman** wallet authentication
- Challenge-response signature verification
- JWT-based session management
- Support for both browser and xApp environments

### 🤖 **AI Task Intelligence**
- Smart task generation based on user goals
- Adaptive difficulty progression
- Multi-modal verification (image/text)
- Automatic completion validation

### 📊 **Progress Visualization**
- Interactive month/week navigation
- Visual progress indicators
- Task completion tracking
- Pool statistics and user standings

## 🏗️ Architecture

### Frontend (Next.js 15.2.4)
```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main dashboard
│   ├── onboarding/        # Goal setup flow
│   └── login/             # Authentication
├── components/            # React Components
│   ├── XamanLogin.tsx     # Wallet authentication
│   ├── task-card.tsx      # Task management
│   └── photo-submission-modal.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.tsx        # Authentication state
│   ├── useGoal.tsx        # Goal management
│   └── useTasks.tsx       # Task operations
└── types/                 # TypeScript definitions
```

### Backend (FastAPI + Python)
```
backend/
├── main.py                # FastAPI application
├── models.py              # Database models
├── routers/               # API endpoints
│   ├── auth.py           # Authentication
│   ├── goals.py          # Goal management
│   ├── tasks.py          # Task operations
│   └── submissions.py    # Task verification
├── services/              # Business logic
│   ├── auth.py           # Wallet authentication
│   └── xrpl_service.py   # XRP Ledger integration
├── ai/                    # AI task generation
│   └── ai.py             # Gemini integration
└── cron/                 # Scheduled jobs
```

### Database Schema
```sql
-- Users table for wallet authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(34) UNIQUE,
    created_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Goals with XRP staking
CREATE TABLE goals (
    id UUID PRIMARY KEY,
    title TEXT,
    duration_weeks INTEGER,
    xrp_amount REAL,
    start_date DATE,
    status VARCHAR(50),
    user_id UUID REFERENCES users(id)
);

-- AI-generated tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    goal_id UUID REFERENCES goals(id),
    week_number INTEGER,
    title TEXT,
    verification_method TEXT,
    expected_data_type VARCHAR(50),
    verified VARCHAR(50)
);

-- Task submissions and verifications
CREATE TABLE submissions (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    submitted_data_url TEXT,
    timestamp TIMESTAMP,
    verification_result TEXT,
    verification_comments TEXT
);
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.8
- **Icons**: Lucide React
- **State Management**: React Hooks + SWR
- **XRP Integration**: XRPL.js 4.0.0, Xumm SDK 1.8.0

### Backend
- **Framework**: FastAPI 0.115.12
- **Language**: Python 3.11+
- **Database**: PostgreSQL with AsyncPG
- **Authentication**: JWT with jose library
- **XRP Integration**: xrpl-py 4.1.0
- **AI**: Google Gemini API
- **Storage**: Supabase

### Blockchain
- **Network**: XRP Ledger Testnet
- **Wallet**: Xaman (XUMM) integration
- **Transactions**: Payment transactions for staking
- **Smart Contracts**: Escrow and conditional payments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Xaman mobile app for wallet authentication

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ripple.git
cd ripple
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/ripple_goals
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
XRPL_NETWORK=testnet
EOF

# Start backend
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_XUMM_API_KEY=your_xumm_api_key
EOF

# Start frontend
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📱 Usage Flow

### 1. **Onboarding**
1. Connect Xaman wallet via QR code
2. Set productivity goal (e.g., "Get fit in 4 weeks")
3. Choose goal duration and difficulty
4. Stake XRP amount for commitment

### 2. **AI Task Generation**
1. System generates weekly tasks using Gemini AI
2. Progressive difficulty increase over weeks
3. Mix of photo and text verification requirements
4. Tasks tailored to specific goal type

### 3. **Daily Usage**
1. View current week's tasks
2. Complete tasks with photo/text evidence
3. Submit verification materials
4. Track progress across weeks/months

### 4. **Reward Cycle**
1. Monthly evaluation of goal completion
2. Successful users keep stake + earn bonus
3. Failed users forfeit stake to community pool
4. Start new goal cycle or continue existing

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET_KEY=your-256-bit-secret

# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# XRP Ledger
XRPL_NETWORK=testnet  # or mainnet
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Wallet Integration
NEXT_PUBLIC_XUMM_API_KEY=your_xumm_api_key
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest

# Test XRP integration
python -m pytest tests/test_xrpl_service.py

# Test AI task generation
python ai/testai.py
```

### Frontend Testing
```bash
cd frontend
npm test

# Test wallet authentication
npm run test:auth

# Test task management
npm run test:tasks
```

## 🚀 Deployment

### Production Deployment Checklist
- [ ] Set production environment variables
- [ ] Configure PostgreSQL production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Set up XRP Ledger mainnet integration
- [ ] Deploy backend to cloud service (Railway, AWS, etc.)
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure production Xaman app credentials

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or deploy individual services
docker build -t xtra-ready-backend ./backend
docker build -t xtra-ready-frontend ./frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript/Python type hints
- Write tests for new features
- Update documentation for API changes
- Test XRP Ledger integration on testnet first

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **XRP Ledger Foundation** for blockchain infrastructure
- **Xaman** team for wallet integration tools
- **Google Gemini** for AI task generation
- **FastAPI** and **Next.js** communities
- **Open Source Contributors**

## 📞 Support

- **Documentation**: Check SETUP.md and XAMAN_AUTH_SETUP.md
- **Issues**: GitHub Issues tab
- **XRP Ledger**: [XRPL Documentation](https://xrpl.org/docs.html)
- **Xaman Integration**: [Xaman Developer Docs](https://docs.xaman.dev/)

---

**Built with ❤️ for the XRP Ledger ecosystem** • **Stake. Focus. Earn. Repeat.**