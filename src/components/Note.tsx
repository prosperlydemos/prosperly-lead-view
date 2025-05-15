
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Note as NoteType, Profile } from '../types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Note as AppNoteType } from '../types';

interface NoteProps {
  note: NoteType | AppNoteType;
}

const Note: React.FC<NoteProps> = ({ note }) => {
  const [author, setAuthor] = useState<Profile | null>(null);
  
  useEffect(() => {
    const fetchAuthor = async () => {
      // Check if it's a Supabase note type with user_id
      if ('user_id' in note && note.user_id) {
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
  }, ['user_id' in note ? note.user_id : undefined]);

  // Get the formatted date from either format
  const formattedDate = format(
    new Date('created_at' in note ? note.created_at : ('createdAt' in note ? note.createdAt : new Date())), 
    'MMM d, yyyy h:mm a'
  );

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
