# 🔨 Инструкции по сборке ДУЧАРХА Android App (.aab для Google Play)

## ✅ **Статус подготовки:**
- ✅ PWA задеплоено: `https://ducharha.onrender.com`
- ✅ Android манифест обновлен с production доменом
- ⏳ **Следующие шаги:** Создание keystore и сборка AAB

## 📋 **Шаг 1: Создание ключа подписи (keystore)**

В директории `android-app/` выполните команду:

```bash
keytool -genkey -v -keystore ducharkha-release-key.keystore -alias ducharkha -keyalg RSA -keysize 2048 -validity 10000
```

### **Заполните данные при создании keystore:**
```
Enter keystore password: [ПРИДУМАЙТЕ НАДЕЖНЫЙ ПАРОЛЬ]
Re-enter new password: [ПОВТОРИТЕ ПАРОЛЬ]
What is your first and last name? [Ваше имя или название компании]
What is the name of your organizational unit? [IT Department]
What is the name of your organization? [DUCHARKHA]
What is the name of your City or Locality? [Душанбе]
What is the name of your State or Province? [Таджикистан]
What is the two-letter country code for this unit? [TJ]
Is CN=... correct? [yes]

Enter key password for <ducharkha>: [НАЖМИТЕ ENTER или укажите отдельный пароль]
```

### ⚠️ **КРИТИЧЕСКИ ВАЖНО:**
- **Сохраните файл `ducharkha-release-key.keystore`** в безопасном месте
- **Запишите все пароли** - без них невозможно обновлять приложение в Google Play
- **Сделайте резервную копию** keystore файла

## 📋 **Шаг 2: Получение SHA-256 отпечатка**

```bash
keytool -list -v -keystore ducharkha-release-key.keystore -alias ducharkha
```

**Найдите строку вида:**
```
SHA256: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00
```

**Скопируйте SHA-256 отпечаток ТОЧНО КАК ЕСТЬ (с двоеточиями):**
`AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00`

## 📋 **Шаг 3: Обновление assetlinks.json**

1. **Откройте файл** `android-app/assetlinks.json`
2. **Замените** `PLACEHOLDER_SHA256_FINGERPRINT` на ваш SHA-256 отпечаток (с двоеточиями!)
3. **КРИТИЧЕСКИ ВАЖНО:** Скопируйте файл на ваш веб-сайт:
   - Скопируйте `assetlinks.json` в `client/public/.well-known/assetlinks.json`
   - Закоммитьте и задеплойте изменения на Render
   - Проверьте доступность: https://ducharha.onrender.com/.well-known/assetlinks.json

**Пример правильного файла:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.ducharkha.delivery",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00"
      ]
    }
  }
]
```

## 📋 **Шаг 4: Настройка подписи в build.gradle**

Откройте `android-app/app/build.gradle` и раскомментируйте/обновите:

```gradle
signingConfigs {
    release {
        storeFile file('ducharkha-release-key.keystore')
        storePassword 'ваш-keystore-пароль'
        keyAlias 'ducharkha'
        keyPassword 'ваш-key-пароль'
    }
}

buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release
    }
}
```

## 📋 **Шаг 5: Проверка Digital Asset Links**

**До сборки** убедитесь что файл доступен по адресу:
`https://ducharha.onrender.com/.well-known/assetlinks.json`

**Если файла нет** - TWA не будет работать в полноэкранном режиме!

## 📋 **Шаг 6: Сборка AAB файла**

```bash
# В директории android-app/
# Если есть Gradle Wrapper:
./gradlew bundleRelease

# Или с локальной установкой Gradle:
gradle bundleRelease

# Или через Android Studio:
# File > Build > Generate Signed Bundle/APK > Android App Bundle
```

**Готовый AAB файл будет в:**
`android-app/app/build/outputs/bundle/release/app-release.aab`

**⚠️ Важно:** При публикации в Google Play используйте **Play App Signing**. Получите SHA-256 отпечаток App Signing Certificate с Play Console и добавьте его в assetlinks.json.

## 📋 **Шаг 7: Тестирование (рекомендуется)**

**Сначала соберите debug версию для тестирования:**
```bash
# Если есть Gradle Wrapper или локальный Gradle:
./gradlew assembleDebug
# Или: gradle assembleDebug

# Или через Android Studio:
# Build > Build Bundle(s)/APK(s) > Build APK(s)
```

**Установите на устройство:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Проверьте что:**
- ✅ Приложение открывается
- ✅ Загружается ваш PWA сайт
- ✅ Нет адресной строки браузера (если Digital Asset Links настроены)
- ✅ Все функции PWA работают

## 🚀 **Финальный результат:**

Файл `app-release.aab` готов для загрузки в Google Play Console!

## 📱 **Загрузка в Google Play:**

1. Перейдите в [Google Play Console](https://play.google.com/console/)
2. Создайте новое приложение
3. Загрузите AAB файл в "Релизы приложения"
4. Заполните Store Listing (используйте материалы из README.md)
5. Отправьте на модерацию

---
**✅ После выполнения всех шагов у вас будет полноценное Android приложение для Google Play Store!**