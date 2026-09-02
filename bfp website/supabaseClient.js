import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(
  'https://awqnrdbytynmalgccocp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cW5yZGJ5dHlubWFsZ2Njb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDg4NjYsImV4cCI6MjEwMzg4NDg2Nn0.1DDhapp1g_dy_xBPYvNNPJPd9jGgW9FyhaEe0mlegV8'
);
