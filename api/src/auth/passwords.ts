import argon2 from "argon2";

export const MIN_PASSWORD_LENGTH = 8;

// argon2id is slow on purpose, so a stolen hash is expensive to crack.
export function hashSecret(secret: string): Promise<string> {
  return argon2.hash(secret, { type: argon2.argon2id });
}

export function verifySecret(hash: string, secret: string): Promise<boolean> {
  return argon2.verify(hash, secret);
}

// Used when an email has no account, so a wrong email takes as long as a
// wrong password and response times don't reveal which emails exist.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(secret: string): Promise<false> {
  dummyHash ??= hashSecret("not-a-real-password");
  await argon2.verify(await dummyHash, secret);
  return false;
}
