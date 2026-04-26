import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { Callout, Geojson, Marker, Polyline  } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { NODOS_REMMI } from '../../data';
const cicloviasData = require('../../assets/Red_Ciclista.json');
const cicloviasLimpias = {
  ...cicloviasData,
  features: cicloviasData.features.filter(
    (feature: any) =>
      feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
  )
};
export default function MapScreen() {
  const params = useLocalSearchParams();
  const [destino, setDestino] = useState<any>(null);
  const [rutaReal, setRutaReal] = useState<any>([]);

  const PUNTO_INICIO_ZOCALO = { latitude: 19.0433, longitude: -98.1983 };

  const regionInicial = {
    latitude: 19.0433,
    longitude: -98.1983,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const calcularRutaAPI = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    
    // 👇 PEGA AQUÍ TU LLAVE QUE EMPIEZA CON 'ey...' 👇
    const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc5ZGVhNjUzZjlkZDRkYWM5NGQyNDk0MmRlZWJkY2M4IiwiaCI6Im11cm11cjY0In0='; 
    
    const start = `${startLng},${startLat}`;
    const end = `${endLng},${endLat}`;
    
    // SOLUCIÓN: Cambiamos a 'cycling-regular' que es el servidor principal que no falla
    const url = `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${API_KEY}&start=${start}&end=${end}`;

    try {
      // Petición limpia y directa
      const response = await fetch(url);
      const data = await response.json();
      
      // Si la API contesta con la ruta real de las calles
      if(data.features && data.features.length > 0) {
         const coordenadasApi = data.features[0].geometry.coordinates;
         const puntosParaElMapa = coordenadasApi.map((coord: any) => ({
           latitude: coord[1],
           longitude: coord[0]
         }));
         setRutaReal(puntosParaElMapa); 
      } else {
         console.error("Error en la respuesta de la API:", data);
         activarRutaEmergencia(startLat, startLng, endLat, endLng);
      }
    } catch (error) {
      activarRutaEmergencia(startLat, startLng, endLat, endLng);
    }
  };

  // 🦸‍♀️ Plan B: Siempre dibuja algo aunque se caiga el internet
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

      if (!destino || destino.coordenadas.latitude !== lat) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  infoWindow: { padding: 10, width: 150 },
  nodoNombre: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  nodoDetalle: { fontSize: 12, color: '#4a5568' },
  nodoTag: { fontSize: 10, color: '#1a73e8', marginTop: 5, fontWeight: 'bold', textTransform: 'uppercase' }
});