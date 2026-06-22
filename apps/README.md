# TicTac Arena

A premium startup-grade real-time multiplayer Tic-Tac-Toe platform built with modern web technologies. Experience competitive gaming with ranked matches, AI opponents, tournaments, and global leaderboards.

![TicTac Arena](https://img.shields.io/badge/status-production-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## 🎮 Features

### Game Modes
- **Ranked Matches**: Compete for ELO and climb from Bronze to Legend
- **Casual Play**: Practice without affecting your rank
- **AI Mode**: Train against AI with 4 difficulty levels (Easy, Medium, Hard, Impossible)
- **Tournament System**: Weekly and monthly competitive tournaments
- **Ultimate Tic-Tac-Toe**: Advanced 9-board variant (Coming Soon)

### Progression System
- **ELO-Based Ranking**: Fair matchmaking system
- **7 Rank Tiers**: Bronze → Silver → Gold → Platinum → Diamond → Master → Legend
- **XP & Leveling**: Level up through gameplay
- **Achievements**: Unlock rewards and track milestones
- **Win Streaks**: Build momentum and earn bonuses

### Social Features
- **Global Leaderboards**: Compete against players worldwide
- **Player Profiles**: Showcase your stats and achievements
- **Match History**: Review past games
- **Friends System** (Coming Soon)
- **Chat System** (Coming Soon)

### Economy
- **Coins**: Earn through matches and achievements
- **Cosmetics**: Unlock themes, frames, and effects
- **Daily Rewards**: Login bonuses and missions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **UI Components**: Custom design system

### Backend
- **Runtime**: Node.js (Serverless)
- **Database**: PostgreSQL (Neon)
- **Authentication**: Better Auth with email/password
- **API**: RESTful endpoints

### Game Engine
- **AI Algorithm**: Minimax with Alpha-Beta Pruning
- **State Management**: React-based game state
- **Win Detection**: Optimized pattern matching

## 📁 Project Structure

```
/apps
├── web/
│   ├── src/
│   │   ├── app/                    # Pages and routes
│   │   │   ├── account/           # Auth pages
│   │   │   ├── api/               # Backend API routes
│   │   │   ├── dashboard/         # User dashboard
│   │   │   ├── leaderboard/       # Global rankings
│   │   │   ├── play/              # Game modes
│   │   │   ├── profile/           # User profiles
│   │   │   └── tournaments/       # Tournament system
│   │   ├── components/            # Reusable components
│   │   ├── lib/                   # Game logic & utilities
│   │   └── utils/                 # Helper functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- npm or yarn

### Environment Variables
```env
DATABASE_URL=your_postgres_connection_string
AUTH_SECRET=your_auth_secret
AUTH_URL=http://localhost:3000
```

### Database Schema
The application uses a comprehensive PostgreSQL schema with tables for:
- users & profiles
- matches & moves
- tournaments & participants
- achievements & cosmetics
- friends & messages

## 🎯 Game Features

### AI Difficulty Levels

**Easy**: 70% random moves - Perfect for beginners  
**Medium**: 40% random moves - Moderate challenge  
**Hard**: 15% random moves - Advanced gameplay  
**Impossible**: 100% optimal moves using Minimax with Alpha-Beta pruning - Unbeatable AI

### Ranking System

| Rank | ELO Range |
|------|-----------|
| Bronze | 0 - 799 |
| Silver | 800 - 1099 |
| Gold | 1100 - 1399 |
| Platinum | 1400 - 1699 |
| Diamond | 1700 - 1999 |
| Master | 2000 - 2399 |
| Legend | 2400+ |

### XP Rewards

- Ranked Win: 100 XP
- Ranked Draw: 25 XP
- Casual Win: 50 XP
- AI Win: 30-60 XP (difficulty multiplier)
- Tournament Win: 200 XP

## 🔐 Authentication

- Email/Password authentication
- Secure session management
- Profile creation on signup
- Protected routes

## 📱 Responsive Design

Fully responsive and works perfectly on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Design System

Modern gaming aesthetic with:
- Dark theme (#0B1120 background)
- Purple primary (#6D28D9)
- Cyan accents (#22D3EE)
- High-fidelity SaaS-inspired UI
- Smooth transitions

## 🔄 Game Flow

1. Matchmaking: Find opponents by ELO
2. Game Start: Players assigned X or O
3. Turns: Alternating moves
4. Win Detection: Real-time checking
5. Results: XP/ELO calculation
6. Stats Update: Profile progression

## 📊 API Endpoints

### Profiles
- `GET /api/profiles/[userId]` - Get profile
- `PATCH /api/profiles/[userId]` - Update profile
- `POST /api/profiles/create` - Create profile

### Matches
- `POST /api/matches/complete` - Complete match

### Leaderboard
- `GET /api/leaderboard?type=global` - Get leaderboard

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament

## 🏆 Achievements

Example achievements:
- First Victory
- 10/100/1000 Wins
- Tournament Champion
- Legend Rank
- Win Streak 20
- AI Slayer

## 🌟 Future Features

- Ultimate Tic-Tac-Toe mode
- Friends system
- Private matches
- Live chat
- Spectator mode
- Replays
- More cosmetics
- Daily missions

## 📄 License

Copyright © 2026 TicTac Arena. All rights reserved.

---

**Built with ❤️ for the competitive Tic-Tac-Toe community**
