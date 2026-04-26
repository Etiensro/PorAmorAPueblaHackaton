import { Ionicons } from '@expo/vector-icons'; // <-- Iconos ilustrativos
import { useRouter } from 'expo-router'; // <-- Esto nos permite saltar entre pantallas
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LUGARES_RECOMENDADOS_CENTRO } from '../../data';

export default function ExploreScreen() {
  const router = useRouter(); // Inicializamos el router

  // Función que se ejecuta al darle clic a una tarjeta
  const irAlMapaYRutear = (lugar: any) => {
    // Saltamos a la pestaña del mapa (index) y le mandamos las coordenadas por "parámetros"
    router.navigate({
      pathname: "/",
      params: { 
        destLat: lugar.latitud, 
        destLng: lugar.longitud, 
        nombreDestino: lugar.nombre 
      }
    });
  };

  // Cambiamos <View> por <TouchableOpacity> para que detecte el clic
  const renderizarLugar = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.tarjeta} 
      activeOpacity={0.7} 
      onPress={() => irAlMapaYRutear(item)}
    >
      <View style={styles.encabezadoTarjeta}>
        {/* Aquí agregamos el icono ilustrativo */}
        <Ionicons name={item.icono} size={24} color="#611232" style={styles.icono} />
        <Text style={styles.titulo}>{item.nombre}</Text>
      </View>
      
      <Text style={styles.descripcion}>{item.descripcion}</Text>
      
      <View style={styles.filaInfo}>
        <Text style={styles.distancia}>📍 {item.distancia} desde el Zócalo</Text>
      </View>
      
      <View style={styles.etiquetaBeneficio}>
        <Text style={styles.textoBeneficio}>🎁 {item.beneficio}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <View style={styles.cabecera}>
        <Text style={styles.tituloPrincipal}>Centro Histórico</Text>
        <Text style={styles.subtitulo}>Toca un lugar para trazar tu ruta segura en bici 🚲</Text>
      </View>

      <FlatList
        data={LUGARES_RECOMENDADOS_CENTRO}
        keyExtractor={(item) => item.id}
        renderItem={renderizarLugar}
        contentContainerStyle={styles.listaPadding}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8f9fa' },
  cabecera: { padding: 20, backgroundColor: '#611232', borderBottomWidth: 1, borderBottomColor: '#611232' },
  tituloPrincipal: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  subtitulo: { fontSize: 14, color: '#d1d8e0', marginTop: 5 },
  listaPadding: { padding: 15 },
  tarjeta: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, 
  },
  encabezadoTarjeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icono: { marginRight: 10 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#611232', flex: 1 },
  descripcion: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 12 },
  filaInfo: { flexDirection: 'row', marginBottom: 10 },
  distancia: { fontSize: 13, color: '#611232', fontWeight: '600' },
  etiquetaBeneficio: { backgroundColor: '#fbe9f0', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  textoBeneficio: { color: '#611232', fontSize: 12, fontWeight: 'bold' }
});