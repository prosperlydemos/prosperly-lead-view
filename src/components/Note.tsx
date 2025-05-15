
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Note } from '../types';

interface NoteProps {
  note: Note;
  userName?: string;
}

const NoteCard: React.FC<NoteProps> = ({ note, userName }) => {
  // Format the createdAt date for display, ensuring it's a string before parsing
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // Ensure we have a string before parsing
      const date = parseISO(String(dateString));
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string = 'User') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <CardDescription className="text-sm">
            {userName || 'Team member'} 
            <span className="mx-2">•</span> 
            {formatDate(note.createdAt)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="whitespace-pre-line">{note.content}</div>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
