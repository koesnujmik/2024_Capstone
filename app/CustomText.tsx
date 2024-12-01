import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

const CustomText: React.FC<TextProps> = ({ style, children, ...props }) => {
  return (
    <Text style={[styles.default, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  default: {
    fontFamily: 'NotoSansKR-VariableFont_wght', // 기본 폰트 설정
    fontSize: 16, // 기본 폰트 크기
    color: '#000', // 기본 텍스트 색상
  },
});

export default CustomText;
