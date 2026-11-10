-- Which lessons each learner profile has finished. The lesson content lives in the app;
-- the API only knows the lesson ids and their order (src/lessons/catalog.ts).

CREATE TABLE lesson_progress (
  learner_id   BIGINT UNSIGNED NOT NULL,
  lesson_id    VARCHAR(40) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (learner_id, lesson_id),
  CONSTRAINT fk_progress_learner FOREIGN KEY (learner_id)
    REFERENCES learners (id) ON DELETE CASCADE
);
