import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export function swVersionPlugin() {
  return {
    name: 'sw-version-replacer',
    buildStart() {
      // Генерируем уникальную версию на основе времени сборки
      const buildVersion = Date.now().toString();
      
      // Путь к файлу сервис-воркера
      const swPath = join(process.cwd(), 'client', 'public', 'sw.js');
      
      try {
        // Читаем файл сервис-воркера
        let swContent = readFileSync(swPath, 'utf8');
        
        // Заменяем placeholder на реальную версию
        swContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);
        
        // Записываем обновленный файл
        writeFileSync(swPath, swContent, 'utf8');
        
        console.log(`✅ Service Worker версия обновлена: ${buildVersion}`);
      } catch (error) {
        console.error('❌ Ошибка при обновлении версии Service Worker:', error);
      }
    },
    buildEnd() {
      // Восстанавливаем placeholder после сборки для разработки
      const swPath = join(process.cwd(), 'client', 'public', 'sw.js');
      
      try {
        let swContent = readFileSync(swPath, 'utf8');
        swContent = swContent.replace(/const CACHE_VERSION = '[^']+';/, "const CACHE_VERSION = '__BUILD_VERSION__';");
        writeFileSync(swPath, swContent, 'utf8');
        console.log('✅ Service Worker placeholder восстановлен');
      } catch (error) {
        console.error('❌ Ошибка при восстановлении placeholder:', error);
      }
    }
  };
}