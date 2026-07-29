-- ============================================================================
-- Apex Gym — seed reference data (global, owner_id = null)
-- Run after migrations. Idempotent via ON CONFLICT (slug).
-- Extend the exercise list freely; this is a solid compound-first starter set.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Muscle groups (slug, name, region, svg_id)
-- ---------------------------------------------------------------------------
insert into muscle_groups (slug, name, region, svg_id) values
  ('chest',      'Chest',            'upper', 'chest'),
  ('front_delts','Front Deltoids',   'upper', 'front_delts'),
  ('side_delts', 'Side Deltoids',    'upper', 'side_delts'),
  ('rear_delts', 'Rear Deltoids',    'upper', 'rear_delts'),
  ('biceps',     'Biceps',           'upper', 'biceps'),
  ('triceps',    'Triceps',          'upper', 'triceps'),
  ('forearms',   'Forearms',         'upper', 'forearms'),
  ('lats',       'Lats',             'upper', 'lats'),
  ('traps',      'Trapezius',        'upper', 'traps'),
  ('upper_back', 'Upper Back',       'upper', 'upper_back'),
  ('lower_back', 'Lower Back',       'core',  'lower_back'),
  ('abs',        'Abdominals',       'core',  'abs'),
  ('obliques',   'Obliques',         'core',  'obliques'),
  ('glutes',     'Glutes',           'lower', 'glutes'),
  ('quads',      'Quadriceps',       'lower', 'quads'),
  ('hamstrings', 'Hamstrings',       'lower', 'hamstrings'),
  ('calves',     'Calves',           'lower', 'calves'),
  ('adductors',  'Adductors',        'lower', 'adductors')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Equipment
-- ---------------------------------------------------------------------------
insert into equipment (slug, name) values
  ('barbell','Barbell'), ('dumbbell','Dumbbell'), ('cable','Cable'),
  ('machine','Machine'), ('bodyweight','Bodyweight'), ('kettlebell','Kettlebell'),
  ('bands','Resistance Bands'), ('smith','Smith Machine'), ('ez_bar','EZ Bar')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Exercises + muscle mappings.
-- Helper: insert exercise by name, then map muscles by slug.
-- ---------------------------------------------------------------------------
do $$
declare
  ex record;
  v_ex_id uuid;
  v_eq_id uuid;
  m text;
  -- {name, equipment_slug, difficulty, is_unilateral, primary[], secondary[]}
  rows jsonb := '[
    {"n":"Barbell Bench Press","e":"barbell","d":"intermediate","u":false,
      "p":["chest"],"s":["front_delts","triceps"]},
    {"n":"Incline Dumbbell Press","e":"dumbbell","d":"intermediate","u":false,
      "p":["chest"],"s":["front_delts","triceps"]},
    {"n":"Cable Fly","e":"cable","d":"beginner","u":false,
      "p":["chest"],"s":["front_delts"]},
    {"n":"Overhead Press","e":"barbell","d":"intermediate","u":false,
      "p":["front_delts"],"s":["side_delts","triceps"]},
    {"n":"Lateral Raise","e":"dumbbell","d":"beginner","u":false,
      "p":["side_delts"],"s":[]},
    {"n":"Pull-Up","e":"bodyweight","d":"intermediate","u":false,
      "p":["lats"],"s":["biceps","upper_back"]},
    {"n":"Lat Pulldown","e":"cable","d":"beginner","u":false,
      "p":["lats"],"s":["biceps","upper_back"]},
    {"n":"Barbell Row","e":"barbell","d":"intermediate","u":false,
      "p":["upper_back","lats"],"s":["biceps","rear_delts"]},
    {"n":"Seated Cable Row","e":"cable","d":"beginner","u":false,
      "p":["upper_back"],"s":["lats","biceps"]},
    {"n":"Face Pull","e":"cable","d":"beginner","u":false,
      "p":["rear_delts"],"s":["traps","upper_back"]},
    {"n":"Barbell Curl","e":"barbell","d":"beginner","u":false,
      "p":["biceps"],"s":["forearms"]},
    {"n":"Hammer Curl","e":"dumbbell","d":"beginner","u":true,
      "p":["biceps"],"s":["forearms"]},
    {"n":"Triceps Pushdown","e":"cable","d":"beginner","u":false,
      "p":["triceps"],"s":[]},
    {"n":"Overhead Triceps Extension","e":"dumbbell","d":"beginner","u":false,
      "p":["triceps"],"s":[]},
    {"n":"Back Squat","e":"barbell","d":"intermediate","u":false,
      "p":["quads","glutes"],"s":["hamstrings","lower_back"]},
    {"n":"Front Squat","e":"barbell","d":"advanced","u":false,
      "p":["quads"],"s":["glutes","abs"]},
    {"n":"Leg Press","e":"machine","d":"beginner","u":false,
      "p":["quads","glutes"],"s":["hamstrings"]},
    {"n":"Romanian Deadlift","e":"barbell","d":"intermediate","u":false,
      "p":["hamstrings","glutes"],"s":["lower_back"]},
    {"n":"Deadlift","e":"barbell","d":"advanced","u":false,
      "p":["glutes","hamstrings","lower_back"],"s":["quads","traps","forearms"]},
    {"n":"Leg Curl","e":"machine","d":"beginner","u":false,
      "p":["hamstrings"],"s":[]},
    {"n":"Leg Extension","e":"machine","d":"beginner","u":false,
      "p":["quads"],"s":[]},
    {"n":"Walking Lunge","e":"dumbbell","d":"beginner","u":true,
      "p":["quads","glutes"],"s":["hamstrings"]},
    {"n":"Standing Calf Raise","e":"machine","d":"beginner","u":false,
      "p":["calves"],"s":[]},
    {"n":"Hanging Leg Raise","e":"bodyweight","d":"intermediate","u":false,
      "p":["abs"],"s":["obliques"]},
    {"n":"Cable Crunch","e":"cable","d":"beginner","u":false,
      "p":["abs"],"s":[]},
    {"n":"Plank","e":"bodyweight","d":"beginner","u":false,
      "p":["abs"],"s":["obliques","lower_back"]}
  ]'::jsonb;
