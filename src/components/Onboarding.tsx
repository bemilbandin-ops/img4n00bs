/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, Paintbrush, ArrowRight, Check, X, Image as ImageIcon } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
  onSelectSample: (type: 'cat' | 'scenic' | 'blank') => void;
}

export default function Onboarding({ onClose, onSelectSample }: OnboardingProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Start with what you want to do",
      icon: <Sparkles className="w-12 h-12 text-white" id="onb-sparkles-icon" />,
      desc: "The editor is grouped by jobs: clean up a photo, add things, cut something out, move parts around, or save the result.",
      color: "from-zinc-900 to-black"
    },
    {
      title: "Each tool says when to use it",
      icon: <Layers className="w-12 h-12 text-white" id="onb-layers-icon" />,
      desc: "Heal blends away spots, Clone covers with nearby pixels, Lasso traces odd shapes, and Pick Color reuses a color from the image.",
      color: "from-zinc-905 to-black"
    },
    {
      title: "Parts stay editable",
      icon: <Paintbrush className="w-12 h-12 text-white" id="onb-paint-icon" />,
      desc: "Photos, drawings, text, and shapes are separate parts. Pick the part you want, then the right panel shows what you can do next.",
      color: "from-zinc-910 to-black"
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="onboarding-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-black rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-zinc-900 flex flex-col"
        id="onboarding-card"
      >
        {/* Step Indicator Top Bar */}
        <div className="px-8 pt-8 flex items-center justify-between" id="onboarding-header">
          <div className="flex gap-1.5" id="onboarding-dots">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`}
              />
            ))}
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition p-1.5 hover:bg-zinc-900 rounded-full"
            id="onboarding-close-btn"
            title="Skip Intro"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6 flex-1 flex flex-col items-center text-center" id="onboarding-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl mb-5 shadow-inner">
                {currentStep.icon}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight font-sans mb-3">
                {currentStep.title}
              </h2>
              <p className="text-zinc-400 text-[15px] leading-relaxed max-w-md font-sans">
                {currentStep.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-8 pb-8 pt-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between" id="onboarding-footer">
          {step < 3 ? (
            <>
              <button
                onClick={onClose}
                className="text-sm font-medium text-zinc-500 hover:text-white transition py-2 px-4 rounded-xl hover:bg-zinc-900"
                id="onboarding-skip-btn"
              >
                Skip intro
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-white text-black py-2.5 px-5 rounded-2xl hover:bg-zinc-200 transition shadow-sm"
                id="onboarding-next-btn"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col gap-4" id="onboarding-final-action">
              <div className="text-center text-xs font-medium text-zinc-500 uppercase tracking-widest font-sans">
                Pick a starting image
              </div>
              <div className="grid grid-cols-3 gap-2" id="onboarding-start-options">
                <button
                  onClick={() => onSelectSample('cat')}
                  className="flex flex-col items-center gap-2 p-3 bg-black border border-zinc-900 text-white rounded-2xl hover:border-white transition cursor-pointer"
                  id="sample-cat-btn"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80" 
                    alt="Cute Cat" 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-xl shadow-sm"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Cute Cat</span>
                </button>
                <button
                  onClick={() => onSelectSample('scenic')}
                  className="flex flex-col items-center gap-2 p-3 bg-black border border-zinc-900 text-white rounded-2xl hover:border-white transition cursor-pointer"
                  id="sample-scenic-btn"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&auto=format&fit=crop&q=80" 
                    alt="Landscape" 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-xl shadow-sm"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Mountain</span>
                </button>
                <button
                  onClick={() => onSelectSample('blank')}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-black border border-zinc-900 rounded-2xl hover:border-white transition cursor-pointer"
                  id="sample-blank-btn"
                >
                  <div className="w-12 h-12 bg-zinc-950 border border-dashed border-zinc-805 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-zinc-500" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">Blank Draw</span>
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-bold bg-white text-black py-3 rounded-2xl hover:bg-zinc-200 transition shadow-sm mt-1 border border-white cursor-pointer"
                id="onboarding-done-btn"
              >
                Let me choose my own photo <Check className="w-4 h-4 text-black" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
