
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DateInput from './DateInput';

interface AddNoteFormProps {
  leadId: string;
  onAddNote: (leadId: string, content: string, followUpDate?: string | null) => void;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ leadId, onAddNote }) => {
  const [content, setContent] = useState('');
  const [followUpDate, setFollowUpDate] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim()) {
      onAddNote(leadId, content, followUpDate);
      setContent('');
      setFollowUpDate(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <Textarea
        placeholder="Add a new note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="mb-3"
      />
      
      <div className="mb-3">
        <DateInput
          label="Follow up date (optional)"
          value={followUpDate}
          onChange={setFollowUpDate}
        />
      </div>

      <Button 
        type="submit" 
        disabled={!content.trim()}
      >
        Add Note
      </Button>
    </form>
  );
};

export default AddNoteForm;
