// End-to-end check of the app's screens in headless Chromium.
// Needs the API (cd api && npm start) and the web build (cd app && npx expo start --web) running.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
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

// The fake microphone "says" the approved Muraho clip, so the speech check runs for real.
// Needs the speech service running too (cd speech && .venv/bin/python server.py).
// Chrome loops the file, so this copy has silence around the word (and is 48 kHz, which
// Chrome reads cleanly): a 3-second recording always holds one whole "Muraho".
const MURAHO = fileURLToPath(new URL('./fixtures/mic-muraho.wav', import.meta.url));
const launch = {
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${MURAHO}`],
};
const browser = await chromium.launch(launch).catch(() => chromium.launch({ ...launch, channel: 'chrome' }));
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// Only visible matches count: screens further back in the stack stay in the page, hidden.
const text = (t) => page.getByText(t, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 8000 });
const tap = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
const fill = (label, value) => page.getByRole('textbox', { name: label }).fill(value);
const shown = async (name) => (await page.getByRole('button', { name, exact: true }).filter({ visible: true }).count()) > 0;
const isLocked = async (name) =>
  (await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().getAttribute('aria-disabled')) === 'true';

// Records through the fake microphone and waits for the speech check's answer. Recording
// stops by itself after the word and a short silence; Stop is tapped if it hasn't yet.
async function speak() {
  await tap('Speak');
  const again = page.getByRole('button', { name: 'Try again', exact: true }).filter({ visible: true }).first();
  await again.waitFor({ timeout: 3500 }).catch(async () => {
    if (await shown('Stop')) await tap('Stop');
  });
  await again.waitFor({ timeout: 20000 });
}

const enabled = async (name) => {
  const button = page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
  return (await button.count()) > 0 && (await button.getAttribute('aria-disabled')) !== 'true';
};
const visibleText = async (t) => (await page.getByText(t, { exact: false }).filter({ visible: true }).count()) > 0;

// Speaks and expects every word green. Chrome's fake microphone sometimes sends silence on
// a recording, so up to two "Try again" taps are allowed, as a learner would.
async function speakUntilHeard(label) {
  const heard = page.getByLabel(label).filter({ visible: true }).first();
  await speak();
  for (let retry = 0; retry < 2 && !(await heard.isVisible()); retry++) {
    await tap('Try again');
    const again = page.getByRole('button', { name: 'Try again', exact: true }).filter({ visible: true }).first();
    await page.waitForTimeout(500);
    await again.waitFor({ timeout: 3500 }).catch(async () => {
      if (await shown('Stop')) await tap('Stop');
    });
    await again.waitFor({ timeout: 20000 });
  }
  await heard.waitFor({ timeout: 5000 });
}

// Match pairs by trying each meaning for each phrase; wrong tries flash red and are allowed.
async function solvePairs() {
  for (let k = 0; k < 6; k++) {
    const kin = page.getByTestId(`pair-kin-${k}`).filter({ visible: true });
    if (!(await kin.count())) break;
    for (let e = 0; e < 6 && (await kin.getAttribute('aria-disabled')) !== 'true'; e++) {
      const en = page.getByTestId(`pair-en-${e}`).filter({ visible: true });
      if (!(await en.count())) break;
      if ((await en.getAttribute('aria-disabled')) === 'true') continue;
      await kin.click();
      await en.click();
      await page.waitForTimeout(650);
    }
  }
}

// Plays a lesson or practice level through to its "complete" screen, answering every
// exercise (sometimes wrongly, which brings the exercise back once at the end).
// With `stopAt`, stops as soon as that text is on screen instead.
async function finishLevel(stopAt) {
  for (let i = 0; i < 400; i++) {
    if (stopAt && (await visibleText(stopAt))) return;
    if (await visibleText(' complete')) return;
    if (await shown('Start')) await tap('Start');
    else if (await enabled('Check')) await tap('Check');
    else if (await enabled('Continue')) await tap('Continue');
    else if (await shown('Finish')) await tap('Finish');
    else if (await shown('Next')) await tap('Next');
    else if (await shown('Speak')) await speak();
    else if (await shown('Listen')) await tap('Listen');
    else if (await page.getByTestId('pair-kin-0').filter({ visible: true }).count()) await solvePairs();
    else if (await page.getByTestId('tile-0').filter({ visible: true }).count()) {
      // Tap every bank word in order; the answer is checked either way.
      for (let t = 0; t < 8; t++) {
        const tile = page.getByTestId(`tile-${t}`).filter({ visible: true }).last();
        if (await tile.count()) await tile.click();
      }
    } else if (await page.getByRole('radio').filter({ visible: true }).count()) {
      await page.getByRole('radio').filter({ visible: true }).first().click();
    } else await page.waitForTimeout(200);
  }
  throw new Error('the level never reached its end');
}

const backToPath = async (name) => {
  await tap('Continue');
  await text(`Muraho, ${name}!`);
};

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

await check('first lesson: listen, then speak; the speech check hears "Muraho" before sign-up', async () => {
  await text('Your first word');
  if (await page.getByRole('button', { name: 'Continue' }).count()) throw new Error('Continue shown before listening');
  await tap('Listen');
  await text('Now say it out loud!');
  if (await page.getByRole('button', { name: 'I said it' }).count()) throw new Error('"I said it" is still there');
  if (await shown('Continue')) throw new Error('Continue shown before speaking');
  await speakUntilHeard('Heard: 1 of 1 words');
  await page.screenshot({ path: `${SHOTS}5-first-lesson.png` });
  await tap('Continue');
  await text('Save your progress');
  // Someone with an account already can sign in from here.
  await page.getByRole('button', { name: 'I already have an account' }).filter({ visible: true }).first().waitFor();
});

await check('learner sign-up: short password is caught, then account is created', async () => {
  await fill('Nickname', 'Amina');
  await tap('Avatar 6');
  await fill('Email', `amina${stamp}@example.com`);
  await fill('Username', `Amina_${stamp}`);
  await fill('Password', 'short');
  await tap('Create account');
  await text('at least 8 characters');
  await page.screenshot({ path: `${SHOTS}6-create-account-error.png` });
  await fill('Password', 'correct horse');
  await tap('Create account');
  await text('Muraho, Amina!');
  await page.getByRole('button', { name: 'Lesson 1: Hello' }).waitFor();
  await page.screenshot({ path: `${SHOTS}7-home-learner.png` });
});

await check('still signed in after reopening the app', async () => {
  await page.reload();
  await text('Muraho, Amina!');
});

await check('the Profile tab shows the daily goal and signs out to Welcome', async () => {
  await page.getByText('Profile', { exact: true }).filter({ visible: true }).last().click();
  await text('15 min');
  await page.screenshot({ path: `${SHOTS}7b-profile.png` });
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
  await tap('Ineza, has a PIN');
  await text("Ineza's PIN");
  await fill('PIN', '0000');
  await tap('Open');
  await text("That PIN isn't right");
  await fill('PIN', '2468');
  await tap('Open');
  await text('Muraho, Ineza!');
  await page.screenshot({ path: `${SHOTS}10-child-home.png` });
});

await check('a child has no sign-out; finishing level 1 opens level 2 only', async () => {
  await page.getByText('Profile', { exact: true }).filter({ visible: true }).last().click();
  await text('Switch profile');
  if (await shown('Sign out')) throw new Error('Sign out shown in child mode');
  await page.getByText('Learn', { exact: true }).filter({ visible: true }).last().click();
  if (!(await isLocked('Lesson 2: Hi and thanks'))) throw new Error('level 2 open before level 1 was done');
  await tap('Lesson 1: Hello');
  await text('By the end you can:');
  await text('Greet anyone at any time of day.');
  await page.screenshot({ path: `${SHOTS}11a-lesson-goal.png` });
  await tap('Start');
  await text('New phrase');
  if (await shown('Continue')) throw new Error('Continue shown before speaking');
  await speakUntilHeard('Heard: 1 of 1 words');
  await page.screenshot({ path: `${SHOTS}11-introduce.png` });
  await tap('Continue');

  // Listen: a wrong pick turns red and the right meaning green, with the answer in the bar.
  await text('What does this mean?');
  await page.getByRole('radio', { name: 'Thank you' }).click();
  await tap('Check');
  await page.getByRole('radio', { name: 'Thank you, wrong answer' }).waitFor();
  await page.getByRole('radio', { name: 'Hello, right answer' }).waitFor();
  await text('Correct answer:');
  await page.screenshot({ path: `${SHOTS}11b-listen-wrong.png` });
  await tap('Continue');

  // Quitting asks first; "Keep learning" stays in the lesson.
  await tap('Quit lesson');
  await text('Quit this lesson?');
  await tap('Keep learning');

  await finishLevel('Tap the matching pairs');
  await page.screenshot({ path: `${SHOTS}11c-pairs.png` });
  await finishLevel('Say this in Kinyarwanda');
  await text('“Hello”');
  if (await page.getByText('Muraho', { exact: true }).filter({ visible: true }).count()) throw new Error('answer shown before trying');
  await page.screenshot({ path: `${SHOTS}11d-recall.png` });
  await finishLevel();
  // The wrong listen answer came back at the end before the lesson could finish.
  await text('Lesson complete');
  await text('Now you can:');
  await page.screenshot({ path: `${SHOTS}12-lesson-done.png` });
  await backToPath('Ineza');
  // Finishing a level starts the streak; the flame lights up for today.
  await page.getByLabel('Streak: 1 day, practised today').filter({ visible: true }).first().waitFor();
  if (await isLocked('Lesson 2: Hi and thanks')) throw new Error('level 2 still locked');
  if (!(await isLocked('Practice 3: Practice: greetings'))) throw new Error('level 3 open too early');
});

await check('levels 2-7 teach the ride, then the roleplay ends with "vayo tugende"', async () => {
  const levels = [
    'Lesson 2: Hi and thanks',
    'Practice 3: Practice: greetings',
    'Lesson 4: Calling a moto',
    'Lesson 5: Where to?',
    'Lesson 6: How much?',
    'Practice 7: Practice: the ride',
  ];
  for (const name of levels) {
    await tap(name);
    if (name.endsWith('Where to?')) {
      await finishLevel('Put the words in order');
      await page.screenshot({ path: `${SHOTS}12b-build.png` });
    }
    await finishLevel();
    await backToPath('Ineza');
  }
  await tap('Roleplay 8: The ride');
  await tap('Start');
  await text('Greet the motari');
  await page.getByRole('radio', { name: 'Mwaramutse' }).click();
  await speak();
  await tap('Next');
  await text('Mota?');
  await tap('Listen');
  await speak();
  await tap('Next');
  // The motari answers with the greeting the learner chose.
  await page.getByLabel('Motari: Mwaramutse').filter({ visible: true }).first().waitFor({ timeout: 8000 });
  for (let i = 0; i < 3; i++) {
    await tap('Listen');
    await speak();
    await tap('Next');
  }
  await text('Ntacyo, vayo tugende.');
  // The last line must be on screen, above the Finish button, not just somewhere in the chat.
  const last = page.getByText('Ntacyo, vayo tugende.').filter({ visible: true }).first();
  const finish = page.getByRole('button', { name: 'Finish' }).filter({ visible: true }).first();
  for (let i = 0; ; i++) {
    const [line, button] = [await last.boundingBox(), await finish.boundingBox()];
    if (line && button && line.y + line.height <= button.y) break;
    if (i === 15) throw new Error('the last line of the ride is hidden below the Finish button');
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${SHOTS}13-ride.png` });
  await tap('Finish');
  await text('Roleplay complete');
  await page.screenshot({ path: `${SHOTS}13b-celebration.png` });
  await backToPath('Ineza');
});

