import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export const LoginScreen = () => {
  const { login } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [identifier, setIdentifier] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password state
  const [isForgotModal, setIsForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotMsg, setForgotMsg] = useState('');

  // Ensure body and html background color matches theme evenly across full page
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const bg = colors.bgMain || '#0F172A';
      if (document.body) document.body.style.backgroundColor = bg;
      if (document.documentElement) document.documentElement.style.backgroundColor = bg;
    }
  }, [colors.bgMain]);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both identifier and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setErrorMsg('Cannot connect to backend service (port 8000). Please ensure backend is running.');
      } else {
        setErrorMsg(msg || 'Unable to sign in. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToken = async () => {
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotMsg(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotStep(2);
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword) return;
    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      setForgotMsg(res.message);
      setTimeout(() => {
        setIsForgotModal(false);
        setForgotStep(1);
        setPassword(newPassword);
      }, 1500);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible, color = '#64748B' }) => {
    if (visible) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]}>
      <View style={[styles.card, { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border }]}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '800' }}>360</Text>
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: colors.textMain }]}>Textile POS</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>Retail & Billing ERP</Text>
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.textMain }]}>Sign In to Terminal</Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>
          Enter your showroom manager credentials
        </Text>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textMain }]}>Email / Username</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="admin@gmail.com"
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textMain }]}>Password</Text>
          <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.passwordInput, { color: colors.textMain }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              activeOpacity={0.7}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon visible={showPassword} color={colors.textMuted || '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsForgotModal(true)}
          style={{ alignSelf: 'flex-end', marginBottom: 16 }}
        >
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 36,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600'
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: 'none'
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
