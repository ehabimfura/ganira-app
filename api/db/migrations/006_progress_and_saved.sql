-- Minutes practised per Kigali day (lesson time, sent when a lesson is finished).
ALTER TABLE learning_days ADD COLUMN seconds INT UNSIGNED NOT NULL DEFAULT 0;

-- Lessons and phrases a learner profile has saved to practise again (FR 8).
CREATE TABLE saved_items (
  learner_id BIGINT UNSIGNED NOT NULL,
  kind       ENUM('lesson', 'phrase') NOT NULL,
  ref        VARCHAR(80) NOT NULL,
  saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (learner_id, kind, ref),
  CONSTRAINT fk_saved_learner FOREIGN KEY (learner_id)
    REFERENCES learners (id) ON DELETE CASCADE
);
