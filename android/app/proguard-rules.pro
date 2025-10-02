# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor и Cordova правила
-keep class com.getcapacitor.** { *; }
-keep class com.ionicframework.capacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# WebView с JavaScript интерфейсом
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Сохранение атрибутов для отладки
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Общие правила для Android
-keep class androidx.** { *; }
-keep class android.support.** { *; }

# Геолокация и уведомления
-keep class com.google.android.gms.location.** { *; }
-keep class androidx.core.app.NotificationCompat { *; }

# JSON и сериализация
-keepattributes *Annotation*,Signature
-keep class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Capacitor плагины
-keep class com.ducharha.delivery.** { *; }

# Сетевые библиотеки
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**

# Multidex поддержка
-keep class androidx.multidex.** { *; }
