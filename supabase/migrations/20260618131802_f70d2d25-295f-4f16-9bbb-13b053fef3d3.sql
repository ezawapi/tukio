-- Tighten realtime.messages by removing the overly broad permissive policy
-- that allowed any topic not matching user_notifications:%. The RESTRICTIVE
-- policy "Block other realtime topics" + the dedicated SELECT policy
-- "Users can subscribe to their own notifications topic" are sufficient.
DROP POLICY IF EXISTS "Users read their own notification realtime msgs" ON realtime.messages;