// ============================================================
// App — Root Component (Router + Layout)
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import AddItemPage from './pages/AddItemPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';
import { useState, useEffect } from 'react';

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading GroceryLens...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LandingPage />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/add" element={<AddItemPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </Layout>
    );
}

export default function App() {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('grocerylens-theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('grocerylens-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Make toggleDarkMode available globally
    (window as any).__toggleDarkMode = () => setDarkMode(prev => !prev);
    (window as any).__isDarkMode = darkMode;

    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
