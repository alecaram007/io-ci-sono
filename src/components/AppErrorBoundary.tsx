import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Errore imprevisto',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crash boundary', error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Io ci sono</Text>
          <Text style={styles.title}>Si e verificato un errore</Text>
          <Text style={styles.copy}>{this.state.message || 'Riprova ad aprire la schermata.'}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} accessibilityRole="button">
            <Text style={styles.buttonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 460,
    padding: 24,
    width: '100%',
  },
  kicker: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 34,
    marginTop: 8,
  },
  copy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.acid,
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
