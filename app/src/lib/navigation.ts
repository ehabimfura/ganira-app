import { router } from 'expo-router';

// Return to the Home already in the stack (it re-renders with the new session),
// rather than opening a second Home on top of it. If there is nothing to go back
// to, for example after a redirect, Home replaces the current screen.
export function returnHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
