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
  nombre: "Estudiante BUAP",
  ecoTokens: 250,
  co2AhorradoKg: 12.5,
  viajesRealizados: 8
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
