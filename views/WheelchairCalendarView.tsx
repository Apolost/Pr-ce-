import React, { useState, useMemo, useCallback } from 'react';
import type { AppState, WheelchairUser } from '../types';

interface WheelchairCalendarViewProps {
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (modal: any) => void;
}

const getDateOfWeek = (w: number, y: number) => {
    const d = (1 + (w - 1) * 7); 
    const date = new Date(y, 0, d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const WheelchairCalendarView: React.FC<WheelchairCalendarViewProps> = ({ appData, setAppData, setModal }) => {
    const today = new Date();
    const [currentWeek, setCurrentWeek] = useState({ year: today.getFullYear(), week: getWeekNumber(today) });

    const wcGenerateScheduleForWeek = useCallback((year: number, week: number) => {
        setAppData(prev => {
            const weekKey = `${year}-${week.toString().padStart(2, '0')}`;
            if(prev.wheelchairSchedule[weekKey]) return prev;

            let prevYear = year;
            let prevWeek = week - 1;
            if (prevWeek < 1) {
                prevWeek = 52;
                prevYear--;
            }
            const prevWeekKey = `${prevYear}-${prevWeek.toString().padStart(2, '0')}`;
            const prevSchedule = prev.wheelchairSchedule[prevWeekKey];
            const newSchedule: AppState['wheelchairSchedule'][string] = {};
            const startDate = getDateOfWeek(week, year);

            if (prevSchedule) {
                 for (let i = 0; i < 7; i++) {
                    const day = new Date(startDate);
                    day.setDate(day.getDate() + i);
                    const dateKey = day.toISOString().split('T')[0];
                    const prevDay = new Date(day);
                    prevDay.setDate(prevDay.getDate() - 7);
                    const prevDateKey = prevDay.toISOString().split('T')[0];
                    const prevDaySchedule = prevSchedule[prevDateKey] || { morning: [], afternoon: [], night: [], vacation: [] };
                    
                    newSchedule[dateKey] = {
                        morning: [...prevDaySchedule.night],
                        afternoon: [...prevDaySchedule.morning],
                        night: [...prevDaySchedule.afternoon],
                        vacation: [...prevDaySchedule.vacation]
                    };
                }
                 // Check for newly added users who are not in the schedule yet
                const firstDayKey = startDate.toISOString().split('T')[0];
                const firstDaySchedule = newSchedule[firstDayKey];
                if (firstDaySchedule) {
                    const usersInSchedule = new Set([
                        ...firstDaySchedule.morning,
                        ...firstDaySchedule.afternoon,
                        ...firstDaySchedule.night,
                        ...firstDaySchedule.vacation,
                    ]);

                    const missingUsers = prev.wheelchairUsers.filter(u => !usersInSchedule.has(u.id));
                    
                    missingUsers.forEach(user => {
                        if (firstDaySchedule[user.startShift]) {
                            firstDaySchedule[user.startShift].push(user.id);
                        }
                    });
                }

            } else {
                for (let i = 0; i < 7; i++) {
                    const day = new Date(startDate);
                    day.setDate(day.getDate() + i);
                    const dateKey = day.toISOString().split('T')[0];
                    newSchedule[dateKey] = { morning: [], afternoon: [], night: [], vacation: [] };
                }
                prev.wheelchairUsers.forEach(user => {
                    const shift = user.startShift || 'morning';
                    const dateKey = startDate.toISOString().split('T')[0];
                    if (newSchedule[dateKey][shift]) {
                        newSchedule[dateKey][shift].push(user.id);
                    }
                });
            }
             return { ...prev, wheelchairSchedule: {...prev.wheelchairSchedule, [weekKey]: newSchedule }};
        });
    }, [setAppData]);
    
    const weekKey = `${currentWeek.year}-${currentWeek.week.toString().padStart(2, '0')}`;
    useMemo(() => {
        if (!appData.wheelchairSchedule[weekKey]) {
            wcGenerateScheduleForWeek(currentWeek.year, currentWeek.week);
        }
    }, [weekKey, appData.wheelchairSchedule, wcGenerateScheduleForWeek, currentWeek]);


    const handleWeekChange = (delta: number) => {
        const newDate = getDateOfWeek(currentWeek.week, currentWeek.year);
        newDate.setDate(newDate.getDate() + (delta * 7));
        setCurrentWeek({ year: newDate.getFullYear(), week: getWeekNumber(newDate) });
    };
    
    const handleDrop = useCallback((
        targetDate: string,
        targetShift: keyof AppState['wheelchairSchedule'][string][string],
        userId: string,
        sourceDate: string,
        sourceShift: keyof AppState['wheelchairSchedule'][string][string]
    ) => {
        if (targetDate === sourceDate && targetShift === sourceShift) {
            return;
        }

        setAppData(prev => {
            const newSchedule = JSON.parse(JSON.stringify(prev.wheelchairSchedule));
            const scheduleForWeek = newSchedule[weekKey];
            if (!scheduleForWeek) return prev;

            // 1. Remove from source
            if (scheduleForWeek[sourceDate]?.[sourceShift]) {
                scheduleForWeek[sourceDate][sourceShift] = scheduleForWeek[sourceDate][sourceShift].filter((id: string) => id !== userId);
            }

            // 2. Add to target
            if (!scheduleForWeek[targetDate]) {
                scheduleForWeek[targetDate] = { morning: [], afternoon: [], night: [], vacation: [] };
            }
            if (!scheduleForWeek[targetDate][targetShift].includes(userId)) {
                scheduleForWeek[targetDate][targetShift].push(userId);
            }
            
            return { ...prev, wheelchairSchedule: newSchedule };
        });
    }, [weekKey, setAppData]);
    
    const startDate = getDateOfWeek(currentWeek.week, currentWeek.year);
    const schedule = appData.wheelchairSchedule[weekKey] || {};

    return (
        <div>
            <div className="page-header-container">
                <h1 className="page-header" style={{ marginBottom: 0 }}>Plán Vozíčkářů</h1>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <button className="btn btn-success" onClick={() => setModal({name: 'wcUser'})}>+ Přidat vozíčkáře</button>
                    <button className="btn btn-primary" onClick={() => setModal({name: 'addWCUserToWeek', year: currentWeek.year, week: currentWeek.week})}>+ Přidat na týden</button>
                    <button className="btn btn-primary" onClick={() => setModal({name: 'wcUserList'})}>Seznam vozíčkářů</button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>Tisk plánu</button>
                </div>
            </div>
            <div className="card">
                <div className="calendar-toolbar">
                    <button onClick={() => handleWeekChange(-1)} className="btn btn-primary">Předchozí týden</button>
                    <div>Týden {currentWeek.week} ({startDate.toLocaleDateString('cs-CZ')})</div>
                    <button onClick={() => handleWeekChange(1)} className="btn btn-primary">Následující týden</button>
                </div>
                <div className="wc-calendar-container">
                     <div className="wc-header-cell"></div>
                    {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((dayName, i) => {
                        const day = new Date(startDate);
                        day.setDate(day.getDate() + i);
                        const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        return <div key={dayName} className={`wc-header-cell ${isWeekend ? 'is-weekend' : ''}`}>{dayName}<br/>{day.toLocaleDateString('cs-CZ', {day: '2-digit', month: '2-digit'})}</div>;
                    })}

                    {(['morning', 'afternoon', 'night', 'vacation'] as const).map(shift => (
                        <React.Fragment key={shift}>
                            <div className="wc-shift-cell">{{morning: 'Ranní', afternoon: 'Odpolední', night: 'Noční', vacation: 'Dovolená'}[shift]}</div>
                            {Array.from({ length: 7 }).map((_, i) => {
                                const day = new Date(startDate);
                                day.setDate(day.getDate() + i);
                                const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const dateKey = day.toISOString().split('T')[0];
                                const userIds = schedule[dateKey]?.[shift] || [];
                                return (
                                    <div 
                                        key={dateKey} 
                                        className={`wc-day-cell ${shift} ${isWeekend ? 'is-weekend' : ''}`}
                                        onDragOver={e => e.preventDefault()}
                                        onDragEnter={e => e.currentTarget.classList.add('drag-over')}
                                        onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('drag-over');
                                            try {
                                                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                handleDrop(dateKey, shift, data.userId, data.sourceDate, data.sourceShift);
                                            } catch (error) {
                                                console.error("Could not parse drag data", error);
                                            }
                                        }}
                                    >
                                        {userIds.map(userId => {
                                            const user = appData.wheelchairUsers.find(u => u.id === userId);
                                            return user ? (
                                                <div 
                                                    key={user.id} 
                                                    className={`wc-user-pill ${shift}`}
                                                    draggable
                                                    onDragStart={e => {
                                                        const data = JSON.stringify({ userId: user.id, sourceDate: dateKey, sourceShift: shift });
                                                        e.dataTransfer.setData('text/plain', data);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        (e.target as HTMLDivElement).classList.add('dragging');
                                                    }}
                                                    onDragEnd={e => {
                                                        (e.target as HTMLDivElement).classList.remove('dragging');
                                                    }}
                                                >
                                                    {user.firstName} {user.lastName.charAt(0)}.
                                                </div>
                                            ) : null;
                                        })}
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

export default WheelchairCalendarView;