import { CameraView, useCameraPermissions } from 'expo-camera';
import { AlertCircle, Camera as CameraIcon, CheckCircle, CreditCard, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface INEVerificationProps {
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

export default function INEVerification({ onVerificationSuccess, onCancel }: INEVerificationProps) {
  const [step, setStep] = useState(0); // 0: intro, 1: ine, 2: face, 3: success
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if ((step === 1 || step === 2) && !permission?.granted) {
      requestPermission();
    }
  }, [step, permission]);

  const fadeTransition = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSimulateScan = async (nextStep: number) => {
    setLoading(true);
    // Simulate API delay for recognition
    setTimeout(() => {
      setLoading(false);
      fadeTransition(nextStep);
    }, 2000);
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <AlertCircle size={48} color="#A3835F" style={styles.icon} />
            <Text style={styles.title}>Verificación de Identidad</Text>
            <Text style={styles.description}>
              Para garantizar la seguridad de la comunidad REMMI, necesitamos validar tu identidad con tu INE y una prueba biométrica facial.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => fadeTransition(1)}>
              <Text style={styles.primaryButtonText}>Comenzar Verificación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Escanea tu INE</Text>
            <Text style={styles.description}>Coloca la parte frontal de tu INE dentro del marco blanco.</Text>
            
            <View style={styles.cameraFrame}>
               {loading ? (
                 <ActivityIndicator size="large" color="#611232" />
               ) : (
                 permission?.granted ? (
                   <CameraView style={styles.cameraPreview} facing="back">
                     <View style={styles.cameraOverlay} />
                   </CameraView>
                 ) : (
                   <CreditCard size={64} color="#BCBDBF" />
                 )
               )}
               {!loading && <View style={styles.cornerTL} />}
               {!loading && <View style={styles.cornerTR} />}
               {!loading && <View style={styles.cornerBL} />}
               {!loading && <View style={styles.cornerBR} />}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.disabledButton]} 
              onPress={() => handleSimulateScan(2)}
              disabled={loading}
            >
              <CameraIcon size={20} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Procesando...' : 'Tomar Foto de INE'}
              </Text>
            </TouchableOpacity>
            {!loading && (
              <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Verificación Facial</Text>
            <Text style={styles.description}>Mira a la cámara y asegúrate de tener buena iluminación para validar tu rostro.</Text>
            
            <View style={styles.faceFrame}>
               {loading ? (
                 <ActivityIndicator size="large" color="#611232" />
               ) : (
                 permission?.granted ? (
                   <CameraView style={styles.cameraPreviewFace} facing="front">
                     <View style={styles.cameraOverlayFace} />
                   </CameraView>
                 ) : (
                   <User size={64} color="#BCBDBF" />
                 )
               )}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.disabledButton]} 
              onPress={() => handleSimulateScan(3)}
              disabled={loading}
            >
              <CameraIcon size={20} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Analizando Rostro...' : 'Escanear Rostro'}
              </Text>
            </TouchableOpacity>
            {!loading && (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => fadeTransition(1)}>
                <Text style={styles.secondaryButtonText}>Volver a INE</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <CheckCircle size={64} color="#16a34a" style={styles.icon} />
            <Text style={styles.title}>¡Identidad Verificada!</Text>
            <Text style={styles.description}>
              Tus datos han sido validados exitosamente. Ahora puedes completar tu registro en REMMI.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onVerificationSuccess}>
              <Text style={styles.primaryButtonText}>Finalizar Registro</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#611232',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#BCBDBF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  cameraFrame: {
    width: 280,
    height: 180,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BCBDBF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  faceFrame: {
    width: 220,
    height: 220,
    backgroundColor: '#F9FAFB',
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#BCBDBF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 14, // slightly smaller than the frame to fit inside border
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cameraPreviewFace: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    overflow: 'hidden',
  },
  cameraOverlayFace: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  primaryButton: {
    backgroundColor: '#611232',
    flexDirection: 'row',
    borderRadius: 16,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#BCBDBF',
    fontSize: 14,
    fontWeight: '600',
  },
  cornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#A3835F', borderTopLeftRadius: 16 },
  cornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#A3835F', borderTopRightRadius: 16 },
  cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#A3835F', borderBottomLeftRadius: 16 },
  cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#A3835F', borderBottomRightRadius: 16 },
});
