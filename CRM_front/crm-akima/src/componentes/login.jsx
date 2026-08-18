import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Importamos las imágenes del carrusel desde la carpeta assets
import bgImage1 from '../assets/fondo1.jpg';
import bgImage2 from '../assets/fondo3.jpg';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el carrusel de fondo
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = [bgImage1, bgImage2];

  const { login } = useAuth();
  const navigate = useNavigate();

  // Efecto para cambiar la imagen cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prevIndex) => 
        prevIndex === backgrounds.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [backgrounds.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const baseURL = import.meta.env.VITE_API_URL;
    const loginURL = `${baseURL}/api/users/login`;

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
        credentials: 'include', 
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      await login(); 
      navigate('/home');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Lado Izquierdo: Carrusel de Imágenes & Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        
        {/* Imágenes del carrusel con transición de opacidad */}
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentBg ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}

        {/* Capa de oscurecimiento (Overlay) para que el texto sea legible */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />

        {/* Contenido sobre el carrusel */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white font-black text-xl">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Alkima CRM</span>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
            Plataforma de Gestión Empresarial
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-lg">
            Control total de tu negocio en un solo lugar.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed drop-shadow-md">
            Optimiza flujos de trabajo, gestiona clientes e inventarios con alta precisión y rapidez.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Alkima CRM. Todos los derechos reservados.
        </div>
      </div>

      {/* Lado Derecho: Formulario de Login */}
      <div className="flex w-full items-center justify-center bg-slate-900/50 p-6 backdrop-blur-xl lg:w-1/2">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-10">
          
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-slate-400">
              Ingresa tus credenciales para acceder a tu panel
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="space-y-1.5">
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@tuempresa.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                disabled={isLoading}
              />
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Contraseña
                </label>
                <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline">
                  ¿La olvidaste?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'} 
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-white focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Botón Submit con Spinner */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:bg-emerald-500 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                'Entrar al panel'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};