/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon } from 'lucide-react';

export interface BackgroundTemplate {
  id: string;
  name: string;
  url: string;
  thumb: string;
}

const TEMPLATES: BackgroundTemplate[] = [
  {
    id: 'studio-gray',
    name: 'Studio Gray',
    url: 'https://images.unsplash.com/photo-1519608487946-4074218eb000?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1519608487946-4074218eb000?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'gradient-warm',
    name: 'Warm Gradient',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'abstract-liquid',
    name: 'Abstract Liquid',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'nature-mountains',
    name: 'Mountains',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'city-night',
    name: 'City Night',
    url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'beach-sunset',
    name: 'Beach Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'minimal-room',
    name: 'Minimal Room',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'wall-texture',
    name: 'Brick Wall',
    url: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'gradient-cool',
    name: 'Cool Gradient',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'tropical-leaves',
    name: 'Tropical Leaves',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'wooden-table',
    name: 'Wooden Surface',
    url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&auto=format&fit=crop&q=60'
  }
];

interface BackgroundTemplatesProps {
  onClose: () => void;
  onSelectTemplate: (template: BackgroundTemplate) => void;
}

export default function BackgroundTemplates({ onClose, onSelectTemplate }: BackgroundTemplatesProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" id="bg-templates-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-950 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-zinc-800 flex flex-col"
          id="bg-templates-card"
          style={{ maxHeight: '80vh' }}
        >
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-black/50" id="bg-templates-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <ImageIcon className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Background Templates</h2>
                <p className="text-xs text-zinc-400">Choose a preset background to add behind your subject.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition p-2 hover:bg-zinc-800 rounded-full"
              id="bg-templates-close-btn"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="bg-templates-grid">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-white"
              >
                <img 
                  src={template.thumb} 
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold text-white truncate drop-shadow-md">
                    {template.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
