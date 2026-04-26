import {
  Check,
  CheckCircle,
  CreditCard,
  LogOut,
  Mountain,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Importamos la lógica de datos desde data.js
import {
  addCardToUser,
  getCurrentUserId,
  getUserData,
  removeCardFromUser,
  topUpBalance
} from '../../data';

export default function PasareladePagos() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isToppingUp, setIsToppingUp] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  
  // Agregamos nombre y CVC al estado de la nueva tarjeta
  const [newCard, setNewCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [isAddingCard, setIsAddingCard] = useState(false);
  
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('100');
  const [selectedCardId, setSelectedCardId] = useState('');

  // Animación de Éxito
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const successAnimValue = useRef(new Animated.Value(0)).current;

  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const userId = getCurrentUserId();
      if (userId) {
        const data = await getUserData(userId);
        setUserData(data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogout = () => {
    Alert.alert('Sesión', 'Has cerrado sesión exitosamente.');
  };

  const handleConfirmTopUp = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount < 10) {
      Alert.alert('Error', 'El monto mínimo es de $10 MXN');
      return;
    }
    
    if (!userData?.cards || userData.cards.length === 0) {
      Alert.alert('Error', 'Debes añadir una tarjeta para poder recargar saldo.');
      return;
    }
    
    if (!selectedCardId) {
      Alert.alert('Error', 'Por favor selecciona una tarjeta para recargar.');
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }

    setIsToppingUp(true);
    try {
      const response = await topUpBalance(userId, amount);
      if (response.success) {
        setShowRecharge(false);
        setRechargeAmount('100');
        // Actualizar el saldo localmente sin tener que hacer otro fetch
        setUserData((prev: any) => ({ ...prev, balance: response.balance }));

        // Mostrar animación exitosa tipo Cholula
        setShowSuccessAnim(true);
        successAnimValue.setValue(0);
        Animated.sequence([
          Animated.timing(successAnimValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
          Animated.timing(successAnimValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSuccessAnim(false);
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al procesar el pago.');
    } finally {
      setIsToppingUp(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleAddCard = async () => {
    if (!newCard.name.trim()) {
      Alert.alert('Error', 'El nombre en la tarjeta es requerido.');
      return;
    }
    if (newCard.number.replace(/\s/g, '').length !== 16) {
      Alert.alert('Error', 'Número de tarjeta inválido (deben ser 16 dígitos).');
      return;
    }
    if (newCard.expiry.length !== 5) {
      Alert.alert('Error', 'Fecha de caducidad inválida (formato MM/YY).');
      return;
    }
    
    // Validar mes y año
    const [monthStr, yearStr] = newCard.expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      Alert.alert('Error', 'Mes inválido. Debe estar entre 01 y 12.');
      return;
    }
    if (isNaN(year) || year < 25) {
      Alert.alert('Error', 'Año inválido. Debe ser 2025 (25) o posterior.');
      return;
    }

    if (newCard.cvc.length < 3) {
      Alert.alert('Error', 'Código CVC inválido (deben ser 3 o 4 dígitos).');
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }

    setIsAddingCard(true);
    try {
      // Llamamos a data.js pasándole los datos
      const response = await addCardToUser(userId, newCard);
      if (response.success) {
        Alert.alert('Éxito', '¡Tarjeta agregada correctamente!');
        setShowAddCard(false);
        setNewCard({ name: '', number: '', expiry: '', cvc: '' });
        // Actualizamos las tarjetas localmente
        setUserData((prev: any) => ({ ...prev, cards: response.cards }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al añadir la tarjeta.');
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await removeCardFromUser(userId, cardId);
      if (response.success) {
        // Actualizamos las tarjetas localmente
        setUserData((prev: any) => ({ ...prev, cards: response.cards }));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al eliminar la tarjeta.');
    }
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#611232" />
      </View>
    );
  }

  const renderSuccessOverlay = () => {
    if (!showSuccessAnim) return null;

    const overlayOpacity = successAnimValue;
    const cardTranslateY = successAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0]
    });
    
    const sunTranslateY = successAnimValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [80, -10, 0]
    });

    return (
      <Animated.View style={[styles.successOverlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.successModalCard, { transform: [{ translateY: cardTranslateY }] }]}>
          
          <View style={styles.cholulaHero}>
            <Animated.View style={[styles.sunWrapper, { transform: [{translateY: sunTranslateY}] }]}>
               <Sun size={64} color="#A3835F" />
            </Animated.View>
            
            <View style={styles.pyramidWrapper}>
              <View style={styles.churchTop}>
                 {/* Representación de la iglesia sobre la pirámide central */}
                 <View style={styles.churchCrossVertical} />
                 <View style={styles.churchCrossHorizontal} />
                 <View style={styles.churchDome} />
                 <View style={styles.churchBaseElem} />
              </View>
              <Mountain size={140} color="#611232" strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.successIconWrapper}>
            <CheckCircle size={32} color="#ffffff" />
          </View>
          <Text style={styles.successTitleText}>¡Recarga Exitosa!</Text>
          <Text style={styles.successSubtitleText}>
            Tu saldo está listo. ¡A pueblear!
          </Text>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Billetera</Text>
          <Text style={styles.subtitle}>Saldo y métodos de pago.</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Tarjeta Principal y Recarga */}
      <View style={styles.section}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBadge}>CÓDIGO REMMI</Text>
            <CreditCard size={24} color="#A3835F" />
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo Actual</Text>
            <View style={styles.balanceAmountRow}>
              <Text style={styles.balanceAmount}>
                ${(userData?.balance || 0).toFixed(2)}
              </Text>
              <Text style={styles.balanceCurrency}> MXN</Text>
            </View>
          </View>
          
          <Text style={styles.userEmail}>{userData?.email || userData?.nombre}</Text>
        </View>

        {showRecharge ? (
          <View style={styles.rechargeBox}>
            <View style={styles.rechargeHeader}>
              <Text style={styles.rechargeTitle}>Pasarela de pago</Text>
              <TouchableOpacity onPress={() => setShowRecharge(false)}>
                <X size={20} color="#BCBDBF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Monto a recargar (MXN)</Text>
            <View style={styles.amountButtonsRow}>
              {['50', '100', '200'].map(amt => {
                const isSelected = rechargeAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.amountButton, isSelected && styles.amountButtonSelected]}
                    onPress={() => setRechargeAmount(amt)}
                  >
                    <Text style={[styles.amountButtonText, isSelected && styles.amountButtonTextSelected]}>
                      ${amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
              placeholder="Otro monto..."
              keyboardType="numeric"
            />

            {userData?.cards && userData.cards.length > 0 ? (
              <View style={styles.cardsSelectionContainer}>
                <Text style={styles.inputLabel}>Pagar con</Text>
                {userData.cards.map((card: any, i: number) => {
                  const isSelected = selectedCardId === card.id || (!selectedCardId && i === 0);
                  if (isSelected && !selectedCardId) {
                      setTimeout(() => setSelectedCardId(card.id), 0);
                  }
                  return (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                      onPress={() => setSelectedCardId(card.id)}
                    >
                      <View style={styles.cardOptionLeft}>
                        <View style={[styles.cardOptionIcon, isSelected && styles.cardOptionIconSelected]}>
                          <CreditCard size={16} color={isSelected ? '#611232' : '#BCBDBF'} />
                        </View>
                        <Text style={styles.cardOptionText}>•••• {card.last4}</Text>
                      </View>
                      {isSelected && <Check size={16} color="#611232" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noCardsNotice}>
                <Text style={styles.noCardsNoticeText}>Sin tarjetas añadidas. Por favor añade una tarjeta debajo.</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.confirmButton, (isToppingUp || !rechargeAmount || ((userData?.cards?.length || 0) > 0 && !selectedCardId)) && styles.confirmButtonDisabled]}
              onPress={handleConfirmTopUp}
              disabled={isToppingUp || !rechargeAmount || !userData?.cards?.length || ((userData?.cards?.length || 0) > 0 && !selectedCardId)}
            >
              {isToppingUp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirmar pago de ${rechargeAmount || '0'} MXN
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.rechargeButton} onPress={() => setShowRecharge(true)}>
            <Plus size={20} color="#611232" />
            <Text style={styles.rechargeButtonText}>Recargar Saldo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Métodos de Pago */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métodos de Pago</Text>
          {!showAddCard && (
            <TouchableOpacity onPress={() => setShowAddCard(true)}>
              <Text style={styles.addButtonText}>+ Añadir</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAddCard ? (
          <View style={styles.addCardBox}>
            <TouchableOpacity style={styles.closeAddCard} onPress={() => setShowAddCard(false)}>
              <X size={20} color="#BCBDBF" />
            </TouchableOpacity>
            <Text style={styles.addCardTitle}>Nueva Tarjeta de Débito/Crédito</Text>
            
            <Text style={styles.inputLabel}>Nombre en la Tarjeta</Text>
            <TextInput
              style={styles.input}
              value={newCard.name}
              onChangeText={(text) => setNewCard({...newCard, name: text})}
              placeholder="Ej. Juan Pérez"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Número de Tarjeta</Text>
            <TextInput
              style={styles.input}
              value={newCard.number}
              onChangeText={(text) => setNewCard({...newCard, number: formatCardNumber(text)})}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              maxLength={19}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>Caducidad</Text>
                <TextInput
                  style={styles.input}
                  value={newCard.expiry}
                  onChangeText={(text) => setNewCard({...newCard, expiry: formatExpiry(text)})}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>CVC/CVV</Text>
                <TextInput
                  style={styles.input}
                  value={newCard.cvc}
                  onChangeText={(text) => setNewCard({...newCard, cvc: text.replace(/[^0-9]/g, '')})}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveCardButton, (isAddingCard || !newCard.name.trim() || newCard.number.length < 19 || newCard.expiry.length < 5 || newCard.cvc.length < 3) && styles.saveCardButtonDisabled]}
              onPress={handleAddCard}
              disabled={isAddingCard || !newCard.name.trim() || newCard.number.length < 19 || newCard.expiry.length < 5 || newCard.cvc.length < 3}
            >
              {isAddingCard ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveCardButtonText}>Guardar Tarjeta</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {userData?.cards && userData.cards.length > 0 ? (
              userData.cards.map((card: any) => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.cardItemLeft}>
                    <View style={styles.cardItemIconWrapper}>
                      <CreditCard size={20} color="#611232" />
                    </View>
                    <View>
                      <Text style={styles.cardItemNumber}>•••• {card.last4}</Text>
                      <Text style={styles.cardItemExpiry}>Expira {card.expiryDate}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                    <Trash2 size={18} color="#BCBDBF" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyCards}>
                <CreditCard size={32} color="#BCBDBF" style={{marginBottom: 8}}/>
                <Text style={styles.emptyCardsText}>No hay tarjetas guardadas.</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Seguridad */}
      <View style={styles.securitySection}>
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <View style={styles.securityBox}>
          <View style={styles.securityIconWrapper}>
            <ShieldCheck size={24} color="#A3835F" />
          </View>
          <View>
            <Text style={styles.securityTitle}>Transacciones Seguras</Text>
            <Text style={styles.securitySubtitle}>Cifrado de extremo a extremo.</Text>
          </View>
        </View>
      </View>
      
    </ScrollView>
    {renderSuccessOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#611232', // Guinda
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  mainCard: {
    backgroundColor: '#611232', // Guinda
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  balanceContainer: {
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#BCBDBF', // Gris
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#A3835F', // Oro
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  rechargeButton: {
    width: '100%',
    backgroundColor: '#fdf2f8',
    borderColor: '#611232',
    borderWidth: 1,
    borderRadius: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeButtonText: {
    color: '#611232',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  rechargeBox: {
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  rechargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rechargeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#611232',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  amountButtonsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  amountButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#611232',
    borderColor: '#611232',
  },
  amountButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4b5563',
  },
  amountButtonTextSelected: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  cardsSelectionContainer: {
    marginBottom: 20,
  },
  cardOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  cardOptionSelected: {
    borderColor: '#611232',
    backgroundColor: '#fdf2f8',
  },
  cardOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardOptionIconSelected: {
    backgroundColor: '#fce7f3',
  },
  cardOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  noCardsNotice: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
  },
  noCardsNoticeText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#611232',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#611232',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A3835F', // Oro
  },
  addCardBox: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    paddingTop: 40,
  },
  closeAddCard: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  addCardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#611232',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  saveCardButton: {
    backgroundColor: '#611232',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveCardButtonDisabled: {
    opacity: 0.5,
  },
  saveCardButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardsList: {
    gap: 12,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardItemIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardItemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardItemExpiry: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyCards: {
    padding: 24,
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyCardsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#BCBDBF',
  },
  securitySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  securityBox: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  securityIconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  securityTitle: {
    fontWeight: 'bold',
    color: '#611232',
  },
  securitySubtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  // --- Estilos de animación de éxito (Cholula) ---
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalCard: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  cholulaHero: {
    width: '100%',
    height: 160,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  sunWrapper: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  pyramidWrapper: {
    alignItems: 'center',
    position: 'absolute',
    bottom: -15, // recortar la base
  },
  churchTop: {
    alignItems: 'center',
    marginBottom: -8, // solapar con la montaña
    zIndex: 10,
  },
  churchCrossVertical: {
    width: 2,
    height: 10,
    backgroundColor: '#A3835F',
  },
  churchCrossHorizontal: {
    width: 8,
    height: 2,
    backgroundColor: '#A3835F',
    position: 'absolute',
    top: 3,
  },
  churchDome: {
    width: 14,
    height: 10,
    backgroundColor: '#A3835F',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: 2,
  },
  churchBaseElem: {
    width: 24,
    height: 14,
    backgroundColor: '#D1BFAe',
    borderRadius: 2,
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitleText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
});