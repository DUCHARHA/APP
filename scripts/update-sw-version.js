#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к файлу сервис-воркера
const swPath = join(__dirname, '..', 'client', 'public', 'sw.js');

try {
  // Читаем файл сервис-воркера
  let swContent = readFileSync(swPath, 'utf8');
  
  // Генерируем уникальную версию на основе текущего времени
  const buildVersion = Date.now().toString();
  
  // Заменяем placeholder на реальную версию
  swContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);
  
  // Записываем обновленный файл
  writeFileSync(swPath, swContent, 'utf8');
  
  console.log(`✅ Service Worker версия обновлена: ${buildVersion}`);
} catch (error) {
  console.error('❌ Ошибка при обновлении версии Service Worker:', error);
  process.exit(1);
}