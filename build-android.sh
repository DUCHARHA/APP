#!/bin/bash
set -e

echo "🔨 Building Android APK..."

# Create public directory for static files
mkdir -p dist/public

# Build web client first - MUST succeed for valid APK
npm run build

# Try to build Android APK if possible
cd android-app
if [ -f "gradlew" ]; then
    echo "Using gradle wrapper..."
    ./gradlew assembleDebug --no-daemon --quiet
elif command -v gradle &> /dev/null; then
    echo "Using system gradle..."
    gradle assembleDebug --no-daemon --quiet
else
    echo "No gradle found, creating placeholder APK"
fi

# Copy APK to public directory
# First check if we have a pre-built APK in the repo (from GitHub Actions)
if [ -f "../dist/public/app-debug.apk" ] && [ "$(stat -c%s ../dist/public/app-debug.apk)" -gt 100 ]; then
    echo "✅ Using pre-built APK from repository..."
elif [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ Copying freshly built APK..."
    cp app/build/outputs/apk/debug/app-debug.apk ../dist/public/
elif [ -f "app-debug.apk" ]; then
    echo "✅ Copying existing APK..."
    cp app-debug.apk ../dist/public/
else
    echo "⚠️ Creating placeholder APK (GitHub Actions will build real one)"
    echo "PK" > ../dist/public/app-debug.apk
fi

cd ..
echo "✅ Android build process completed"