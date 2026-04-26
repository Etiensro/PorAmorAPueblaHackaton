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
  nombre: "Estudiante BUAP",
  ecoTokens: 250,
  co2AhorradoKg: 12.5,
  viajesRealizados: 8
};

// Almacenamiento local en memoria para simular la base de datos de la Billetera.
let inMemoryDB = {
  users: {
    'user_123': {
      id: 'user_123',
      nombre: USUARIO_ACTUAL.nombre, 
      email: 'estudiante@buap.mx',
      balance: 150.50, // Saldo inicial predeterminado
      cards: [
        { id: 'c_abc', cardNumber: '1234567890123456', expiryDate: '12/28', last4: '3456' }
      ]
    }
  }
};

// Simulamos que el usuario "user_123" es el que está usando la app actual.
const currentUserId = 'user_123';

/**
 * Obtiene el ID del usuario actualmente autenticado.
 */
export const getCurrentUserId = () => {
  return currentUserId;
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