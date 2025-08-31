

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isKfcSurovinaByName } from './constants';
import type { 
    Surovina, Zakaznik, OrderItem, Order, MixDefinition, Product, PlannedAction, Change,
    WheelchairUser, WheelchairSchedule, PCPerson, PCEvent, AppState, ToastInfo, ConfirmationState, DocumentFolder, DocumentFile, WorkPosition
} from './types';

// Import Views
import DashboardView from './views/DashboardView';
import DailyPlanView from './views/DailyPlanView';
import OrdersView from './views/OrdersView';
import CalendarView from './views/CalendarView';
import CustomersView from './views/CustomersView';
import EmployeesView from './views/EmployeesView';
import KFCView from './views/KFCView';
import ChangesView from './views/ChangesView';
import DocumentsView from './views/DocumentsView';
import BoxWeightsView from './views/settings/BoxWeightsView';
import CreateMixView from './views/settings/CreateMixView';
import CreateProductView from './views/settings/CreateProductView';
import PaletteWeightsView from './views/settings/PaletteWeightsView';
import WheelchairCalendarView from './views/WheelchairCalendarView';
import WorkPlacementsView from './views/settings/WorkPlacementsView';
import SettingsView from './views/settings/SettingsView';

// Import Modals & Components
import { AddOrderModal, MixRatioModal, PlanActionModal, DayDetailsModal, AddChangeModal, PCPersonModal, PCEventModal, PCDayDetailsModal, PCShiftsModal, WCUserModal, WCUserListModal, AddKfcOrderModal, KfcCompositionModal, AddCustomerModal, AddDocumentFileModal, AddDocumentFolderModal, AddWCUserToWeekModal, AddSpizyOrderModal, QuickStockModal, EditSpizyOrderModal, AddWorkPositionModal, EditProductModal } from './modals';
import Toast from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';

// --- (1) HELPER HOOK FOR LOCALSTORAGE ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            const parsedItem = item ? JSON.parse(item) : initialValue;
            if (typeof initialValue === 'object' && initialValue !== null) {
                const initialStateKeys = Object.keys(initialValue);
                const loadedStateKeys = Object.keys(parsedItem);
                if (initialStateKeys.some(k => !loadedStateKeys.includes(k))) {
                    return { ...initialValue, ...parsedItem };
                }
            }
            return parsedItem;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// --- (2) INITIAL STATE SETUP ---
