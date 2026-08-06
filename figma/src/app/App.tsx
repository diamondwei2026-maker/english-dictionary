import { useState } from 'react';
import type { ViewState, AuthUser, Note } from './data/types';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { WordDetailView } from './components/WordDetailView';
import { LibrariesView, LibraryWordsView } from './components/LibrariesView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { AdminView } from './components/AdminView';
import { NotesView } from './components/NotesView';
import { FavoritesView } from './components/FavoritesView';
import { TrainingView } from './components/TrainingView';
import { QuizView } from './components/QuizView';
import { mockNotes } from './data/mockData';

type Tab = 'home' | 'libraries' | 'training' | 'profile';

function tabFromView(view: ViewState): Tab {
  if (view.name === 'libraries' || view.name === 'libraryWords') return 'libraries';
  if (view.name === 'training' || view.name === 'quiz') return 'training';
  if (view.name === 'profile' || view.name === 'login' || view.name === 'register' || view.name === 'notes' || view.name === 'favorites') return 'profile';
  return 'home';
}

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function App() {
  const [view, setView] = useState<ViewState>({ name: 'home' });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [favorites, setFavorites] = useState<string[]>([]);

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

  const handleSaveNote = (note: Omit<Note, 'id' | 'createdAt' | 'likedBy'>) => {
    setNotes(prev => [...prev, { ...note, id: genId(), createdAt: new Date().toISOString().slice(0, 10), likedBy: [] }]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleToggleLike = (noteId: string) => {
    if (!user) return;
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const liked = n.likedBy.includes(user.id);
      return { ...n, likedBy: liked ? n.likedBy.filter(id => id !== user.id) : [...n.likedBy, user.id] };
    }));
  };

  const handleToggleFavorite = (wordId: string) => {
    if (!user) return;
    setFavorites(prev => prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]);
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'home') navigate({ name: 'home' });
    else if (tab === 'libraries') navigate({ name: 'libraries' });
    else if (tab === 'training') navigate({ name: 'training' });
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
            {view.name === 'wordDetail' && (
              <WordDetailView
                wordId={view.wordId}
                navigate={navigate}
                user={user}
                notes={notes}
                onSaveNote={handleSaveNote}
                onToggleLike={handleToggleLike}
                isFavorite={favorites.includes(view.wordId)}
                onToggleFavorite={() => handleToggleFavorite(view.wordId)}
              />
            )}
            {view.name === 'libraries' && <LibrariesView navigate={navigate} />}
            {view.name === 'training' && <TrainingView navigate={navigate} />}
            {view.name === 'quiz' && <QuizView direction={view.direction} wordId={view.wordId} navigate={navigate} />}
            {view.name === 'libraryWords' && <LibraryWordsView libraryId={view.libraryId} navigate={navigate} />}
            {view.name === 'profile' && (
              <ProfileView user={user} navigate={navigate} onLogout={handleLogout} notes={notes} favorites={favorites} />
            )}
            {view.name === 'login' && <AuthView mode="login" navigate={navigate} onAuth={handleLogin} />}
            {view.name === 'register' && <AuthView mode="register" navigate={navigate} onAuth={handleLogin} />}
            {view.name === 'notes' && user && (
              <NotesView user={user} notes={notes} navigate={navigate} onDeleteNote={handleDeleteNote} />
            )}
            {view.name === 'favorites' && user && (
              <FavoritesView favorites={favorites} navigate={navigate} onToggleFavorite={handleToggleFavorite} />
            )}
          </div>
          <BottomNav currentTab={tabFromView(view)} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}
