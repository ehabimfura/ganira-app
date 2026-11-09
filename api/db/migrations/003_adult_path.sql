-- Adult learners live anywhere in the world, so their path is "Everyday Kinyarwanda" (ADULT),
-- not "Living in Rwanda". Children keep FAMILY.

ALTER TABLE learners MODIFY path ENUM('FAMILY', 'LIVING_IN_RWANDA', 'ADULT') NULL;
UPDATE learners SET path = 'ADULT' WHERE path = 'LIVING_IN_RWANDA';
ALTER TABLE learners MODIFY path ENUM('FAMILY', 'ADULT') NULL;
