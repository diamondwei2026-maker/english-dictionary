import { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { mockWords, mockLibraries } from '../data/mockData';
import type { ViewState } from '../data/types';

interface HomeViewProps {
  navigate: (view: ViewState) => void;
}

const featuredWordId = 'w1';

export function HomeView({ navigate }: HomeViewProps) {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? mockWords.filter(w =>
        w.word.toLowerCase().includes(query.toLowerCase()) ||
        w.coreMeaning.includes(query)
      )
    : [];

  const featuredWord = mockWords.find(w => w.id === featuredWordId)!;
  const todayWord = mockWords[Math.floor(Date.now() / 86400000) % mockWords.length];

  return (
    <div style={{ padding: '0 0 24px', minHeight: '100vh', background: '#F7F9FC' }}>
      {/* Header */}
      <div
        style={{
          padding: '56px 24px 24px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
            认知英语词典
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1.3, margin: 0 }}>
            用物理意象<br />读懂英语
          </h1>
        </div>
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入英文单词..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 46px',
              borderRadius: '16px',
              border: '1.5px solid transparent',
              background: '#F1F5F9',
              fontSize: '16px',
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#2563EB';
              e.target.style.background = '#fff';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'transparent';
              e.target.style.background = '#F1F5F9';
            }}
          />
        </div>
      </div>

      {/* Search results */}
      {query.trim() && (
        <div style={{ padding: '16px 24px 0' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: '15px' }}>未找到相关单词</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>可在管理后台添加新词汇</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map(word => (
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
                    boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{word.phonetic}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {word.coreMeaning.slice(0, 36)}...
                    </p>
                  </div>
                  <ArrowRight size={16} color="#D1D5DB" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content when not searching */}
      {!query.trim() && (
        <div style={{ padding: '20px 24px 0' }}>
          {/* Today's word */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={14} color="#2563EB" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                今日一词
              </span>
            </div>
            <button
              onClick={() => navigate({ name: 'wordDetail', wordId: todayWord.id })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
                borderRadius: '24px',
                padding: '28px 24px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
                color: '#fff',
              }}
            >
              <p style={{ fontSize: '11px', opacity: 0.7, letterSpacing: '2px', margin: '0 0 8px', textTransform: 'uppercase' }}>
                核心物理意象
              </p>
              <h2 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                {todayWord.word}
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.8, margin: '0 0 16px', fontStyle: 'italic' }}>
                {todayWord.phonetic}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                {todayWord.coreMeaning}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
                <span style={{ fontSize: '13px', opacity: 0.8 }}>查看完整解析</span>
                <ArrowRight size={14} opacity={0.8} />
              </div>
            </button>
          </div>

          {/* All words list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                全部词汇
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{mockWords.length} 个</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mockWords.map(word => {
                const lib = mockLibraries.find(l => l.id === word.libraryId);
                return (
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {word.coreMeaning}
                      </p>
                      {lib && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          fontSize: '11px',
                          color: '#2563EB',
                          background: '#EFF6FF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}>
                          {lib.name}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={15} color="#D1D5DB" style={{ flexShrink: 0, marginLeft: '12px' }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
