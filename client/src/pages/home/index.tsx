import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockWords, mockLibraries } from '../../data/mockData';
import { Icon } from '../../components/Icon';
import { CustomTabBar } from '../../components/CustomTabBar';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const results = query.trim()
    ? mockWords.filter(w =>
        w.word.toLowerCase().includes(query.toLowerCase()) ||
        w.coreMeaning.includes(query)
      )
    : [];

  const todayWord = mockWords[Math.floor(Date.now() / 86400000) % mockWords.length];

  const goToWordDetail = (wordId: string) => {
    Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
  };

  return (
    <View style={{ padding: '0 0 24px', minHeight: '100vh', background: '#F7F9FC' }}>
      {/* Header — 毛玻璃降级 */}
      <View
        style={{
          padding: '56px 24px 24px',
          background: 'rgba(255,255,255,0.93)',
          borderBottom: '0.5px solid rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ marginBottom: '20px' }}>
          <Text style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            认知英语词典
          </Text>
          <Text style={{ fontSize: '26px', fontWeight: '700', color: '#111827', lineHeight: '1.3', display: 'block' }}>
            用物理意象
          </Text>
          <Text style={{ fontSize: '26px', fontWeight: '700', color: '#111827', lineHeight: '1.3', display: 'block' }}>
            读懂英语
          </Text>
        </View>
        {/* Search bar */}
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Icon name="search" size={18} color="#9CA3AF" />
          </View>
          <Input
            value={query}
            onInput={e => setQuery(e.detail.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder='输入英文单词...'
            style={{
              width: '100%',
              padding: '14px 16px 14px 46px',
              borderRadius: '16px',
              border: searchFocused ? '1.5px solid #2563EB' : '1.5px solid transparent',
              background: searchFocused ? '#fff' : '#F1F5F9',
              fontSize: '16px',
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </View>
      </View>

      {/* Search results */}
      {query.trim() ? (
        <View style={{ padding: '16px 24px 0' }}>
          {results.length === 0 ? (
            <View style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
              <Text style={{ fontSize: '15px', display: 'block' }}>未找到相关单词</Text>
              <Text style={{ fontSize: '13px', marginTop: '6px', display: 'block' }}>可在管理后台添加新词汇</Text>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map(word => (
                <View
                  key={word.id}
                  onClick={() => goToWordDetail(word.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                  }}
                >
                  <View>
                    <View style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <Text style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{word.word}</Text>
                      <Text style={{ fontSize: '13px', color: '#9CA3AF' }}>{word.phonetic}</Text>
                    </View>
                    <Text style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', lineHeight: '1.5', display: 'block' }}>
                      {word.coreMeaning.slice(0, 36)}...
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#D1D5DB" />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        /* Content when not searching */
        <View style={{ padding: '20px 24px 0' }}>
          {/* Today's word */}
          <View style={{ marginBottom: '24px' }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icon name="sparkles" size={14} color="#2563EB" />
              <Text style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                今日一词
              </Text>
            </View>
            <View
              onClick={() => goToWordDetail(todayWord.id)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
                borderRadius: '24px',
                padding: '28px 24px',
                boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
              }}
            >
              <Text style={{ fontSize: '11px', opacity: '0.7', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', display: 'block', marginBottom: '8px' }}>
                核心物理意象
              </Text>
              <Text style={{ fontSize: '34px', fontWeight: '800', color: '#fff', display: 'block', marginBottom: '6px', letterSpacing: '-0.5px' }}>
                {todayWord.word}
              </Text>
              <Text style={{ fontSize: '14px', opacity: '0.8', color: '#fff', display: 'block', marginBottom: '16px', fontStyle: 'italic' }}>
                {todayWord.phonetic}
              </Text>
              <Text style={{ fontSize: '14px', opacity: '0.9', lineHeight: '1.6', color: '#fff', display: 'block' }}>
                {todayWord.coreMeaning}
              </Text>
              <View style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
                <Text style={{ fontSize: '13px', opacity: '0.8', color: '#fff' }}>查看完整解析</Text>
                <Icon name="chevron-right" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </View>

          {/* All words list */}
          <View>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                全部词汇
              </Text>
              <Text style={{ fontSize: '13px', color: '#9CA3AF' }}>{mockWords.length} 个</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mockWords.map(word => {
                const lib = mockLibraries.find(l => l.id === word.libraryId);
                return (
                  <View
                    key={word.id}
                    onClick={() => goToWordDetail(word.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: '#fff',
                      borderRadius: '16px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                  >
                    <View style={{ flex: 1, minWidth: '0' }}>
                      <View style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                        <Text style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>{word.word}</Text>
                        <Text style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</Text>
                      </View>
                      <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {word.coreMeaning}
                      </Text>
                      {lib && (
                        <Text style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          fontSize: '11px',
                          color: '#2563EB',
                          background: '#EFF6FF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}>
                          {lib.name}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexShrink: 0, marginLeft: 12 }}>
                      <Icon name="chevron-right" size={15} color="#D1D5DB" />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      <CustomTabBar activeTab="home" />
    </View>
  );
}
