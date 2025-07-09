
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead, Profile } from '../types/supabase';
import { format, isToday, parseISO } from 'date-fns';
import { Check, ListTodo, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TodoItem {
  id: string;
  leadId: string;
  contactName: string;
  businessName: string;
  dueDate: string;
  completed: boolean;
  type: 'follow-up' | 'demo';
  time?: string; // Optional time for demo items
}

interface TodoListProps {
  isOpen: boolean;
  onClose: () => void;
  todoItems: TodoItem[];
  onMarkComplete: (todoId: string) => void;
  onViewLead: (leadId: string) => void;
  currentUser: Profile | null;
}

const TodoList: React.FC<TodoListProps> = ({ 
  isOpen, 
  onClose, 
  todoItems,
  onMarkComplete,
  onViewLead,
  currentUser
}) => {
  // Filter todo items to only show those that are explicitly not completed
  // This ensures that once completed is true, they won't appear
  const userTodoItems = todoItems.filter(
    item => item.completed === false
  );

  console.log('TodoList - All todo items:', todoItems.length);
  console.log('TodoList - Completed items:', todoItems.filter(item => item.completed === true).length);
  console.log('TodoList - Active todo items:', userTodoItems.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Items For Today ({userTodoItems.length})</DialogTitle>
        </DialogHeader>

        {userTodoItems.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No follow-up items or demos for today
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {userTodoItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{item.contactName}</div>
                    <div className="text-sm text-muted-foreground">{item.businessName}</div>
                    <div className="text-xs flex items-center">
                      {item.type === 'follow-up' ? (
                        <>
                          <ListTodo className="mr-1" size={14} />
                          Follow-up due: {format(parseISO(item.dueDate), 'PPP')}
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-1" size={14} />
                          Demo with {item.contactName} at {item.time || 'time not set'}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewLead(item.leadId)}
                    >
                      View
                    </Button>
                    {item.type === 'follow-up' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkComplete(item.id)}
                        className="flex items-center"
                      >
                        <Check className="mr-1" size={16} />
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TodoList;
