# 🐄 PashuBazaar — India's Livestock Marketplace

PashuBazaar is a modern, high-performance marketplace built for farmers and livestock traders in India. It enables users to browse, buy, and sell cows, buffaloes, goats, sheep, and pets with trust and transparency.

**Live Demo:** [model-mauve.vercel.app](https://model-mauve.vercel.app)

## 🚀 Features

- **Multi-Step Listings:** detailed forms for livestock specs (breed, milk yield, age, health status).
- **Verified Listings:** Integrated badge system for vaccinated and phone-verified sellers.
- **Supabase Integration:** Real-time database, Auth (Phone/Google), and Storage for listing photos.
- **Premium Boosting:** Realistic multi-step payment simulation for featured listings.
- **PWA Ready:** Installable on mobile devices with offline manifest support.
- **Admin Dashboard:** Secure panel for managing users, listings, and reports.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS.
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Security:** RLS (Row Level Security) and Vercel security headers.

## 📦 Setup Instructions

1. **Clone the repo:**
   ```bash
   git clone https://github.com/GuGan74/model.git
   cd pashubazaar-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file based on `.env.example`:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_DEMO_MODE=true # Set to false for real OTP verification
   ```

4. **Database Configuration:**
   Run the following SQL files in the Supabase SQL Editor in order:
   - `create_tables.sql` (Initial schema)
   - `create_favorites.sql`
   - `create_notifications.sql`
   - `create_reports.sql`
   - `rls_production.sql` (Critical security policies)

5. **Run Locally:**
   ```bash
   npm run dev
   ```

## 🛡️ Security Note

The `rls_production.sql` file contains critical Row Level Security policies. **You MUST run this in your Supabase SQL Editor** to prevent unauthorized data access or deletion.

## 📄 License

MIT License.
