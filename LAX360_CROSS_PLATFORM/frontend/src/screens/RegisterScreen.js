import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const RegisterScreen = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [formData, setFormData] = useState({
    owner_name: '',
    store_name: '',
    email: '',
    phone: '',
    password: '',
    store_address: '',
    pincode: '',
    city: '',
    state: '',
    gstin: ''
  });

  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePincodeChange = async (pin) => {
    handleChange('pincode', pin);
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      setPinLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          handleChange('city', po.District || po.Division);
          handleChange('state', po.State);
        }
      } catch (e) {
        console.warn('Pincode lookup error:', e);
      } finally {
        setPinLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.owner_name || !formData.store_name || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await register(formData);
    } catch (e) {
      setErrorMsg(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.textMain }]}>Register Showroom</Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>
          Setup your cross-platform textile POS database
        </Text>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textMain }]}>Owner / Manager Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
            value={formData.owner_name}
            onChangeText={(v) => handleChange('owner_name', v)}
            placeholder="e.g. Meenakshi Sundaram"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textMain }]}>Store / Showroom Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
            value={formData.store_name}
            onChangeText={(v) => handleChange('store_name', v)}
            placeholder="e.g. Lady Avenue Showroom"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>Email Address *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              placeholder="manager@store.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.phone}
              onChangeText={(v) => handleChange('phone', v)}
              placeholder="9876543210"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textMain }]}>Password *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
            value={formData.password}
            onChangeText={(v) => handleChange('password', v)}
            placeholder="Create password"
            secureTextEntry
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>
              PIN Code {pinLoading ? '(Looking up...)' : ''}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.pincode}
              onChangeText={handlePincodeChange}
              placeholder="600017"
              maxLength={6}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>City / District</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.city}
              onChangeText={(v) => handleChange('city', v)}
              placeholder="Salem"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>State</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.state}
              onChangeText={(v) => handleChange('state', v)}
              placeholder="Tamil Nadu"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textMain }]}>GSTIN (Optional)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
              value={formData.gstin}
              onChangeText={(v) => handleChange('gstin', v)}
              placeholder="33AABCS8899K1ZM"
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Complete Store Setup</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin} style={{ marginLeft: 6 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 580,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4
  },
  subheading: {
    fontSize: 13,
    marginBottom: 20
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  }
});