const setupDefaultData = (): AppState => {
    const suroviny = [
        {id: 's01', name: 'ŘÍZKY'}, {id: 's02', name: 'STRIPS'}, {id: 's03', name: 'PRSA'},
        {id: 's04', name: 'HRBETY'}, {id: 's05', name: 'PRDELE'}, {id: 's06', name: 'HORNÍ STEHNA'},
        {id: 's07', name: 'SPODNÍ STEHNA'}, {id: 's08', name: 'ČTVRTKY'}, {id: 's09', name: 'KŘÍDLA'},
        {id: 's10', name: 'PLACKY'}, {id: 's11', name: 'BANDURY'}, {id: 's12', name: 'STEAK'},
        {id: 's13', name: 'JÁTRA'}, {id: 's14', name: 'SRDCE'}, {id: 's15', name: 'ŽALUDKY'}, {id: 's16', name: 'KRKY'},
        {id: 's17', name: 'KFC FILLET'}, {id: 's18', name: 'KFC DRUMSTIK'}, {id: 's19', name: 'KFC DARKFILET'}, {id: 's20', name: 'KFC 9ŘEZ'},
        {id: 's21', name: 'KFC KŘÍDLA'}, {id: 's22', name: 'KFC STRIPS'}, {id: 's23', name: 'ŠPÍZY'},
        {id: 's24', name: 'ŠPÍZY - ŠPEK'}, {id: 's25', name: 'ŠPÍZY - KLOBÁSA'}, {id: 's26', name: 'ŠPÍZY - ČILI MANGO'}
    ].map(s => ({ ...s, paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true }));

    const zakaznici = [
        {id: 'c1', name: 'Ahold'}, {id: 'c2', name: 'Billa'}, {id: 'c3', name: 'Tesco'},
        {id: 'c4', name: 'Kaufland'}, {id: 'c5', name: 'Lidl'}, {id: 'c6', name: 'Rohlik'},
        {id: 'c7', name: 'KFC'}
    ];

    const boxWeights: AppState['boxWeights'] = {};
    zakaznici.forEach(c => {
        boxWeights[c.id] = { standard: {}, extra: {}, bulk: {} };
        suroviny.forEach(s => {
            boxWeights[c.id].standard![s.id] = 10000;
            boxWeights[c.id].extra![s.id] = 10000;
            boxWeights[c.id].bulk![s.id] = 10000;
        });
    });

    const workPositions: WorkPosition[] = [
        'bizzerba', 'řízky pas', 'dočistování', 'robot', 'icut', 
        'maykawa', 'manipulant', 'mleté maso', 'lima', 'kfc', 
        'špízy', 'nezařazené'
    ].map((name, index) => ({ id: `wp${index + 1}`, name }));

    return {
        suroviny, zakaznici, boxWeights, orders: [], mixDefinitions: {}, kfcCompositions: {},
        plannedActions: [], products: [], changes: [], wheelchairUsers: [], wheelchairSchedule: {},
        people: [], peopleEvents: [], documentFolders: [], documentFiles: [], workPositions, spizyOrdersStatus: {},
        extraProductionStatus: {},
    };
};

// --- (3) MODAL STATE TYPES ---
type ModalState = 
    | { name: 'none' } | { name: 'addOrder'; customerId: string; orderType: Order['orderType']; }
    | { name: 'addKfcOrder' } | { name: 'kfcComposition' } | { name: 'mixRatio'; orderId: string; itemId: string }
    | { name: 'planAction'; actionId?: string } | { name: 'dayDetails'; date: string }
    | { name: 'addChange'; changeId?: string } | { name: 'addCustomer'; customerId?: string }
    | { name: 'addDocumentFile'; fileId?: string } | { name: 'addDocumentFolder'; folderId?: string }
    | { name: 'pcPerson'; personId?: string } | { name: 'pcEvent'; eventId?: string }
    | { name: 'pcDayDetails'; date: string } | { name: 'pcShifts' } | { name: 'addWorkPosition'; positionId?: string }
    | { name: 'wcUser'; userId?: string } | { name: 'wcUserList' }
    | { name: 'addWCUserToWeek'; year: number; week: number } | { name: 'addSpizyOrder' }
    | { name: 'editSpizyOrder'; customerId: string; } | { name: 'quickStock' }
    | { name: 'editProduct'; surovinaId: string; customerId: string; orderType: Order['orderType'] };

