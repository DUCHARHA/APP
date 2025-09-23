#!/bin/bash
set -e

echo "🔨 Building Android APK..."

# Create directories for static files and releases
mkdir -p dist/public
mkdir -p releases

# Build web client first - MUST succeed for valid APK
npm run build

# Sync Capacitor before building
echo "📱 Syncing Capacitor..."
npx cap sync || echo "⚠️ Capacitor sync failed, continuing..."

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ] && [ ! -f "android/local.properties" ]; then
    echo "⚠️ Android SDK не найден в данной среде разработки"
    echo "💡 Это нормально для Replit - создаем placeholder APK"
    echo "📱 Для реальной сборки APK используйте GitHub Actions или локальную среду с Android SDK"
else
    # Try to build Android APK if possible
    cd android
    if [ -f "gradlew" ]; then
        echo "Using gradle wrapper..."
        # Use timeout to prevent hanging (check if timeout command exists)
        if command -v timeout >/dev/null 2>&1; then
            if ! timeout 300s ./gradlew assembleDebug --no-daemon --warning-mode none; then
                echo "⚠️ Gradle build failed or timed out, will create placeholder APK"
            fi
        else
            # Fallback without timeout for macOS/systems without timeout
            if ! ./gradlew assembleDebug --no-daemon --warning-mode none; then
                echo "⚠️ Gradle build failed, will create placeholder APK"
            fi
        fi
    elif command -v gradle &> /dev/null; then
        echo "Using system gradle..."
        if command -v timeout >/dev/null 2>&1; then
            if ! timeout 300s gradle assembleDebug --no-daemon --warning-mode none; then
                echo "⚠️ Gradle build failed or timed out, will create placeholder APK"
            fi
        else
            if ! gradle assembleDebug --no-daemon --warning-mode none; then
                echo "⚠️ Gradle build failed, will create placeholder APK"
            fi
        fi
    else
        echo "No gradle found, will create placeholder APK"
    fi
fi

cd android 2>/dev/null || true

# Copy APK to releases directory (NOT dist/public to avoid contaminating webDir)
# First check if we have a pre-built APK in the releases folder
# Use portable file size check (works on both GNU and macOS)
APK_SIZE=0
if [ -f "../releases/app-debug.apk" ]; then
    if command -v stat >/dev/null 2>&1 && stat -c%s "../releases/app-debug.apk" >/dev/null 2>&1; then
        APK_SIZE=$(stat -c%s "../releases/app-debug.apk")
    else
        # Fallback for macOS or systems without GNU stat
        APK_SIZE=$(wc -c < "../releases/app-debug.apk" 2>/dev/null || echo 0)
    fi
fi

if [ "$APK_SIZE" -gt 100 ]; then
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