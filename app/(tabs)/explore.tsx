import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
// IMPORTANTE: Agregamos 'Image' a las importaciones
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LUGARES_RECOMENDADOS_CENTRO } from '../../data';

export default function ExploreScreen() {
  const router = useRouter();

  const irAlMapaYRutear = (lugar: any) => {
    router.navigate({
      pathname: "/",
      params: {
        destLat: lugar.latitud,
        destLng: lugar.longitud,
        nombreDestino: lugar.nombre
      }
    });
  };

  const renderizarLugar = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.7}
      onPress={() => irAlMapaYRutear(item)}
    >
      {/* NUEVO: Componente de Imagen */}
      {/* Si usas imágenes locales (require), cambia la prop a source={item.imagen} */}
      <Image
        source={{ uri: item.imagen }}
        style={styles.imagenTarjeta}
        resizeMode="cover"
      />

      <View style={styles.encabezadoTarjeta}>
        <Ionicons name={item.icono} size={24} color="#611232" style={styles.icono} />
        <Text style={styles.titulo}>{item.nombre}</Text>
      </View>

      <Text style={styles.descripcion}>{item.descripcion}</Text>

      <View style={styles.filaInfo}>
        <Text style={styles.distancia}>📍 {item.distancia} desde el Zócalo</Text>
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
        showsVerticalScrollIndicator={false} // Oculta la barra de scroll para mayor limpieza
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8f9fa' },
  cabecera: { padding: 20, backgroundColor: '#611232', borderBottomWidth: 1, paddingTop: 50, borderBottomColor: '#611232' },
  tituloPrincipal: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  subtitulo: { fontSize: 14, color: '#d1d8e0', marginTop: 5 },
  listaPadding: { padding: 15 },

  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 16, // Aumenté un poco el radio para un look más moderno
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  // NUEVO: Estilos para la imagen
  imagenTarjeta: {
    width: '100%',
    height: 160,          // Altura fija para que todas las tarjetas se vean uniformes
    borderRadius: 12,     // Bordes redondeados internos
    marginBottom: 12,     // Separación entre la imagen y el título
    backgroundColor: '#e1e4e8', // Color de fondo gris claro mientras carga la imagen
  },

  encabezadoTarjeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icono: { marginRight: 10 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#611232', flex: 1 },
  descripcion: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 12 },
  filaInfo: { flexDirection: 'row', marginBottom: 5 },
  distancia: { fontSize: 13, color: '#611232', fontWeight: '600' },
});