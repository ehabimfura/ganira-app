import { SvgXml } from 'react-native-svg';
import { avatarSvg } from '@/lib/avatars';

export function Avatar({ id, size = 56 }: { id: string; size?: number }) {
  return <SvgXml xml={avatarSvg(id)} width={size} height={size} />;
}
