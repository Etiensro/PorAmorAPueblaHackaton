import { ArrowRight, Bike, Lock, Mail, User } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { loginUser, registerUser } from '..//../data'; // <-- Revisa que la ruta al data.js sea correcta

const { width } = Dimensions.get('window');

export default function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Ref para la posición de la bicicleta animada
  const bikePosition = useRef(new Animated.Value(-100)).current;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const playSuccessAnimation = (user: any) => {
    setShowAnimation(true);
    Animated.sequence([
      Animated.timing(bikePosition, {
        toValue: width,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Cuando la bici termine de cruzar, marcamos el inicio de sesión exitoso
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    });
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor llena todos los campos necesarios.');
      return;
    }
    
    if (isRegistering && !name.trim()) {
      Alert.alert('Error', 'El nombre es requerido para registrarte.');
      return;
    }

    setIsLoading(true);
    try {
      let user;
      if (isRegistering) {
        user = await registerUser(name, email, password);
      } else {
        user = await loginUser(email, password);
      }
      
      // Lanzar animación
      playSuccessAnimation(user);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error de autenticación.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setName('');
    setEmail('');
    setPassword('');
  };

  // Pantalla de animación al iniciar sesión
  if (showAnimation) {
    return (
      <View style={styles.animationContainer}>
        <Text style={styles.animationText}>
          {isRegistering ? '¡Tu cuenta ha sido creada!' : '¡Hola de nuevo!'}
        </Text>
        <Animated.View style={{ transform: [{ translateX: bikePosition }] }}>
          <Bike size={64} color="#A3835F" />
        </Animated.View>
      </View>
    );
  }

  // Pantalla del Formulario
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        {/* Encabezado / Logo */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>REMMI</Text>
          <Text style={styles.loveSubtitle}>Por amor a Puebla</Text>
          <Text style={styles.subtitle}>
            {isRegistering
              ? 'Únete a la movilidad sostenible'
              : 'Bienvenido a tu red de transporte'}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#BCBDBF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor="#BCBDBF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#BCBDBF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@buap.mx"
                placeholderTextColor="#BCBDBF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#BCBDBF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#BCBDBF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#A3835F" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonText}>
                  {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
                </Text>
                <ArrowRight size={20} color="#A3835F" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.footerAction}>
              {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Fondo general suave para resaltar la tarjeta blanca
  },
  animationContainer: {
    flex: 1,
    backgroundColor: '#611232', // Guinda Institucional
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#611232', // Guinda Institucional
    letterSpacing: 2,
    marginBottom: 4,
  },
  loveSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A3835F', // Dorado
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#611232',
    opacity: 0.8,
  },
  form: {
    backgroundColor: '#FFFFFF', // Blanco Puro
    borderRadius: 24,
    padding: 24,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#611232', // Guinda Institucional
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BCBDBF', // Gris Ceniza
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#611232',
  },
  submitButton: {
    backgroundColor: '#611232', // Guinda Institucional
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#A3835F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#A3835F', // Color dorado deshabilitado
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF', // Blanco Puro
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#BCBDBF', // Gris Ceniza
    fontSize: 14,
    marginRight: 4,
  },
  footerAction: {
    color: '#611232', // Guinda Institucional
    fontSize: 14,
    fontWeight: 'bold',
  },
});