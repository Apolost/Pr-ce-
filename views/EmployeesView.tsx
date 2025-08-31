import React, { useState, useMemo } from 'react';
import type { AppState } from '../types';

interface EmployeesViewProps {
    appData: AppState;
    setModal: (modal: any) => void;
    setActiveView: (view: string) => void;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ appData, setModal, setActiveView }) => {
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
        const weeks = [];
        for (let i = 0; i < 6; i++) {
            const days = [];
            for (let j = 0; j < 7; j++) {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + (i * 7) + j);
                days.push(day);
            }
            weeks.push(days);
        }
        return weeks;
    }, [currentDate]);

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Zaměstnanci</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={{ minWidth: '170px' }} className="btn btn-success" onClick={() => setModal({ name: 'pcPerson' })}>+ Přidat zaměstnance</button>
                    <button style={{ minWidth: '170px' }} className="btn btn-success" onClick={() => setModal({ name: 'pcEvent' })}>+ Událost</button>
                    <button style={{ minWidth: '170px' }} className="btn btn-primary" onClick={() => setModal({ name: 'pcShifts' })}>Seznam směn</button>
                    <button style={{ minWidth: '170px' }} className="btn btn-primary" onClick={() => setActiveView('wheelchair-calendar')}>Vozíčkáři</button>
                </div>
            </div>
            <div className="card">
                <div className="calendar-toolbar">
                    <button onClick={() => changeMonth(-1)} className="btn btn-primary">Předchozí</button>
                    <div>{currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => changeMonth(1)} className="btn btn-primary">Další</button>
                </div>
                <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                     {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => <div key={day} className="calendar-header">{day}</div>)}
                    {calendarGrid.flat().map(day => {
                        const dateStr = day.toISOString().split('T')[0];
                        const dayEvents = appData.peopleEvents.filter(e => {
                            const eventStart = new Date(e.dateFrom + 'T00:00:00');
                            const eventEnd = e.dateTo ? new Date(e.dateTo + 'T00:00:00') : eventStart;
                            const currentDay = new Date(dateStr + 'T00:00:00');
                            return currentDay >= eventStart && currentDay <= eventEnd;
                        });
                        return (
                             <div 
                                key={dateStr}
                                className="calendar-day"
                                style={{ opacity: day.getMonth() !== currentDate.getMonth() ? 0.5 : 1 }}
                                onClick={() => dayEvents.length > 0 && setModal({ name: 'pcDayDetails', date: dateStr })}
                            >
                                <div className="day-number">{day.getDate()}</div>
                                <div className="day-items">
                                    {dayEvents.map(event => {
                                        const person = appData.people.find(p => p.chip === event.chip);
                                        return (
                                            <div key={event.id} className={`pc-day-event-pill ${event.type}`}>
                                                {person ? person.lastName : event.chip}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EmployeesView;
