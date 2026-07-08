import React from 'react';
import VectorIcon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme/colors';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 22, color = colors.text }: IconProps) {
  return <VectorIcon name={name} size={size} color={color} />;
}
