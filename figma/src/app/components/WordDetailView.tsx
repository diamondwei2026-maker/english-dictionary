import { useState } from 'react';
import { ArrowLeft, ChevronRight, FileText, Heart, Bookmark } from 'lucide-react';
import { mockWords, mockLibraries } from '../data/mockData';
import { PhysicalImage } from './PhysicalImage';
import type { ViewState, AuthUser, Note } from '../data/types';

interface WordDetailViewProps {
  wordId: string;
  navigate: (view: ViewState) => void;
  user: AuthUser | null;
  notes: Note[];
  onSaveNote: (note: Omit<Note, 'id' | 'createdAt' | 'likedBy'>) => void;
  onToggleLike: (noteId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  'n.': { bg: '#EFF6FF', text: '#1D4ED8' },
  'v.': { bg: '#F0FDF4', text: '#166534' },
  'adj.': { bg: '#FFF7ED', text: '#C2410C' },
  'adv.': { bg: '#FAF5FF', text: '#7E22CE' },
  'v./n.': { bg: '#ECFDF5', text: '#065F46' },
  'adj./adv.': { bg: '#FFF1F2', text: '#9F1239' },
};

function EvolutionArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '12px 0 10px' }}>
      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, #E5E7EB, #2563EB)' }} />
      <ChevronRight size={14} color="#2563EB" />
    </div>
  );
}

