import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockLibraries, mockWords } from '../../data/mockData';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { CustomTabBar } from '../../components/CustomTabBar';

export default function LibrariesPage() {
  const libraryColors = [
    { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', accent: '#2563EB', border: '#BFDBFE' },
    { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', accent: '#16A34A', border: '#BBF7D0' },
    { bg: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', accent: '#D97706', border: '#FDE68A' },
    { bg: 'linear-gradient(135deg, #FAF5FF, #EDE9FE)', accent: '#7C3AED', border: '#DDD6FE' },
  ];

  const goToLibraryWords = (libraryId: string) => {
    Taro.navigateTo({ url: `/pages/library-words/index?libraryId=${libraryId}` });
  };

  return (
    <View style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <PageHeader subtitle="词库" title="选择词库" />

      <View style={{ padding: '20px 24px' }}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mockLibraries.map((lib, index) => {
            const color = libraryColors[index % libraryColors.length];
            const wordsInLib = mockWords.filter(w => w.libraryId === lib.id);

            return (
              <View
                key={lib.id}
                onClick={() => goToLibraryWords(lib.id)}
                style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                }}
              >
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <View style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="book" size={18} color={color.accent} />
                      </View>
                      <Text style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>
                        {lib.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', display: 'block', marginBottom: '16px' }}>
                      {lib.description}
                    </Text>
                    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ display: 'flex', gap: '16px' }}>
                        <Text style={{ fontSize: '12px', color: color.accent, fontWeight: '600' }}>
                          {lib.wordCount} 个单词
                        </Text>
                        {wordsInLib.length > 0 && (
                          <Text style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            已收录 {wordsInLib.length} 个
                          </Text>
                        )}
                      </View>
                      <Icon name="chevron-right" size={16} color={color.accent} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <CustomTabBar activeTab="libraries" />
    </View>
  );
}
