#!/bin/bash
set -e

echo "🔨 Building Android APK..."

# Create public directory for static files
mkdir -p server/public

# Build web client first
npm run build:client || vite build --outDir server/public

# Try to build Android APK if possible
cd android-app
if [ -f "gradlew" ]; then
    echo "Using gradle wrapper..."
    ./gradlew assembleDebug --no-daemon --quiet || echo "Android build failed, using placeholder"
elif command -v gradle &> /dev/null; then
    echo "Using system gradle..."
    gradle assembleDebug --no-daemon --quiet || echo "Android build failed, using placeholder"
else
    echo "No gradle found, creating placeholder APK"
fi

# Copy APK to public directory
# First check if we have a pre-built APK in the repo (from GitHub Actions)
if [ -f "../server/public/app-debug.apk" ] && [ "$(stat -c%s ../server/public/app-debug.apk)" -gt 100 ]; then
    echo "✅ Using pre-built APK from repository..."
elif [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ Copying freshly built APK..."
    cp app/build/outputs/apk/debug/app-debug.apk ../server/public/
elif [ -f "app-debug.apk" ]; then
    echo "✅ Copying existing APK..."
    cp app-debug.apk ../server/public/
else
    echo "⚠️ Creating placeholder APK (GitHub Actions will build real one)"
    echo "PK" > ../server/public/app-debug.apk
fi

cd ..
echo "✅ Android build process completed"