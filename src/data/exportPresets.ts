export type ExportPresetId = 'transparent-png' | 'small-web-jpeg' | 'high-quality-png' | 'square-avatar' | 'sticker' | 'social-image';

export interface ExportPreset {
  id: ExportPresetId;
  label: string;
  description: string;
  format: 'png' | 'jpeg' | 'webp';
  background: 'transparent' | 'solid';
  quality?: number;
  width?: number;
  height?: number;
  keywords: string[];
}

export const exportPresets: ExportPreset[] = [
  {
    id: 'transparent-png',
    label: 'Transparent PNG',
    description: 'For logos, cutouts, and images that need no background.',
    format: 'png',
    background: 'transparent',
    keywords: ['transparent', 'png', 'logo', 'cutout']
  },
  {
    id: 'small-web-jpeg',
    label: 'Small web JPEG',
    description: 'For upload limits when transparency is not needed.',
    format: 'jpeg',
    background: 'solid',
    quality: 82,
    keywords: ['small', 'web', 'jpeg', 'jpg', 'upload']
  },
  {
    id: 'high-quality-png',
    label: 'High-quality PNG',
    description: 'For crisp graphics or screenshots.',
    format: 'png',
    background: 'solid',
    keywords: ['high quality', 'png', 'screenshot']
  },
  {
    id: 'square-avatar',
    label: 'Square avatar',
    description: 'For profile pictures.',
    format: 'png',
    background: 'solid',
    width: 1024,
    height: 1024,
    keywords: ['avatar', 'profile', 'square']
  },
  {
    id: 'sticker',
    label: 'Sticker',
    description: 'Transparent PNG for cutout stickers.',
    format: 'png',
    background: 'transparent',
    keywords: ['sticker', 'transparent', 'cutout']
  },
  {
    id: 'social-image',
    label: 'Social image',
    description: 'Share-friendly export for captioned images.',
    format: 'jpeg',
    background: 'solid',
    quality: 90,
    keywords: ['social', 'share', 'caption']
  }
];
