import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName?: string
): string {
  const colorFromProps = props['light'];
  return colorFromProps ?? Colors.gray900;
}
