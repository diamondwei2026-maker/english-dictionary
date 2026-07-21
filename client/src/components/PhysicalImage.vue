<template>
  <!-- Ported from figma-prototype PhysicalImage.tsx — 8 physics concept SVG illustrations -->
  <!-- H5: inline SVG preserved; Mini Program: PNG fallback via <image> -->
  <view class="physical-image">
    <!-- #ifdef H5 -->
    <view v-if="type === 'flow'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#EFF6FF" />
        <rect x="30" y="46" width="340" height="8" rx="4" fill="#BFDBFE" />
        <rect x="30" y="166" width="340" height="8" rx="4" fill="#BFDBFE" />
        <line x1="50" y1="58" x2="330" y2="58" stroke="#BFDBFE" stroke-width="1.5" stroke-linecap="round" />
        <line x1="50" y1="76" x2="350" y2="76" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />
        <line x1="50" y1="96" x2="366" y2="96" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="50" y1="110" x2="370" y2="110" stroke="#2563EB" stroke-width="3" stroke-linecap="round" />
        <line x1="50" y1="124" x2="366" y2="124" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="50" y1="144" x2="350" y2="144" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />
        <line x1="50" y1="162" x2="330" y2="162" stroke="#BFDBFE" stroke-width="1.5" stroke-linecap="round" />
        <polygon points="370,110 356,104 356,116" fill="#2563EB" />
        <polygon points="356,96 342,90 342,102" fill="#60A5FA" />
        <polygon points="356,124 342,118 342,130" fill="#60A5FA" />
        <polygon points="340,76 326,70 326,82" fill="#93C5FD" />
        <polygon points="340,144 326,138 326,150" fill="#93C5FD" />
        <path d="M 44,58 Q 24,110 44,162" fill="none" stroke="#DBEAFE" stroke-width="1.5" stroke-dasharray="5,3" />
        <text x="30" y="205" font-family="Inter,sans-serif" font-size="11" fill="#93C5FD" letter-spacing="1">流速剖面</text>
        <text x="200" y="205" font-family="Inter,sans-serif" font-size="11" fill="#2563EB" letter-spacing="1" text-anchor="middle">→ 重力方向</text>
      </svg>
    </view>
    <view v-else-if="type === 'grasp'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#F5F3FF" />
        <circle cx="200" cy="110" r="36" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="2" />
        <circle cx="200" cy="110" r="22" fill="#DDD6FE" stroke="#7C3AED" stroke-width="1.5" />
        <line x1="200" y1="36" x2="200" y2="74" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5,4" />
        <polygon points="200,74 194,62 206,62" fill="#7C3AED" />
        <line x1="200" y1="184" x2="200" y2="146" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5,4" />
        <polygon points="200,146 194,158 206,158" fill="#7C3AED" />
        <line x1="108" y1="110" x2="164" y2="110" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5,4" />
        <polygon points="164,110 152,104 152,116" fill="#7C3AED" />
        <line x1="292" y1="110" x2="236" y2="110" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5,4" />
        <polygon points="236,110 248,104 248,116" fill="#7C3AED" />
        <line x1="130" y1="62" x2="171" y2="84" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="5,4" />
        <polygon points="171,84 163,73 174,74" fill="#8B5CF6" />
        <text x="88" y="46" font-family="Inter,sans-serif" font-size="10" fill="#8B5CF6">摩擦力</text>
        <text x="200" y="200" font-family="Inter,sans-serif" font-size="11" fill="#7C3AED" text-anchor="middle" letter-spacing="1">多点包围施压</text>
      </svg>
    </view>
    <view v-else-if="type === 'break'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#FEF2F2" />
        <line x1="200" y1="22" x2="200" y2="62" stroke="#EF4444" stroke-width="2.5" />
        <polygon points="200,66 193,52 207,52" fill="#EF4444" />
        <text x="210" y="42" font-family="Inter,sans-serif" font-size="10" fill="#EF4444">F</text>
        <rect x="30" y="76" width="162" height="56" rx="6" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5" />
        <rect x="208" y="76" width="162" height="56" rx="6" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5" />
        <path d="M 192,66 L 200,82 L 188,99 L 205,116 L 196,136" stroke="#EF4444" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="197" cy="99" r="5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="197" cy="99" r="10" fill="#FCA5A5" opacity="0.2" />
        <line x1="80" y1="145" x2="80" y2="168" stroke="#94A3B8" stroke-width="2" />
        <polygon points="80,172 74,158 86,158" fill="#94A3B8" />
        <line x1="320" y1="145" x2="320" y2="168" stroke="#94A3B8" stroke-width="2" />
        <polygon points="320,172 314,158 326,158" fill="#94A3B8" />
        <line x1="50" y1="175" x2="350" y2="175" stroke="#CBD5E1" stroke-width="2" />
        <text x="200" y="200" font-family="Inter,sans-serif" font-size="11" fill="#EF4444" text-anchor="middle" letter-spacing="1">应力集中 → 永久断裂</text>
      </svg>
    </view>
    <view v-else-if="type === 'bear'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#FFFBEB" />
        <line x1="140" y1="20" x2="140" y2="72" stroke="#D97706" stroke-width="2" />
        <polygon points="140,76 133,62 147,62" fill="#D97706" />
        <line x1="200" y1="20" x2="200" y2="72" stroke="#D97706" stroke-width="2.5" />
        <polygon points="200,76 193,62 207,62" fill="#D97706" />
        <line x1="260" y1="20" x2="260" y2="72" stroke="#D97706" stroke-width="2" />
        <polygon points="260,76 253,62 267,62" fill="#D97706" />
        <text x="272" y="40" font-family="Inter,sans-serif" font-size="10" fill="#D97706">荷载 W</text>
        <rect x="60" y="80" width="280" height="24" rx="5" fill="#FDE68A" stroke="#F59E0B" stroke-width="2" />
        <rect x="96" y="104" width="18" height="58" rx="4" fill="#FCD34D" stroke="#F59E0B" stroke-width="1.5" />
        <rect x="286" y="104" width="18" height="58" rx="4" fill="#FCD34D" stroke="#F59E0B" stroke-width="1.5" />
        <line x1="105" y1="170" x2="105" y2="150" stroke="#059669" stroke-width="2" />
        <polygon points="105,146 99,160 111,160" fill="#059669" />
        <line x1="295" y1="170" x2="295" y2="150" stroke="#059669" stroke-width="2" />
        <polygon points="295,146 289,160 301,160" fill="#059669" />
        <rect x="60" y="172" width="280" height="10" rx="3" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1" />
        <text x="200" y="202" font-family="Inter,sans-serif" font-size="11" fill="#D97706" text-anchor="middle" letter-spacing="1">力传导路径</text>
      </svg>
    </view>
    <view v-else-if="type === 'drive'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#F0FDF4" />
        <line x1="30" y1="168" x2="370" y2="168" stroke="#86EFAC" stroke-width="2" />
        <line x1="36" y1="88" x2="104" y2="88" stroke="#BBF7D0" stroke-width="2" stroke-linecap="round" />
        <line x1="24" y1="108" x2="104" y2="108" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" />
        <line x1="36" y1="128" x2="104" y2="128" stroke="#4ADE80" stroke-width="2" stroke-linecap="round" />
        <line x1="52" y1="72" x2="96" y2="72" stroke="#D1FAE5" stroke-width="1.5" stroke-linecap="round" />
        <line x1="52" y1="144" x2="96" y2="144" stroke="#D1FAE5" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="228" cy="66" r="18" fill="none" stroke="#16A34A" stroke-width="2.5" />
        <line x1="228" y1="84" x2="222" y2="122" stroke="#16A34A" stroke-width="2.5" />
        <line x1="222" y1="102" x2="198" y2="116" stroke="#16A34A" stroke-width="2" />
        <line x1="222" y1="102" x2="252" y2="88" stroke="#16A34A" stroke-width="2" />
        <line x1="222" y1="122" x2="248" y2="148" stroke="#16A34A" stroke-width="2.5" />
        <line x1="248" y1="148" x2="272" y2="140" stroke="#16A34A" stroke-width="2.5" />
        <line x1="222" y1="122" x2="200" y2="148" stroke="#16A34A" stroke-width="2.5" />
        <line x1="200" y1="148" x2="180" y2="160" stroke="#16A34A" stroke-width="2.5" />
        <line x1="276" y1="108" x2="340" y2="108" stroke="#16A34A" stroke-width="2.5" />
        <polygon points="344,108 330,102 330,114" fill="#16A34A" />
        <text x="200" y="202" font-family="Inter,sans-serif" font-size="11" fill="#16A34A" text-anchor="middle" letter-spacing="1">持续施力 → 方向前进</text>
      </svg>
    </view>
    <view v-else-if="type === 'light'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <defs>
          <radialGradient id="lightBg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#FEFCE8" />
            <stop offset="100%" stop-color="#FEF9C3" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FDE047" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#FDE047" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="220" rx="20" fill="url(#lightBg)" />
        <circle cx="200" cy="110" r="50" fill="url(#glowGrad)" />
        <line x1="200" y1="110" x2="200" y2="30" stroke="#EAB308" stroke-width="2.5" opacity="0.9" />
        <line x1="200" y1="110" x2="200" y2="190" stroke="#EAB308" stroke-width="2.5" opacity="0.9" />
        <line x1="200" y1="110" x2="110" y2="110" stroke="#EAB308" stroke-width="2.5" opacity="0.9" />
        <line x1="200" y1="110" x2="290" y2="110" stroke="#EAB308" stroke-width="2.5" opacity="0.9" />
        <line x1="200" y1="110" x2="136" y2="46" stroke="#EAB308" stroke-width="2" opacity="0.7" />
        <line x1="200" y1="110" x2="264" y2="46" stroke="#EAB308" stroke-width="2" opacity="0.7" />
        <line x1="200" y1="110" x2="136" y2="174" stroke="#EAB308" stroke-width="2" opacity="0.7" />
        <line x1="200" y1="110" x2="264" y2="174" stroke="#EAB308" stroke-width="2" opacity="0.7" />
        <line x1="200" y1="110" x2="112" y2="68" stroke="#FDE047" stroke-width="1.5" opacity="0.5" />
        <line x1="200" y1="110" x2="288" y2="68" stroke="#FDE047" stroke-width="1.5" opacity="0.5" />
        <line x1="200" y1="110" x2="112" y2="152" stroke="#FDE047" stroke-width="1.5" opacity="0.5" />
        <line x1="200" y1="110" x2="288" y2="152" stroke="#FDE047" stroke-width="1.5" opacity="0.5" />
        <circle cx="200" cy="110" r="14" fill="#FDE047" />
        <circle cx="200" cy="110" r="8" fill="#FACC15" />
        <text x="200" y="205" font-family="Inter,sans-serif" font-size="11" fill="#CA8A04" text-anchor="middle" letter-spacing="1">光子向四周辐射传播</text>
      </svg>
    </view>
    <view v-else-if="type === 'leverage'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#F8FAFC" />
        <line x1="50" y1="130" x2="350" y2="86" stroke="#475569" stroke-width="6" stroke-linecap="round" />
        <polygon points="200,144 184,176 216,176" fill="#64748B" />
        <line x1="170" y1="176" x2="230" y2="176" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" />
        <rect x="38" y="100" width="28" height="28" rx="4" fill="#334155" opacity="0.8" />
        <line x1="52" y1="100" x2="52" y2="68" stroke="#334155" stroke-width="2" stroke-dasharray="4,3" />
        <polygon points="52,64 46,78 58,78" fill="#334155" />
        <text x="30" y="58" font-family="Inter,sans-serif" font-size="10" fill="#334155">重物 W</text>
        <line x1="330" y1="82" x2="330" y2="50" stroke="#2563EB" stroke-width="2.5" />
        <polygon points="330,46 324,60 336,60" fill="#2563EB" />
        <text x="336" y="44" font-family="Inter,sans-serif" font-size="10" fill="#2563EB">f（小力）</text>
        <line x1="52" y1="185" x2="200" y2="185" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3,2" />
        <text x="120" y="198" font-family="Inter,sans-serif" font-size="10" fill="#94A3B8" text-anchor="middle">短力臂</text>
        <line x1="200" y1="185" x2="340" y2="185" stroke="#2563EB" stroke-width="1" stroke-dasharray="3,2" />
        <text x="270" y="198" font-family="Inter,sans-serif" font-size="10" fill="#2563EB" text-anchor="middle">长力臂</text>
        <text x="200" y="215" font-family="Inter,sans-serif" font-size="11" fill="#475569" text-anchor="middle" letter-spacing="1">f × 长力臂 = W × 短力臂</text>
      </svg>
    </view>
    <view v-else-if="type === 'yield'" class="physical-image__svg">
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#FFF7ED" />
        <line x1="200" y1="20" x2="200" y2="64" stroke="#EA580C" stroke-width="2.5" />
        <polygon points="200,68 193,54 207,54" fill="#EA580C" />
        <text x="210" y="44" font-family="Inter,sans-serif" font-size="10" fill="#EA580C">F（超过极限）</text>
        <rect x="58" y="140" width="16" height="40" rx="3" fill="#D1D5DB" />
        <rect x="326" y="140" width="16" height="40" rx="3" fill="#D1D5DB" />
        <line x1="40" y1="182" x2="360" y2="182" stroke="#D1D5DB" stroke-width="3" />
        <path d="M 66,140 Q 100,140 140,140 Q 200,160 260,140 Q 300,140 334,140" fill="none" stroke="#F97316" stroke-width="5" stroke-linecap="round" />
        <circle cx="200" cy="158" r="12" fill="#FED7AA" stroke="#F97316" stroke-width="1.5" />
        <circle cx="200" cy="158" r="6" fill="#FB923C" />
        <path d="M 120,110 C 140,100 160,100 180,108" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3" />
        <text x="88" y="108" font-family="Inter,sans-serif" font-size="9" fill="#94A3B8">弹性限</text>
        <text x="200" y="202" font-family="Inter,sans-serif" font-size="11" fill="#EA580C" text-anchor="middle" letter-spacing="1">屈服点 → 永久形变</text>
      </svg>
    </view>
    <view v-else class="physical-image__svg">
      <!-- Generic fallback -->
      <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="400" height="220" rx="20" fill="#F8FAFC" />
        <circle cx="200" cy="110" r="60" fill="none" stroke="#E2E8F0" stroke-width="2" />
        <circle cx="200" cy="110" r="40" fill="none" stroke="#CBD5E1" stroke-width="1.5" />
        <circle cx="200" cy="110" r="20" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5" />
        <line x1="200" y1="30" x2="200" y2="190" stroke="#E2E8F0" stroke-width="1" />
        <line x1="120" y1="110" x2="280" y2="110" stroke="#E2E8F0" stroke-width="1" />
        <text x="200" y="200" font-family="Inter,sans-serif" font-size="11" fill="#94A3B8" text-anchor="middle" letter-spacing="1">物理意象</text>
      </svg>
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <image
      class="physical-image__fallback"
      :src="`/static/images/type-${type || 'generic'}.png`"
      mode="aspectFill"
    />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type: string;
}>();
</script>

<style scoped lang="scss">
.physical-image {
  width: 100%;
  border-radius: 32rpx;    /* Phase1(src): PhysicalImage.tsx:274 — 16px → 32rpx */
  overflow: hidden;
  box-shadow: 0 8rpx 48rpx rgba(0, 0, 0, 0.07); /* Phase1(src): WordDetailView.tsx:111 — 0 4px 24px rgba(0,0,0,0.07) → rpx×2 */

  &__svg {
    width: 100%;
    aspect-ratio: 400 / 220;
  }

  &__fallback {
    width: 100%;
    aspect-ratio: 400 / 220;
  }
}
</style>
