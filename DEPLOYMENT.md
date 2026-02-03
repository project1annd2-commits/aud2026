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

## Backend - Render (Blueprint Deployment)

The repository now includes `render.yaml` in the root directory for Blueprint deployment.

### Deploy via Render Blueprint:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" > "Blueprint"
3. Connect your GitHub repository `project1annd2-commits/aud2026`
4. Render will auto-detect the `render.yaml` file
5. Review the configuration:
   - Database: `mongo_db` (MongoDB)
   - Web Service: `school-audit-api` (Python/FastAPI)
6. Click "Apply" to deploy

### Environment Variables:
The `render.yaml` includes:
- `MONGODB_URI`: Auto-connected from the mongo_db database
- `PORT`: 5000
- `PYTHONPATH`: project/server_python

## Manual Web Service Deployment (Alternative)

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

## Quick Reference

| Component | Location | Deployment Method |
|-----------|----------|-------------------|
| Frontend | `project/` | Netlify or GitHub Pages |
| Backend | `project/server_python/` | Render Blueprint (render.yaml) |
| Database | MongoDB Atlas | Render managed or external |