await check('three days later the daily review brings phrases back, and finishing it keeps the streak', async () => {
  // Move this child's practice three days into the past, as if time had passed
  // (the local test database only; the MySQL client comes with Homebrew's mysql@8.4).
  execFileSync('/opt/homebrew/opt/mysql@8.4/bin/mysql', [
    `-u${env.DB_USER}`, `-h${env.DB_HOST}`, `-P${env.DB_PORT}`, env.DB_NAME, '-e',
    `UPDATE phrase_memory m JOIN learners l ON l.id = m.learner_id
        SET m.last_practised_at = m.last_practised_at - INTERVAL 3 DAY
      WHERE l.nickname = 'Ineza' AND l.created_at > NOW() - INTERVAL 1 HOUR`,
  ], { env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD } });
  await page.reload();
  await text('Muraho, Ineza!');
  const card = page.getByRole('button', { name: /^Daily review: \d+ phrases?$/ }).filter({ visible: true }).first();
  await card.waitFor({ timeout: 10000 });
  await page.screenshot({ path: `${SHOTS}14-review-card.png` });
  await card.click();
  await finishLevel('Review complete');
  await text('phrases refreshed');
  await page.screenshot({ path: `${SHOTS}15-review-done.png` });
  await backToPath('Ineza');
});

await check("only the parent's password leaves the child's profile", async () => {
  await page.getByText('Profile', { exact: true }).filter({ visible: true }).last().click();
  await tap('Switch profile');
  await fill('Parent password', 'wrong password');
  await tap('Continue');
  await text("That password isn't right");
  await fill('Parent password', PARENT_PASSWORD);
  await tap('Continue');
  await text('Who is learning?');
});

await check('a child without a PIN opens with one tap', async () => {
  await tap('Add child');
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
