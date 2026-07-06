import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockLibraries, mockWords } from '../../data/mockData';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';

export default function LibraryWordsPage() {
  const router = useRouter();
  const libraryId = router.params.libraryId as string;

  const library = mockLibraries.find(l => l.id === libraryId);
  const words = mockWords.filter(w => w.libraryId === libraryId);

  const goToWordDetail = (wordId: string) => {
    Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
  };

  return (
    <View style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <PageHeader
        showBack
        backLabel="词库列表"
        title={library?.name}
      >
        <Text style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', marginTop: '4px' }}>
          {words.length} 个单词
        </Text>
      </PageHeader>

      <View style={{ padding: '16px 24px' }}>
        {words.length === 0 ? (
          <View style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <View style={{ opacity: 0.4 }}>
              <Icon name="book" size={32} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: '15px', display: 'block' }}>该词库暂无单词</Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {words.map(word => (
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
                <View>
                  <View style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                    <Text style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>{word.word}</Text>
                    <Text style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</Text>
                  </View>
                  <Text style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5', display: 'block' }}>
                    {word.coreMeaning.slice(0, 40)}...
                  </Text>
                </View>
                <Icon name="chevron-right" size={15} color="#D1D5DB" />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
