# Deployment Guide

## Frontend - GitHub Pages or Netlify

The frontend is already connected to GitHub at: https://github.com/project1annd2-commits/aud2026

### To deploy frontend to Netlify:
1. Go to [Netlify](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Select GitHub and choose the `aud2026` repository
4. Build settings:
   - Build command: `cd project && npm run build`
   - Publish directory: `project/dist`
5. Click "Deploy site"

## Backend - Render (CLI Deployment)

### Option 1: Blueprint Deployment (Recommended)
The repository includes a `render.yaml` file in `project/server_python/` for Blueprint deployment:

1. Push the code to GitHub (already done)
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" > "Blueprint"
4. Connect your GitHub repository
5. Render will auto-detect the `render.yaml` file
6. Review the configuration and click "Apply"

### Option 2: Manual Web Service Deployment
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" > "Web Service"
3. Configure:
   - Name: `school-audit-api`
   - Root Directory: `project/server_python`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - Example: `mongodb+srv://project1annd2_db_user:mKhiz4Uy6ObbAeGV@cluster0.dvnoiyy.mongodb.net/school_audit_db?appName=Cluster0`
5. Click "Create Web Service"

## Environment Variables Needed

For the backend, ensure these environment variables are set in Render:
- `MONGODB_URI`: MongoDB connection string
- `PORT`: 5000 (optional, defaults to 5000)

## Frontend API Configuration

After deploying the backend, update the frontend to use the Render URL:

Edit `project/src/utils/database.ts` and update the API endpoint:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://your-render-app.onrender.com";
```

Or create a `.env` file in `project/` with:
```
VITE_API_URL=https://your-render-app.onrender.com
```

## Quick Deploy Commands

If you have the Render CLI installed:
```bash
# Login to Render
render login

# Deploy using Blueprint
render blueprint apply
```

Note: The Render CLI can be installed via: `npm install -g @render-com/cli` (requires authentication)
