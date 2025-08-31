import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import type { AppState, WheelchairUser } from '../types';

const getDateOfWeek = (w: number, y: number) => {
    const d = (1 + (w - 1) * 7); 
    const date = new Date(y, 0, d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

interface AddWCUserToWeekModalProps {
    year: number;
    week: number;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onClose: () => void;
}

const AddWCUserToWeekModal: React.FC<AddWCUserToWeekModalProps> = ({ year, week, appData, setAppData, showToast, onClose }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(appData.wheelchairUsers[0]?.id || '');
    const [selectedShift, setSelectedShift] = useState<WheelchairUser['startShift']>('morning');

    // When the selected user changes, update the default shift to their preferred one
    useEffect(() => {
        const user = appData.wheelchairUsers.find(u => u.id === selectedUserId);
        if (user) {
            setSelectedShift(user.startShift);
        }
    }, [selectedUserId, appData.wheelchairUsers]);


    const handleSave = () => {
        if (!selectedUserId) {
            showToast('Musíte vybrat vozíčkáře.', 'error');
            return;
        }

        const userToAdd = appData.wheelchairUsers.find(u => u.id === selectedUserId);
        if (!userToAdd) {
            showToast('Vybraný vozíčkář nebyl nalezen.', 'error');
            return;
        }

        setAppData(prev => {
            const newSchedule = JSON.parse(JSON.stringify(prev.wheelchairSchedule));
            const weekKey = `${year}-${week.toString().padStart(2, '0')}`;
            const scheduleForWeek = newSchedule[weekKey];

            if (!scheduleForWeek) {
                console.error("Schedule for week not found, should have been generated.");
                return prev; // Should not happen if calendar view is opened first
            }

            const startDate = getDateOfWeek(week, year);

            for (let i = 0; i < 7; i++) {
                const day = new Date(startDate);
                day.setDate(day.getDate() + i);
                const dateKey = day.toISOString().split('T')[0];
                
                const daySchedule = scheduleForWeek[dateKey];
                const shift = selectedShift;

                // Remove from any other shift on that day to prevent duplicates
                Object.keys(daySchedule).forEach(s => {
                    daySchedule[s] = daySchedule[s].filter((id: string) => id !== selectedUserId);
                });
                
                // Add to the correct shift if not already there
                if (daySchedule[shift] && !daySchedule[shift].includes(selectedUserId)) {
                    daySchedule[shift].push(selectedUserId);
                }
            }
            
            return { ...prev, wheelchairSchedule: newSchedule };
        });
        
        const shiftNames = { morning: 'ranní', afternoon: 'odpolední', night: 'noční' };
        showToast(`${userToAdd.firstName} ${userToAdd.lastName} přidán(a) na ${shiftNames[selectedShift]} směnu.`);
        onClose();
    };

    return (
        <Modal
            title={`Přidat vozíčkáře na Týden ${week}`}
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave}>Uložit</button>
                </>
            }
        >
            <div className="form-group">
                <label>Vyberte vozíčkáře</label>
                <select 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                    disabled={appData.wheelchairUsers.length === 0}
                >
                    {appData.wheelchairUsers.length === 0 ? (
                        <option>Žádní vozíčkáři k dispozici</option>
                    ) : (
                        appData.wheelchairUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                        ))
                    )}
                </select>
            </div>
            <div className="form-group">
                <label>Přiřadit na směnu</label>
                <select
                    value={selectedShift}
                    onChange={e => setSelectedShift(e.target.value as WheelchairUser['startShift'])}
                >
                    <option value="morning">Ranní</option>
                    <option value="afternoon">Odpolední</option>
                    <option value="night">Noční</option>
                </select>
                <small style={{marginTop: '8px', display: 'block', color: 'var(--dz-text-secondary)'}}>
                    Vozíčkář bude přidán do vybrané směny pro každý den v týdnu.
                </small>
            </div>
        </Modal>
    );
};

export default AddWCUserToWeekModal;