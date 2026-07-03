interface PhysicalImageProps {
  type: string;
  className?: string;
}

function FlowImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#EFF6FF" />
      {/* Channel walls */}
      <rect x="30" y="46" width="340" height="8" rx="4" fill="#BFDBFE" />
      <rect x="30" y="166" width="340" height="8" rx="4" fill="#BFDBFE" />
      {/* Streamlines - velocity profile, fastest in center */}
      <line x1="50" y1="58" x2="330" y2="58" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="76" x2="350" y2="76" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="96" x2="366" y2="96" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="110" x2="370" y2="110" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="124" x2="366" y2="124" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="144" x2="350" y2="144" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="162" x2="330" y2="162" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
      {/* Arrow heads */}
      <polygon points="370,110 356,104 356,116" fill="#2563EB" />
      <polygon points="356,96 342,90 342,102" fill="#60A5FA" />
      <polygon points="356,124 342,118 342,130" fill="#60A5FA" />
      <polygon points="340,76 326,70 326,82" fill="#93C5FD" />
      <polygon points="340,144 326,138 326,150" fill="#93C5FD" />
      {/* Velocity profile curve on left */}
      <path d="M 44,58 Q 24,110 44,162" fill="none" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="5,3" />
      {/* Label */}
      <text x="30" y="205" fontFamily="Inter, system-ui" fontSize="11" fill="#93C5FD" letterSpacing="1">流速剖面</text>
      <text x="200" y="205" fontFamily="Inter, system-ui" fontSize="11" fill="#2563EB" letterSpacing="1" textAnchor="middle">→ 重力方向</text>
    </svg>
  );
}

function GraspImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#F5F3FF" />
      {/* Central object being grasped */}
      <circle cx="200" cy="110" r="36" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="200" cy="110" r="22" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1.5" />
      {/* Force vectors (fingers) converging from 5 directions */}
      {/* Top */}
      <line x1="200" y1="36" x2="200" y2="74" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5,4" />
      <polygon points="200,74 194,62 206,62" fill="#7C3AED" />
      {/* Bottom */}
      <line x1="200" y1="184" x2="200" y2="146" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5,4" />
      <polygon points="200,146 194,158 206,158" fill="#7C3AED" />
      {/* Left */}
      <line x1="108" y1="110" x2="164" y2="110" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5,4" />
      <polygon points="164,110 152,104 152,116" fill="#7C3AED" />
      {/* Right */}
      <line x1="292" y1="110" x2="236" y2="110" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5,4" />
      <polygon points="236,110 248,104 248,116" fill="#7C3AED" />
      {/* Upper left */}
      <line x1="130" y1="62" x2="171" y2="84" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5,4" />
      <polygon points="171,84 163,73 174,74" fill="#8B5CF6" />
      {/* Force label */}
      <text x="88" y="46" fontFamily="Inter, system-ui" fontSize="10" fill="#8B5CF6" letterSpacing="0.5">摩擦力</text>
      <text x="200" y="200" fontFamily="Inter, system-ui" fontSize="11" fill="#7C3AED" textAnchor="middle" letterSpacing="1">多点包围施压</text>
    </svg>
  );
}

function BreakImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#FEF2F2" />
      {/* Load arrow from top */}
      <line x1="200" y1="22" x2="200" y2="62" stroke="#EF4444" strokeWidth="2.5" />
      <polygon points="200,66 193,52 207,52" fill="#EF4444" />
      <text x="210" y="42" fontFamily="Inter, system-ui" fontSize="10" fill="#EF4444">F</text>
      {/* Left block */}
      <rect x="30" y="76" width="162" height="56" rx="6" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Right block (slightly separated) */}
      <rect x="208" y="76" width="162" height="56" rx="6" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Fracture line */}
      <path d="M 192,66 L 200,82 L 188,99 L 205,116 L 196,136" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Stress concentration */}
      <circle cx="197" cy="99" r="5" fill="#FCA5A5" opacity="0.6" />
      <circle cx="197" cy="99" r="10" fill="#FCA5A5" opacity="0.2" />
      {/* Support arrows */}
      <line x1="80" y1="145" x2="80" y2="168" stroke="#94A3B8" strokeWidth="2" />
      <polygon points="80,172 74,158 86,158" fill="#94A3B8" />
      <line x1="320" y1="145" x2="320" y2="168" stroke="#94A3B8" strokeWidth="2" />
      <polygon points="320,172 314,158 326,158" fill="#94A3B8" />
      <line x1="50" y1="175" x2="350" y2="175" stroke="#CBD5E1" strokeWidth="2" />
      <text x="200" y="200" fontFamily="Inter, system-ui" fontSize="11" fill="#EF4444" textAnchor="middle" letterSpacing="1">应力集中 → 永久断裂</text>
    </svg>
  );
}

function BearImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#FFFBEB" />
      {/* Load arrows from above */}
      <line x1="140" y1="20" x2="140" y2="72" stroke="#D97706" strokeWidth="2" />
      <polygon points="140,76 133,62 147,62" fill="#D97706" />
      <line x1="200" y1="20" x2="200" y2="72" stroke="#D97706" strokeWidth="2.5" />
      <polygon points="200,76 193,62 207,62" fill="#D97706" />
      <line x1="260" y1="20" x2="260" y2="72" stroke="#D97706" strokeWidth="2" />
      <polygon points="260,76 253,62 267,62" fill="#D97706" />
      <text x="272" y="40" fontFamily="Inter, system-ui" fontSize="10" fill="#D97706">荷载 W</text>
      {/* Main platform/beam */}
      <rect x="60" y="80" width="280" height="24" rx="5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
      {/* Support columns */}
      <rect x="96" y="104" width="18" height="58" rx="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
      <rect x="286" y="104" width="18" height="58" rx="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
      {/* Reaction arrows upward */}
      <line x1="105" y1="170" x2="105" y2="150" stroke="#059669" strokeWidth="2" />
      <polygon points="105,146 99,160 111,160" fill="#059669" />
      <line x1="295" y1="170" x2="295" y2="150" stroke="#059669" strokeWidth="2" />
      <polygon points="295,146 289,160 301,160" fill="#059669" />
      {/* Ground */}
      <rect x="60" y="172" width="280" height="10" rx="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      <text x="200" y="202" fontFamily="Inter, system-ui" fontSize="11" fill="#D97706" textAnchor="middle" letterSpacing="1">力传导路径</text>
    </svg>
  );
}

function DriveImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#F0FDF4" />
      {/* Ground line */}
      <line x1="30" y1="168" x2="370" y2="168" stroke="#86EFAC" strokeWidth="2" />
      {/* Speed/motion lines */}
      <line x1="36" y1="88" x2="104" y2="88" stroke="#BBF7D0" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="108" x2="104" y2="108" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="128" x2="104" y2="128" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="72" x2="96" y2="72" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="144" x2="96" y2="144" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stick figure runner */}
      <circle cx="228" cy="66" r="18" fill="none" stroke="#16A34A" strokeWidth="2.5" />
      {/* Body */}
      <line x1="228" y1="84" x2="222" y2="122" stroke="#16A34A" strokeWidth="2.5" />
      {/* Arms */}
      <line x1="222" y1="102" x2="198" y2="116" stroke="#16A34A" strokeWidth="2" />
      <line x1="222" y1="102" x2="252" y2="88" stroke="#16A34A" strokeWidth="2" />
      {/* Legs running pose */}
      <line x1="222" y1="122" x2="248" y2="148" stroke="#16A34A" strokeWidth="2.5" />
      <line x1="248" y1="148" x2="272" y2="140" stroke="#16A34A" strokeWidth="2.5" />
      <line x1="222" y1="122" x2="200" y2="148" stroke="#16A34A" strokeWidth="2.5" />
      <line x1="200" y1="148" x2="180" y2="160" stroke="#16A34A" strokeWidth="2.5" />
      {/* Force arrow */}
      <line x1="276" y1="108" x2="340" y2="108" stroke="#16A34A" strokeWidth="2.5" />
      <polygon points="344,108 330,102 330,114" fill="#16A34A" />
      <text x="200" y="202" fontFamily="Inter, system-ui" fontSize="11" fill="#16A34A" textAnchor="middle" letterSpacing="1">持续施力 → 方向前进</text>
    </svg>
  );
}

function LightImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="lightBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FEFCE8" />
          <stop offset="100%" stopColor="#FEF9C3" />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" rx="20" fill="url(#lightBg)" />
      {/* Glow halo */}
      <circle cx="200" cy="110" r="50" fill="url(#glowGrad)" />
      {/* Main rays - 8 directions */}
      <line x1="200" y1="110" x2="200" y2="30" stroke="#EAB308" strokeWidth="2.5" opacity="0.9" />
      <line x1="200" y1="110" x2="200" y2="190" stroke="#EAB308" strokeWidth="2.5" opacity="0.9" />
      <line x1="200" y1="110" x2="110" y2="110" stroke="#EAB308" strokeWidth="2.5" opacity="0.9" />
      <line x1="200" y1="110" x2="290" y2="110" stroke="#EAB308" strokeWidth="2.5" opacity="0.9" />
      <line x1="200" y1="110" x2="136" y2="46" stroke="#EAB308" strokeWidth="2" opacity="0.7" />
      <line x1="200" y1="110" x2="264" y2="46" stroke="#EAB308" strokeWidth="2" opacity="0.7" />
      <line x1="200" y1="110" x2="136" y2="174" stroke="#EAB308" strokeWidth="2" opacity="0.7" />
      <line x1="200" y1="110" x2="264" y2="174" stroke="#EAB308" strokeWidth="2" opacity="0.7" />
      {/* Secondary rays */}
      <line x1="200" y1="110" x2="112" y2="68" stroke="#FDE047" strokeWidth="1.5" opacity="0.5" />
      <line x1="200" y1="110" x2="288" y2="68" stroke="#FDE047" strokeWidth="1.5" opacity="0.5" />
      <line x1="200" y1="110" x2="112" y2="152" stroke="#FDE047" strokeWidth="1.5" opacity="0.5" />
      <line x1="200" y1="110" x2="288" y2="152" stroke="#FDE047" strokeWidth="1.5" opacity="0.5" />
      {/* Light source point */}
      <circle cx="200" cy="110" r="14" fill="#FDE047" />
      <circle cx="200" cy="110" r="8" fill="#FACC15" />
      <text x="200" y="205" fontFamily="Inter, system-ui" fontSize="11" fill="#CA8A04" textAnchor="middle" letterSpacing="1">光子向四周辐射传播</text>
    </svg>
  );
}

function LeverageImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#F8FAFC" />
      {/* Lever bar */}
      <line x1="50" y1="130" x2="350" y2="86" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      {/* Fulcrum (triangle support) */}
      <polygon points="200,144 184,176 216,176" fill="#64748B" />
      <line x1="170" y1="176" x2="230" y2="176" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      {/* Load (left side - heavy) */}
      <rect x="38" y="100" width="28" height="28" rx="4" fill="#334155" opacity="0.8" />
      <line x1="52" y1="100" x2="52" y2="68" stroke="#334155" strokeWidth="2" strokeDasharray="4,3" />
      <polygon points="52,64 46,78 58,78" fill="#334155" />
      <text x="30" y="58" fontFamily="Inter, system-ui" fontSize="10" fill="#334155">重物 W</text>
      {/* Effort (right side - small force) */}
      <line x1="330" y1="82" x2="330" y2="50" stroke="#2563EB" strokeWidth="2.5" />
      <polygon points="330,46 324,60 336,60" fill="#2563EB" />
      <text x="336" y="44" fontFamily="Inter, system-ui" fontSize="10" fill="#2563EB">f（小力）</text>
      {/* Arm length labels */}
      <line x1="52" y1="185" x2="200" y2="185" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2" />
      <text x="120" y="198" fontFamily="Inter, system-ui" fontSize="10" fill="#94A3B8" textAnchor="middle">短力臂</text>
      <line x1="200" y1="185" x2="340" y2="185" stroke="#2563EB" strokeWidth="1" strokeDasharray="3,2" />
      <text x="270" y="198" fontFamily="Inter, system-ui" fontSize="10" fill="#2563EB" textAnchor="middle">长力臂</text>
      <text x="200" y="215" fontFamily="Inter, system-ui" fontSize="11" fill="#475569" textAnchor="middle" letterSpacing="1">f × 长力臂 = W × 短力臂</text>
    </svg>
  );
}

function YieldImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#FFF7ED" />
      {/* Load arrow */}
      <line x1="200" y1="20" x2="200" y2="64" stroke="#EA580C" strokeWidth="2.5" />
      <polygon points="200,68 193,54 207,54" fill="#EA580C" />
      <text x="210" y="44" fontFamily="Inter, system-ui" fontSize="10" fill="#EA580C">F（超过极限）</text>
      {/* Supports */}
      <rect x="58" y="140" width="16" height="40" rx="3" fill="#D1D5DB" />
      <rect x="326" y="140" width="16" height="40" rx="3" fill="#D1D5DB" />
      <line x1="40" y1="182" x2="360" y2="182" stroke="#D1D5DB" strokeWidth="3" />
      {/* Bent/yielded beam */}
      <path d="M 66,140 Q 100,140 140,140 Q 200,160 260,140 Q 300,140 334,140" fill="none" stroke="#F97316" strokeWidth="5" strokeLinecap="round" />
      {/* Yield zone indicator */}
      <circle cx="200" cy="158" r="12" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
      <circle cx="200" cy="158" r="6" fill="#FB923C" />
      {/* Arrows showing elastic vs plastic */}
      <path d="M 120,110 C 140,100 160,100 180,108" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="88" y="108" fontFamily="Inter, system-ui" fontSize="9" fill="#94A3B8">弹性限</text>
      <text x="200" y="202" fontFamily="Inter, system-ui" fontSize="11" fill="#EA580C" textAnchor="middle" letterSpacing="1">屈服点 → 永久形变</text>
    </svg>
  );
}

function GenericImage() {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="220" rx="20" fill="#F8FAFC" />
      <circle cx="200" cy="110" r="60" fill="none" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="200" cy="110" r="40" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
      <circle cx="200" cy="110" r="20" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
      <line x1="200" y1="30" x2="200" y2="190" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="120" y1="110" x2="280" y2="110" stroke="#E2E8F0" strokeWidth="1" />
      <text x="200" y="200" fontFamily="Inter, system-ui" fontSize="11" fill="#94A3B8" textAnchor="middle" letterSpacing="1">物理意象</text>
    </svg>
  );
}

const imageMap: Record<string, React.ReactNode> = {
  flow: <FlowImage />,
  grasp: <GraspImage />,
  break: <BreakImage />,
  bear: <BearImage />,
  drive: <DriveImage />,
  light: <LightImage />,
  leverage: <LeverageImage />,
  yield: <YieldImage />,
};

export function PhysicalImage({ type, className }: PhysicalImageProps) {
  const image = imageMap[type] || <GenericImage />;
  return (
    <div className={className} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden' }}>
      {image}
    </div>
  );
}
