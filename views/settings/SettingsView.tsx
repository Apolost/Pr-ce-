import React from 'react';

interface SettingsViewProps {
    setActiveView: (view: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ setActiveView }) => {
    const settingsItems = [
        { view: 'create-product', title: 'Produkty pro zákazníky', description: 'Správa specifických produktů pro zákazníky, včetně kalibrace a ztrát.' },
        { view: 'create-mix', title: 'Mixy', description: 'Definice a správa vícesložkových produktů (mixů).' },
        { view: 'box-weights', title: 'Úprava produktu', description: 'Úprava názvů, vah, aktivace a deaktivace produktů.' },
        { view: 'palette-weights', title: 'Váhy palet', description: 'Nastavení vah palet pro základní suroviny.' },
        { view: 'zakaznici', title: 'Zákazníci', description: 'Přidávání a správa zákazníků v systému.' },
        { view: 'work-placements', title: 'Pracovní umístění', description: 'Správa pracovních pozic a umístění pro zaměstnance.' },
    ];

    return (
        <div>
            <h1 className="page-header">Nastavení</h1>
            <div className="settings-grid">
                {settingsItems.map(item => (
                    <div key={item.view} className="settings-card" onClick={() => setActiveView(item.view)} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveView(item.view)}>
                        <div className="settings-card-title">{item.title}</div>
                        <div className="settings-card-description">{item.description}</div>
                        <div className="settings-card-footer">
                            <span>Přejít do sekce</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsView;
