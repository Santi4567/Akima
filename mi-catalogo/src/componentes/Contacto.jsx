import React from 'react';

// ===============================================
// ⚙️ VARIABLES DE CONFIGURACIÓN (MODIFICABLES) ⚙️
// ===============================================

const CONTACT_INFO = {
  phone: "+52 55 1234 5678",
  email: "contacto@alkimia.com.mx",
  address: "Av. Paseo de la Reforma 296, Juárez, 06600 Ciudad de México, CDMX",
  // Coordenadas para el mapa (ejemplo: Torre Mayor, CDMX)
  latitude: 19.4239857,
  longitude: -99.167265,
  googleMapsUrl: "https://maps.app.goo.gl/TUq1WJc1hX9n5Zk77", // URL de la ubicación
};

// ===============================================

export const Contacto = () => {
  // Genera el enlace de Google Maps con las coordenadas
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${CONTACT_INFO.latitude},${CONTACT_INFO.longitude}&query_place_id=ChIJFz0_qgL-_YURJ-v1K4b54eY`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-green-950 mb-4 font-serif">
          Contáctanos
        </h1>
        <p className="text-xl text-gray-600">
          Estamos aquí para ayudarte a encontrar la solución química perfecta para tus cultivos.
        </p>
      </div>

      {/* --- SECCIÓN DE CONTACTO Y MAPA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1 & 2: DETALLES DE CONTACTO */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Tarjeta de Teléfono */}
          <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`} className="block p-6 bg-white border border-green-950/20 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-green-950 flex items-center mb-3">
              <svg className="w-6 h-6 mr-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Llámanos
            </h2>
            <p className="text-lg text-gray-700 font-semibold">{CONTACT_INFO.phone}</p>
          </a>

          {/* Tarjeta de Correo */}
          <a href={`mailto:${CONTACT_INFO.email}`} className="block p-6 bg-white border border-green-950/20 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-green-950 flex items-center mb-3">
              <svg className="w-6 h-6 mr-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Envíanos un Email
            </h2>
            <p className="text-lg text-gray-700 font-semibold">{CONTACT_INFO.email}</p>
          </a>
          
          {/* Tarjeta de Dirección */}
          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-green-950/20 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
             <h2 className="text-2xl font-bold text-green-950 flex items-center mb-3">
                <svg className="w-6 h-6 mr-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Nuestra Oficina
             </h2>
             <p className="text-lg text-gray-700">{CONTACT_INFO.address}</p>
             <p className="mt-2 text-sm text-green-600 font-medium">Ver en Google Maps →</p>
          </a>

        </div>

        {/* COLUMNA 3: MAPA EMBEBIDO */}
        <div className="lg:col-span-2 bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
          <h3 className="p-4 bg-green-950 text-white font-bold text-lg">
            Ubicación Central
          </h3>
          <div className="relative h-96 w-full">
            {/* Usamos la URL de Google Maps para incrustar el mapa (iframe). 
              Es la forma más sencilla sin una clave de API.
              La URL incrustada se genera a partir de las coordenadas.
            */}
            <iframe
              title="Ubicación de Alkimia"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${CONTACT_INFO.latitude},${CONTACT_INFO.longitude}&z=15&output=embed`}
              allowFullScreen=""
              aria-hidden="false"
              tabIndex="0"
              className="absolute top-0 left-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};