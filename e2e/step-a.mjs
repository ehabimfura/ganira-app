// End-to-end check of phone step A in headless Chromium.
// Needs the API (cd api && npm start) and the web build (cd app && npx expo start --web) running.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:8081';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
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
  }
}

const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const text = (t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 8000 });
const tap = (name) => page.getByRole('button', { name, exact: true }).click();
const fill = (label, value) => page.getByRole('textbox', { name: label }).fill(value);

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

await check('learner sign-up: short password is caught, then account is created', async () => {
  await page.goto(`${BASE}/birth-year?for=me`);
  await fill('Birth year', '1992');
  await page.keyboard.press('Enter');
  await text('Save your progress');
  await fill('Nickname', 'Amina');
  await tap('leopard');
  await fill('Email', `amina${stamp}@example.com`);
  await fill('Username', `Amina_${stamp}`);
  await fill('Password', 'short');
  await tap('Create account');
  await text('at least 8 characters');
  await page.screenshot({ path: `${SHOTS}4-create-account-error.png` });
  await fill('Password', 'correct horse');
  await tap('Create account');
  await text('Muraho, Amina!');
  await text('daily goal 10 minutes');
  await page.screenshot({ path: `${SHOTS}5-home-learner.png` });
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

await check('test account signs in by username and sees its child', async () => {
  await fill('Password', env.TEST_ACCOUNT_PASSWORD);
  await tap('Sign in');
  await text('Muraho, john!');
  await text('1 child profile(s)');
  await page.screenshot({ path: `${SHOTS}6-home-parent.png` });
  await tap('Sign out');
  await text('I already have an account');
});

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `Page errors:\n${errors.join('\n')}` : 'No page errors.');
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
