# 迁移：React (Vite/CRA) → Next.js (App Router)

## 目标项目结构

```
<project-name>/
├── src/
│   └── app/
│       ├── layout.tsx           # 根布局（包裹所有页面）
│       ├── page.tsx             # 首页 (/)
│       ├── globals.css           # 全局样式
│       ├── word-detail/
│       │   └── [id]/
│       │       └── page.tsx     # /word-detail/:id
│       ├── libraries/
│       │   └── page.tsx         # /libraries
│       ├── profile/
│       │   └── page.tsx         # /profile
│       ├── login/
│       │   └── page.tsx         # /login
│       ├── admin/
│       │   └── page.tsx         # /admin
│       └── api/                 # API 路由（按需）
├── components/                   # 共享组件
├── data/                         # 类型、模拟数据
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 核心映射规则

### 路由：useState 视图状态 → 文件系统路由

这是最重大的变化。源项目的手动路由方式：

```tsx
// ❌ Source
const [view, setView] = useState<ViewState>({name:'home'});
{view.name === 'home' && <HomeView navigate={setView} />}
```

必须改为：

```tsx
// ✅ Target — each view becomes a page under src/app/
// Navigation via:
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push(`/word-detail/${wordId}`);      // 导航
router.push('/libraries');                   // 导航
router.back();                               // 返回
```

### 页面参数：props → useParams / searchParams

```tsx
// Source
function WordDetailView({ wordId, navigate }: Props) { ... }

// Target: src/app/word-detail/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';

export default function WordDetailPage() {
  const params = useParams();
  const wordId = params.id as string;
  // ... rest of component
}
```

### 客户端组件 vs 服务端组件

```
页面组件（交互式）     → 'use client'
数据展示组件（静态）   → 服务端组件（默认，无需 'use client'）
共享交互组件           → 'use client'
```

一条好的经验法则：如果组件包含 `useState`、`useEffect`、`onClick` 或任何事件处理函数，则必须在顶部添加 `'use client'`。

### 布局：App.tsx 包装器 → layout.tsx

```tsx
// Source: App.tsx wraps everything with a container + BottomNav
<div style={{maxWidth:430, margin:'0 auto', minHeight:'100vh'}}>
  {view.name !== 'admin' && <BottomNav />}
</div>

// Target: src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}

// BottomNav 放在需要它的每个页面内部，或放在嵌套布局中
```

### 浏览器 API：使用 typeof 检查进行防护

```tsx
// Source: 直接使用
const todayWord = mockWords[Math.floor(Date.now() / 86400000) % mockWords.length];

// Target: 必须同时能在服务端和客户端运行
import { useState, useEffect } from 'react';
const [todayWord, setTodayWord] = useState(mockWords[0]);
useEffect(() => {
  setTodayWord(mockWords[Math.floor(Date.now() / 86400000) % mockWords.length]);
}, []);
```

### 样式：内联样式 → Tailwind（Next.js 默认）或 CSS Modules

Next.js 两者都支持。如果源项目使用 Tailwind，保留即可。如果是内联样式，转换为 Tailwind 类名或 CSS Modules。

### 图片：`<img>` → `next/image`

```tsx
// Source
<img src="/hero.png" alt="..." />

// Target
import Image from 'next/image';
<Image src="/hero.png" alt="..." width={400} height={220} />
```

---

## 快速检查清单

- [ ] 手动 useState 路由 → 文件系统路由页面
- [ ] `navigate()` → `router.push()` / `router.back()`
- [ ] 基于 props 的参数 → `useParams()` / `useSearchParams()`
- [ ] 交互式组件 → `'use client'`
- [ ] `Date.now()` / `Math.random()` → 防护或放入 useEffect
- [ ] `window` / `document` 访问 → `typeof window !== 'undefined'`
- [ ] `<img>` → `<Image>`（可选但推荐）
- [ ] 全局布局（App 包装器）→ `layout.tsx`
- [ ] BottomNav → 布局或页面级组件
