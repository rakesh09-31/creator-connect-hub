SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name,
    af.attname AS foreign_column_name,
    pg_get_constraintdef(c.oid) AS constraint_def
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
  AND c.conrelid = 'public.squad_members'::regclass;
