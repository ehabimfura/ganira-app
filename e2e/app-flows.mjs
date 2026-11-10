// End-to-end check of the app's screens in headless Chromium.
// Needs the API (cd api && npm start) and the web build (cd app && npx expo start --web) running.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:8081';
// fileURLToPath keeps spaces in folder names ("Tedx ") instead of turning them into %20.
const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const env = Object.fromEntries(
  readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const stamp = Date.now().toString().slice(-6);
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message.split('\n')[0]}`);
    const slug = name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
    await page.screenshot({ path: `${SHOTS}FAIL-${slug}.png` }).catch(() => {});
    const body = await page.locator('body').innerText().catch(() => '');
    results.push(`     screen text: ${body.replace(/\s+/g, ' ').slice(0, 200)}`);
  }
}

const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// Only visible matches count: screens further back in the stack stay in the page, hidden.
const text = (t) => page.getByText(t, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 8000 });
const tap = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
const fill = (label, value) => page.getByRole('textbox', { name: label }).fill(value);
const shown = async (name) => (await page.getByRole('button', { name, exact: true }).filter({ visible: true }).count()) > 0;
const isLocked = async (name) =>
  (await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().getAttribute('aria-disabled')) === 'true';

// Lessons 1-4: listen to each phrase, move on, and finish.
async function finishStepLesson() {
  for (let i = 0; i < 40; i++) {
    if (await shown('Back to lessons')) return;
    if (await shown('Finish')) await tap('Finish');
    else if (await shown('Next')) await tap('Next');
    else if (await shown('🔊 Listen')) await tap('🔊 Listen');
    else await page.waitForTimeout(200);
  }
  throw new Error('the lesson never reached its end');
}

await check('welcome screen shows on first launch', async () => {
  await page.goto(BASE);
  await text('Muraho!');
  await page.screenshot({ path: `${SHOTS}1-welcome.png` });
});

await check('under 18 on "Me" is sent to a parent, nothing saved', async () => {
  await tap('Get started');
  await tap('Me');
  await fill('Birth year', '2014');
  await page.screenshot({ path: `${SHOTS}2-birth-year.png` });
  await page.keyboard.press('Enter');
  await text('Ask a parent or guardian to set up Ganira');
  await page.screenshot({ path: `${SHOTS}3-under-age.png` });
});

await check('parent path asks for the parent year and explains a child year', async () => {
  await page.goto(`${BASE}/who`);
  await tap('My child');
  await text('(parent or guardian)');
  await fill('Birth year', '2016');
  await page.keyboard.press('Enter');
  await text('Please enter your own birth year');
  await tap('Back');
  await text('(parent or guardian)');
});

await check('save-progress without answers sends the learner back to the start', async () => {
  await page.goto(`${BASE}/create-account?for=me`);
  await text('Who is Ganira for?');
});

await check('learner answers level and daily goal', async () => {
  await page.goto(`${BASE}/birth-year?for=me`);
  await fill('Birth year', '1992');
  await page.keyboard.press('Enter');
  await text('How much Kinyarwanda do you know?');
  await page.getByRole('radio', { name: 'I know a few words' }).click();
  await page.screenshot({ path: `${SHOTS}4-level.png` });
  await tap('Continue');
  await text('How much time a day?');
  await page.getByRole('radio', { name: '15 minutes a day' }).click();
  await tap('Continue');
});

await check('first lesson: must listen before continuing; no "I said it" button', async () => {
  await text('Your first word');
  if (await page.getByRole('button', { name: 'Continue' }).count()) throw new Error('Continue shown before listening');
  await tap('🔊 Listen');
  await text('Now say it out loud!');
  if (await page.getByRole('button', { name: 'I said it' }).count()) throw new Error('"I said it" is still there');
  await page.screenshot({ path: `${SHOTS}5-first-lesson.png` });
  await tap('Continue');
  await text('Save your progress');
});

await check('learner sign-up: short password is caught, then account is created', async () => {
  await fill('Nickname', 'Amina');
  await tap('leopard');
  await fill('Email', `amina${stamp}@example.com`);
  await fill('Username', `Amina_${stamp}`);
  await fill('Password', 'short');
  await tap('Create account');
  await text('at least 8 characters');
  await page.screenshot({ path: `${SHOTS}6-create-account-error.png` });
  await fill('Password', 'correct horse');
  await tap('Create account');
  await text('Muraho, Amina!');
  await text('Daily goal: 15 minutes');
  await page.getByRole('button', { name: 'Lesson 1: Greetings' }).waitFor();
  await page.screenshot({ path: `${SHOTS}7-home-learner.png` });
});

await check('still signed in after reopening the app', async () => {
  await page.reload();
  await text('Muraho, Amina!');
});

await check('sign out returns to Welcome', async () => {
  await tap('Sign out');
  await text('I already have an account');
});

await check('a taken username gets a clear message', async () => {
  await page.goto(`${BASE}/birth-year?for=child`);
  await fill('Birth year', '1985');
  await page.keyboard.press('Enter');
  await text('Create your parent account');
  await fill('Email', `other${stamp}@example.com`);
  await fill('Username', 'john');
  await fill('Password', 'correct horse');
  await tap('Create account');
  await text('That username is taken');
});

await check('wrong password gets a clear message', async () => {
  await page.goto(`${BASE}/sign-in`);
  await fill('Email or username', 'john');
  await fill('Password', 'wrong-password');
  await tap('Sign in');
  await text('email, username or password is not right');
});

await check('test account signs in by username and sees its child in the picker', async () => {
  await fill('Password', env.TEST_ACCOUNT_PASSWORD);
  await tap('Sign in');
  await text('Who is learning?');
  await page.getByRole('button', { name: 'Keza' }).waitFor();
  await tap('Sign out');
  await text('I already have an account');
});

const PARENT_PASSWORD = 'parent password';

await check('new parent is asked to add a child; consent is required', async () => {
  await page.goto(`${BASE}/birth-year?for=child`);
  await fill('Birth year', '1984');
  await page.keyboard.press('Enter');
  await fill('Email', `mama${stamp}@example.com`);
  await fill('Username', `mama_${stamp}`);
  await fill('Password', PARENT_PASSWORD);
  await tap('Create account');
  await text('Add your child');
  await fill("Child's nickname", 'Ineza');
  await page.getByRole('radio', { name: '7-9' }).click();
  await fill('PIN (optional, 4 numbers)', '2468');
  await tap('Add child');
  await text('Please confirm you are the parent or guardian');
  await page.getByRole('checkbox', { name: "I am this child's parent or guardian" }).click();
  await page.screenshot({ path: `${SHOTS}8-add-child.png`, fullPage: true });
  await tap('Add child');
  await text('Who is learning?');
  await page.screenshot({ path: `${SHOTS}9-picker.png` });
});

await check('a PIN-locked child needs the right PIN', async () => {
  await tap('Ineza');
  await text("Ineza's PIN");
  await fill('PIN', '0000');
  await tap('Open');
  await text("That PIN isn't right");
  await fill('PIN', '2468');
  await tap('Open');
  await text('Muraho, Ineza!');
  await text('Daily goal: 5 minutes');
  await page.screenshot({ path: `${SHOTS}10-child-home.png` });
});

await check('a child has no sign-out; finishing lesson 1 opens lesson 2 only', async () => {
  if (await page.getByRole('button', { name: 'Sign out' }).count()) throw new Error('Sign out shown in child mode');
  if (!(await isLocked('Lesson 2: Yes and no'))) throw new Error('lesson 2 open before lesson 1 was done');
  await tap('Lesson 1: Greetings');
  await text('1. Greetings');
  await text('Muraho');
  if (await shown('Next')) throw new Error('Next shown before listening');
  await tap('🔊 Listen');
  await text('Now say it out loud!');
  await page.screenshot({ path: `${SHOTS}11-lesson-step.png` });
  await finishStepLesson();
  await text('Lesson 1 complete');
  await page.screenshot({ path: `${SHOTS}12-lesson-done.png` });
  await tap('Back to lessons');
  await text('Muraho, Ineza!');
  if (await isLocked('Lesson 2: Yes and no')) throw new Error('lesson 2 still locked');
  if (!(await isLocked('Lesson 3: Where to?'))) throw new Error('lesson 3 open too early');
});

await check('lessons 2-4 teach the motari\'s words, then the ride ends with "vayo tugende"', async () => {
  for (const name of ['Lesson 2: Yes and no', 'Lesson 3: Where to?', 'Lesson 4: How much?']) {
    await tap(name);
    await finishStepLesson();
    await tap('Back to lessons');
    await text('Muraho, Ineza!');
  }
  await tap('Lesson 5: The ride');
  await text('Greet the motari');
  await page.getByRole('radio', { name: 'Mwaramutse' }).click();
  await tap('Next');
  await text('Mota?');
  await tap('🔊 Listen');
  await tap('Next');
  // The motari answers with the greeting the learner chose.
  await page.getByLabel('Motari: Mwaramutse').filter({ visible: true }).first().waitFor({ timeout: 8000 });
  for (let i = 0; i < 3; i++) {
    await tap('🔊 Listen');
    await tap('Next');
  }
  await text('Ntacyo, vayo tugende.');
  // The last line must be on screen, above the Finish button, not just somewhere in the chat.
  const last = page.getByText('Ntacyo, vayo tugende.').filter({ visible: true }).first();
  const finish = page.getByRole('button', { name: '🏍️ Finish' }).filter({ visible: true }).first();
  for (let i = 0; ; i++) {
    const [line, button] = [await last.boundingBox(), await finish.boundingBox()];
    if (line && button && line.y + line.height <= button.y) break;
    if (i === 15) throw new Error('the last line of the ride is hidden below the Finish button');
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${SHOTS}13-ride.png` });
  await tap('🏍️ Finish');
  await text('Lesson 5 complete');
  await tap('Back to lessons');
  await text('Muraho, Ineza!');
});

await check("only the parent's password leaves the child's profile", async () => {
  await tap('Parent');
  await fill('Parent password', 'wrong password');
  await tap('Continue');
  await text("That password isn't right");
  await fill('Parent password', PARENT_PASSWORD);
  await tap('Continue');
  await text('Who is learning?');
});

await check('a child without a PIN opens with one tap', async () => {
  await tap('+ Add child');
  await text('Add another child');
  await fill("Child's nickname", 'Ganza');
  await page.getByRole('radio', { name: '4-6' }).click();
  await page.getByRole('checkbox', { name: "I am this child's parent or guardian" }).click();
  await tap('Add child');
  await text('Who is learning?');
  await tap('Ganza');
  await text('Muraho, Ganza!');
});

await check('credits name the voice and its licence', async () => {
  await page.goto(`${BASE}/credits`);
  await text('Digital Umuganda');
  await text('CC BY-SA 4.0');
});

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `Page errors:\n${errors.join('\n')}` : 'No page errors.');
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
