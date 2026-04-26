import { useRouter } from 'expo-router';
import { Award, Bike, ChevronRight, Cloud, CloudLightning, CloudRain, Compass, Leaf, MapPin, Navigation, Search, Sun, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const { width, height } = Dimensions.get('window');

import { getCurrentUserId, getUserData } from '../../data';

const AnimatedActionCard = ({ icon: Icon, title, onPress, color }: { icon: any, title: string, onPress: () => void, color: string }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        handlePressIn();
        setTimeout(() => {
          handlePressOut();
          onPress();
        }, 150);
      }}
    >
      <Animated.View style={[styles.actionCard, { flex: 1, marginHorizontal: 4, transform: [{ scale }], borderColor: color }]}>
        <View style={[styles.actionIconWrapper, { borderColor: color, shadowColor: color }]}>
           <Icon size={26} color={color} />
        </View>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const AnimatedTripCard = ({ route, date, points, imageUrl }: { route: string, date: string, points: string, imageUrl: string }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        handlePressIn();
        setTimeout(() => {
          handlePressOut();
        }, 150);
      }}
    >
      <Animated.View style={[styles.recentTripCard, { transform: [{ scale }] }]}>
         <Image source={{ uri: imageUrl }} style={styles.tripImage} />
         
         <View style={styles.tripContent}>
           <View style={styles.tripLeft}>
               <View style={styles.tripIconWrapper}>
                 <MapPin size={20} color="#A3835F" />
              </View>
              <View>
                 <Text style={styles.tripRoute}>{route}</Text>
                 <Text style={styles.tripDate}>{date}</Text>
              </View>
           </View>
           <View style={styles.tripRight}>
              <Text style={styles.tripPoints}>{points}</Text>
              <ChevronRight size={16} color="#BCBDBF" />
           </View>
         </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function Inicio() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  // --- ESTADO PARA EL CLIMA EN TIEMPO REAL ---
  const [weatherData, setWeatherData] = useState({
    temp: '--',
    condition: 'Cargando...',
    icon: Sun,
    recommendation: 'Buscando al cielo de Puebla...'
  });

  // Animación de Intro (Primera vista)
  const [showIntro, setShowIntro] = useState(true);
  const introFadeAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.5)).current;
  const textTranslateAnim = useRef(new Animated.Value(50)).current;

  // Valores de animación main UI
  const headerAnim = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const tripsAnim = useRef(new Animated.Value(0)).current;

  const headerTranslate = useRef(new Animated.Value(30)).current;
  const weatherTranslate = useRef(new Animated.Value(30)).current;
  const statsTranslate = useRef(new Animated.Value(30)).current;
  const actionsTranslate = useRef(new Animated.Value(30)).current;
  const tripsTranslate = useRef(new Animated.Value(30)).current;

  // Animación de transición de pantalla
  const [transitionData, setTransitionData] = useState<{color: string, icon: any, title: string} | null>(null);
  const transitionAnim = useRef(new Animated.Value(0)).current;

  const loadUserData = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      if (userId) {
        const data = await getUserData(userId);
        setUserData(data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  },[]);

  // --- FUNCIÓN PARA LLAMAR A LA API (OPEN-METEO, SIN KEY) ---
  const fetchWeather = async () => {
    try {
      // Coordenadas de Puebla: Lat: 19.0414, Lon: -98.2063
      const url = `https://api.open-meteo.com/v1/forecast?latitude=19.0414&longitude=-98.2063&current_weather=true`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.current_weather) {
        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;

        let WeatherIcon = Sun;
        let conditionStr = 'Despejado';
        let rec = 'Excelente clima para ganar Puntos.';

        // Códigos WMO (Organización Meteorológica Mundial)
        if (weatherCode === 0 || weatherCode === 1) {
          WeatherIcon = Sun;
          conditionStr = 'Despejado';
          rec = 'Día soleado en Puebla, ¡perfecto para rodar!';
        } else if (weatherCode === 2 || weatherCode === 3) {
          WeatherIcon = Cloud;
          conditionStr = 'Nublado';
          rec = 'Clima fresco, ideal para no quemarte con el sol.';
        } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
          WeatherIcon = CloudRain;
          conditionStr = 'Lluvia';
          rec = 'Está lloviendo. ¡Lleva tu impermeable y rueda con cuidado!';
        } else if (weatherCode >= 95) {
          WeatherIcon = CloudLightning;
          conditionStr = 'Tormenta';
          rec = 'Hay tormenta eléctrica. Te recomendamos pausar tu viaje.';
        }

        setWeatherData({
          temp: `${temp}`,
          condition: conditionStr,
          icon: WeatherIcon,
          recommendation: rec
        });
      }
    } catch (error) {
      console.error("Error obteniendo el clima:", error);
      // Fallback si el usuario no tiene internet en ese segundo
      setWeatherData({
        temp: '24',
        condition: 'Clima Offline',
        icon: Sun,
        recommendation: 'Conéctate a internet para ver el clima actual.'
      });
    }
  };

  const runIntroAnimation = () => {
    Animated.parallel([
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(introFadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
           setShowIntro(false);
           startMainUiAnimations();
        });
      }, 1500);
    });
  };

  const startMainUiAnimations = () => {
    const createEntranceAnim = (opacityVar: Animated.Value, translateVar: Animated.Value) => {
      return Animated.parallel([
        Animated.timing(opacityVar, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(translateVar, { toValue: 0, duration: 600, useNativeDriver: true })
      ]);
    };

    Animated.stagger(150,[
      createEntranceAnim(headerAnim, headerTranslate),
      createEntranceAnim(weatherAnim, weatherTranslate),
      createEntranceAnim(statsAnim, statsTranslate),
      createEntranceAnim(actionsAnim, actionsTranslate),
      createEntranceAnim(tripsAnim, tripsTranslate),
    ]).start();
  };

  useEffect(() => {
    loadUserData();
    fetchWeather(); // Llamada al Clima Libre
    runIntroAnimation();
  },[loadUserData]);

  const navigateWithTransition = (path: any, data: {color: string, icon: any, title: string}) => {
    setTransitionData(data);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        router.push(path); 
        setTimeout(() => {
          transitionAnim.setValue(0);
          setTransitionData(null);
        }, 100);
      }, 500);
    });
  };

  const renderIntroOverlay = () => {
    if (!showIntro) return null;
    return (
      <Animated.View style={[styles.introOverlay, { opacity: introFadeAnim }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1596394993175-9e6b4e6dbcc8?q=80&w=800' }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={15}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(253, 242, 248, 0.85)' }]} />

        <Animated.View style={{ transform: [{ scale: logoScaleAnim }], alignItems: 'center' }}>
          <View style={styles.introLogoWrapper}>
             <Bike size={64} color="#611232" />
          </View>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: textTranslateAnim }], opacity: logoScaleAnim, alignItems: 'center' }}>
          <Text style={styles.introTitle}>¡Bienvenido a REMMI!</Text>
          <Text style={styles.introSubtitle}>Moviendo a Puebla juntos y seguro.</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderTransitionOverlay = () => {
    if (!transitionData) return null;
    
    const size = transitionAnim.interpolate({
      inputRange:[0, 1],
      outputRange: [0, height * 2.5]
    });

    const contentOpacity = transitionAnim.interpolate({
      inputRange:[0, 0.5, 1],
      outputRange: [0, 0, 1]
    });

    const contentScale = transitionAnim.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0.8, 0.8, 1]
    });

    const TransIcon = transitionData.icon;

    return (
      <View style={styles.transitionContainer} pointerEvents="none">
        <Animated.View style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: height * 1.5,
          backgroundColor: transitionData.color,
          opacity: 0.98,
        }} />
        <Animated.View style={{
          opacity: contentOpacity,
          transform: [{ scale: contentScale }],
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
           <View style={styles.transitionIconWrapper}>
              <TransIcon size={64} color={transitionData.color} />
           </View>
           <Text style={styles.transitionTitle}>{transitionData.title}</Text>
        </Animated.View>
      </View>
    );
  };

  const CurrentWeatherIcon = weatherData.icon;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header con Bienvenida y Foto de Puebla (Catedral) */}
        <Animated.View style={[{ opacity: headerAnim, transform: [{ translateY: headerTranslate }] }]}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1620025985011-cbac4ff63b2f?q=80&w=1000' }}
            style={styles.headerBackground}
            imageStyle={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, opacity: 0.85 }}
          >
            <View style={styles.headerOverlay} />
            
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greetingHeader}>Hola, {userData ? (userData.nombre || userData.name || 'Viajero') : 'Viajero'} 👋</Text>
                <Text style={styles.subGreetingHeader}>¿Listo para rodar por Puebla?</Text>
              </View>
              <View style={styles.avatarPlaceholder}>
                <User size={26} color="#611232" />
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        <View style={styles.contentContainer}>
          {/* Tarjeta de Clima Dinámica (Weather Widget) */}
          <Animated.View style={[styles.section, { opacity: weatherAnim, transform:[{ translateY: weatherTranslate }] }]}>
            <View style={styles.weatherCard}>
              <View style={styles.weatherTopRow}>
                  <View style={styles.weatherMain}>
                    <CurrentWeatherIcon size={48} color="#A3835F" />
                    <View style={{ marginLeft: 16 }}>
                        <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
                        <Text style={styles.weatherCity}>Puebla de los Ángeles</Text>
                    </View>
                  </View>
                  <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherBottomRow}>
                  <Leaf size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.weatherRecommendation}>{weatherData.recommendation}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Hero Card / Dashboard Stats */}
          <Animated.View style={[styles.section, { opacity: statsAnim, transform: [{ translateY: statsTranslate }] }]}>
            <View style={styles.heroCard}>
              <View style={styles.heroContentRow}>
                  <View style={styles.heroStat}>
                    <View style={styles.statIconBadge}>
                        <Leaf size={24} color="#611232" />
                    </View>
                    <Text style={styles.heroStatValue}>{userData?.co2AhorradoKg || 0} kg</Text>
                    <Text style={styles.heroStatLabel}>CO2 Ahorrado</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.heroStat}>
                    <View style={[styles.statIconBadge, { backgroundColor: '#fdf2f8' }]}>
                        <Award size={24} color="#611232" />
                    </View>
                    <Text style={styles.heroStatValue}>{userData?.ecoTokens || 0}</Text>
                    <Text style={styles.heroStatLabel}>Eco-Tokens</Text>
                  </View>
              </View>
            </View>
          </Animated.View>

          {/* Acciones Rápidas */}
          <Animated.View style={[styles.section, { opacity: actionsAnim, transform:[{ translateY: actionsTranslate }] }]}>
            <Text style={styles.sectionTitle}>Tus Herramientas</Text>
            <View style={styles.actionGrid}>
              <AnimatedActionCard 
                  icon={Navigation}
                  title="Iniciar Viaje"
                  color="#611232"
                  onPress={() => navigateWithTransition('/', { color: '#611232', icon: Navigation, title: 'Iniciando Viaje...' })}
              />
              
              <AnimatedActionCard 
                  icon={Compass}
                  title="Explorar"
                  color="#A3835F"
                  onPress={() => navigateWithTransition('/explore', { color: '#A3835F', icon: Compass, title: 'Explorar Lugares...' })}
              />

              <AnimatedActionCard 
                  icon={Search}
                  title="Eco-Tokens"
                  color="#264653"
                  onPress={() => navigateWithTransition('/recompensas', { color: '#264653', icon: Search, title: 'Buscando Premios...' })}
              />
            </View>
          </Animated.View>

          {/* Actividad Reciente */}
          <Animated.View style={[styles.section, { opacity: tripsAnim, transform: [{ translateY: tripsTranslate }] }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Viajes Recientes</Text>
              <TouchableWithoutFeedback>
                  <Text style={styles.seeAllText}>Ver Historial</Text>
              </TouchableWithoutFeedback>
            </View>
            
            <AnimatedTripCard 
              route="Zócalo - Cholula"
              date="Hoy, 10:30 AM"
              points="+12 pts"
              imageUrl="https://images.unsplash.com/photo-1662496738982-f5dbac28e370?q=80&w=600"
            />

            <AnimatedTripCard 
              route="CAPU - Barrio del Artista"
              date="Ayer, 16:45 PM"
              points="+8 pts"
              imageUrl="https://images.unsplash.com/photo-1596394993175-9e6b4e6dbcc8?q=80&w=600"
            />

          </Animated.View>
        </View>

      </ScrollView>
      {renderIntroOverlay()}
      {renderTransitionOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  headerBackground: {
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#611232',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(97, 18, 50, 0.7)',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subGreetingHeader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)', 
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    paddingTop: 32,
    paddingBottom: 40,
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fdf2f8', 
    zIndex: 3000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introLogoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#A3835F', 
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#611232',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 16,
    color: '#611232',
    fontWeight: '800',
    textAlign: 'center',
  },
  transitionContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4000,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  transitionIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  transitionTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  weatherCard: {
    backgroundColor: '#611232', 
    borderRadius: 28,
    padding: 24,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF', 
  },
  weatherCity: {
    fontSize: 13,
    color: '#BCBDBF', 
    fontWeight: '600',
    marginTop: 2,
  },
  weatherCondition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A3835F', 
  },
  weatherDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    marginVertical: 18,
  },
  weatherBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherRecommendation: {
    fontSize: 14,
    color: '#FFFFFF', 
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#F3F4F6', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  heroStat: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#F3F4F6', 
  },
  heroStatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#611232', 
  },
  heroStatLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A3835F', 
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#611232', 
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A3835F', 
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16, 
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recentTripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  tripImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6'
  },
  tripContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fdf2f8', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tripRoute: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#611232', 
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 12,
    color: '#BCBDBF', 
    fontWeight: '600',
  },
  tripRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripPoints: {
    fontSize: 16,
    fontWeight: '900',
    color: '#A3835F', 
    marginRight: 8,
  },
});