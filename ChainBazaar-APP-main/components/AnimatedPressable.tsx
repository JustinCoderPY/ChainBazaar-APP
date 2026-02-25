import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Static style — applied to the outer Animated.View */
  style?: StyleProp<ViewStyle>;
  /** Scale value when pressed (0-1). Default: 0.97 */
  scaleValue?: number;
  /** Duration of the press-in animation in ms. Default: 120 */
  pressInDuration?: number;
  /** Duration of the press-out animation in ms. Default: 180 */
  pressOutDuration?: number;
  children: React.ReactNode;
}

export default function AnimatedPressable({
  style,
  scaleValue = 0.97,
  pressInDuration = 120,
  pressOutDuration = 180,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: scaleValue,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [onPressOut]
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}