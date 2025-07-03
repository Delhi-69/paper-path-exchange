
-- Fix the RLS policy for conversation_participants to allow system insertion
DROP POLICY IF EXISTS "System can manage conversation participants" ON conversation_participants;

CREATE POLICY "System can manage conversation participants" ON conversation_participants
FOR ALL USING (true);

-- Also ensure users can view and update their own participation
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

CREATE POLICY "Users can view their own participation" ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());
