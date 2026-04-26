// data.js
export const NODOS_REMMI = [
  {
    id: "BUAP-01",
    nombre: "Nodo CU - Puerta 1",
    latitud: 19.0022,
    longitud: -98.2018,
    bicisDisponibles: 4,
    tipo: "Educativo"
  },
  {
    id: "CAPU-01",
    nombre: "Nodo Intermodal CAPU",
    latitud: 19.0635,
    longitud: -98.2001,
    bicisDisponibles: 12,
    tipo: "Transporte Masivo"
  },
  {
    id: "ANGEL-01",
    nombre: "Nodo Plaza Angelópolis",
    latitud: 19.0304,
    longitud: -98.2343,
    bicisDisponibles: 2,
    tipo: "Comercial"
  }
];

// WALLET----------------------------------------SIMULACIÓN DE DATOS DE USUARIO PARA LA BILLETERA 
export const USUARIO_ACTUAL = {
  nombre: "Usuario",
  ecoTokens: 250,
  co2AhorradoKg: 12.5,
  viajesRealizados: 8
};

// Almacenamiento local en memoria para simular la base de datos de la Billetera.
// Modificado para soportar el inicio de sesión
let inMemoryDB = {
  users: {
    'user_123': {
      id: 'user_123',
      nombre: USUARIO_ACTUAL.nombre, 
      email: 'estudiante@buap.mx',
      password: 'password123', // Contraseña inicial para poder inciar sesión (email: estudiante@buap.mx)
      balance: 150.50, // Saldo inicial predeterminado
      cards: [
        { id: 'c_abc', cardNumber: '1234567890123456', expiryDate: '12/28', last4: '3456' }
      ]
    }
  }
};

// Simulamos que el usuario "user_123" es el que está usando la app actual.
let currentUserId = 'user_123';

/**
 * Obtiene el ID del usuario actualmente autenticado.
 */
export const getCurrentUserId = () => {
  return currentUserId;
};

/**
 * Establece el usuario autenticado actual.
 */
export const setCurrentUserId = (id) => {
  currentUserId = id;
};

/**
 * Inicia sesión con email y contraseña.
 */
export const loginUser = async (email, password) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula red
  
  const users = Object.values(inMemoryDB.users);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  
  setCurrentUserId(user.id);
  return user;
};

/**
 * Registra un nuevo usuario.
 */
export const registerUser = async (nombre, email, password) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula red
  
  const users = Object.values(inMemoryDB.users);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("El correo ya está registrado.");
  }
  
  const newId = 'user_' + Math.random().toString(36).substring(2, 11);
  const newUser = {
    id: newId,
    nombre: nombre,
    email: email,
    password: password,
    balance: 0,
    cards: []
  };
  
  inMemoryDB.users[newId] = newUser;
  setCurrentUserId(newId);
  return newUser;
};

/**
 * Obtiene los datos del usuario completo, simulando red.
 */
export const getUserData = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return inMemoryDB.users[userId] || null;
};

/**
 * Recarga el saldo del usuario actual.
 */
export const topUpBalance = async (userId, amount) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (inMemoryDB.users[userId]) {
       inMemoryDB.users[userId].balance += amount;
       return { success: true, balance: inMemoryDB.users[userId].balance };
    } else {
       throw new Error("Usuario no encontrado");
    }
  } catch (error) {
    console.error('Error al recargar saldo:', error);
    throw new Error('Error al procesar el pago.');
  }
};

/**
 * NUEVA VERSIÓN: Añade una nueva tarjeta validando también el CVC y el nombre.
 * @param {string} userId - ID del usuario.
 * @param {Object} newCardInfo - Objeto con { name, number, expiry, cvc }.
 */
export const addCardToUser = async (userId, newCardInfo) => {
  try {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 600));

    // Validación de CVC
    if (!newCardInfo.cvc || newCardInfo.cvc.length < 3) {
      throw new Error("El código CVC/CVV es inválido");
    }

    const last4 = newCardInfo.number.slice(-4);
    const newCardObj = {
      id: Math.random().toString(36).substring(2, 11),
      name: newCardInfo.name, // Se agregó el nombre de la tarjeta
      cardNumber: newCardInfo.number,
      expiryDate: newCardInfo.expiry,
      last4: last4
    };
    
    if (inMemoryDB.users[userId]) {
       inMemoryDB.users[userId].cards.push(newCardObj);
       return { success: true, card: newCardObj, cards: inMemoryDB.users[userId].cards };
    } else {
       throw new Error("Usuario no encontrado");
    }
  } catch (error) {
    console.error('Error al añadir tarjeta:', error);
    throw new Error(error.message || 'Error al añadir la tarjeta.');
  }
};

/**
 * Elimina una tarjeta.
 */
export const removeCardFromUser = async (userId, cardIdToRemove) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (inMemoryDB.users[userId]) {
       inMemoryDB.users[userId].cards = inMemoryDB.users[userId].cards.filter(c => c.id !== cardIdToRemove);
       return { success: true, cards: inMemoryDB.users[userId].cards };
    } else {
        throw new Error("Usuario no encontrado");
    }
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    throw new Error('Error al eliminar la tarjeta.');
  }
};

export const LUGARES_RECOMENDADOS_CENTRO = [
  {
    id: "REC-01",
    nombre: "Zócalo de Puebla",
    descripcion: "El corazón del Centro Histórico. Cuenta con amplias zonas peatonales y ciclopuertos cerca del Palacio Municipal.",
    distancia: "0 km",
    beneficio: "Gana 10 Eco-Tokens al llegar aquí.",
    latitud: 19.0433,
    longitud: -98.1983,
    icono: "map" // Icono ilustrativo
  },
  {
    id: "REC-02",
    nombre: "Calle de los Dulces",
    descripcion: "Disfruta de la gastronomía local. Muestra tu app REMMI en las tiendas participantes para obtener descuentos.",
    distancia: "0.4 km",
    beneficio: "Descuento del 10% con Eco-Tokens.",
    latitud: 19.0445,
    longitud: -98.1950,
    icono: "restaurant" // Icono ilustrativo
  },
  {
    id: "REC-03",
    nombre: "Barrio del Artista",
    descripcion: "Zona cultural ideal para recorrer a pie después de dejar tu bicicleta en el Smart Dock más cercano.",
    distancia: "0.6 km",
    beneficio: "Ruta 100% segura con infraestructura ciclista.",
    latitud: 19.0435,
    longitud: -98.1930,
    icono: "color-palette" // Icono ilustrativo
  },
  {
    id: "REC-04",
    nombre: "Museo Amparo",
    descripcion: "Uno de los museos más importantes. Tiene facilidades para estacionar medios de micro-movilidad.",
    distancia: "0.3 km",
    beneficio: "Entrada 2x1 usando tus Eco-Tokens.",
    latitud: 19.0410,
    longitud: -98.1985,
    icono: "business" // Icono ilustrativo
  }
];
//catalogo de recompensas
export const CATALOGO_RECOMPENSAS = [
  { 
      id: 'RWD-001', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Museo Amparo', 
      descripcion: 'Válido para una entrada general cualquier día de la semana.',
      costoPuntos: 14 
  },
  { 
      id: 'RWD-002', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Fuerte de Loreto', 
      descripcion: 'Conoce la historia de Puebla con esta entrada general.',
      costoPuntos: 9
  },
  { 
      id: 'RWD-003', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Museo de la Evolución', 
      descripcion: 'válido para tu próxima visitas.',
      costoPuntos: 8
  },
  { 
      id: 'RWD-004', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Planetario', 
      descripcion: 'válido para tu próxima visitas.',
      costoPuntos: 10 
  },
{ 
      id: 'RWD-005', 
      tipo: 'Descuento', 
      titulo: 'Viaje estrella de puebla', 
      descripcion: 'Ten un viaje gratis en la estrella de puebla.',
      costoPuntos: 40 
  }, 
    { 
      id: 'RWD-006', 
      tipo: 'Descuento', 
      titulo: 'Viaje carrusel parque sendela', 
      descripcion: 'Ten un viaje gratis en el carrusel parque sendela.',
      costoPuntos: 40 
  }
];