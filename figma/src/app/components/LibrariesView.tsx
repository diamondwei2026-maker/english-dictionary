import { BookOpen, ArrowRight } from 'lucide-react';
import { mockLibraries, mockWords } from '../data/mockData';
import type { ViewState } from '../data/types';

interface LibrariesViewProps {
  navigate: (view: ViewState) => void;
}

export function LibrariesView({ navigate }: LibrariesViewProps) {
  const libraryColors = [
    { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', accent: '#2563EB', border: '#BFDBFE' },
    { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', accent: '#16A34A', border: '#BBF7D0' },
    { bg: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', accent: '#D97706', border: '#FDE68A' },
    { bg: 'linear-gradient(135deg, #FAF5FF, #EDE9FE)', accent: '#7C3AED', border: '#DDD6FE' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <div
        style={{
          padding: '52px 24px 20px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
          词库
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          选择词库
        </h1>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mockLibraries.map((lib, index) => {
            const color = libraryColors[index % libraryColors.length];
            const wordsInLib = mockWords.filter(w => w.libraryId === lib.id);

            return (
              <button
                key={lib.id}
                onClick={() => navigate({ name: 'libraryWords', libraryId: lib.id })}
                style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: '24px',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <BookOpen size={18} color={color.accent} />
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        {lib.name}
                      </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
                      {lib.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: color.accent, fontWeight: 600 }}>
                          {lib.wordCount} 个单词
                        </span>
                        {wordsInLib.length > 0 && (
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            已收录 {wordsInLib.length} 个
                          </span>
                        )}
                      </div>
                      <ArrowRight size={16} color={color.accent} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Library words view - inline for the library detail */}
      </div>
    </div>
  );
}

interface LibraryWordsViewProps {
  libraryId: string;
  navigate: (view: ViewState) => void;
}

export function LibraryWordsView({ libraryId, navigate }: LibraryWordsViewProps) {
  const library = mockLibraries.find(l => l.id === libraryId);
  const words = mockWords.filter(w => w.libraryId === libraryId);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <div
        style={{
          padding: '52px 24px 20px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          onClick={() => navigate({ name: 'libraries' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B7280',
            fontSize: '14px',
            marginBottom: '12px',
            padding: 0,
          }}
        >
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          词库列表
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          {library?.name}
        </h1>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          {words.length} 个单词
        </p>
      </div>

      <div style={{ padding: '16px 24px' }}>
        {words.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px' }}>该词库暂无单词</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {words.map(word => (
              <button
                key={word.id}
                onClick={() => navigate({ name: 'wordDetail', wordId: word.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#fff',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                    {word.coreMeaning.slice(0, 40)}...
                  </p>
                </div>
                <ArrowRight size={15} color="#D1D5DB" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
