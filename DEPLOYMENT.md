# 🚀 Quick Deployment Guide for Vercel

This is your step-by-step guide to deploy the Fruity app to Vercel.

## ✅ Pre-Deployment Checklist

Before deploying, make sure you have:

- [ ] Supabase project created with all required tables
- [ ] Supabase URL and Anon Key ready
- [ ] Email confirmation DISABLED in Supabase (Settings → Auth → Email Confirmations → OFF)
- [ ] Code pushed to GitHub/GitLab/Bitbucket

## 🎯 Deploy Steps

### 1. Push to Git

```bash
cd fruity-base44
git init
git add .
git commit -m "Initial commit - Fruity Base44"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your repository
4. Vercel will detect Vite automatically

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
VITE_SUPABASE_URL=https://mgknigoqqxdajlnepzjo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1na25pZ29xcXhkYWpsbmVwempvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODc3NjMsImV4cCI6MjA4MTQ2Mzc2M30.vJyVgf5IaHwst358o0q9ChQ0g7MaF5UJUYQNzw1ZaZ4
```

### 4. Deploy

Click "Deploy" button and wait for build to complete!

### 5. Configure Supabase Redirect URLs

After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`) and:

1. Go to Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add to **Site URL**: `https://your-app.vercel.app`
4. Add to **Redirect URLs**: `https://your-app.vercel.app/**`
5. Save changes

## ✨ That's It!

Your app should now be live at your Vercel URL!

## 🧪 Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign Up" and create a test account
3. Try creating a fruit listing
4. Check the map page to see listings
5. Test sending a pickup request
6. Verify messages work

## 🐛 Common Issues

### "Missing environment variables" error
- Make sure you added both env vars in Vercel
- Redeploy after adding env vars

### Can't sign in after signup
- Check that email confirmation is DISABLED in Supabase
- Go to Supabase → Settings → Auth → Email Confirmations → Turn OFF

### Map not showing
- Clear browser cache
- Check browser console for errors
- Verify Leaflet CSS is loading

### Redirect loop after login
- Verify redirect URLs in Supabase match your Vercel URL exactly
- Make sure there's no trailing slash difference

## 🔄 Updating Your Deployment

Whenever you push to your main branch, Vercel will automatically rebuild and redeploy!

```bash
git add .
git commit -m "Your update message"
git push
```

## 📱 Custom Domain (Optional)

1. In Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

---

Need help? Check the main [README.md](README.md) for full documentation.
