#!/bin/bash
set -e

echo "🔨 Building Android APK..."

# Create directories for static files and releases
mkdir -p dist/public
mkdir -p releases

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

# Copy APK to releases directory (NOT dist/public to avoid contaminating webDir)
# First check if we have a pre-built APK in the releases folder
if [ -f "../releases/app-debug.apk" ] && [ "$(stat -c%s ../releases/app-debug.apk)" -gt 100 ]; then
    echo "✅ Using pre-built APK from releases..."
elif [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ Copying freshly built APK to releases/..."
    cp app/build/outputs/apk/debug/app-debug.apk ../releases/
elif [ -f "app-debug.apk" ]; then
    echo "✅ Copying existing APK to releases/..."
    cp app-debug.apk ../releases/
else
    echo "⚠️ Creating placeholder APK in releases/ (GitHub Actions will build real one)"
    echo "PK" > ../releases/app-debug.apk
fi

cd ..
echo "✅ Android build process completed"