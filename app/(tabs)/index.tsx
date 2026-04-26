import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Geojson, Marker, Polyline } from 'react-native-maps';
import { NODOS_REMMI } from '../../data';

// --- IMPORTACIONES DE DATOS ---
const cicloviasData = require('../../assets/Red_Ciclista.json');
const museosData = require('../../assets/Museos.json');

const cicloviasLimpias = {
  ...cicloviasData,
  features: cicloviasData.features.filter(
    (feature: any) =>
      feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
  )
};

// --- ESTILO DE MAPA OSCURO ---
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
];

const EstacionMarker = memo(({ nodo, onSelect, modoActivo }: { nodo: any, onSelect: (n: any) => void, modoActivo: boolean }) => {
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTrackChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: nodo.latitud, longitude: nodo.longitud }}
      onPress={() => !modoActivo && onSelect({ ...nodo, tipo: 'Bicicleta' })}
      tracksViewChanges={trackChanges}
    >
      {/* Aplicamos el color de fondo dinámico, el resto de la forma ya está fija en markerContainer */}
      <View style={[styles.markerContainer, { backgroundColor: modoActivo ? '#9b59b6' : '#34a853' }]}>
        {modoActivo ? (
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>H</Text>
        ) : (
          <Ionicons name="bicycle" size={14} color="white" />
        )}
      </View>
    </Marker>
  );
});

const MuseoMarker = memo(({ museo, onSelect }: { museo: any, onSelect: (m: any) => void }) => {
  const lat = museo.geometry.coordinates[0][0][1];
  const lng = museo.geometry.coordinates[0][0][0];
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTrackChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      onPress={() => onSelect({ nombre: museo.properties.nombre, latitud: lat, longitud: lng, tipo: 'Estación de Museo' })}
      tracksViewChanges={trackChanges}
    >
      <View style={[styles.markerContainer, { backgroundColor: '#E67E22' }]}>
        <Ionicons name="library" size={20} color="white" />
      </View>
    </Marker>
  );
});

