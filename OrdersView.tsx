import React from 'react';
import type { AppState } from '../types';
import { IconTrash } from '../App';

interface OrdersViewProps {
    selectedDate: string;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState>>;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    setModal: (modal: any) => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ selectedDate, appData, setAppData, showConfirmation, setModal }) => {
    
    const handleBoxCountChange = (orderId: string, itemId: string, count: number) => {
        setAppData(prev => ({
            ...prev,
            orders: prev.orders.map(o => 
                o.id === orderId 
                ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, boxCount: count } : i) }
                : o
            )
        }));
    };
    
    const handleDeleteOrderItem = (orderId: string, itemId: string) => {
        showConfirmation("Opravdu si přejete smazat tuto položku z objednávky?", () => {
            setAppData(prev => {
                const newOrders = prev.orders.map(order => {
                    if (order.id !== orderId) return order;
                    return { ...order, items: order.items.filter(item => item.id !== itemId) };
                }).filter(order => order.items.length > 0);
                return { ...prev, orders: newOrders };
            });
        });
    };

    return (
        <div>
            <h1 className="page-header">Objednávky</h1>
            <div className="customer-grid">
                {appData.zakaznici.map(customer => {
                    const customerOrders = appData.orders.filter(o => o.customerId === customer.id && o.date === selectedDate);
                    const allItems = customerOrders.flatMap(order => 
                        order.items.map(item => ({...item, orderId: order.id}))
                    );

                    return (
                        <div key={customer.id} className="customer-card">
                            <div className="customer-card-header">{customer.name}</div>
                            <div className="customer-card-content">
                                {allItems.length > 0 ? (
                                    <div className="customer-order-list">
                                        {allItems.map(item => {
                                            const surovina = appData.suroviny.find(s => s.id === item.surovinaId);
                                            return (
                                                <div key={item.id} className="customer-order-item">
                                                    <span>{surovina?.name || 'N/A'}</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.boxCount}
                                                        onChange={(e) => handleBoxCountChange(item.orderId, item.id, parseInt(e.target.value) || 0)}
                                                    />
                                                    {surovina?.isMix && (
                                                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({name: 'mixRatio', orderId: item.orderId, itemId: item.id})}>Poměr</button>
                                                    )}
                                                    <button className="btn-icon" onClick={() => handleDeleteOrderItem(item.orderId, item.id)}>
                                                        <IconTrash />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{color: 'var(--text-secondary)'}}>Žádné objednávky pro tento den.</p>
                                )}
                            </div>
                            <div className="customer-card-footer">
                                <button className="btn btn-success btn-sm" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'standard' })}>+ Přidat (OA RB)</button>
                                <button className="btn btn-primary btn-sm" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'extra' })}>+ Přidat (Extra)</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setModal({ name: 'addOrder', customerId: customer.id, orderType: 'bulk' })}>+ Přidat (Volně)</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrdersView;