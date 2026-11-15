import { Redirect, Tabs } from 'expo-router';
import { CircleUserRound, House } from 'lucide-react-native';
import { useSession } from '@/lib/session';
import { colors, fonts, icon } from '@/theme';

// The signed-in learner's home, with a tab bar at the bottom as in Duolingo:
// Learn (the path) and Profile (who is learning, switching profile, signing out).
// Without an open profile there is nothing to show, so Home's profile picker takes over.
export default function MainTabs() {
  const { me } = useSession();
  if (!me || me.activeProfileId === null) return <Redirect href="/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.borderStrong,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 2, height: 64, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <House size={icon.large - 4} color={color} strokeWidth={icon.stroke} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CircleUserRound size={icon.large - 4} color={color} strokeWidth={icon.stroke} />,
        }}
      />
    </Tabs>
  );
}
