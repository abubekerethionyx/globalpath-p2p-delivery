import React, { useState, useEffect, useRef } from 'react';
import { AdminService } from '../../services/AdminService';
import { COUNTRIES } from '../../constants';
import { useToast } from '../ToastContext';
import ConfirmationModal from '../ConfirmationModal';

const AdminCountriesTab: React.FC = () => {
    const [countries, setCountries] = useState<any[]>([]);
    const [newCountry, setNewCountry] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const suggestionRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'DANGER' | 'INFO';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'INFO',
        onConfirm: () => { }
    });

    const fetchCountries = async () => {
        try {
            const data = await AdminService.getCountries();
            setCountries(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load countries');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCountries();

        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewCountry(value);
        if (value.trim()) {
            const filtered = COUNTRIES.filter(c =>
                c.toLowerCase().includes(value.toLowerCase()) &&
                !countries.some(existing => existing.name.toLowerCase() === c.toLowerCase())
            ).slice(0, 10);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setNewCountry(suggestion);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCountry.trim()) return;

        try {
            await AdminService.addCountry(newCountry);
            setNewCountry('');
            setShowSuggestions(false);
            showToast(`${newCountry} registered successfully`, 'SUCCESS');
            fetchCountries();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to add country', 'ERROR');
        }
    };

    const handleDelete = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Node',
            message: 'Are you sure you want to remove this country? It will no longer be available for new shipments.',
            type: 'DANGER',
            onConfirm: async () => {
                try {
                    await AdminService.deleteCountry(id);
                    showToast('Country node deleted', 'SUCCESS');
                    fetchCountries();
                } catch (err) {
                    showToast('Failed to delete country', 'ERROR');
                } finally {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleToggle = async (id: string) => {
        try {
            await AdminService.toggleCountry(id);
            showToast('Node status updated', 'SUCCESS');
            fetchCountries();
        } catch (err) {
            showToast('Failed to toggle country status', 'ERROR');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-2">Supported Geographies</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">Manage operational origin and destination countries for the GlobalPath platform.</p>

                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-10 relative">
                    <div className="flex-1 relative" ref={suggestionRef}>
                        <input
                            type="text"
                            placeholder="Enter country name (e.g. Ethiopia)"
                            value={newCountry}
                            onChange={handleInputChange}
                            onFocus={() => newCountry.trim() && setShowSuggestions(true)}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                {suggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className="px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                                    >
                                        <span>{suggestion}</span>
                                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!newCountry.trim()}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Register Node
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countries.map((country) => (
                        <div key={country.id} className="group relative bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${country.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{country.name}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${country.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                                        {country.is_active ? 'Operational' : 'Restricted'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleToggle(country.id)}
                                    title={country.is_active ? 'Disable' : 'Enable'}
                                    className={`p-2 rounded-xl border transition-colors ${country.is_active ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100' : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(country.id)}
                                    className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {countries.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold">No geographies registered in the protocol.</p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminCountriesTab;
