import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LAX360 Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred in the billing interface.'}
            </Text>
            <TouchableOpacity style={styles.btn} onPress={this.handleReload} activeOpacity={0.8}>
              <Text style={styles.btnText}>Reload Terminal</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 24
  },
  card: {
    maxWidth: 480,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  icon: {
    fontSize: 48,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  btn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
