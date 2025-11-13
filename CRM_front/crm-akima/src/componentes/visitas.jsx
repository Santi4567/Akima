export const Visitas = () => {
  
  // --- LÓGICA ---
  // (Aquí irían los useState, useEffect, etc. si los necesitaras)
  const mensaje = "Hola mundo";

  // --- RENDERIZADO (El JSX que se devuelve) ---
  // Todo debe estar envuelto en UN solo elemento (como un <div>)
  return (
    <div>
      <h1>{mensaje}</h1>
      <p>Este es el componente más básico.</p>
    </div>
  );
};