// --- PANTALLA PRINCIPAL ---
export default function MapScreen() {
  const params = useLocalSearchParams();
  const [destino, setDestino] = useState<any>(null);
  const [rutaReal, setRutaReal] = useState<any>([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<any>(null);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const [verMuseos, setVerMuseos] = useState(true);
  const [verEstaciones, setVerEstaciones] = useState(true);

  // --- ESTADOS DE VIAJE ACTIVO ---
  const [viajeActivo, setViajeActivo] = useState(false);
  const [tiempoViaje, setTiempoViaje] = useState(0); // en segundos
  const [distanciaViaje, setDistanciaViaje] = useState(0); // en km
  const [modalReporte, setModalReporte] = useState(false);

  const PUNTO_INICIO_ZOCALO = { latitude: 19.0433, longitude: -98.1983 };

  // --- ESTADOS PARA CÁMARA ---
  const [mostrandoCamara, setMostrandoCamara] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [permisoCamara, requestPermission] = useCameraPermissions();

  const animacionPaloma = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // --- LÓGICA DE SIMULACIÓN DE VIAJE ---
  useEffect(() => {
    let timer: any;
    if (viajeActivo) {
      timer = setInterval(() => {
        setTiempoViaje(t => t + 1);
        setDistanciaViaje(d => d + 0.004); // Simulamos avanzar ~15km/h (0.004 km por segundo)
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viajeActivo]);

  // FORMATEAR TIEMPO Y CO2
  const minutos = Math.floor(tiempoViaje / 60).toString().padStart(2, '0');
  const segundos = (tiempoViaje % 60).toString().padStart(2, '0');
  const co2Evitado = (distanciaViaje * 0.12).toFixed(2); // 120g de CO2 por km aprox

  // MOCK: Habilitar botón de finalizar cuando recorra 50 metros (0.05 km)
  const cercaDeDock = distanciaViaje >= 0.05;

  // --- LÓGICA DE PAN RESPONDER ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) panY.setValue(gestureState.dy); },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1.0) cerrarModalAnimado();
        else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const cerrarModalAnimado = () => {
    Animated.timing(panY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => setNodoSeleccionado(null));
  };

  // --- LÓGICA DE API Y ENRUTAMIENTO (¡RESTAURADA!) ---
  const calcularRutaAPI = async (lat: number, lng: number, nombre?: string) => {
    const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc5ZGVhNjUzZjlkZDRkYWM5NGQyNDk0MmRlZWJkY2M4IiwiaCI6Im11cm11cjY0In0=';
    const start = `${PUNTO_INICIO_ZOCALO.longitude},${PUNTO_INICIO_ZOCALO.latitude}`;
    const end = `${lng},${lat}`;
    const url = `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${API_KEY}&start=${start}&end=${end}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features?.length > 0) {
        const puntos = data.features[0].geometry.coordinates.map((c: any) => ({
          latitude: c[1], longitude: c[0]
        }));
        setRutaReal(puntos);
        setDestino({ coordenadas: { latitude: lat, longitude: lng }, nombre: nombre || "Destino" });
      } else {
        Alert.alert("Aviso", "No se encontró una ruta ciclista directa para este punto.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSeleccionarNodo = (data: any) => {
    panY.setValue(0);
    setAceptoTerminos(false);
    setNodoSeleccionado(data);
    calcularRutaAPI(data.latitud, data.longitud, data.nombre);
  };

  // --- LÓGICA DE CÁMARA ---
  const abrirCamara = async () => {
    if (!aceptoTerminos) return;
    if (!permisoCamara?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permiso requerido", "Necesitas dar acceso a la cámara para escanear el QR.");
        return;
      }
    }
    setNodoSeleccionado(null);
    setMostrandoCamara(true);
    setEscaneado(false);
    animacionPaloma.setValue(0);
  };

  const handleEscanearQR = ({ data }: any) => {
    setEscaneado(true);
    Animated.spring(animacionPaloma, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    // Iniciar Viaje Activo
    setTimeout(() => {
      setMostrandoCamara(false);
      setViajeActivo(true);
      setTiempoViaje(0);
      setDistanciaViaje(0);
    }, 2000);
  };

  const enviarReporte = (tipo: string) => {
    Alert.alert("Reporte Enviado", `Gracias por reportar: ${tipo}. Nuestro equipo lo revisará.`);
    setModalReporte(false);
  };

  const finalizarViaje = () => {
    Alert.alert("Viaje Finalizado", `Tiempo: ${minutos}:${segundos}\nDistancia: ${distanciaViaje.toFixed(2)} km\nCO2 Evitado: ${co2Evitado} kg`);
    setViajeActivo(false);
    setNodoSeleccionado(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ ...PUNTO_INICIO_ZOCALO, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
        customMapStyle={viajeActivo ? darkMapStyle : []}
        showsUserLocation={viajeActivo} // Muestra el punto azul de usuario si tiene permisos GPS
      >
        {!viajeActivo && <Geojson geojson={cicloviasLimpias} strokeColor="#3182CE" strokeWidth={3} />}

        {verEstaciones && NODOS_REMMI.map((nodo) => (
          <EstacionMarker key={`est-${nodo.id}`} nodo={nodo} onSelect={handleSeleccionarNodo} modoActivo={viajeActivo} />
        ))}

        {!viajeActivo && verMuseos && museosData.features.map((f: any, i: number) => (
          <MuseoMarker key={`mus-${i}`} museo={f} onSelect={handleSeleccionarNodo} />
        ))}

        {!viajeActivo && rutaReal.length > 0 && <Polyline coordinates={rutaReal} strokeColor="#2ecc71" strokeWidth={5} />}
      </MapView>

      {/* INTERFAZ: MAPA NORMAL */}
      {!viajeActivo && !mostrandoCamara && (
        <View style={styles.layerSelector}>
          <TouchableOpacity style={styles.layerBtn} onPress={() => setVerEstaciones(!verEstaciones)}>
            <Ionicons name="bicycle" size={24} color={verEstaciones ? "#34a853" : "#ccc"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.layerBtn} onPress={() => setVerMuseos(!verMuseos)}>
            <Ionicons name="business" size={24} color={verMuseos ? "#E67E22" : "#ccc"} />
          </TouchableOpacity>
        </View>
      )}

      {/* VENTANA FLOTANTE: RENTA DE BICI */}
      {nodoSeleccionado && !mostrandoCamara && !viajeActivo && (
        <Modal animationType="fade" transparent={true} visible={!!nodoSeleccionado}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={cerrarModalAnimado} />
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panY }] }]} {...panResponder.panHandlers}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.vehicleTitle}>{nodoSeleccionado.tipo || 'Vehículo'}</Text>
                <View style={styles.priceBadge}><Text style={styles.priceText}>$4 MXN</Text></View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>{nodoSeleccionado.nombre}</Text>
              </View>
              <TouchableOpacity style={styles.termsContainer} activeOpacity={0.8} onPress={() => setAceptoTerminos(!aceptoTerminos)}>
                <Ionicons name={aceptoTerminos ? "checkbox" : "square-outline"} size={24} color={aceptoTerminos ? "#81D4AD" : "#A0AAB5"} />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsTitle}>Términos de Viaje</Text>
                  <Text style={styles.termsDesc}>Acepto uso por 30 minutos. Pago con saldo/tarjeta.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qrBtn, !aceptoTerminos && styles.qrBtnDisabled]} onPress={abrirCamara} disabled={!aceptoTerminos}>
                <Ionicons name="scan-outline" size={22} color="white" />
                <Text style={styles.qrBtnText}>Pagar y Desbloquear</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* =========================================
          INTERFAZ: VIAJE ACTIVO
      ========================================= */}
      {viajeActivo && (
        <>
          {/* Píldoras Superiores */}
          <View style={styles.activeTopBar}>
            <View style={styles.activeStatusBadge}>
              <View style={styles.dotIndicator} />
              <Text style={styles.activeStatusText}>Viaje Activo</Text>
            </View>
            <View style={styles.secureRouteBadge}>
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text style={styles.secureRouteText}>RUTA SEGURA</Text>
            </View>
          </View>

          {/* Panel Inferior Fijo de Viaje */}
          <View style={styles.activeBottomPanel}>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricBigText}>{minutos}:{segundos}</Text>
                <Text style={styles.metricLabel}>Tiempo transcurrido</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricBigText, { color: '#2ecc71' }]}>
                  {distanciaViaje.toFixed(2)} <Text style={{ fontSize: 16 }}>km</Text>
                </Text>
                <Text style={styles.metricLabel}>Distancia</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              <View style={styles.co2Card}>
                <Ionicons name="leaf-outline" size={24} color="#2ecc71" />
                <Text style={styles.co2Value}>{co2Evitado}</Text>
                <Text style={styles.co2Label}>KG CO2 EVITADO</Text>
              </View>

              <TouchableOpacity style={styles.reportCard} onPress={() => setModalReporte(true)}>
                <Ionicons name="warning" size={24} color="#e74c3c" />
                <Text style={styles.reportText}>REPORTAR</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.finishBtn, !cercaDeDock && styles.finishBtnDisabled]}
              onPress={finalizarViaje}
              disabled={!cercaDeDock}
            >
              <Ionicons name="radio-button-on" size={24} color={cercaDeDock ? "white" : "#666"} />
              <Text style={[styles.finishBtnText, !cercaDeDock && { color: '#666' }]}>Finalizar en Smart Dock</Text>
            </TouchableOpacity>
            {!cercaDeDock && <Text style={styles.hintText}>Acércate a un punto H para finalizar.</Text>}
          </View>
        </>
      )}

      {/* MODAL DE REPORTES */}
      <Modal visible={modalReporte} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setModalReporte(false)} />
          <View style={styles.reportModalContent}>
            <Text style={styles.reportModalTitle}>¿Qué deseas reportar?</Text>
            {['Baches / Mal estado', 'Falta de iluminación', 'Altercado / Accidente', 'Inseguridad en la zona'].map((opcion, idx) => (
              <TouchableOpacity key={idx} style={styles.reportOptionBtn} onPress={() => enviarReporte(opcion)}>
                <Text style={styles.reportOptionText}>{opcion}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.reportCancelBtn} onPress={() => setModalReporte(false)}>
              <Text style={styles.reportCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CÁMARA A PANTALLA COMPLETA */}
      {mostrandoCamara && (
        <View style={styles.cameraOverlay}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={escaneado ? undefined : handleEscanearQR} />
          {!escaneado && (
            <View style={styles.qrTargetContainer}>
              <View style={styles.qrTargetBox} />
              <Text style={styles.qrTargetText}>Apunta al código QR</Text>
            </View>
          )}
          {!escaneado && (
            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setMostrandoCamara(false)}>
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          )}
          {escaneado && (
            <View style={styles.successContainer}>
              <Animated.View style={{ transform: [{ scale: animacionPaloma }] }}>
                <Ionicons name="checkmark-circle" size={120} color="#2ecc71" />
              </Animated.View>
              <Text style={styles.successText}>¡Vehículo Liberado!</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    width: 36,            // Ancho fijo
    height: 36,           // Alto fijo (igual al ancho para que sea cuadrado perfecto)
    borderRadius: 18,     // Exactamente la mitad del width/height para hacerlo círculo
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  layerSelector: { position: 'absolute', top: 50, right: 20, backgroundColor: 'white', borderRadius: 10, padding: 10, elevation: 5 },
  layerBtn: { marginVertical: 5 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingTop: 15, paddingBottom: 35, alignItems: 'center', elevation: 20 },
  handle: { width: 45, height: 5, backgroundColor: '#D1D5DB', borderRadius: 10, marginBottom: 20 },

  // Estilos Originales Renta
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 5 },
  vehicleTitle: { fontSize: 26, fontWeight: '800', color: '#111' },
  priceBadge: { backgroundColor: '#EAF7F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  priceText: { color: '#208A4E', fontWeight: 'bold', fontSize: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 25 },
  locationText: { color: '#6B7280', fontSize: 14, marginLeft: 5 },
  batteryContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
  batteryLeft: { flexDirection: 'row', alignItems: 'center' },
  batteryTitle: { fontWeight: 'bold', fontSize: 15, marginLeft: 8, color: '#1F2937' },
  autonomyBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  autonomyText: { fontSize: 12, color: '#6B7280' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#F4F6F8', padding: 15, borderRadius: 16, marginBottom: 25 },
  termsTextContainer: { marginLeft: 12, flex: 1 },
  termsTitle: { fontWeight: 'bold', fontSize: 15, color: '#1F2937', marginBottom: 2 },
  termsDesc: { fontSize: 13, color: '#6B7280' },
  qrBtn: { backgroundColor: '#81D4AD', flexDirection: 'row', padding: 18, borderRadius: 16, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  qrBtnDisabled: { backgroundColor: '#D1D5DB' },
  qrBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  footerInfoText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5, marginTop: 5 },

  // --- ESTILOS VIAJE ACTIVO ---
  activeTopBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  activeStatusBadge: { backgroundColor: '#1C1C1E', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  dotIndicator: { width: 10, height: 10, backgroundColor: '#2ecc71', borderRadius: 5, marginRight: 8 },
  activeStatusText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  secureRouteBadge: { backgroundColor: '#2ecc71', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  secureRouteText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },

  activeBottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  metricBox: { alignItems: 'flex-start', flex: 1 },
  metricBigText: { fontSize: 48, fontWeight: '900', color: '#111', letterSpacing: -1 },
  metricLabel: { fontSize: 14, color: '#666', fontWeight: '500' },

  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  co2Card: { flex: 1, backgroundColor: '#EAF7F0', borderRadius: 16, padding: 15, alignItems: 'center', marginRight: 10 },
  co2Value: { fontSize: 18, fontWeight: 'bold', color: '#111', marginVertical: 5 },
  co2Label: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  reportCard: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 16, padding: 15, alignItems: 'center', marginLeft: 10, justifyContent: 'center' },
  reportText: { fontSize: 12, color: '#e74c3c', fontWeight: 'bold', marginTop: 8 },

  finishBtn: { backgroundColor: '#111827', flexDirection: 'row', padding: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  finishBtnDisabled: { backgroundColor: '#E5E7EB' },
  finishBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  hintText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10, fontWeight: '500' },

  // Modal de Reportes
  reportModalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  reportModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 20, textAlign: 'center' },
  reportOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reportOptionText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  reportCancelBtn: { marginTop: 20, paddingVertical: 15, alignItems: 'center' },
  reportCancelText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },

  // Estilos de la Cámara
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', zIndex: 999 },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, zIndex: 1000 },
  successContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  successText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  qrTargetContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  qrTargetBox: { width: 250, height: 250, borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20, backgroundColor: 'transparent' },
  qrTargetText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' }
});