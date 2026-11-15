-- Practice tracking for the daily streak and the spaced review (src/practice/memory.ts).

-- Each Kigali day on which a learner profile finished a level or a review.
CREATE TABLE learning_days (
  learner_id BIGINT UNSIGNED NOT NULL,
  day        DATE NOT NULL,
  PRIMARY KEY (learner_id, day),
  CONSTRAINT fk_days_learner FOREIGN KEY (learner_id)
    REFERENCES learners (id) ON DELETE CASCADE
);

-- How well a learner profile remembers each phrase (half-life regression).
-- The phrase is its Kinyarwanda text, as the app shows it.
CREATE TABLE phrase_memory (
  learner_id        BIGINT UNSIGNED NOT NULL,
  phrase            VARCHAR(80) NOT NULL,
  half_life_hours   DOUBLE NOT NULL,
  last_practised_at DATETIME NOT NULL,
  right_count       INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (learner_id, phrase),
  CONSTRAINT fk_memory_learner FOREIGN KEY (learner_id)
    REFERENCES learners (id) ON DELETE CASCADE
);
