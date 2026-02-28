# Electron Release Manager - Setup Guide

## Prerequisites

- Node.js 18+ 
- Vercel account with Blob storage enabled
- Supabase account

## Installation

1. **Clone/Extract the project**
   ```bash
   git clone <repository-url>
   cd electron-versioning-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

4. **Initialize the database**

   Open your Supabase dashboard and run the SQL scripts in this order:
   
   - Copy all SQL from `/scripts/001-create-tables.sql` and execute it in the SQL editor
   - Copy all SQL from `/scripts/002-enable-rls.sql` and execute it in the SQL editor

## Database Schema

### releases table
- `id`: UUID (primary key)
- `version`: Text (semantic version)
- `platform`: Text (win32, darwin, linux)
- `filename`: Text (original file name)
- `blob_url`: Text (public blob URL)
- `checksum`: Text (SHA-256 hash)
- `file_size`: Bigint (in bytes)
- `published`: Boolean (is this the latest version?)
- `published_at`: Timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `created_by`: UUID (references auth.users)

### latest_releases table
- `id`: UUID (primary key)
- `platform`: Text (unique per platform)
- `version`: Text (currently published version)
- `release_id`: UUID (references releases)
- `updated_at`: Timestamp

## Running the Application

```bash
npm run dev
# or
pnpm dev
```

Visit http://localhost:3000 to access the application.

## Using the Dashboard

1. **Sign Up** - Create an account at `/auth/sign-up`
2. **Upload Release** - Go to `/dashboard` and use the upload form
3. **Publish Release** - Click "Publish" on an unpublished release to make it the latest version
4. **Access Latest.yml** - Clients can fetch `/api/latest.yml?platform=win32` to get the manifest

## Electron Client Integration

In your Electron app, configure electron-updater:

```javascript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

// Configure the update server
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-deployment.vercel.app/api/latest.yml?platform=win32'
});
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/latest.yml?platform=<platform>` - Latest release manifest (YAML)

### Protected Endpoints (require authentication)
- `POST /api/releases/upload` - Upload a new release binary
- `GET /api/releases/upload` - List all releases
- `POST /api/releases/publish` - Publish a release as latest
- `POST /api/releases/rollback` - Rollback to a previous version

## Deployment

### Deploy to Vercel

```bash
vercel deploy
```

The application will automatically use Vercel's Blob storage for file uploads if configured in your Vercel project.

## Security Notes

- All admin operations (upload, publish, rollback) require authentication
- Row Level Security (RLS) policies restrict users from accessing other users' data
- The `latest.yml` endpoint is public for client updates
- All files are stored with public-read access in Vercel Blob
- Use strong passwords for your Supabase accounts