export function WordDetailView({ wordId, navigate, user, notes, onSaveNote, onToggleLike, isFavorite, onToggleFavorite }: WordDetailViewProps) {
  const word = mockWords.find(w => w.id === wordId);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteTab, setNoteTab] = useState<'all' | 'mine'>('all');

  if (!word) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>
        <p>单词不存在</p>
        <button onClick={() => navigate({ name: 'home' })} style={{ marginTop: '12px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>
          返回首页
        </button>
      </div>
    );
  }

  const library = mockLibraries.find(l => l.id === word.libraryId);
  const allNotes = notes
    .filter(n => n.wordId === wordId)
    .sort((a, b) => b.likedBy.length - a.likedBy.length);
  const myNotes = user ? allNotes.filter(n => n.userId === user.id) : [];
  const displayedNotes = noteTab === 'mine' ? myNotes : allNotes;

  const handleSave = () => {
    if (!noteInput.trim() || !user) return;
    setSaving(true);
    setTimeout(() => {
      onSaveNote({ wordId, userId: user.id, authorName: user.username, content: noteInput.trim() });
      setNoteInput('');
      setSaving(false);
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '52px 20px 16px',
          background: 'rgba(247,249,252,0.92)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          onClick={() => navigate({ name: 'home' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B7280',
            padding: '6px 0',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} />
          返回
        </button>
        {library && (
          <span style={{
            fontSize: '11px',
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '4px 12px',
            borderRadius: '20px',
            letterSpacing: '0.3px',
          }}>
            {library.name}
          </span>
        )}
      </div>

      <div style={{ padding: '8px 24px 40px' }}>
        {/* Word heading */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-1px', lineHeight: 1.1 }}>
              {word.word}
            </h1>
            <p style={{ fontSize: '16px', color: '#9CA3AF', margin: 0, letterSpacing: '0.5px' }}>
              {word.phonetic}
            </p>
          </div>
          <button
            onClick={() => { if (user) { onToggleFavorite(); } else { navigate({ name: 'login' }); } }}
            aria-label={isFavorite ? '取消收藏' : '收藏'}
            style={{
              flexShrink: 0,
              width: '44px',
              height: '44px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              background: isFavorite ? '#EFF6FF' : '#F1F5F9',
              transition: 'all 0.2s',
            }}
          >
            <Bookmark
              size={20}
              fill={isFavorite ? '#2563EB' : 'none'}
              color={isFavorite ? '#2563EB' : '#9CA3AF'}
            />
          </button>
        </div>

        {/* Physical image - the visual centerpiece */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
            物理意象
          </p>
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            <PhysicalImage type={word.coreImageType} />
          </div>
        </div>

        {/* Core meaning */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            核心义
          </p>
          <p style={{ fontSize: '16px', color: '#111827', lineHeight: 1.7, margin: '0 0 20px', fontWeight: 500 }}>
            {word.coreMeaning}
          </p>
          <div style={{
            padding: '16px 18px',
            background: '#F8FAFC',
            borderRadius: '14px',
            borderLeft: '3px solid #2563EB',
          }}>
            <p style={{ fontSize: '15px', color: '#1D4ED8', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.6 }}>
              {word.coreExampleSentence}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              {word.coreExampleTranslation}
            </p>
          </div>
        </div>

        {/* Extended meanings */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            引申义演化
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {word.extendedMeanings.map((ext, index) => (
              <div
                key={ext.id}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                }}
              >
                {/* Evolution logic */}
                <div style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    <span style={{ color: '#9CA3AF', marginRight: '6px' }}>{index + 1}.</span>
                    {ext.logicalEvolution}
                  </p>
                </div>

                <EvolutionArrow />

                {/* Meaning */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {ext.meaning}
                  </p>
                  <span style={{
                    flexShrink: 0,
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: 500,
                    background: (POS_COLORS[ext.partOfSpeech] || { bg: '#F3F4F6', text: '#6B7280' }).bg,
                    color: (POS_COLORS[ext.partOfSpeech] || { bg: '#F3F4F6', text: '#6B7280' }).text,
                  }}>
                    {ext.partOfSpeech}
                  </span>
                </div>

                {/* Example */}
                <div style={{
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  borderLeft: '3px solid #10B981',
                }}>
                  <p style={{ fontSize: '14px', color: '#065F46', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {ext.exampleSentence}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    {ext.exampleTranslation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collocations */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
            常见搭配
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {word.collocations.map((col, i) => (
              <span
                key={i}
                style={{
                  padding: '8px 14px',
                  background: '#F1F5F9',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#374151',
                  fontStyle: 'italic',
                  lineHeight: 1,
                }}
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Community notes — visible to everyone */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={14} color="#9CA3AF" />
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
              社区笔记
            </p>
          </div>

          {/* Tab switch */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: '#F1F5F9',
            borderRadius: '14px',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => setNoteTab('all')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                background: noteTab === 'all' ? '#fff' : 'transparent',
                color: noteTab === 'all' ? '#111827' : '#9CA3AF',
                boxShadow: noteTab === 'all' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              所有笔记 {allNotes.length}
            </button>
            {user && (
              <button
                onClick={() => setNoteTab('mine')}
                style={{
                  flex: 1,
                  padding: '9px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: noteTab === 'mine' ? '#fff' : 'transparent',
                  color: noteTab === 'mine' ? '#111827' : '#9CA3AF',
                  boxShadow: noteTab === 'mine' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                我的笔记 {myNotes.length}
              </button>
            )}
          </div>

          {/* Notes list */}
          {displayedNotes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {displayedNotes.map(note => {
                const liked = !!user && note.likedBy.includes(user.id);
                const isMine = !!user && note.userId === user.id;
                return (
                  <div
                    key={note.id}
                    style={{
                      padding: '14px 16px',
                      background: '#F8FAFC',
                      borderRadius: '14px',
                      borderLeft: '3px solid #2563EB',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        {note.authorName}{isMine && <span style={{ color: '#2563EB', fontWeight: 500 }}>（我）</span>}
                      </span>
                      <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{note.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 12px', lineHeight: 1.7 }}>{note.content}</p>
                    <button
                      onClick={() => { if (user) { onToggleLike(note.id); } else { navigate({ name: 'login' }); } }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: liked ? '#EFF6FF' : '#F1F5F9',
                        color: liked ? '#2563EB' : '#9CA3AF',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Heart size={14} fill={liked ? '#2563EB' : 'none'} color={liked ? '#2563EB' : '#9CA3AF'} />
                      {note.likedBy.length}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
                {noteTab === 'mine' ? '你还没有为该单词写笔记' : '暂无笔记，来写下第一条吧'}
              </p>
            </div>
          )}

          {/* Input — only for logged-in users */}
          {user ? (
            <>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="添加笔记，记录你的理解..."
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #E5E7EB',
                  background: '#F8FAFC',
                  fontSize: '14px',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.7,
                  resize: 'none',
                  minHeight: '88px',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  marginBottom: '10px',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F8FAFC'; }}
              />
              <button
                onClick={handleSave}
                disabled={!noteInput.trim() || saving}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: !noteInput.trim() || saving ? '#DBEAFE' : '#2563EB',
                  color: !noteInput.trim() || saving ? '#93C5FD' : '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: !noteInput.trim() || saving ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {saving ? '保存中...' : '保存笔记'}
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate({ name: 'login' })}
              style={{
                width: '100%',
                padding: '13px',
                background: '#EFF6FF',
                color: '#2563EB',
                border: 'none',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              登录后可点赞和添加笔记
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
