-- Sign in with email or username, and store the onboarding answers (SRS FR 2.1).

ALTER TABLE accounts ADD COLUMN username VARCHAR(20) NULL AFTER email;

-- Existing accounts get the part of their email before "@" (john@ganira.test -> john).
UPDATE accounts
   SET username = LOWER(LEFT(REGEXP_REPLACE(SUBSTRING_INDEX(email, '@', 1), '[^A-Za-z0-9_]', ''), 20));

ALTER TABLE accounts
  MODIFY username VARCHAR(20) NOT NULL,
  ADD CONSTRAINT uq_accounts_username UNIQUE (username);

-- Path and level come from onboarding. The API requires them for new profiles;
-- they stay nullable here so older rows remain valid.
ALTER TABLE learners
  ADD COLUMN path  ENUM('FAMILY', 'LIVING_IN_RWANDA') NULL AFTER kind,
  ADD COLUMN level ENUM('NEW', 'FEW_WORDS', 'SHORT_CHAT') NULL AFTER path;

UPDATE learners SET path = 'FAMILY', level = 'NEW' WHERE kind = 'CHILD' AND path IS NULL;
