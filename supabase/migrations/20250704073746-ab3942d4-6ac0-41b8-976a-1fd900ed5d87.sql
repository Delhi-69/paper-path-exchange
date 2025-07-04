
-- Drop the existing restrictive policy that's causing the issue
DROP POLICY IF EXISTS "System can update book analytics" ON book_analytics;

-- Create a more permissive policy that allows the system to manage book analytics
CREATE POLICY "System can manage book analytics"
ON book_analytics
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure the trigger function has proper permissions by making it security definer
CREATE OR REPLACE FUNCTION public.create_book_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO book_analytics (book_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS create_book_analytics_trigger ON books;
CREATE TRIGGER create_book_analytics_trigger
  AFTER INSERT ON books
  FOR EACH ROW
  EXECUTE FUNCTION create_book_analytics();