begin
  for ex in select * from jsonb_array_elements(rows) as r(v)
  loop
    -- skip if a global exercise with this name already exists
    if exists (select 1 from exercises where name = ex.v->>'n' and owner_id is null) then
      continue;
    end if;

    select id into v_eq_id from equipment where slug = ex.v->>'e';

    insert into exercises (owner_id, name, equipment_id, difficulty, is_unilateral)
    values (null, ex.v->>'n', v_eq_id, (ex.v->>'d')::difficulty, (ex.v->>'u')::boolean)
    returning id into v_ex_id;

    for m in select jsonb_array_elements_text(ex.v->'p')
    loop
      insert into exercise_muscles (exercise_id, muscle_group_id, is_primary)
      select v_ex_id, mg.id, true from muscle_groups mg where mg.slug = m
      on conflict do nothing;
    end loop;

    for m in select jsonb_array_elements_text(ex.v->'s')
    loop
      insert into exercise_muscles (exercise_id, muscle_group_id, is_primary)
      select v_ex_id, mg.id, false from muscle_groups mg where mg.slug = m
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Achievements (criteria are machine-checkable by services/achievements)
-- ---------------------------------------------------------------------------
insert into achievements (slug, name, description, icon, criteria) values
  ('first_workout',  'First Steps',      'Complete your first workout.',        'Dumbbell',
     '{"type":"workout_count","gte":1}'),
  ('workouts_100',   'Centurion',        'Complete 100 workouts.',              'Trophy',
     '{"type":"workout_count","gte":100}'),
  ('sets_1000',      'Set Machine',      'Log 1,000 sets.',                     'Layers',
     '{"type":"set_count","gte":1000}'),
  ('hours_100',      'Time Under Tension','Train for 100 hours total.',         'Clock',
     '{"type":"training_hours","gte":100}'),
  ('prs_50',         'Record Breaker',   'Set 50 personal records.',            'Medal',
     '{"type":"pr_count","gte":50}'),
  ('streak_365',     'Year of Iron',     'Maintain a 365-day workout streak.',  'Flame',
     '{"type":"streak_days","gte":365}'),
  ('perfect_month',  'Perfect Month',    'Hit every planned workout in a month.','CalendarCheck',
     '{"type":"perfect_month"}'),
  ('never_miss_mon', 'Never Miss Monday','Train 12 Mondays in a row.',          'CalendarClock',
     '{"type":"weekday_streak","weekday":1,"gte":12}'),
  ('bench_100kg',    'Bench Club',       'Bench press 100 kg.',                 'Award',
     '{"type":"lift_1rm","exercise":"Barbell Bench Press","gte":100}'),
  ('squat_140kg',    'Squat Club',       'Squat 140 kg.',                       'Award',
     '{"type":"lift_1rm","exercise":"Back Squat","gte":140}'),
  ('deadlift_180kg', 'Deadlift Club',    'Deadlift 180 kg.',                    'Award',
     '{"type":"lift_1rm","exercise":"Deadlift","gte":180}')
on conflict (slug) do nothing;
