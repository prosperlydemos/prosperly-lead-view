
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DateInput from './DateInput';

interface AddNoteFormProps {
  leadId: string;
  onAddNote: (leadId: string, content: string, followUpDate?: string) => void;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ leadId, onAddNote }) => {
  const [content, setContent] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState<string>('no');
  const [followUpDate, setFollowUpDate] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim()) {
      const followUpDateToPass = scheduleFollowUp === 'yes' ? followUpDate : undefined;
      onAddNote(leadId, content, followUpDateToPass || undefined);
      setContent('');
      setScheduleFollowUp('no');
      setFollowUpDate(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Textarea
        placeholder="Add a new note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="mb-3"
      />
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="followup-select" className="text-sm font-medium">
              Follow up:
            </Label>
            <Select value={scheduleFollowUp} onValueChange={setScheduleFollowUp}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Schedule follow up?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No follow up</SelectItem>
                <SelectItem value="yes">Schedule follow up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleFollowUp === 'yes' && (
            <div>
              <DateInput
                label="Follow up date:"
                value={followUpDate}
                onChange={setFollowUpDate}
              />
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!content.trim()}
        className="w-full"
      >
        Add Note
      </Button>
    </form>
  );
};

export default AddNoteForm;
