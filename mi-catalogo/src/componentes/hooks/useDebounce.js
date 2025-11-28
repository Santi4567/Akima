import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 1. Configuramos el timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 2. Limpiamos el timer si el valor cambia antes del retraso (delay)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Se dispara si 'value' o 'delay' cambian

  return debouncedValue;
}