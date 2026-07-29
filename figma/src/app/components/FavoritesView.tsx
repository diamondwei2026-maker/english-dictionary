import { ArrowLeft, Bookmark } from 'lucide-react';
import { mockWords } from '../data/mockData';
import type { ViewState } from '../data/types';

interface FavoritesViewProps {
  favorites: string[];
  navigate: (view: ViewState) => void;
  onToggleFavorite: (wordId: string) => void;
}

export function FavoritesView({ favorites, navigate, onToggleFavorite }: FavoritesViewProps) {
  const words = favorites
    .map(id => mockWords.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => !!w);

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
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>我的收藏</h1>
      </div>

      <div style={{ padding: '16px 24px 40px' }}>
        {words.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0' }}>
            <Bookmark size={40} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', color: '#9CA3AF', margin: '0 0 6px' }}>还没有收藏单词</p>
            <p style={{ fontSize: '13px', color: '#D1D5DB', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              在单词详情页点击收藏按钮，保存需要复习的单词
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
              共 {words.length} 个单词
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {words.map(word => (
                <div
                  key={word.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: '#fff', borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', gap: '12px',
                  }}
                >
                  <button
                    onClick={() => navigate({ name: 'wordDetail', wordId: word.id })}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '4px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', flex: 1, minWidth: 0, padding: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {word.coreMeaning}
                    </p>
                  </button>
                  <button
                    onClick={() => onToggleFavorite(word.id)}
                    aria-label="取消收藏"
                    style={{
                      flexShrink: 0, width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: '#EFF6FF',
                    }}
                  >
                    <Bookmark size={16} fill="#2563EB" color="#2563EB" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
