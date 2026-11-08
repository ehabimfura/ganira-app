import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';

// The opening route only decides where to go.
export default function Index() {
  const { status } = useSession();
  return <Redirect href={status === 'signedIn' ? '/home' : '/welcome'} />;
}
