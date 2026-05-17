-- Fix FK constraints to use ON DELETE CASCADE
-- This allows deleting split_exercises (and their parents) without FK violations

-- exercise_logs.split_exercise_id → split_exercises
ALTER TABLE exercise_logs
  DROP CONSTRAINT exercise_logs_split_exercise_id_fkey,
  ADD CONSTRAINT exercise_logs_split_exercise_id_fkey
    FOREIGN KEY (split_exercise_id)
    REFERENCES split_exercises(id)
    ON DELETE CASCADE;

-- exercise_logs.session_id → workout_sessions (same pattern, fix preventively)
ALTER TABLE exercise_logs
  DROP CONSTRAINT exercise_logs_session_id_fkey,
  ADD CONSTRAINT exercise_logs_session_id_fkey
    FOREIGN KEY (session_id)
    REFERENCES workout_sessions(id)
    ON DELETE CASCADE;

-- split_exercises.split_id → training_splits
ALTER TABLE split_exercises
  DROP CONSTRAINT split_exercises_split_id_fkey,
  ADD CONSTRAINT split_exercises_split_id_fkey
    FOREIGN KEY (split_id)
    REFERENCES training_splits(id)
    ON DELETE CASCADE;

-- training_splits.phase_id → program_phases
ALTER TABLE training_splits
  DROP CONSTRAINT training_splits_phase_id_fkey,
  ADD CONSTRAINT training_splits_phase_id_fkey
    FOREIGN KEY (phase_id)
    REFERENCES program_phases(id)
    ON DELETE CASCADE;

-- program_phases.program_id → programs
ALTER TABLE program_phases
  DROP CONSTRAINT program_phases_program_id_fkey,
  ADD CONSTRAINT program_phases_program_id_fkey
    FOREIGN KEY (program_id)
    REFERENCES programs(id)
    ON DELETE CASCADE;
