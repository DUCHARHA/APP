# 🚀 GitHub Actions - Автоматическая сборка Android AAB

## ✅ Настройка GitHub Secrets

Для безопасной автоматической сборки Android AAB необходимо добавить следующие секреты в ваш GitHub репозиторий:

### 🔑 Требуемые секреты:

1. **ANDROID_KEYSTORE_B64** - Base64 закодированный keystore файл
2. **ANDROID_KEYSTORE_PASSWORD** - пароль keystore  
3. **ANDROID_KEY_ALIAS** - alias ключа
4. **ANDROID_KEY_PASSWORD** - пароль ключа

### 📋 Инструкция по настройке:

#### Шаг 1: Подготовка keystore в Base64
```bash
# В директории android-app/
base64 -i ducharkha-release-key.keystore
```

Скопируйте полученную строку Base64 - это значение для `ANDROID_KEYSTORE_B64`.

#### Шаг 2: Добавление секретов в GitHub

1. Перейдите в ваш GitHub репозиторий
2. Откройте: **Settings** → **Secrets and variables** → **Actions**  
3. Нажмите **New repository secret**
4. Добавьте каждый секрет:

| Имя секрета | Значение |
|-------------|----------|
| `ANDROID_KEYSTORE_B64` | Base64 строка из Шага 1 |
| `ANDROID_KEYSTORE_PASSWORD` | `[ваш пароль keystore]` |
| `ANDROID_KEY_ALIAS` | `[ваш alias ключа]` |
| `ANDROID_KEY_PASSWORD` | `[ваш пароль ключа]` |

### 🔨 Запуск сборки

После настройки секретов вы можете:

1. **Автоматический запуск**: Сделать commit в ветку `main` с изменениями в папках `android-app/` или `client/`

2. **Ручной запуск**:
   - Перейдите в **Actions** → **Build Android Release AAB**
   - Нажмите **Run workflow** → **Run workflow**

### 📦 Получение готового AAB файла

После успешной сборки:

1. Перейдите в **Actions** → выберите успешный workflow
2. В разделе **Artifacts** скачайте `app-release-aab`
3. Извлеките файл `app-release.aab` из архива
4. Готово! Файл можно загружать в Google Play Console

### ⚠️ Важные замечания

- **Keystore файл удален из репозитория** для безопасности
- Все секреты хранятся в GitHub Secrets, а не в коде
- SHA-256 отпечаток вашего ключа: `5B:F9:36:70:12:35:26:64:BC:DE:D5:17:BE:CE:E4:0C:06:13:DD:AF:28:60:90:FA:2A:9B:25:D7:6F:85:12:64`
- Digital Asset Links уже обновлен и доступен по адресу: https://ducharha.onrender.com/.well-known/assetlinks.json

### 🎯 Результат

После сборки вы получите подписанный файл `app-release.aab`, готовый для публикации в Google Play Store, что уберет адресную строку в TWA приложении.

---
**✅ Система готова к автоматической сборке production AAB файлов!**