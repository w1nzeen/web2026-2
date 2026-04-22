CREATE TABLE IF NOT EXISTS users (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO users (name, email) VALUES
  ('Bohdan', 'w1nzeen.r@gmail.com'),
  ('Denys',   'denys.k@gmail.com')
ON CONFLICT (email) DO NOTHING;