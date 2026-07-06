import { View } from '@tarojs/components';

// @taroify/icons imports — Taro 兼容的 SVG 图标组件
import SearchIcon from '@taroify/icons/Search';
import BookmarkOutlinedIcon from '@taroify/icons/BookmarkOutlined';
import UserOutlinedIcon from '@taroify/icons/UserOutlined';
import ArrowLeftIcon from '@taroify/icons/ArrowLeft';
import ArrowIcon from '@taroify/icons/Arrow';
import EyeOutlinedIcon from '@taroify/icons/EyeOutlined';
import ClosedEyeIcon from '@taroify/icons/ClosedEye';
import PlusIcon from '@taroify/icons/Plus';
import DeleteOutlinedIcon from '@taroify/icons/DeleteOutlined';
import CloseIcon from '@taroify/icons/Close';
import CheckedIcon from '@taroify/icons/Checked';
import SettingOutlinedIcon from '@taroify/icons/SettingOutlined';
import ShieldOutlinedIcon from '@taroify/icons/ShieldOutlined';
import ReplayIcon from '@taroify/icons/Replay';
import StarOutlinedIcon from '@taroify/icons/StarOutlined';
import AimIcon from '@taroify/icons/Aim';
import FireOutlinedIcon from '@taroify/icons/FireOutlined';
import FontOutlinedIcon from '@taroify/icons/FontOutlined';
import FriendsOutlinedIcon from '@taroify/icons/FriendsOutlined';

export type IconName =
  | 'search'
  | 'book'
  | 'user'
  | 'arrow-left'
  | 'chevron-right'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'trash'
  | 'close'
  | 'check'
  | 'settings'
  | 'shield'
  | 'refresh'
  | 'sparkles'
  | 'target'
  | 'logout'
  | 'fire'
  | 'font'
  | 'friends';

interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
}

/** Taro 兼容的图标组件 — 替换全部 emoji */
export function Icon({ name, size = '1em', color }: IconProps) {
  const props = { size, color };

  switch (name) {
    case 'search':
      return <SearchIcon {...props} />;
    case 'book':
      return <BookmarkOutlinedIcon {...props} />;
    case 'user':
      return <UserOutlinedIcon {...props} />;
    case 'arrow-left':
      return <ArrowLeftIcon {...props} />;
    case 'chevron-right':
      return <ArrowIcon {...props} />;
    case 'eye':
      return <EyeOutlinedIcon {...props} />;
    case 'eye-off':
      return <ClosedEyeIcon {...props} />;
    case 'plus':
      return <PlusIcon {...props} />;
    case 'trash':
      return <DeleteOutlinedIcon {...props} />;
    case 'close':
      return <CloseIcon {...props} />;
    case 'check':
      return <CheckedIcon {...props} />;
    case 'settings':
      return <SettingOutlinedIcon {...props} />;
    case 'shield':
      return <ShieldOutlinedIcon {...props} />;
    case 'refresh':
      return <ReplayIcon {...props} />;
    case 'sparkles':
      return <StarOutlinedIcon {...props} />;
    case 'target':
      return <AimIcon {...props} />;
    case 'fire':
      return <FireOutlinedIcon {...props} />;
    case 'font':
      return <FontOutlinedIcon {...props} />;
    case 'friends':
      return <FriendsOutlinedIcon {...props} />;
    case 'logout':
      // @taroify/icons 无 LogOut 图标，使用内联 SVG
      return (
        <View style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
          <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' width={size} height={size}>
            <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' stroke={color || 'currentColor'} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            <polyline points='16 17 21 12 16 7' stroke={color || 'currentColor'} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            <line x1='21' y1='12' x2='9' y2='12' stroke={color || 'currentColor'} strokeWidth='2' strokeLinecap='round' />
          </svg>
        </View>
      );
    default:
      return null;
  }
}
