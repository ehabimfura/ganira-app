import { WebHaptics } from 'web-haptics';

// The web build vibrates through web-haptics (https://github.com/lochie/web-haptics, MIT),
// which also works on iPhone browsers. Same names as haptics.ts.
let engine: WebHaptics | null = null;

function trigger(pattern: Parameters<WebHaptics['trigger']>[0]): void {
  try {
    engine ??= new WebHaptics();
    engine.trigger(pattern);
  } catch (error) {
    console.warn('Haptics unavailable', error);
  }
}

export const haptics = {
  tap: () => trigger('selection'),
  correct: () => trigger('success'),
  wrong: () => trigger('error'),
  celebrate: () => trigger([25, 70, 30, 60, 35, 50, 45, 40, 220]),
};
