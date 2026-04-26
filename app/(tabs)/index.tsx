import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { Callout, Geojson, Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { NODOS_REMMI } from '../../data';

// 1. IMPORTACIONES DE TUS MAPAS
const cicloviasData = require('../../assets/Red_Ciclista.json');
const museosData = require('../../assets/Museos.json');

// Limpieza de ciclovias
const cicloviasLimpias = {
  ...cicloviasData,
  features: cicloviasData.features.filter(
    (feature: any) =>
      feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
  )
};

// 2. FUNCIÓN MATEMÁTICA PARA MEDIR DISTANCIAS REALES
const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function MapScreen() {
  const params = useLocalSearchParams();
  const [destino, setDestino] = useState<any>(null);
  const [rutaReal, setRutaReal] = useState<any>([]);

  const PUNTO_INICIO_ZOCALO = { latitude: 19.0433, longitude: -98.1983 };
  const [radioBusqueda, setRadioBusqueda] = useState(1.5); 

  const regionInicial = {
    latitude: 19.0433,
    longitude: -98.1983,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // 3. LÓGICA DE FILTRADO DE LUGARES CERCANOS
  const todosLosMuseos = museosData.features.map((f: any, index: number) => {
    try {
      const coord = f.geometry.coordinates[0][0];
      return {
        id: `MUSEO-${index}`,
        nombre: f.properties?.nombre || f.properties?.name || "Lugar Turístico",
        latitude: coord[1], 
        longitude: coord[0]
      };
    } catch (e) {
      return null;
    }
  }).filter((m: any) => m !== null); 

  const lugaresCercanos = todosLosMuseos.filter((museo: any) => {
    const distancia = calcularDistancia(
      PUNTO_INICIO_ZOCALO.latitude, PUNTO_INICIO_ZOCALO.longitude,
      museo.latitude, museo.longitude
    );
    return distancia <= radioBusqueda; 
  });

  const calcularRutaAPI = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc5ZGVhNjUzZjlkZDRkYWM5NGQyNDk0MmRlZWJkY2M4IiwiaCI6Im11cm11cjY0In0='; 
    const start = `${startLng},${startLat}`;
    const end = `${endLng},${endLat}`;
    const url = `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${API_KEY}&start=${start}&end=${end}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if(data.features && data.features.length > 0) {
         const coordenadasApi = data.features[0].geometry.coordinates;
         const puntosParaElMapa = coordenadasApi.map((coord: any) => ({
           latitude: coord[1],
           longitude: coord[0]
         }));
         setRutaReal(puntosParaElMapa); 
      } else {
         activarRutaEmergencia(startLat, startLng, endLat, endLng);
      }
    } catch (error) {
      activarRutaEmergencia(startLat, startLng, endLat, endLng);
    }
  };

  const activarRutaEmergencia = (startLat: number, startLng: number, endLat: number, endLng: number) => {
    setRutaReal([
      { latitude: startLat, longitude: startLng },
      { latitude: startLat + 0.001, longitude: startLng - 0.001 },
      { latitude: endLat, longitude: endLng }
    ]);
  };

  useEffect(() => {
    if (params.destLat && params.destLng) {
      const lat = parseFloat(params.destLat as string);
      const lng = parseFloat(params.destLng as string);

      const distanciaAlDestino = calcularDistancia(
        PUNTO_INICIO_ZOCALO.latitude, PUNTO_INICIO_ZOCALO.longitude,
        lat, lng
      );

      if (distanciaAlDestino < 0.05) {
        Alert.alert("¡Ya estás aquí! 📍", "Actualmente te encuentras muy cerca de este punto de interés.");
      } 
      else if (!destino || destino.coordenadas.latitude !== lat) {
         setDestino({ coordenadas: { latitude: lat, longitude: lng }, nombre: params.nombreDestino });
         calcularRutaAPI(PUNTO_INICIO_ZOCALO.latitude, PUNTO_INICIO_ZOCALO.longitude, lat, lng);
      }
    }
  }, [params.destLat, params.destLng]); 

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={regionInicial}
        showsUserLocation={true}
      >
        <Geojson
          geojson={cicloviasLimpias}
          strokeColor="#3182CE"
          strokeWidth={3}
        />

        {NODOS_REMMI.map((nodo) => (
          <Marker
            key={nodo.id}
            coordinate={{ latitude: nodo.latitud, longitude: nodo.longitud }}
            pinColor={nodo.tipo === 'Educativo' ? '#1a73e8' : '#34a853'}
          >
            <Callout>
              <View style={styles.infoWindow}>
                <Text style={styles.nodoNombre}>{nodo.nombre}</Text>
                <Text style={styles.nodoDetalle}>Bicis: {nodo.bicisDisponibles}</Text>
                <Text style={styles.nodoTag}>{nodo.tipo}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {lugaresCercanos.map((museo: any) => (
          <Marker
            key={museo.id}
            coordinate={{ latitude: museo.latitude, longitude: museo.longitude }}
            pinColor="orange"
          >
             <Callout>
              <View style={styles.infoWindow}>
                <Text style={styles.nodoNombre}>{museo.nombre}</Text>
                <Text style={styles.nodoDetalle}>📍 Sugerencia cercana</Text>
                <Text style={styles.nodoTag}>TURISMO</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        <Marker coordinate={PUNTO_INICIO_ZOCALO} title="Inicio: Zócalo" pinColor="red" />

        {destino && (
          <>
            <Marker coordinate={destino.coordenadas} title={destino.nombre} pinColor="purple" />
            
            {rutaReal.length > 0 && (
              <Polyline
                coordinates={rutaReal}
                strokeColor="#2ecc71" 
                strokeWidth={5}
              />
            )}
          </>
        )}
      </MapView>

      {/* 👇 SIMBOLOGÍA FLOTANTE 👇 */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Simbología</Text>
        
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#3182CE' }]} />
          <Text style={styles.legendText}>Red Ciclista Segura</Text>
        </View>
        
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#34a853' }]} />
          <Text style={styles.legendText}>Estación REMMI</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: 'orange' }]} />
          <Text style={styles.legendText}>Destino / Museo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  infoWindow: { padding: 10, width: 150 },
  nodoNombre: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  nodoDetalle: { fontSize: 12, color: '#4a5568' },
  nodoTag: { fontSize: 10, color: '#1a73e8', marginTop: 5, fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Estilos de la Simbología
  legendContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  colorBox: { width: 15, height: 15, borderRadius: 3, marginRight: 8 },
  legendText: { fontSize: 12, color: '#333' }
});