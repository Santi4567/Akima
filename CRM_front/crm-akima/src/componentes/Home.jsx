// src/pages/Home.jsx
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold">¡Bienvenido a Home!</h1>
      <p className="mt-4 text-lg">Has iniciado sesión como: {user?.nombre}</p>
      <p>Tu rol es: <span className="font-semibold">{user?.rol}</span></p>

      <button
        onClick={logout}
        className="mt-8 rounded-md bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};