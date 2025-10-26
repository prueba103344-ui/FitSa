import React from 'react';
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ViewProps } from 'react-native';

export default function KeyboardAware({ children, style }: React.PropsWithChildren<{ style?: ViewProps['style'] }>) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {children as any}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
