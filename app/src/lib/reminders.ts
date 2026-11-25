import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// One reminder a day at the time the parent chose (FR 9.3). It is scheduled on this phone,
// so it works without the server. The web build can't schedule reminders, so it does nothing there.
export async function syncReminder(reminderTime: string | null): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!reminderTime) return;
    const [hour, minute] = reminderTime.split(':').map(Number);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Ganira', body: 'Time for a few minutes of Kinyarwanda.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch (error) {
    console.warn('Could not set the reminder', error);
  }
}
