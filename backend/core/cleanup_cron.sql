-- Enable the pg_cron extension to allow scheduling database queries
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to delete 'in_progress' sessions older than 6 hours.
-- Cron expression '0 */6 * * *' executes every 6 hours.
SELECT cron.schedule(
  'cleanup-in-progress-sessions',
  '0 */6 * * *',
  $$ 
    DELETE FROM geosketch_sessions 
    WHERE status = 'in_progress' 
      AND created_at < now() - INTERVAL '6 hours';
  $$
);

-- Schedule job to delete 'completed' sessions older than 15 days.
-- Cron expression '0 0 * * *' executes daily at midnight.
SELECT cron.schedule(
  'cleanup-completed-sessions',
  '0 0 * * *',
  $$ 
    DELETE FROM geosketch_sessions 
    WHERE status = 'completed' 
      AND created_at < now() - INTERVAL '15 days';
  $$
);
