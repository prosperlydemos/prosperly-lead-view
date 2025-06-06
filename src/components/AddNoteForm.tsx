
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddNoteFormProps {
  leadId: string;
  onAddNote: (leadId: string, content: string, followUpDays?: number) => void;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ leadId, onAddNote }) => {
  const [content, setContent] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState<string>('no');
  const [followUpDays, setFollowUpDays] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim()) {
      const followUpDaysToPass = scheduleFollowUp === 'yes' ? followUpDays : undefined;
      onAddNote(leadId, content, followUpDaysToPass);
      setContent('');
      setScheduleFollowUp('no');
      setFollowUpDays(1);
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
        <div>
          <Label htmlFor="followup-select" className="text-sm font-medium">
            Follow up in:
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
            <Label htmlFor="followup-days" className="text-sm font-medium">
              Number of days:
            </Label>
            <Input
              id="followup-days"
              type="number"
              min="1"
              max="365"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(parseInt(e.target.value) || 1)}
              className="w-full"
              placeholder="Enter days"
            />
          </div>
        )}
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
