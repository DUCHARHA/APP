import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Простейший компонент для тестирования
function TestApp() {
  return (
    <div className="p-4 min-h-screen bg-white">
      <h1 className="text-2xl font-bold text-black mb-4">ДУЧАРХА работает!</h1>
      <p className="text-gray-600 mb-4">Приложение React загружено успешно.</p>
      <button 
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        onClick={() => alert("Кнопка работает!")}
      >
        Тестовая кнопка
      </button>
      <div className="mt-8">
        <a href="/catalog" className="text-blue-600 underline">Попробовать перейти в каталог</a>
      </div>
    </div>
  );
}

// Монтируем приложение
const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<TestApp />);
}