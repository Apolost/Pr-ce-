import React, { useState, useMemo } from 'react';
import type { AppState } from '../types';

interface CalendarViewProps {
    appData: AppState;
    setModal: (modal: any) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appData, setModal }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        let dayOfWeek = firstDayOfMonth.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; 
        const offset = dayOfWeek - 1;

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - offset);

        const getWeekNumber = (d: Date) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        const weeks = [];
        for (let i = 0; i < 6; i++) {
            const days = [];
            for (let j = 0; j < 7; j++) {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + (i * 7) + j);
                days.push(day);
            }
            weeks.push({ weekNumber: getWeekNumber(days[0]), days });
        }
        return weeks;
    }, [currentDate]);

    return (
        <div>
            <h1 className="page-header">Kalendář akcí</h1>
            <div className="card">
                <div className="calendar-toolbar">
                    <button onClick={() => changeMonth(-1)} className="btn btn-primary">Předchozí</button>
                    <div>{currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => changeMonth(1)} className="btn btn-primary">Další</button>
                    <button onClick={() => setModal({ name: 'planAction' })} className="btn btn-success">+ Přidat akci</button>
                </div>
                <div className="calendar-grid">
                    <div className="calendar-header"></div>
                    {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => <div key={day} className="calendar-header">{day}</div>)}
                    
                    {calendarGrid.map(({ weekNumber, days }) => (
                        <React.Fragment key={weekNumber}>
                            <div className="week-number">{weekNumber}</div>
                            {days.map(day => {
                                const dateStr = day.toISOString().split('T')[0];
                                const dayActions = appData.plannedActions.filter(a => dateStr >= a.startDate && (!a.endDate || dateStr <= a.endDate));
                                const dayOrders = appData.orders.filter(o => o.date === dateStr);
                                return (
                                    <div 
                                        key={dateStr}
                                        className="calendar-day"
                                        style={{ opacity: day.getMonth() !== currentDate.getMonth() ? 0.5 : 1 }}
                                        onClick={() => setModal({ name: 'dayDetails', date: dateStr })}
                                    >
                                        <div className="day-number">{day.getDate()}</div>
                                        <div className="day-items">
                                            {dayActions.map(action => (
                                                 <div key={action.id} className="day-pill">
                                                    {appData.zakaznici.find(c=>c.id === action.customerId)?.name || '?'} (Akce)
                                                 </div>
                                            ))}
                                            {dayOrders.length > 0 && <div className="day-pill is-order">Objednávka</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
