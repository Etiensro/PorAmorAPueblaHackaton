import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';

// Importamos el catálogo de data.js
import { CATALOGO_RECOMPENSAS } from '../../data';

export default function RecompensasScreen() {
  // ------------------------------------------------------------------
  // Valor simulado de CO2 (reemplazar cuando se conecte con las otras pestañas)
  const CO2_SIMULADO = 30.0; 
  // ------------------------------------------------------------------

  const [co2Local, setCo2Local] = useState(CO2_SIMULADO);

  useEffect(() => {
    setCo2Local(CO2_SIMULADO);
  }, [CO2_SIMULADO]);
  
  const puntosDisponibles = Math.floor(co2Local / 4);
  const progresoParaSiguientePunto = (co2Local % 4).toFixed(1);

  // Función para generar código (solo para museos)
  const generarCodigoMuseo = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < 6; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return `MUSEO-${resultado}`;
  };

  const handleCanjear = (recompensa: any) => {
    if (puntosDisponibles >= recompensa.costoPuntos) {
      const co2Equivalente = recompensa.costoPuntos * 4;

      if (recompensa.tipo === 'Museo') {
        // LÓGICA PARA MUSEOS: Genera código y pide confirmación
        const nuevoCodigo = generarCodigoMuseo();
        Alert.alert(
          "Entrada Generada",
          `Tu código para el ${recompensa.titulo} es:\n\n${nuevoCodigo}\n\nMuéstralo en taquilla. Esta es la única vez que se mostrará.`,
          [
            { 
              text: "Entendido / Copiado", 
              onPress: () => setCo2Local((prev: number) => prev - co2Equivalente)
            }
          ],
          { cancelable: false }
        );
      } else {
        // LÓGICA PARA DESCUENTOS (AUTOMÁTICA): Se aplica directo
        Alert.alert(
          "Beneficio Activado",
          `El beneficio "${recompensa.titulo}" se ha aplicado automáticamente a tu próxima renta.\n\n¡Buen viaje!`,
          [
            { 
              text: "Genial", 
              onPress: () => setCo2Local((prev: number) => prev - co2Equivalente)
            }
          ]
        );
      }
    } else {
      Alert.alert(
        "Puntos insuficientes",
        `Necesitas ahorrar ${(recompensa.costoPuntos * 4 - co2Local).toFixed(1)} kg más de CO2 para este premio.`
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const puedeCanjear = puntosDisponibles >= item.costoPuntos;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <View style={[styles.tagContainer, { backgroundColor: item.tipo === 'Museo' ? '#e1f5fe' : '#e8f5e9' }]}>
            <Text style={[styles.tagText, { color: item.tipo === 'Museo' ? '#0288d1' : '#2e7d32' }]}>{item.tipo}</Text>
          </View>
        </View>
        <Text style={styles.description}>{item.descripcion}</Text>
        <View style={styles.footerCard}>
          <Text style={[styles.puntosCosto, { color: puedeCanjear ? '#2d6a4f' : '#bc4749' }]}>
            {item.costoPuntos} Puntos
          </Text>
          <TouchableOpacity 
            style={[styles.btnCanjear, { backgroundColor: puedeCanjear ? '#1a73e8' : '#bdc3c7' }]}
            onPress={() => handleCanjear(item)}
            disabled={!puedeCanjear}
          >
            <Text style={styles.btnText}>
              {item.tipo === 'Descuento' ? 'Activar' : 'Canjear'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userText}>Mis Logros Ecológicos</Text>
        <Text style={styles.puntosPrincipales}>{puntosDisponibles} Puntos</Text>
        <Text style={styles.co2Sub}>Total ahorrado: {co2Local.toFixed(1)} kg de CO2</Text>
        <View style={styles.progressContainer}>
            <Text style={styles.tip}>Progreso para el siguiente punto: {progresoParaSiguientePunto}/4 kg</Text>
        </View>
      </View>

      <Text style={styles.tituloSeccion}>Catálogo de Premios</Text>

      <FlatList
        data={CATALOGO_RECOMPENSAS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    backgroundColor: '#1a73e8', 
    padding: 30, 
    paddingTop: 60, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    elevation: 8
  },
  userText: { color: '#d1d8e0', fontSize: 16, marginBottom: 5 },
  puntosPrincipales: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  co2Sub: { color: '#fff', fontSize: 14, marginTop: 5, opacity: 0.9 },
  progressContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 },
  tip: { color: '#feca57', fontSize: 12, fontWeight: 'bold' },
  tituloSeccion: { fontSize: 22, fontWeight: 'bold', margin: 20, color: '#2c3e50' },
  lista: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, color: '#34495e', marginRight: 10 },
  tagContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  tagText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  description: { color: '#7f8c8d', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  footerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  puntosCosto: { fontSize: 16, fontWeight: 'bold' },
  btnCanjear: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});