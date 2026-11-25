import { router } from 'expo-router';
import { Choice, Screen, Body, Title } from '@/components/ui';
import { useSession } from '@/lib/session';

// The parent's list of children. Each one opens its progress and settings (FR 10.1).
export default function ParentView() {
  const { me } = useSession();
  const children = me?.profiles.filter((p) => p.kind === 'CHILD') ?? [];

  return (
    <Screen>
      <Title>Your children</Title>
      {children.length === 0 ? (
        <Body>No children yet. Add a child from the profile picker.</Body>
      ) : (
        children.map((child) => (
          <Choice
            key={child.id}
            label={child.nickname}
            hint={`${child.streak.days} day${child.streak.days === 1 ? '' : 's'} in a row`}
            onPress={() => router.push({ pathname: '/child/[id]', params: { id: String(child.id) } })}
          />
        ))
      )}
    </Screen>
  );
}
