
import { useState, useEffect } from 'react';
import { Lead } from '@/types/supabase';
import { isToday, parseISO } from 'date-fns';
import { Profile } from '@/types/supabase';

export interface TodoItem {
  id: string;
  leadId: string;
  contactName: string;
  businessName: string;
  dueDate: string;
  completed: boolean;
}

export const useTodos = (leads: Lead[], currentUser: Profile | null) => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  // Update todo items whenever leads change
  useEffect(() => {
    if (!currentUser) return;
    
    const newTodoItems: TodoItem[] = [];
    
    leads.forEach(lead => {
      // Only consider leads assigned to the current user
      if (lead.owner_id === currentUser.id && lead.next_follow_up) {
        // Check if the next follow-up is today
        const followUpDate = parseISO(lead.next_follow_up);
        if (isToday(followUpDate)) {
          newTodoItems.push({
            id: `todo-${lead.id}-${Date.now()}`,
            leadId: lead.id,
            contactName: lead.contact_name,
            businessName: lead.business_name || '',
            dueDate: lead.next_follow_up,
            completed: false
          });
        }
      }
    });
    
    // Filter out completed items and add new ones
    const filteredItems = todoItems.filter(item => 
      !item.completed && 
      !newTodoItems.some(newItem => newItem.leadId === item.leadId)
    );
    
    setTodoItems([...filteredItems, ...newTodoItems]);
  }, [leads, currentUser]);

  const handleMarkTodoComplete = (todoId: string) => {
    setTodoItems(todoItems.map(item => 
      item.id === todoId ? { ...item, completed: true } : item
    ));
  };

  // Get the number of active todo items for the current user
  const activeTodoCount = todoItems.filter(
    item => !item.completed && item.leadId
  ).length;

  return {
    todoItems,
    setTodoItems,
    handleMarkTodoComplete,
    activeTodoCount
  };
};
