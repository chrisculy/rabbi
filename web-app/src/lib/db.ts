import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false,
});

export async function query(text: string, params?: unknown[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getUser(googleId: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0];
}

export async function createUser(data: {
  googleId: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}) {
  const result = await pool.query(
    'INSERT INTO users (google_id, email, name, profile_picture_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.googleId, data.email, data.name, data.profilePictureUrl]
  );
  return result.rows[0];
}

export async function updateUserLastLogin(googleId: string) {
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE google_id = $1',
    [googleId]
  );
}

export async function getGuidesByUser(userId: string, limit = 10) {
  const result = await pool.query(
    'SELECT id, title, source_type, publish_date, created_at, status FROM guides WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

export async function getGuide(guideId: string, userId: string) {
  const result = await pool.query(
    'SELECT * FROM guides WHERE id = $1 AND user_id = $2',
    [guideId, userId]
  );
  return result.rows[0];
}

export async function createGuide(data: {
  userId: string;
  title: string;
  sourceType: 'youtube' | 'upload';
  sourceIdentifier: string;
  transcript: string;
  publishDate?: Date;
}) {
  const result = await pool.query(
    'INSERT INTO guides (user_id, title, source_type, source_identifier, transcript, publish_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.userId, data.title, data.sourceType, data.sourceIdentifier, data.transcript, data.publishDate || null, 'processing']
  );
  return result.rows[0];
}

export async function updateGuideMarkdown(guideId: string, markdown: string) {
  const result = await pool.query(
    'UPDATE guides SET markdown_content = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [markdown, 'completed', guideId]
  );
  return result.rows[0];
}

export async function deleteGuide(guideId: string, userId: string) {
  await pool.query(
    'DELETE FROM guides WHERE id = $1 AND user_id = $2',
    [guideId, userId]
  );
}
