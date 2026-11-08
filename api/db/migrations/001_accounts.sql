-- Accounts sign in; learner profiles learn.
-- A LEARNER account owns exactly one SELF profile.
-- A PARENT account owns zero or more CHILD profiles and never learns itself.
-- These ownership rules span tables, so the API enforces them.

CREATE TABLE accounts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  kind          ENUM('PARENT', 'LEARNER') NOT NULL,
  birth_year    SMALLINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_accounts_email UNIQUE (email)
);

CREATE TABLE learners (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id         BIGINT UNSIGNED NOT NULL,
  kind               ENUM('SELF', 'CHILD') NOT NULL,
  nickname           VARCHAR(40) NOT NULL,
  avatar             VARCHAR(50) NOT NULL,
  pin_hash           VARCHAR(255) NULL,
  age_range          VARCHAR(20) NULL,
  learner_role       ENUM('TOURIST', 'STUDENT', 'TEACHER', 'WORKER') NULL,
  native_language    VARCHAR(40) NOT NULL DEFAULT 'English',
  daily_goal_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  reminder_time      TIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learners_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE,
  -- Only child profiles can have a PIN.
  CONSTRAINT ck_learners_pin_child CHECK (pin_hash IS NULL OR kind = 'CHILD')
);

-- Record that a parent created and consented to a child's profile.
CREATE TABLE parental_consents (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_account_id BIGINT UNSIGNED NOT NULL,
  learner_id        BIGINT UNSIGNED NOT NULL,
  given_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_consents_learner UNIQUE (learner_id),
  CONSTRAINT fk_consents_parent FOREIGN KEY (parent_account_id)
    REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_consents_learner FOREIGN KEY (learner_id)
    REFERENCES learners (id) ON DELETE CASCADE
);

-- One row per signed-in phone. Only a SHA-256 hash of the token is stored.
CREATE TABLE sessions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  active_learner_id BIGINT UNSIGNED NULL,
  token_hash        CHAR(64) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        DATETIME NOT NULL,
  CONSTRAINT uq_sessions_token UNIQUE (token_hash),
  CONSTRAINT fk_sessions_account FOREIGN KEY (account_id)
    REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_learner FOREIGN KEY (active_learner_id)
    REFERENCES learners (id) ON DELETE SET NULL
);
