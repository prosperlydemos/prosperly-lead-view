
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lead } from '@/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval } from 'date-fns';

interface DemoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

const DemoDetailsModal: React.FC<DemoDetailsModalProps> = ({ isOpen, onClose, leads }) => {
  const now = new Date();
  
  // Filter leads that have demo dates
  const leadsWithDemos = leads.filter(lead => lead.demoDate);
  
  // Calculate demos for today
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const demosToday = leadsWithDemos.filter(lead => {
    const demoDate = new Date(lead.demoDate!);
    return isWithinInterval(demoDate, { start: todayStart, end: todayEnd });
  }).length;
  
  // Calculate demos for this week
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const demosThisWeek = leadsWithDemos.filter(lead => {
    const demoDate = new Date(lead.demoDate!);
    return isWithinInterval(demoDate, { start: weekStart, end: weekEnd });
  }).length;
  
  // Calculate demos for this month
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const demosThisMonth = leadsWithDemos.filter(lead => {
    const demoDate = new Date(lead.demoDate!);
    return isWithinInterval(demoDate, { start: monthStart, end: monthEnd });
  }).length;
  
  // Generate day-by-day breakdown for this month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyBreakdown = daysInMonth.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const demosOnDay = leadsWithDemos.filter(lead => {
      const demoDate = new Date(lead.demoDate!);
      return isWithinInterval(demoDate, { start: dayStart, end: dayEnd });
    }).length;
    
    return {
      date: day,
      count: demosOnDay,
      formattedDate: format(day, 'MMMM d')
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demo Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demosToday}</div>
                <p className="text-xs text-muted-foreground mt-1">demos booked</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demosThisWeek}</div>
                <p className="text-xs text-muted-foreground mt-1">demos booked</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demosThisMonth}</div>
                <p className="text-xs text-muted-foreground mt-1">demos booked</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Daily Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Daily Breakdown - {format(now, 'MMMM yyyy')}</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dailyBreakdown.map((day, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    day.count > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{day.formattedDate}:</span>
                  <span className={`font-semibold ${
                    day.count > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {day.count} demo{day.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoDetailsModal;
