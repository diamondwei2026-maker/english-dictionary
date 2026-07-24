import { useState } from 'react';
import { ArrowLeft, FileText, Trash2, ChevronRight } from 'lucide-react';
import { mockWords } from '../data/mockData';
import type { AuthUser, Note, ViewState } from '../data/types';

interface NotesViewProps {
  user: AuthUser;
  notes: Note[];
  navigate: (view: ViewState) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesView({ user, notes, navigate, onDeleteNote }: NotesViewProps) {
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const userNotes = notes.filter(n => n.userId === user.id);

  const grouped = userNotes.reduce<Record<string, Note[]>>((acc, note) => {
    if (!acc[note.wordId]) acc[note.wordId] = [];
    acc[note.wordId].push(note);
    return acc;
  }, {});

  const wordIds = Object.keys(grouped);

  // ── Level 2: notes for a specific word ──────────────────────────────────────
  if (selectedWordId !== null) {
    const word = mockWords.find(w => w.id === selectedWordId);
    const wordNotes = grouped[selectedWordId] || [];

    return (
      <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '52px 24px 16px',
          background: 'rgba(247,249,252,0.94)',
          backdropFilter: 'blur(16px)',
        }}>
          <button
            onClick={() => setSelectedWordId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B7280', fontSize: '14px', padding: '6px 0', marginBottom: '12px',
            }}
          >
            <ArrowLeft size={18} />
            笔记列表
          </button>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {word ? word.word : selectedWordId}
          </h1>
        </div>

        <div style={{ padding: '16px 24px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {wordNotes.map(note => (
              <div
                key={note.id}
                style={{
                  padding: '16px 18px',
                  background: '#fff',
                  borderRadius: '16px',
                  borderLeft: '3px solid #2563EB',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 6px', lineHeight: 1.7 }}>
                    {note.content}
                  </p>
                  <p style={{ fontSize: '11px', color: '#CBD5E1', margin: 0 }}>{note.createdAt}</p>
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  style={{
                    flexShrink: 0, background: '#FEF2F2', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', color: '#DC2626',
                    padding: '6px', display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate({ name: 'wordDetail', wordId: selectedWordId })}
            style={{
              width: '100%', padding: '15px', borderRadius: '16px', border: 'none',
              background: '#EFF6FF', color: '#2563EB', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            查看单词详情
          </button>
        </div>
      </div>
    );
  }

  // ── Level 1: word list ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '52px 24px 16px',
        background: 'rgba(247,249,252,0.94)',
        backdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={() => navigate({ name: 'profile' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B7280', fontSize: '14px', padding: '6px 0', marginBottom: '12px',
          }}
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
          我的
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>我的笔记</h1>
      </div>

      <div style={{ padding: '16px 24px 40px' }}>
        {wordIds.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0' }}>
            <FileText size={40} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', color: '#9CA3AF', margin: '0 0 6px' }}>还没有笔记</p>
            <p style={{ fontSize: '13px', color: '#D1D5DB', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              去单词详情页添加你的理解和记忆
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
              共 {wordIds.length} 个单词
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wordIds.map(wordId => {
                const word = mockWords.find(w => w.id === wordId);
                const count = grouped[wordId].length;
                return (
                  <button
                    key={wordId}
                    onClick={() => setSelectedWordId(wordId)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 20px', background: '#fff', border: 'none',
                      borderRadius: '20px', cursor: 'pointer', textAlign: 'left',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                    }}
                  >
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                      {word ? word.word : wordId}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '12px', color: '#2563EB', background: '#EFF6FF',
                        padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                      }}>
                        {count} 条笔记
                      </span>
                      <ChevronRight size={16} color="#D1D5DB" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
