import { BookOpenCheck, ChevronRight, Languages } from 'lucide-react';
import type { ViewState } from '../data/types';
export function TrainingView({ navigate }: { navigate: (view: ViewState) => void }) {
  return <main style={{ minHeight:'100vh', padding:'56px 24px 112px', background:'#F7F9FC' }}>
    <p style={{ margin:'0 0 10px', color:'#2563EB', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>语言反应训练</p>
    <h1 style={{ margin:'0 0 10px', fontSize:32, lineHeight:1.2, letterSpacing:'-0.5px', color:'#111827', fontWeight:750 }}>训练</h1>
    <p style={{ margin:'0 0 32px', color:'#6B7280', fontSize:15, lineHeight:1.75 }}>从核心意象出发，在句子里建立英语的直接反应。</p>
    <button onClick={() => navigate({ name:'quiz', direction:'zh2en' })} style={{ width:'100%', textAlign:'left', border:'1px solid #E6EBF2', borderRadius:24, padding:24, background:'#fff', boxShadow:'0 8px 26px rgba(25,49,80,.06)', cursor:'pointer', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}><div style={{ width:46,height:46,borderRadius:16,display:'grid',placeItems:'center',background:'#EFF6FF',color:'#2563EB' }}><Languages size={22}/></div><ChevronRight size={20} color="#2563EB" /></div>
      <h2 style={{ margin:'24px 0 8px', fontSize:20, color:'#111827', fontWeight:700 }}>短句中译英</h2><p style={{ margin:0, color:'#6B7280', fontSize:14, lineHeight:1.65 }}>10 道短句，练习把中文意图直接组织成英语。</p>
    </button>
    <div style={{ position:'relative', opacity:.55, border:'1px solid #E6EBF2', borderRadius:24, padding:24, background:'#fff', boxShadow:'0 8px 26px rgba(25,49,80,.04)' }}>
      <span style={{ position:'absolute',right:20,top:20,padding:'4px 10px',borderRadius:100,background:'#F3F4F6',color:'#9CA3AF',fontSize:11 }}>即将上线</span><div style={{ width:46,height:46,borderRadius:16,display:'grid',placeItems:'center',background:'#F8FAFC',color:'#94A3B8' }}><BookOpenCheck size={22}/></div>
      <h2 style={{ margin:'24px 0 8px',fontSize:20,color:'#111827',fontWeight:700 }}>短句英译中</h2><p style={{ margin:0,color:'#6B7280',fontSize:14,lineHeight:1.65 }}>从英语的原生组织方式理解句子的意义。</p>
    </div>
  </main>;
}
