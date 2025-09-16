# 🚀 Чеклист для развертывания Android TWA приложения

## ✅ Контрольный список готовности к Google Play

### 1. Подготовка PWA (Обязательно!)
- [ ] PWA задеплоено на production хостинг с HTTPS
- [ ] Manifest.json доступен по адресу `https://ваш-домен.com/manifest.webmanifest`
- [ ] Service Worker зарегистрирован и работает
- [ ] PWA проходит Lighthouse audit со счетом 80+ баллов

### 2. Обновление Android проекта
- [ ] В `AndroidManifest.xml` заменить `your-production-domain.com` на ваш реальный домен (2 места)
- [ ] Убедиться что домен указан правильно:
  ```xml
  <data android:scheme="https" android:host="вашдомен.com" />
  <meta-data android:value="https://вашдомен.com/" />
  ```

### 3. Создание ключа подписи
- [ ] Создать keystore файл:
  ```bash
  keytool -genkey -v -keystore ducharkha-release-key.keystore -alias ducharkha -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Сохранить пароли и данные в безопасном месте
- [ ] Получить SHA-256 отпечаток:
  ```bash
  keytool -list -v -keystore ducharkha-release-key.keystore -alias ducharkha
  ```

### 4. Digital Asset Links
- [ ] Обновить `assetlinks.json` с реальным SHA-256 отпечатком
- [ ] Загрузить файл на сервер как `https://вашдомен.com/.well-known/assetlinks.json`
- [ ] Проверить доступность файла в браузере
- [ ] Убедиться что JSON валидный

### 5. Настройка сборки
**Для debug сборок (тестирование):**
- [ ] Сборка готова без дополнительной настройки: `./gradlew assembleDebug`

**Для release сборок (Google Play Store):**
- [ ] Раскомментировать и заполнить `signingConfigs.release` в `app/build.gradle`
- [ ] Указать путь к keystore файлу (`../ducharkha-release-key.keystore`)
- [ ] Раскомментировать `signingConfig signingConfigs.release` в release buildType

### 6. Сборка приложения
- [ ] Собрать debug версию для тестирования: `./gradlew assembleDebug`
- [ ] Протестировать debug APK на реальном устройстве
- [ ] Проверить что приложение открывается без адресной строки браузера
- [ ] Собрать release AAB: `./gradlew bundleRelease`

### 7. Финальные тесты
- [ ] Установить debug APK и проверить функционал PWA
- [ ] Убедиться что Digital Asset Links работают (нет URL bar)
- [ ] Проверить что все функции PWA работают корректно
- [ ] Тестирование на разных устройствах Android

### 8. Google Play Console
- [ ] Создать новое приложение в Play Console
- [ ] Заполнить Store Listing (название, описание, скриншоты)
- [ ] Загрузить AAB файл
- [ ] Настроить internal testing
- [ ] Пройти внутреннее тестирование
- [ ] Подать на модерацию в Google Play

## ⚠️ Частые ошибки

### Digital Asset Links не работают
- Файл должен быть доступен по HTTPS
- Проверьте валидность JSON
- SHA-256 должен точно соответствовать keystore
- Путь должен быть точно `/.well-known/assetlinks.json`

### Приложение показывает адресную строку
- Digital Asset Links не настроены или не работают
- Домен в manifest не соответствует реальному
- PWA не соответствует требованиям

### Ошибки при сборке
- Проверьте что все файлы keystore существуют
- Убедитесь что пароли указаны правильно
- Проверьте что signing config правильно настроен

## 📋 Важные файлы

- `app/build.gradle` - конфигурация сборки и подписи
- `AndroidManifest.xml` - домен и метаданные TWA  
- `assetlinks.json` - файл верификации домена
- `ducharkha-release-key.keystore` - ключ подписи для Google Play
- `app-release.aab` - финальный файл для загрузки в Play Store

## 🎯 После публикации

- [ ] Мониторить отчеты об ошибках в Play Console
- [ ] Отслеживать отзывы пользователей
- [ ] Обновлять PWA не затрагивает Android app (автоматическое обновление)
- [ ] При изменении домена - обновить Android app