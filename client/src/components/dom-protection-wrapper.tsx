import React, { useEffect, useRef, ReactNode } from 'react';

interface DOMProtectionWrapperProps {
  children: ReactNode;
  onDOMError?: (error: Error) => void;
}

/**
 * Wrapper компонент для защиты от DOM ошибок
 * Перехватывает и обрабатывает ошибки removeChild/appendChild
 */
export function DOMProtectionWrapper({ children, onDOMError }: DOMProtectionWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Переопределяем методы DOM для безопасности
    const originalRemoveChild = wrapper.removeChild;
    const originalAppendChild = wrapper.appendChild;

    wrapper.removeChild = function<T extends Node>(child: T): T {
      if (isUnmountedRef.current) {
        console.warn('Попытка removeChild после unmount, игнорируем');
        return child;
      }
      
      try {
        if (this.contains(child) && child.parentNode === this) {
          return originalRemoveChild.call(this, child) as T;
        } else {
          console.warn('Безопасный removeChild: элемент не является дочерним');
          return child;
        }
      } catch (error) {
        const domError = error as Error;
        console.warn('DOM ошибка перехвачена:', domError.message);
        onDOMError?.(domError);
        return child;
      }
    };

    wrapper.appendChild = function<T extends Node>(child: T): T {
      if (isUnmountedRef.current) {
        console.warn('Попытка appendChild после unmount, игнорируем');
        return child;
      }
      
      try {
        if (!this.contains(child)) {
          return originalAppendChild.call(this, child) as T;
        } else {
          console.warn('Безопасный appendChild: элемент уже добавлен');
          return child;
        }
      } catch (error) {
        const domError = error as Error;
        console.warn('DOM ошибка перехвачена:', domError.message);
        onDOMError?.(domError);
        return child;
      }
    };

    return () => {
      isUnmountedRef.current = true;
      // Восстанавливаем оригинальные методы
      if (wrapper) {
        wrapper.removeChild = originalRemoveChild;
        wrapper.appendChild = originalAppendChild;
      }
    };
  }, [onDOMError]);

  return (
    <div ref={wrapperRef} className="dom-protection-wrapper">
      {children}
    </div>
  );
}