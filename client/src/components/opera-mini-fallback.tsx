// Простая страница для пользователей Opera Mini
// Opera Mini не поддерживает современные веб-технологии, поэтому показываем базовую версию

const OperaMiniFallback = () => {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      lineHeight: '1.6'
    }}>
      {/* Заголовок */}
      <div style={{
        backgroundColor: '#5B21B6',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>ДУЧАРХА</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>Экспресс-доставка продуктов</p>
      </div>

      {/* Основное сообщение */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '20px' }}>
          Ваш браузер не поддерживается
        </h2>
        <p style={{ margin: '0 0 15px 0', color: '#666' }}>
          К сожалению, Opera Mini не поддерживает современные веб-технологии, 
          которые необходимы для работы нашего приложения.
        </p>
        <p style={{ margin: '0', color: '#666' }}>
          Чтобы получить полный функционал ДУЧАРХА, пожалуйста, используйте один 
          из рекомендуемых браузеров:
        </p>
      </div>

      {/* Рекомендуемые браузеры */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          Рекомендуемые браузеры:
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Google Chrome</strong> - Отличная поддержка всех функций
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Mozilla Firefox</strong> - Надежный и безопасный
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Opera</strong> (обычная версия) - Быстрый и удобный
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Яндекс.Браузер</strong> - Отлично работает с российскими сайтами
          </li>
          <li style={{ marginBottom: '0' }}>
            <strong>Microsoft Edge</strong> - Современный браузер от Microsoft
          </li>
        </ul>
      </div>

      {/* Информация о приложении */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          Что вас ждет в приложении:
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
          <li style={{ marginBottom: '8px' }}>
            ⚡ Доставка за 10-15 минут
          </li>
          <li style={{ marginBottom: '8px' }}>
            🛒 Широкий ассортимент продуктов
          </li>
          <li style={{ marginBottom: '8px' }}>
            📱 Удобный интерфейс для мобильных устройств
          </li>
          <li style={{ marginBottom: '8px' }}>
            🎯 Персональные предложения и скидки
          </li>
          <li style={{ marginBottom: '0' }}>
            📍 Точное отслеживание заказа
          </li>
        </ul>
      </div>

      {/* Кнопка обновления */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px'
      }}>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#5B21B6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          data-testid="button-reload-page"
        >
          Обновить страницу
        </button>
      </div>

      {/* Футер */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        color: '#999',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0' }}>
          ДУЧАРХА © 2025 | Экспресс-доставка продуктов
        </p>
      </div>
    </div>
  );
};

export default OperaMiniFallback;