// --- (4) MAIN APP COMPONENT ---
function App() {
    const [appData, setAppData] = useLocalStorage<AppState>('surovinyAppData_v15', setupDefaultData());
    
    const today = new Date().toISOString().split('T')[0];
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedDate, setSelectedDate] = useState(today);
    const [modal, setModal] = useState<ModalState>({ name: 'none' });
    const [toast, setToast] = useState<ToastInfo | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // Data migration effects... (kept unchanged)
    useEffect(() => {
        const needsKfcMigration = !appData.suroviny.some(s => s.id === 's21' || s.id === 's22');
        if (needsKfcMigration) {
            setAppData(prev => {
                const newSurovinyToAdd = [];
                if (!prev.suroviny.some(s => s.id === 's21')) newSurovinyToAdd.push({id: 's21', name: 'KFC KŘÍDLA', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true});
                if (!prev.suroviny.some(s => s.id === 's22')) newSurovinyToAdd.push({id: 's22', name: 'KFC STRIPS', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true});
                if (newSurovinyToAdd.length === 0) return prev;
                const updatedSuroviny = [...prev.suroviny, ...newSurovinyToAdd];
                const updatedBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
                prev.zakaznici.forEach(customer => {
                    if (!updatedBoxWeights[customer.id]) updatedBoxWeights[customer.id] = { standard: {}, extra: {}, bulk: {} };
                    newSurovinyToAdd.forEach(surovina => {
                        if (updatedBoxWeights[customer.id].standard) updatedBoxWeights[customer.id].standard[surovina.id] = 10000;
                        if (updatedBoxWeights[customer.id].extra) updatedBoxWeights[customer.id].extra[surovina.id] = 10000;
                        if (updatedBoxWeights[customer.id].bulk) updatedBoxWeights[customer.id].bulk[surovina.id] = 10000;
                    });
                });
                return { ...prev, suroviny: updatedSuroviny, boxWeights: updatedBoxWeights };
            });
        }
    }, []);
    useEffect(() => {
        const firstOrder = appData.orders[0], firstCustomerWeights = Object.values(appData.boxWeights)[0];
        const needsOrderMigration = firstOrder && !('orderType' in firstOrder), needsBoxWeightsMigration = firstCustomerWeights && !('standard' in firstCustomerWeights);
        if (needsOrderMigration || needsBoxWeightsMigration) {
            setAppData(prev => {
                let migratedOrders = prev.orders;
                if (needsOrderMigration) migratedOrders = prev.orders.map(o => ({ ...(o as any), orderType: (o as any).isExtra ? 'extra' : 'standard' }));
                let migratedBoxWeights = prev.boxWeights;
                if (needsBoxWeightsMigration) {
                    migratedBoxWeights = {};
                    Object.keys(prev.boxWeights).forEach(customerId => {
                        const weights = prev.boxWeights[customerId] as any;
                        migratedBoxWeights[customerId] = { standard: {...weights}, extra: {...weights}, bulk: {...weights} };
                    });
                }
                prev.zakaznici.forEach(c => {
                    if (!migratedBoxWeights[c.id]) {
                        migratedBoxWeights[c.id] = { standard: {}, extra: {}, bulk: {} };
                        prev.suroviny.forEach(s => {
                            migratedBoxWeights[c.id].standard![s.id] = 10000;
                            migratedBoxWeights[c.id].extra![s.id] = 10000;
                            migratedBoxWeights[c.id].bulk![s.id] = 10000;
                        });
                    } else {
                        if (!migratedBoxWeights[c.id].standard) migratedBoxWeights[c.id].standard = {};
                        if (!migratedBoxWeights[c.id].extra) migratedBoxWeights[c.id].extra = JSON.parse(JSON.stringify(migratedBoxWeights[c.id].standard));
                        if (!migratedBoxWeights[c.id].bulk) migratedBoxWeights[c.id].bulk = JSON.parse(JSON.stringify(migratedBoxWeights[c.id].standard));
                    }
                });
                return { ...prev, orders: migratedOrders, boxWeights: migratedBoxWeights };
            });
        }
    }, []);
    useEffect(() => {
        if (!appData.suroviny.some(s => s.id === 's23')) {
            setAppData(prev => {
                const newSurovina = {id: 's23', name: 'ŠPÍZY', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true};
                const updatedSuroviny = [...prev.suroviny, newSurovina];
                const updatedBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
                prev.zakaznici.forEach(c => {
                    if (!updatedBoxWeights[c.id]) updatedBoxWeights[c.id] = { standard: {}, extra: {}, bulk: {} };
                    updatedBoxWeights[c.id].standard![newSurovina.id] = 10000;
                    updatedBoxWeights[c.id].extra![newSurovina.id] = 10000;
                    updatedBoxWeights[c.id].bulk![newSurovina.id] = 10000;
                });
                return { ...prev, suroviny: updatedSuroviny, boxWeights: updatedBoxWeights };
            });
        }
    }, []);
    useEffect(() => {
        if (!appData.suroviny.some(s => s.id === 's24' || s.id === 's25' || s.id === 's26')) {
            setAppData(prev => {
                const newSurovinyToAdd = [];
                if (!prev.suroviny.some(s => s.id === 's24')) newSurovinyToAdd.push({id: 's24', name: 'ŠPÍZY - ŠPEK', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true});
                if (!prev.suroviny.some(s => s.id === 's25')) newSurovinyToAdd.push({id: 's25', name: 'ŠPÍZY - KLOBÁSA', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true});
                if (!prev.suroviny.some(s => s.id === 's26')) newSurovinyToAdd.push({id: 's26', name: 'ŠPÍZY - ČILI MANGO', paletteWeight: 500, stock: 0, stockBoxes: 0, isMix: false, isActive: true});
                if (newSurovinyToAdd.length === 0) return prev;
                const updatedSuroviny = [...prev.suroviny, ...newSurovinyToAdd];
                const updatedBoxWeights = JSON.parse(JSON.stringify(prev.boxWeights));
                prev.zakaznici.forEach(c => {
                    if (!updatedBoxWeights[c.id]) updatedBoxWeights[c.id] = { standard: {}, extra: {}, bulk: {} };
                    newSurovinyToAdd.forEach(s => {
                        updatedBoxWeights[c.id].standard![s.id] = 10000;
                        updatedBoxWeights[c.id].extra![s.id] = 10000;
                        updatedBoxWeights[c.id].bulk![s.id] = 10000;
                    });
                });
                return { ...prev, suroviny: updatedSuroviny, boxWeights: updatedBoxWeights };
            });
        }
    }, []);
    useEffect(() => {
        if (appData.suroviny.some(s => s.stockBoxes === undefined)) {
            setAppData(prev => ({ ...prev, suroviny: prev.suroviny.map(s => ({ ...s, stockBoxes: s.stockBoxes || 0 })) }));
        }
    }, []);
    useEffect(() => {
        if (appData.suroviny.some(s => s.isActive === undefined)) {
            setAppData(prev => ({
                ...prev,
                suroviny: prev.suroviny.map(s => ({
                    ...s,
                    isActive: s.isActive === undefined ? true : s.isActive
                }))
            }));
        }
    }, [appData.suroviny, setAppData]);
    useEffect(() => {
        if (appData.extraProductionStatus === undefined) {
            setAppData(prev => ({ ...prev, extraProductionStatus: {} }));
        }
    }, [appData.extraProductionStatus, setAppData]);
    useEffect(() => {
        if (appData.products.length > 0 && appData.products.some(p => p.isBulk === undefined)) {
            setAppData(prev => ({
                ...prev,
                products: prev.products.map(p => ({ ...p, isBulk: p.isBulk || false }))
            }));
        }
    }, [appData.products, setAppData]);
    useEffect(() => {
        if (appData.workPositions === undefined) {
            const initialPositions = [
                'bizzerba', 'řízky pas', 'dočistování', 'robot', 'icut', 
                'maykawa', 'manipulant', 'mleté maso', 'lima', 'kfc', 
                'špízy', 'nezařazené'
            ].map((name, index) => ({ id: `wp${index + 1}`, name }));
            setAppData(prev => ({ ...prev, workPositions: initialPositions }));
        }
    }, [appData.workPositions, setAppData]);


    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            if (isNavOpen) root.classList.add('nav-open');
            else root.classList.remove('nav-open');
        }
    }, [isNavOpen]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ id: Date.now(), message, type });
    const showConfirmation = (message: string, onConfirm: () => void) => setConfirmation({ message, onConfirm });

    const getSurovinaName = useCallback((id: string) => appData.suroviny.find(s => s.id === id)?.name || 'N/A', [appData.suroviny]);
    const getCustomerName = useCallback((id: string) => appData.zakaznici.find(c => c.id === id)?.name || 'N/A', [appData.zakaznici]);

    const getDailyNeeds = useCallback((date: string, customerFilter: 'kfc' | 'non-kfc' | null = null) => {
        const needs: { [key: string]: number } = {};
        appData.suroviny.filter(s => !s.isMix).forEach(s => { needs[s.id] = 0; });
        let dailyOrders = appData.orders.filter(o => o.date === date);
        let activeActions = appData.plannedActions.filter(a => date >= a.startDate && (!a.endDate || date <= a.endDate));
        const kfcId = appData.zakaznici.find(c => c.name.toLowerCase() === 'kfc')?.id;
        if (customerFilter && kfcId) {
            if (customerFilter === 'kfc') {
                dailyOrders = dailyOrders.filter(o => o.customerId === kfcId);
                activeActions = activeActions.filter(a => a.customerId === kfcId);
            } else if (customerFilter === 'non-kfc') {
                dailyOrders = dailyOrders.filter(o => o.customerId !== kfcId);
                activeActions = activeActions.filter(a => a.customerId !== kfcId);
            }
        }
        const allItemsForDay: (OrderItem & { customerId: string, orderType: Order['orderType'] })[] = [];
        dailyOrders.forEach(order => {
            order.items.forEach(item => allItemsForDay.push({ ...item, customerId: order.customerId, orderType: order.orderType || 'standard' }));
        });
        activeActions.forEach(action => {
            const boxCount = action.dailyCounts[date];
            if (boxCount && boxCount > 0) {
                allItemsForDay.push({ surovinaId: action.surovinaId, boxCount, customerId: action.customerId, id: action.id, orderType: 'standard' });
            }
        });
        allItemsForDay.forEach(item => {
            const surovina = appData.suroviny.find(s => s.id === item.surovinaId);
            if (!surovina || !(surovina.isActive ?? true)) return;
            const boxWeightInGrams = appData.boxWeights[item.customerId]?.[item.orderType]?.[surovina.id] || 10000;
            const netWeightKg = item.boxCount * (boxWeightInGrams / 1000);
            if (surovina.isMix) {
                const mixDef = appData.mixDefinitions[surovina.id];
                const components = item.ratioOverride || mixDef?.components;
                if (components) {
                    components.forEach(comp => {
                        const loss = comp.loss || 0;
                        const componentNetWeight = netWeightKg * (comp.percentage / 100);
                        const componentGrossWeight = componentNetWeight / (1 - (loss / 100));
                        needs[comp.surovinaId] = (needs[comp.surovinaId] || 0) + componentGrossWeight;
                    });
                }
            } else if (isKfcSurovinaByName(surovina.name)) {
                const composition = appData.kfcCompositions[surovina.id];
                if (composition && composition.baseSurovinaId) {
                    const loss = composition.lossPercent || 0;
                    const grossWeightKg = netWeightKg / (1 - (loss / 100));
                    needs[composition.baseSurovinaId] = (needs[composition.baseSurovinaId] || 0) + grossWeightKg;
                }
            } else {
                const product = appData.products.find(p => p.customerId === item.customerId && p.surovinaId === surovina.id);
                const loss = product?.lossPercent || 0;
                const grossWeightKg = netWeightKg / (1 - (loss / 100));
                needs[surovina.id] = (needs[surovina.id] || 0) + grossWeightKg;
            }
        });
        return needs;
    }, [appData]);

    const VIEW_TITLES: { [key: string]: string } = {
        'dashboard': 'Hlavní stránka', 'daily-plan': 'Denní Plán', 'orders': 'Objednávky',
        'calendar': 'Kalendář akcí', 'zakaznici': 'Správa Zákazníků', 'zamestnanci': 'Zaměstnanci',
        'kfc': 'KFC Plán', 'zmeny': 'Změny', 'documents': 'Dokumenty', 'create-product': 'Produkty pro zákazníky',
        'create-mix': 'Vytvořit mix', 'box-weights': 'Úprava produktu', 'palette-weights': 'Váhy palet',
        'wheelchair-calendar': 'Plán Vozíčkářů', 'work-placements': 'Pracovní umístění', 'settings': 'Nastavení'
    };
    
    const renderActiveView = () => {
        const commonProps = { appData, setAppData, showToast, showConfirmation, setModal, getSurovinaName, getCustomerName };
        switch (activeView) {
            case 'dashboard': return <DashboardView getDailyNeeds={getDailyNeeds} selectedDate={selectedDate} {...commonProps} setActiveView={setActiveView} />;
            case 'daily-plan': return <DailyPlanView getDailyNeeds={getDailyNeeds} selectedDate={selectedDate} {...commonProps} />;
            case 'orders': return <OrdersView selectedDate={selectedDate} {...commonProps} />;
            case 'calendar': return <CalendarView {...commonProps} />;
            case 'zakaznici': return <CustomersView {...commonProps} />;
            case 'zamestnanci': return <EmployeesView {...commonProps} setActiveView={setActiveView}/>;
            case 'kfc': return <KFCView getDailyNeeds={getDailyNeeds} selectedDate={selectedDate} {...commonProps} />;
            case 'zmeny': return <ChangesView {...commonProps} />;
            case 'documents': return <DocumentsView {...commonProps} />;
            case 'create-product': return <CreateProductView {...commonProps} />;
            case 'create-mix': return <CreateMixView {...commonProps} />;
            case 'box-weights': return <BoxWeightsView {...commonProps} />;
            case 'palette-weights': return <PaletteWeightsView {...commonProps} />;
            case 'wheelchair-calendar': return <WheelchairCalendarView {...commonProps} />;
            case 'work-placements': return <WorkPlacementsView {...commonProps} />;
            case 'settings': return <SettingsView setActiveView={setActiveView} />;
            default: return <div className="card"><div className="card-header"><h2 className="card-title">Pohled se připravuje</h2></div><div className="card-content"><p>Pohled '{activeView}' se momentálně dokončuje.</p></div></div>;
        }
    };

    return (
        <>
            <div className="app-overlay" onClick={() => setIsNavOpen(false)}></div>
            <Sidebar activeView={activeView} setActiveView={setActiveView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onLinkClick={() => setIsNavOpen(false)} />
            <main id="app-main">
                <MobileHeader onMenuClick={() => setIsNavOpen(true)} title={VIEW_TITLES[activeView] || 'DZ Control'} />
                {renderActiveView()}
            </main>
            
            {modal.name === 'addOrder' && <AddOrderModal customerId={modal.customerId} orderType={modal.orderType} selectedDate={selectedDate} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'addKfcOrder' && <AddKfcOrderModal selectedDate={selectedDate} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'kfcComposition' && <KfcCompositionModal appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'mixRatio' && <MixRatioModal orderId={modal.orderId} itemId={modal.itemId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} getSurovinaName={getSurovinaName} />}
            {modal.name === 'planAction' && <PlanActionModal actionId={modal.actionId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'dayDetails' && <DayDetailsModal date={modal.date} appData={appData} setAppData={setAppData} showConfirmation={showConfirmation} setModal={setModal} onClose={() => setModal({name: 'none'})} getCustomerName={getCustomerName} getSurovinaName={getSurovinaName} />}
            {modal.name === 'addChange' && <AddChangeModal changeId={modal.changeId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'addCustomer' && <AddCustomerModal customerId={modal.customerId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'addDocumentFile' && <AddDocumentFileModal fileId={modal.fileId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'addDocumentFolder' && <AddDocumentFolderModal folderId={modal.folderId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'pcPerson' && <PCPersonModal personId={modal.personId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'pcEvent' && <PCEventModal eventId={modal.eventId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'pcDayDetails' && <PCDayDetailsModal date={modal.date} appData={appData} setAppData={setAppData} showConfirmation={showConfirmation} setModal={setModal} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'pcShifts' && <PCShiftsModal appData={appData} setModal={setModal} showConfirmation={showConfirmation} setAppData={setAppData} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'addWorkPosition' && <AddWorkPositionModal positionId={modal.positionId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'wcUser' && <WCUserModal userId={modal.userId} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'wcUserList' && <WCUserListModal appData={appData} setAppData={setAppData} setModal={setModal} showConfirmation={showConfirmation} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'addWCUserToWeek' && <AddWCUserToWeekModal year={modal.year} week={modal.week} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'addSpizyOrder' && <AddSpizyOrderModal selectedDate={selectedDate} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'editSpizyOrder' && <EditSpizyOrderModal customerId={modal.customerId} selectedDate={selectedDate} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({ name: 'none' })} />}
            {modal.name === 'quickStock' && <QuickStockModal appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}
            {modal.name === 'editProduct' && <EditProductModal surovinaId={modal.surovinaId} customerId={modal.customerId} orderType={modal.orderType} appData={appData} setAppData={setAppData} showToast={showToast} onClose={() => setModal({name: 'none'})} />}

            {toast && <Toast message={toast.message} type={toast.type} onEnd={() => setToast(null)} />}
            {confirmation && <ConfirmationDialog message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation(null)} />}
        </>
    );
}

// --- SVG Icons ---
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconClipboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 16 2 2 4-4"></path></svg>;
const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconChevronRight = () => <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

// --- Mobile Header ---
const MobileHeader: React.FC<{ onMenuClick: () => void, title: string }> = ({ onMenuClick, title }) => (
    <header id="mobile-header">
        <button id="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div id="mobile-header-title">{title}</div>
    </header>
);

// --- Sidebar Component ---
interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    onLinkClick: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, selectedDate, setSelectedDate, onLinkClick }) => {
    const NavLink: React.FC<{ view: string; icon: React.ReactNode; children: React.ReactNode }> = ({ view, icon, children }) => (
        <a href="#" className={`nav-link ${activeView === view ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView(view); onLinkClick(); }}>
            {icon}
            <span>{children}</span>
        </a>
    );
    
    return (
        <nav id="app-nav">
            <div>
                <div className="nav-header">DZ Control</div>
                <div className="nav-links-container">
                    <NavLink view="dashboard" icon={<IconHome />}>Hlavní stránka</NavLink>
                    <NavLink view="daily-plan" icon={<IconClipboard />}>Denní Plán</NavLink>
                    <details open={['orders', 'kfc'].includes(activeView)}>
                        <summary className="nav-summary">
                            <IconPackage />
                            <span>Objednávky</span>
                            <IconChevronRight />
                        </summary>
                        <div className="nav-submenu">
                            <NavLink view="orders" icon={<></>}>Přehled</NavLink>
                            <NavLink view="kfc" icon={<></>}>KFC Plán</NavLink>
                        </div>
                    </details>
                    <NavLink view="calendar" icon={<IconCalendar />}>Kalendář akcí</NavLink>
                    <NavLink view="zamestnanci" icon={<IconUsers />}>Zaměstnanci</NavLink>
                    <NavLink view="documents" icon={<IconFileText />}>Dokumenty</NavLink>
                    <NavLink view="zmeny" icon={<IconRefresh />}>Změny</NavLink>
                    <NavLink view="settings" icon={<IconSettings />}>Nastavení</NavLink>
                </div>
            </div>
            <div className="nav-footer">
                <div className="form-group">
                    <label htmlFor="selectedDate">Datum plánu</label>
                    <input type="date" id="selectedDate" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
            </div>
        </nav>
    );
};

export default App;
// --- Icon components moved into App.tsx for file simplicity ---
// FIX: Corrected the malformed viewBox attribute in the IconEdit SVG component.
export const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
export const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
export const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;