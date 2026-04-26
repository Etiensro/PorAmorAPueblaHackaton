import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Geojson, Marker } from 'react-native-maps';
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
  const regionInicial = {
    latitude: 19.0022,
    longitude: -98.2018,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

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
            pinColor={nodo.tipo === 'Educativo' ? '#1a73e8' : '#34a853'} // Azul para escuelas, verde para transporte
          >
            {/* El Callout es la ventanita que sale al darle click al pin */}
            <Callout>
              <View style={styles.infoWindow}>
                <Text style={styles.nodoNombre}>{nodo.nombre}</Text>
                <Text style={styles.nodoDetalle}>🚲 Disponibles: {nodo.bicisDisponibles}</Text>
                <Text style={styles.nodoTag}>{nodo.tipo}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoWindow: {
    padding: 10,
    width: 150,
  },
  nodoNombre: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  nodoDetalle: {
    fontSize: 12,
    color: '#4a5568',
  },
  nodoTag: {
    fontSize: 10,
    color: '#1a73e8',
    marginTop: 5,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});