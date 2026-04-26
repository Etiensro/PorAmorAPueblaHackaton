import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Geojson, Marker, Polyline } from 'react-native-maps';
import { NODOS_REMMI, getCurrentUserId, getUserData, procesarPagoViaje } from '../../data';

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
      onPress={() => !modoActivo && onSelect({ ...nodo, tipo: 'Bicicleta Tradicional' })}
      tracksViewChanges={trackChanges}
    >
      {/* Se aplica opacidad del 40% si es modo de viaje activo para hacerlo casi transparente */}
      <View style={[styles.markerContainer, { backgroundColor: modoActivo ? '#9b59b6' : '#34a853', opacity: modoActivo ? 0.4 : 1 }]}>
        {modoActivo ? (
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>H</Text>
        ) : (
          <Ionicons name="bicycle" size={20} color="white" />
        )}
      </View>
    </Marker>
  );
});

const MuseoMarker = memo(({ museo, onSelect, modoActivo }: { museo: any, onSelect: (m: any) => void, modoActivo: boolean }) => {
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
      onPress={() => !modoActivo && onSelect({ nombre: museo.properties.nombre, latitud: lat, longitud: lng, tipo: 'Estación de Museo' })}
      tracksViewChanges={trackChanges}
    >
      <View style={[styles.markerContainer, { backgroundColor: '#E67E22', opacity: modoActivo ? 0.4 : 1 }]}>
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
  const [mostrarTutorial, setMostrarTutorial] = useState(true);
  const [modalResumen, setModalResumen] = useState(false);
  const [panelExpandido, setPanelExpandido] = useState(true);
  const [saldoUsuario, setSaldoUsuario] = useState(0);
  const [procesandoPago, setProcesandoPago] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Cargar saldo al enfocar la pantalla o cambiar modalResumen
      const cargarDatos = async () => {
        const id = getCurrentUserId();
        if (id) {
          const data = await getUserData(id);
          if (data) setSaldoUsuario(data.balance);
        }
      };
      cargarDatos();
    }, [modalResumen])
  );


  // --- ESTADO POSICIÓN DEL USUARIO ---
  const PUNTO_INICIO_ZOCALO = { latitude: 19.0433, longitude: -98.1983 };
  const [ubicacionUsuario, setUbicacionUsuario] = useState(PUNTO_INICIO_ZOCALO);

  // --- ESTADOS PARA CÁMARA ---
  const [mostrandoCamara, setMostrandoCamara] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [permisoCamara, requestPermission] = useCameraPermissions();

  const animacionPaloma = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.animateCamera({ center: PUNTO_INICIO_ZOCALO, zoom: 17, pitch: 0 });
    }, 300);
  }, []);

  // --- LÓGICA DE SIMULACIÓN DE VIAJE Y RECORRIDO DE RUTA ---
  useEffect(() => {
    let timer: any;
    if (viajeActivo) {
      let stepActual = 0;
      const totalSteps = rutaReal.length;
      
      timer = setInterval(() => {
        setTiempoViaje(t => t + 1);
        setDistanciaViaje(d => d + 0.004); // Simulamos avanzar ~15km/h (0.004 km por segundo)
        
        // Actualizando la ubicación del usuario y moviendo en tiempo real
        if (totalSteps > 0 && stepActual < totalSteps) {
          const currentPosition = rutaReal[stepActual];
          setUbicacionUsuario(currentPosition);
          mapRef.current?.animateCamera({ 
            center: currentPosition, 
            zoom: 19, 
            pitch: 50 
          });
          stepActual += 1;
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viajeActivo, rutaReal]);

  // FORMATEAR TIEMPO Y CO2
  const minutos = Math.floor(tiempoViaje / 60).toString().padStart(2, '0');
  const segundos = (tiempoViaje % 60).toString().padStart(2, '0');
  const co2Evitado = (distanciaViaje * 0.12).toFixed(2); // 120g de CO2 por km aprox

  // Habilitar botón de finalizar al acercarse a un Smart Dock
  const cercaDeDock = distanciaViaje >= 0.02;

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
    Animated.timing(panY, { toValue: 600, duration: 250, useNativeDriver: true }).start(() => {
      setNodoSeleccionado(null);
      // Reiniciar la ruta real si el usuario cierra el panel sin iniciar el viaje
      if (!viajeActivo) {
        setRutaReal([]);
        setDestino(null);
      }
    });
  };

  // --- LÓGICA DE API Y ENRUTAMIENTO ---
  const calcularRutaAPI = async (lat: number, lng: number, nombre?: string) => {
    // LLAMADA A LA API (SE MANTIENE IGUAL)
    const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc5ZGVhNjUzZjlkZDRkYWM5NGQyNDk0MmRlZWJkY2M4IiwiaCI6Im11cm11cjY0In0=';
    const start = `${ubicacionUsuario.longitude},${ubicacionUsuario.latitude}`;
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
    
    // Verificar saldo
    if (saldoUsuario < 15) {
      Alert.alert("Saldo Insuficiente", "No tienes fondos suficientes ($15.00 MXN) para iniciar un viaje. Por favor, recarga tu billetera.");
      return;
    }

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

  const costoTotal = "15.00"; // Se mantiene fijo conociendo la tarifa base que muestra la app
  const puntosGanados = Math.floor(distanciaViaje / 5) || 0; // 1 token por 5km, al menos 0

  const finalizarViaje = async () => {
    const id = getCurrentUserId();
    if (id && !procesandoPago) {
      setProcesandoPago(true);
      try {
        await procesarPagoViaje(id, parseFloat(costoTotal), puntosGanados, distanciaViaje, parseFloat(co2Evitado));
      } catch (e) {
        console.error("Error al descontar:", e);
      }
      setProcesandoPago(false);
    }
    
    setViajeActivo(false);
    setModalResumen(true);
  };

  const cerrarResumen = () => {
    setModalResumen(false);
    setNodoSeleccionado(null);
    setRutaReal([]);
    setDestino(null);
    // Ya no regresamos al Zócalo, nos quedamos en el destino para el próximo viaje
    mapRef.current?.animateCamera({ center: ubicacionUsuario, zoom: 15, pitch: 0 });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ ...PUNTO_INICIO_ZOCALO, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        customMapStyle={viajeActivo ? darkMapStyle : []}
        showsUserLocation={false} 
      >
        {/* Marcador del Usuario para ver dónde estamos y simular recorrido */}
        <Marker coordinate={ubicacionUsuario} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userDotOutline}>
             <View style={styles.userDotInner} />
          </View>
        </Marker>

        {!viajeActivo && <Geojson geojson={cicloviasLimpias} strokeColor="#3182CE" strokeWidth={3} />}

        {/* Las estaciones se ocultan durante viajeActivo */}
        {verEstaciones && !viajeActivo && NODOS_REMMI.map((nodo) => (
          <EstacionMarker key={`est-${nodo.id}`} nodo={nodo} onSelect={handleSeleccionarNodo} modoActivo={viajeActivo} />
        ))}

        {!viajeActivo && verMuseos && museosData.features.map((f: any, i: number) => (
          <MuseoMarker key={`mus-${i}`} museo={f} onSelect={handleSeleccionarNodo} modoActivo={viajeActivo} />
        ))}

        {rutaReal.length > 0 && (
          <Polyline 
            coordinates={rutaReal} 
            strokeColor={viajeActivo ? "#2ecc71" : "#3498db"} 
            strokeWidth={viajeActivo ? 6 : 4} 
          />
        )}
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
                <Text style={styles.vehicleTitle}>{nodoSeleccionado.tipo || 'Bicicleta Clásica'}</Text>
                {/* Etiqueta de Precio */}
                <View style={styles.priceBadge}><Text style={styles.priceText}>Base $15 MXN</Text></View>
              </View>
              
              <View style={styles.saldoRow}>
                <Text style={styles.saldoLabel}>Tu Saldo actual:</Text>
                <Text style={[styles.saldoValue, saldoUsuario < 15 && {color: '#e74c3c'}]}>${saldoUsuario.toFixed(2)} MXN</Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>{nodoSeleccionado.nombre}</Text>
              </View>
              
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={22} color="#0284c7" />
                <Text style={styles.infoText}>Este trayecto monitorea tu ubicación en tiempo real hacia tu destino final.</Text>
              </View>

              <TouchableOpacity style={styles.termsContainer} activeOpacity={0.8} onPress={() => setAceptoTerminos(!aceptoTerminos)}>
                <Ionicons name={aceptoTerminos ? "checkbox" : "square-outline"} size={24} color={aceptoTerminos ? "#81D4AD" : "#A0AAB5"} />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsTitle}>Términos de Viaje</Text>
                  <Text style={styles.termsDesc}>Acepto uso responsable y dejarla en un Smart Dock (Punto H).</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qrBtn, !aceptoTerminos && styles.qrBtnDisabled]} onPress={abrirCamara} disabled={!aceptoTerminos}>
                <Ionicons name="scan-outline" size={22} color="white" />
                <Text style={styles.qrBtnText}>Escanear para Desbloquear</Text>
              </TouchableOpacity>
              <Text style={styles.footerInfoText}>MANTÉN EL USO DENTRO DE CICLOVÍAS</Text>
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
              <Text style={styles.secureRouteText}>EN RUTA</Text>
            </View>
          </View>

          {/* Panel Inferior Fijo de Viaje */}
          <View style={[styles.activeBottomPanel, !panelExpandido && { paddingBottom: 15, paddingTop: 15 }]}>
            <TouchableOpacity 
              style={styles.togglePanelBtn} 
              onPress={() => setPanelExpandido(!panelExpandido)}
            >
              <View style={styles.handleBar} />
              {!panelExpandido && <Text style={styles.panelTitleMinified}>Mostrar detalles ({minutos}:{segundos})</Text>}
            </TouchableOpacity>

            {panelExpandido && (
              <>
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
                  style={[styles.finishBtn, (!cercaDeDock || procesandoPago) && styles.finishBtnDisabled]}
                  onPress={finalizarViaje}
                  disabled={!cercaDeDock || procesandoPago}
                >
                  <Ionicons name="radio-button-on" size={24} color={cercaDeDock ? "white" : "#666"} />
                  <Text style={[styles.finishBtnText, !cercaDeDock && { color: '#666' }]}>
                    {procesandoPago ? 'Procesando pago...' : 'Finalizar en Smart Dock'}
                  </Text>
                </TouchableOpacity>
                {!cercaDeDock && <Text style={styles.hintText}>Acércate a un punto H para finalizar.</Text>}
              </>
            )}
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

      {/* MODAL DE TUTORIAL */}
      <Modal visible={mostrarTutorial} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.tutorialContent}>
            <View style={styles.tutorialHeader}>
              <View style={styles.tutorialIconBg}>
                <Ionicons name="bicycle-outline" size={40} color="#2ecc71" />
              </View>
              <Text style={styles.tutorialTitle}>Bienvenido a REMMI</Text>
              <Text style={styles.tutorialSubtitle}>Tu movilidad en Puebla</Text>
            </View>
            
            <View style={styles.tutorialStepsContainer}>
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumberBadge}><Text style={styles.stepNumber}>1</Text></View>
                <Text style={styles.tutorialStepText}>Explora el mapa del <Text style={{fontWeight: 'bold', color: '#2ecc71'}}>Centro Histórico de Puebla</Text> y encuentra una estación o vehículo.</Text>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumberBadge}><Text style={styles.stepNumber}>2</Text></View>
                <Text style={styles.tutorialStepText}>Elige un destino, escanea el QR en un vehículo y sigue la ruta de forma segura.</Text>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumberBadge}><Text style={styles.stepNumber}>3</Text></View>
                <Text style={styles.tutorialStepText}>Bloquea el vehículo en un Punto H para finalizar y procesar tu cobro.</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.tutorialBtn} onPress={() => setMostrarTutorial(false)}>
              <Text style={styles.tutorialBtnText}>Comenzar a explorar</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE RESUMEN DE VIAJE */}
      <Modal visible={modalResumen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.resumenCard}>
            <View style={styles.resumenHeader}>
              <Ionicons name="checkmark-circle" size={50} color="#2ecc71" />
              <Text style={styles.resumenTitle}>¡Viaje Completado!</Text>
              <Text style={styles.resumenSubtitle}>Gracias por moverte de forma sostenible</Text>
            </View>
            
            <View style={styles.resumenBody}>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Tiempo total</Text>
                <Text style={styles.resumenValue}>{minutos}:{segundos} min</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Distancia recorrida</Text>
                <Text style={styles.resumenValue}>{distanciaViaje.toFixed(2)} km</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>CO2 Evitado</Text>
                <Text style={styles.resumenValue}>{co2Evitado} kg</Text>
              </View>
              
              <View style={styles.resumenDivider} />
              
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Total a pagar</Text>
                <Text style={styles.resumenPrice}>${costoTotal} MXN</Text>
              </View>
              
              <View style={styles.resumenPoints}>
                <Ionicons name="star" size={20} color="#f39c12" />
                <Text style={styles.resumenPointsText}>+ {puntosGanados} Puntos REMMI obtenidos</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.resumenBtn} onPress={cerrarResumen}>
              <Text style={styles.resumenBtnText}>Aceptar y Continuar</Text>
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
  
  // Ubicación Usuario
  userDotOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.5)',
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  saldoRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 10, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10 },
  saldoLabel: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
  saldoValue: { color: '#111', fontSize: 14, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15 },
  locationText: { color: '#6B7280', fontSize: 14, marginLeft: 5 },
  
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', padding: 12, borderRadius: 12, marginBottom: 15, width: '100%' },
  infoText: { fontSize: 12, color: '#0369a1', marginLeft: 8, flex: 1, lineHeight: 18, fontWeight: '500' },

  termsContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#F4F6F8', padding: 15, borderRadius: 16, marginBottom: 25 },
  termsTextContainer: { marginLeft: 12, flex: 1 },
  termsTitle: { fontWeight: 'bold', fontSize: 15, color: '#1F2937', marginBottom: 2 },
  termsDesc: { fontSize: 13, color: '#6B7280' },
  qrBtn: { backgroundColor: '#2ecc71', flexDirection: 'row', padding: 18, borderRadius: 16, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
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
  togglePanelBtn: { alignItems: 'center', paddingVertical: 10, marginTop: -15, marginBottom: 10 },
  handleBar: { width: 40, height: 5, backgroundColor: '#D1D5DB', borderRadius: 5, marginBottom: 5 },
  panelTitleMinified: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 5 },
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

  // Modal Tutorial
  tutorialContent: { backgroundColor: 'white', margin: 20, borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 },
  tutorialHeader: { alignItems: 'center', marginBottom: 25 },
  tutorialIconBg: { backgroundColor: '#EAF7F0', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  tutorialTitle: { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  tutorialSubtitle: { fontSize: 16, color: '#666', fontWeight: '500', marginTop: 5 },
  tutorialStepsContainer: { width: '100%', marginBottom: 10 },
  tutorialStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  stepNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 2 },
  stepNumber: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  tutorialStepText: { fontSize: 15, color: '#444', lineHeight: 24, flex: 1, fontWeight: '400' },
  tutorialBtn: { backgroundColor: '#111827', flexDirection: 'row', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  tutorialBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Modal Resumen
  resumenCard: { backgroundColor: 'white', margin: 20, borderRadius: 24, padding: 0, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  resumenHeader: { backgroundColor: '#F9FAFB', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resumenTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 10, letterSpacing: -0.5 },
  resumenSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  resumenBody: { padding: 30 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  resumenLabel: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  resumenValue: { fontSize: 16, color: '#111', fontWeight: 'bold' },
  resumenDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  resumenPrice: { fontSize: 24, color: '#2ecc71', fontWeight: '900' },
  resumenPoints: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 15, borderRadius: 12, justifyContent: 'center', marginTop: 10 },
  resumenPointsText: { color: '#B45309', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  resumenBtn: { backgroundColor: '#111827', margin: 20, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  resumenBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Estilos de la Cámara
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', zIndex: 999 },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, zIndex: 1000 },
  successContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  successText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  qrTargetContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  qrTargetBox: { width: 250, height: 250, borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20, backgroundColor: 'transparent' },
  qrTargetText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' }
});
