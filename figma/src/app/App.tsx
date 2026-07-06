import { useState } from 'react';
import type { ViewState, AuthUser } from './data/types';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { WordDetailView } from './components/WordDetailView';
import { LibrariesView, LibraryWordsView } from './components/LibrariesView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { AdminView } from './components/AdminView';

type Tab = 'home' | 'libraries' | 'profile';

function tabFromView(view: ViewState): Tab {
  if (view.name === 'libraries' || view.name === 'libraryWords') return 'libraries';
  if (view.name === 'profile' || view.name === 'login' || view.name === 'register') return 'profile';
  return 'home';
}

export default function App() {
  const [view, setView] = useState<ViewState>({ name: 'home' });
  const [user, setUser] = useState<AuthUser | null>(null);

  const navigate = (newView: ViewState) => setView(newView);

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    if (u.role === 'admin') {
      navigate({ name: 'admin', tab: 'overview' });
    } else {
      navigate({ name: 'profile' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate({ name: 'home' });
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'home') navigate({ name: 'home' });
    else if (tab === 'libraries') navigate({ name: 'libraries' });
    else if (tab === 'profile') navigate({ name: 'profile' });
  };

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        maxWidth: '430px',
        margin: '0 auto',
        minHeight: '100vh',
        background: '#F7F9FC',
        position: 'relative',
      }}
    >
      {/* Admin takes over the full view without bottom nav */}
      {view.name === 'admin' ? (
        <AdminView navigate={navigate} user={user} />
      ) : (
        <>
          <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>
            {view.name === 'home' && <HomeView navigate={navigate} />}
            {view.name === 'wordDetail' && <WordDetailView wordId={view.wordId} navigate={navigate} />}
            {view.name === 'libraries' && <LibrariesView navigate={navigate} />}
            {view.name === 'libraryWords' && <LibraryWordsView libraryId={view.libraryId} navigate={navigate} />}
            {view.name === 'profile' && <ProfileView user={user} navigate={navigate} onLogout={handleLogout} />}
            {view.name === 'login' && <AuthView mode="login" navigate={navigate} onAuth={handleLogin} />}
            {view.name === 'register' && <AuthView mode="register" navigate={navigate} onAuth={handleLogin} />}
          </div>
          <BottomNav currentTab={tabFromView(view)} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}
