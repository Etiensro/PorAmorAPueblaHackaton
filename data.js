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

export const USUARIO_ACTUAL = {
  nombre: "Usuario",
  ecoTokens: 250,
  co2AhorradoKg: 12.5,
  viajesRealizados: 8
};

// Agrega esto al final de tu archivo data.js

export const CATALOGO_RECOMPENSAS = [
  { 
      id: 'RWD-001', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Museo Amparo', 
      descripcion: 'Válido para una entrada general cualquier día de la semana.',
      costoPuntos: 5 
  },
  { 
      id: 'RWD-002', 
      tipo: 'Museo', 
      titulo: 'Entrada Gratis: Fuerte de Loreto', 
      descripcion: 'Conoce la historia de Puebla con esta entrada general.',
      costoPuntos: 3 
  },
  { 
      id: 'RWD-003', 
      tipo: 'Descuento', 
      titulo: '15% Off: Estación CU', 
      descripcion: 'Descuento válido para tu próxima renta iniciando en Ciudad Universitaria.',
      costoPuntos: 2 
  },
  { 
      id: 'RWD-004', 
      tipo: 'Descuento', 
      titulo: 'Viaje de 30 min gratis', 
      descripcion: 'Aplica en cualquier estación de la red (Paseo Bravo, Zócalo, etc).',
      costoPuntos: 4 
  }
];