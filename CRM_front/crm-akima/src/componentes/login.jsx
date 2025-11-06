import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redirigir
import { useAuth } from '../context/AuthContext'; // Nuestro hook de autenticación
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Nuevos estados para manejo de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth(); // Función de nuestro contexto
  const navigate = useNavigate(); // Hook para redirigir

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Empezamos a cargar
    setError(null);     // Limpiamos errores previos

    // Leemos la URL de la API desde las variables de entorno
    const baseURL = import.meta.env.VITE_API_URL;
    const loginURL = `${baseURL}/api/users/login`; // Endpoint correcto

    // Creamos el payload con las claves correctas (Correo, Passwd)
    const payload = {
      Correo: email,
      Passwd: password,
    };

    try {
      const response = await fetch(loginURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Si la API dice que no fue exitoso, lanzamos un error
      if (!data.success) {
        // Usamos el mensaje de error de la API
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // ¡ÉXITO!
      // Llamamos a nuestra función 'login' del contexto con los datos
      login(data.data.user, data.data.token);

      // Redirigimos al usuario al dashboard (próximo paso)
      // Por ahora, redirijamos a la raíz
      navigate('/Home'); 

    } catch (err) {
      // Capturamos cualquier error (de red o de la API)
      setError(err.message);
    } finally {
      // Pase lo que pase, dejamos de cargar
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-green-100 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        
        <h2 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-gray-900">
          Bienvenido a Akima CRM
        </h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ... (Tu campo de Email no cambia) ... */}
          <div>
            <label htmlFor="email" className="...">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@tuempresa.com"
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150"
              disabled={isLoading} // Desactivar durante la carga
            />
          </div>
          
          {/* ... (Tu campo de Contraseña no cambia) ... */}
          <div>
            <label htmlFor="password" className="...">Contraseña</label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150"
                disabled={isLoading} // Desactivar durante la carga
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Botón de Submit */}
          <div>
            <button
              type="submit"
              // Desactivamos el botón y cambiamos el estilo/texto mientras carga
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              {isLoading ? 'Accediendo...' : 'Acceder'}

            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-green-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        
      </div>
    </div>
  );
};