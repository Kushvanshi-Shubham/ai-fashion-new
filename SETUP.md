# 🚀 AI Fashion Extractor Setup Guide

## Quick Fix for Current Issue

Your app is working, but needs environment configuration! The 404 errors you're seeing are because:

1. **Missing Environment Variables**: The AI extraction service needs API keys to function.

## ✅ Required Setup Steps

### Step 1: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

### Step 2: Get Required API Keys

#### OpenAI API Key (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to `.env.local`:
   ```
   OPENAI_API_KEY="sk-your-actual-key-here"
   ```

#### Database URL (Required)
Choose one option:

**Option A: Neon (Recommended - Free tier)**
1. Go to [Neon](https://neon.tech/)
2. Create a free account and database
3. Copy the connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
   ```

**Option B: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create database: `createdb ai_fashion_db`
3. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_fashion_db"
   ```

### Step 3: Run Database Migration

```bash
npx prisma migrate dev
```

### Step 4: Restart Development Server

```bash
npm run dev
```

## 🔧 Testing the Fix

1. Go to `/category-workflow`
2. Upload an image
3. Select category (e.g., "Men's T-Shirts")
4. Click "Extract with AI"
5. Check results at `/extractions`

## 📊 Features Now Available

- ✅ AI-powered attribute extraction
- ✅ Permanent result storage
- ✅ Real-time job status tracking
- ✅ Dashboard with actual statistics
- ✅ Export functionality
- ✅ Extraction history at `/extractions`

## 🐛 Common Issues

### "Job not found" errors
- **Cause**: Missing OPENAI_API_KEY or DATABASE_URL
- **Fix**: Configure environment variables as above

### Database connection errors
- **Cause**: Invalid DATABASE_URL
- **Fix**: Verify connection string format and credentials

### API rate limits
- **Cause**: OpenAI usage limits
- **Fix**: Check your OpenAI billing and usage

## 📁 Project Structure Enhancement

The following files were added/updated to fix the extraction data visibility:

- 📊 **Database Schema**: `prisma/schema.prisma` (ExtractionResult table)
- 🔄 **Job Processing**: `src/lib/queue/worker.ts` (permanent result storage)
- 🔌 **API Endpoints**: `src/app/api/results/` (data retrieval)
- 📱 **UI Pages**: `src/app/extractions/` (results display)
- 📈 **Dashboard**: `src/app/dashboard/` (real statistics)

Your AI Fashion Extractor is now fully functional with persistent data storage! 🎉