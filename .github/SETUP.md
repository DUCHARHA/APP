# Настройка GitHub Actions для сборки Android приложения

## ⚠️ ВАЖНО: Удалите дублирующиеся файлы

У вас есть дублирующиеся workflow файлы. **Удалите следующие файлы вручную:**
- `.github/workflows/build-apk.yml` ❌ (удалить)
- `.github/workflows/build-aab.yml` ❌ (удалить)

**Оставьте только эти файлы:**
- `.github/workflows/build-android.yml` ✅ (оставить)
- `.github/workflows/build-android-release.yml` ✅ (оставить)

## Обзор

В вашем проекте настроены два основных GitHub Actions workflow:

1. **Build Android APK** (`build-android.yml`) - собирает debug APK при каждом push
2. **Build Android Release AAB** (`build-android-release.yml`) - собирает release AAB (подписанный) для публикации в Google Play

## Исправленная проблема

**Проблема была:** Workflows не запускались, потому что у них был фильтр `paths:`, который срабатывал только при изменениях в папках `android/` или `client/`. Когда вы делали push из Replit с изменениями в других файлах, workflows пропускались.

**Решение:** Фильтр `paths:` был удален, теперь workflows запускаются при **каждом push** в ветки `main` или `master`.

## Что происходит автоматически

### При каждом push в main/master:
- ✅ Собирается debug APK
- ✅ Собирается release AAB (если настроены секреты для подписи)
- ✅ Артефакты сохраняются и доступны для скачивания
- ✅ APK/AAB файлы копируются в `server/public/` и коммитятся в репозиторий

## Настройка GitHub Secrets (для подписанного AAB)

Для создания подписанного AAB файла нужно настроить 4 секрета в вашем GitHub репозитории:

### Шаг 1: Создание Keystore (если еще нет)

Если у вас уже есть keystore файл, переходите к Шагу 2.

```bash
keytool -genkey -v -keystore release.keystore -alias ducharkha -keyalg RSA -keysize 2048 -validity 10000
```

Запомните:
- Пароль keystore (KEYSTORE_PASSWORD)
- Alias ключа (обычно "ducharkha")
- Пароль ключа (KEY_PASSWORD)

### Шаг 2: Конвертация Keystore в Base64

```bash
base64 -i release.keystore -o keystore-base64.txt
```

Или на macOS:
```bash
base64 -i release.keystore > keystore-base64.txt
```

### Шаг 3: Добавление секретов в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. Откройте Settings → Secrets and variables → Actions
3. Нажмите "New repository secret" и добавьте:

| Имя секрета | Значение | Описание |
|-------------|----------|----------|
| `ANDROID_KEYSTORE_B64` | Содержимое файла `keystore-base64.txt` | Base64 keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Ваш пароль keystore | Пароль от keystore |
| `ANDROID_KEY_ALIAS` | Обычно "ducharkha" | Alias ключа |
| `ANDROID_KEY_PASSWORD` | Ваш пароль ключа | Пароль от ключа |

### Шаг 4: Проверка

После настройки секретов:
1. Сделайте любое изменение в коде
2. Сделайте commit и push в GitHub
3. Перейдите на вкладку "Actions" в вашем репозитории
4. Вы увидите два workflow: "Build APK" и "Build AAB"
5. Дождитесь завершения сборки (обычно 3-5 минут)
6. Скачайте готовые файлы из раздела "Artifacts"

## Скачивание готовых файлов

После успешной сборки:

1. Перейдите на вкладку "Actions" в GitHub
2. Выберите последний успешный workflow run
3. Прокрутите вниз до раздела "Artifacts"
4. Скачайте:
   - `ducharkha-debug-apk` - для тестирования
   - `app-release-aab` - для публикации в Google Play

## Создание Release

Для создания официального релиза:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions автоматически:
- Соберет подписанный AAB
- Создаст Release на GitHub
- Прикрепит AAB файл к релизу

## Устранение проблем

### Workflow не запускается?
- Убедитесь, что файлы находятся в `.github/workflows/`
- Проверьте, что вы делаете push в ветку `main` или `master`
- ❗ Удалите дублирующиеся файлы `build-apk.yml` и `build-aab.yml` (см. раздел "ВАЖНО" выше)
- Убедитесь, что в workflow файлах НЕТ секции `paths:` под `on.push:`

### Ошибка при сборке AAB?
- Проверьте, что все 4 секрета настроены правильно
- Убедитесь, что base64 файл скопирован полностью (без пробелов и переносов строк)

### Где найти собранные файлы?
- Перейдите: Actions → выберите workflow → Artifacts (внизу страницы)

## Дополнительная информация

- **Debug APK**: можно установить на любое Android устройство для тестирования
- **Release AAB**: используется для публикации в Google Play Store
- **Срок хранения**: APK - 30 дней, AAB - 90 дней

---

Создано: Октябрь 2025
