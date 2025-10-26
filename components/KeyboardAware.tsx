import React from 'react';
import { KeyboardAvoidingView, Platform, ViewProps } from 'react-native';

export default function KeyboardAware({ children, style }: React.PropsWithChildren<{ style?: ViewProps['style'] }>) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
