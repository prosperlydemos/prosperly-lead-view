
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
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getEasternDayBounds } from '@/utils/dateUtils';

// Eastern Time Zone identifier
const TIMEZONE = "America/New_York";

interface DemoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

const DemoDetailsModal: React.FC<DemoDetailsModalProps> = ({ isOpen, onClose, leads }) => {
  // Get current date in Eastern time
  const now = new Date();
  const easternNow = toZonedTime(now, TIMEZONE);
  
  // Filter leads that have demo booked dates (when they were booked, not when they're scheduled)
  const leadsWithDemos = leads.filter(lead => lead.demoBookedDate);
  
  // Calculate demos for today (booked today in Eastern time)
  const todayBounds = getEasternDayBounds(easternNow);
  const demosToday = leadsWithDemos.filter(lead => {
    const demoBookedDate = new Date(lead.demoBookedDate!);
    return isWithinInterval(demoBookedDate, { start: todayBounds.start, end: todayBounds.end });
  }).length;
  
  // Calculate demos for this week (booked this week in Eastern time)
  const weekStart = new Date(easternNow);
  weekStart.setDate(easternNow.getDate() - easternNow.getDay() + 1); // Monday start
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday end
  
  const weekStartBounds = getEasternDayBounds(weekStart);
  const weekEndBounds = getEasternDayBounds(weekEnd);
  
  const demosThisWeek = leadsWithDemos.filter(lead => {
    const demoBookedDate = new Date(lead.demoBookedDate!);
    return isWithinInterval(demoBookedDate, { start: weekStartBounds.start, end: weekEndBounds.end });
  }).length;
  
  // Calculate demos for this month (booked this month in Eastern time)
  const monthStart = startOfMonth(easternNow);
  const monthEnd = endOfMonth(easternNow);
  const monthStartUTC = fromZonedTime(monthStart, TIMEZONE);
  const monthEndUTC = fromZonedTime(monthEnd, TIMEZONE);
  
  const demosThisMonth = leadsWithDemos.filter(lead => {
    const demoBookedDate = new Date(lead.demoBookedDate!);
    return isWithinInterval(demoBookedDate, { start: monthStartUTC, end: monthEndUTC });
  }).length;
  
  // Generate day-by-day breakdown for this month (based on when demos were booked in Eastern time)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyBreakdown = daysInMonth.map(day => {
    const dayBounds = getEasternDayBounds(day);
    
    const demosOnDay = leadsWithDemos.filter(lead => {
      const demoBookedDate = new Date(lead.demoBookedDate!);
      return isWithinInterval(demoBookedDate, { start: dayBounds.start, end: dayBounds.end });
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
          <DialogTitle>Demo Booking Details (Eastern Time)</DialogTitle>
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
            <h3 className="text-lg font-semibold mb-4">Daily Breakdown - {format(easternNow, 'MMMM yyyy')} (Eastern Time)</h3>
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
                    {day.count} demo{day.count !== 1 ? 's' : ''} booked
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
