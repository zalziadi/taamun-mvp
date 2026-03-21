#!/bin/bash
# Run this in your Mac Terminal to push the latest changes to Vercel
cd "$(dirname "$0")"
echo "📦 Pushing to GitHub..."
git push origin main
echo ""
echo "✅ Done! Vercel will build automatically."
echo "🔗 Check: https://taamun-mvp.vercel.app"
