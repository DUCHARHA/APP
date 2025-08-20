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
  
  // Заменяем любую версию обратно на placeholder
  swContent = swContent.replace(/const CACHE_VERSION = '[^']+';/, "const CACHE_VERSION = '__BUILD_VERSION__';");
  
  // Записываем обновленный файл
  writeFileSync(swPath, swContent, 'utf8');
  
  console.log('✅ Service Worker placeholder восстановлен');
} catch (error) {
  console.error('❌ Ошибка при восстановлении placeholder:', error);
}