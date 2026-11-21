CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE RESTRICT,
  display_name text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT comments_state CHECK (
    (deleted_at IS NULL AND display_name IS NOT NULL AND body IS NOT NULL
      AND display_name = lower(btrim(display_name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
      AND char_length(display_name) BETWEEN 1 AND 20
      AND char_length(btrim(body, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')) BETWEEN 1 AND 2000
      AND char_length(body) <= 2000)
    OR (deleted_at IS NOT NULL AND display_name IS NULL AND body IS NULL)
  )
);

CREATE INDEX comments_thread_order ON comments (page_key, parent_id, created_at, id);

CREATE FUNCTION comments_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.id, NEW.page_key, NEW.parent_id, NEW.created_at)
      IS DISTINCT FROM (OLD.id, OLD.page_key, OLD.parent_id, OLD.created_at) THEN
    RAISE EXCEPTION 'Comment identity and creation time are immutable';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM comments WHERE id = NEW.parent_id AND page_key = NEW.page_key AND parent_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid comment parent';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER comments_guard BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION comments_guard();
