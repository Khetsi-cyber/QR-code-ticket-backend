# QR Bus Ticketing System - Supabase Version

A modern bus ticketing system with QR code generation, built with React and Supabase.

## Features

### Passenger Features
- **First-time Registration**: New passengers can easily register before their first booking
- **Bus Capacity Check**: See available seats before booking (max 60 passengers per bus)
- **Multi-step Booking Flow**:
  1. Select an available bus
  2. Choose departure point
  3. Select destination from available routes
  4. View fare and confirm
  5. Get QR code ticket instantly
- **My Tickets**: View all your past and current tickets
- **No Payment Required** (payment integration coming later)

### Admin Features
- **Dashboard with Real-time Stats**: View today's tickets and revenue
- **Bus Capacity Monitoring**: Track how full each bus is
- **QR Code Scanner**: Scan and verify tickets
- **Ticket Management**: Mark tickets as used
- **Recent Tickets View**: See all recent bookings

## Tech Stack

- **Frontend**: React 18, React Router
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **QR Code**: qrcode.react for generation, @blackbox-vision/react-qr-reader for scanning
- **Authentication**: Supabase Auth with email/password

## Quick Start

**New to Supabase?** Follow the detailed **[SETUP_GUIDE.md](SETUP_GUIDE.md)** with step-by-step instructions!

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy **Project URL** and **anon public key** from Settings → API

### 2. Set up Database

1. Open **SQL Editor** in Supabase (left sidebar)
2. Run all SQL commands from `SUPABASE_SETUP.md`

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env and paste your Supabase URL and anon key
npm install --legacy-peer-deps
npm start
```

### 4. Create Admin User

Sign up through the app, then in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

**Need help?** See detailed instructions in **[SETUP_GUIDE.md](SETUP_GUIDE.md)**

## Usage

### Passengers
1. Select "Passenger" → Register (first time) or Sign In
2. Select bus → Choose departure → Pick destination → Confirm → Get QR code

### Admin
1. Sign in with admin credentials
2. Scan QR codes to verify tickets
3. View stats and manage capacity

## Project Structure

```
/
├── SUPABASE_SETUP.md    - Database schema and setup SQL
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── supabaseClient.js
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

## Requirements Met

✅ Passenger must register if first-time user  
✅ Credentials saved for next login  
✅ Bus capacity check (max 60 passengers)  
✅ Multi-step booking: bus → departure → destination → fare → checkout  
✅ QR code generation  
✅ No payment required (pending integration)  

## Coming Soon

- Payment integration (Stripe/PayPal)
- Email/SMS notifications
- Ticket refunds
- Mobile app

## License

MIT
