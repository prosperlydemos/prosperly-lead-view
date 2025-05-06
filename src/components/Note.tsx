
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Note as NoteType, Profile } from '../types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface NoteProps {
  note: NoteType;
}

const Note: React.FC<NoteProps> = ({ note }) => {
  const [author, setAuthor] = useState<Profile | null>(null);
  
  useEffect(() => {
    const fetchAuthor = async () => {
      if (note.user_id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', note.user_id)
          .single();
          
        if (!error && data) {
          setAuthor(data);
        }
      }
    };
    
    fetchAuthor();
  }, [note.user_id]);

  const formattedDate = format(new Date(note.created_at), 'MMM d, yyyy h:mm a');

  return (
    <div className="border-b pb-4 mb-4 last:border-b-0">
      <div className="text-sm text-muted-foreground mb-1 flex justify-between">
        <span>{formattedDate}</span>
        {author && <span className="text-primary text-xs">{author.name}</span>}
      </div>
      <div className="whitespace-pre-wrap">
        {note.content}
      </div>
    </div>
  );
};

export default Note;
