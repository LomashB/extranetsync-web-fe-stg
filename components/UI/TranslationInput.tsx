import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, Languages } from 'lucide-react';
import Input from './Input';
import { motion, AnimatePresence } from 'framer-motion';

interface TranslationInputProps {
  sourceName: string;
  sourceValue: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  sourceError?: string;
  targetName: string;
  targetValue: string;
  targetLabel: string;
  targetPlaceholder: string;
  targetError?: string;
  disabled?: boolean;
  sourceToTarget: 'en-sl' | 'sl-en';
  onChange: (name: string, value: string) => void;
}

export default function TranslationInput({
  sourceName,
  sourceValue,
  sourceLabel,
  sourcePlaceholder,
  sourceError,
  targetName,
  targetValue,
  targetLabel,
  targetPlaceholder,
  targetError,
  disabled = false,
  sourceToTarget,
  onChange,
}: TranslationInputProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeField, setActiveField] = useState<'source' | 'target' | null>(null);
  const [translatingDirection, setTranslatingDirection] = useState<'toTarget' | 'toSource' | null>(null);
  const translationTimer = useRef<NodeJS.Timeout | null>(null);

  const translate = async (text: string, from: 'en' | 'hi' | 'gu', to: 'en' | 'hi' | 'gu', targetFieldName: string) => {
    if (!text.trim() || disabled || isTranslating) return;

    try {
      setIsTranslating(true);
      setTranslatingDirection(targetFieldName === targetName ? 'toTarget' : 'toSource');
      
      // Map language codes for the translation API
      const langMap = {
        'en': 'en',
        'hi': 'hi',
        'gu': 'gu'
      };
      
      const langPair = `${langMap[from]}|${langMap[to]}`;
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        onChange(targetFieldName, data.responseData.translatedText);
      } else {
        throw new Error(data.responseMessage || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      // Keep the animation visible for a short moment after translation
      setTimeout(() => {
        setIsTranslating(false);
        setTranslatingDirection(null);
      }, 300);
    }
  };

  const handleTranslate = () => {
    // Determine translation direction and languages based on field names
    let sourceLang: 'en' | 'hi' | 'gu' = 'en';
    let targetLang: 'en' | 'hi' | 'gu' = 'hi';

    // Auto-detect language based on field names
    if (sourceName.includes('en_')) sourceLang = 'en';
    else if (sourceName.includes('hi_')) sourceLang = 'hi';
    else if (sourceName.includes('gu_')) sourceLang = 'gu';

    if (targetName.includes('en_')) targetLang = 'en';
    else if (targetName.includes('hi_')) targetLang = 'hi';
    else if (targetName.includes('gu_')) targetLang = 'gu';

    // Translate based on which field was last edited
    if (activeField === 'target') {
      translate(targetValue, targetLang, sourceLang, sourceName);
    } else {
      translate(sourceValue, sourceLang, targetLang, targetName);
    }
  };

  const handleInputChange = (fieldType: 'source' | 'target', e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
    setActiveField(fieldType);

    // Clear any existing timer
    if (translationTimer.current) {
      clearTimeout(translationTimer.current);
      translationTimer.current = null;
    }

    // Only auto-translate if the opposite field is empty and source field has content
    const oppositeValue = fieldType === 'source' ? targetValue : sourceValue;
    if (value.trim() && !oppositeValue.trim() && fieldType === 'source') {
      translationTimer.current = setTimeout(() => {
        // Determine languages based on field names
        let sourceLang: 'en' | 'hi' | 'gu' = 'en';
        let targetLang: 'en' | 'hi' | 'gu' = 'hi';

        if (sourceName.includes('en_')) sourceLang = 'en';
        else if (sourceName.includes('hi_')) sourceLang = 'hi';
        else if (sourceName.includes('gu_')) sourceLang = 'gu';

        if (targetName.includes('en_')) targetLang = 'en';
        else if (targetName.includes('hi_')) targetLang = 'hi';
        else if (targetName.includes('gu_')) targetLang = 'gu';

        translate(value, sourceLang, targetLang, targetName);
      }, 2000);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (translationTimer.current) {
        clearTimeout(translationTimer.current);
      }
    };
  }, []);

  // Get language indicator
  const getLanguageIcon = (fieldName: string) => {
    if (fieldName.includes('en_')) return '🇺🇸';
    if (fieldName.includes('hi_')) return '🇮🇳';
    if (fieldName.includes('gu_')) return '🇮🇳';
    return '🌐'; // Return emoji instead of JSX element
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Languages className="h-4 w-4 mr-2" />
          <span>Translation Helper</span>
        </div>
        <motion.button
          type="button"
          onClick={handleTranslate}
          disabled={disabled || isTranslating || (!sourceValue.trim() && !targetValue.trim())}
          className="flex items-center px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Translate between languages"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
        >
          <RefreshCcw 
            className={`h-3 w-3 mr-1 transition-transform duration-300 ${isTranslating ? 'animate-spin' : ''}`} 
          />
          {isTranslating ? 'Translating...' : 'Translate'}
        </motion.button>
      </div>

      <div className="relative">
        <AnimatePresence>
          {isTranslating && translatingDirection === 'toTarget' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-10"
            >
              <div className="w-6 h-6 rounded-full bg-gray-500/20 animate-pulse flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 animate-ping" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative">
          <Input
            label={`${sourceName.includes('en_') ? '🇺🇸' : sourceName.includes('hi_') ? '🇮🇳' : sourceName.includes('gu_') ? '🇮🇳' : '🌐'} ${sourceLabel}`} 
            name={sourceName}
            value={sourceValue}
            onChange={(e) => handleInputChange('source', e)}
            placeholder={sourcePlaceholder}
            error={sourceError}
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="relative">
        <AnimatePresence>
          {isTranslating && translatingDirection === 'toSource' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-10"
            >
              <div className="w-6 h-6 rounded-full bg-gray-500/20 animate-pulse flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 animate-ping" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative">
          <Input
            label={`${targetName.includes('en_') ? '🇺🇸' : targetName.includes('hi_') ? '🇮🇳' : targetName.includes('gu_') ? '🇮🇳' : '🌐'} ${targetLabel}`} 
            name={targetName}
            value={targetValue}
            onChange={(e) => handleInputChange('target', e)}
            placeholder={targetPlaceholder}
            error={targetError}
            disabled={disabled || isTranslating}
          />
          {isTranslating && !targetValue && translatingDirection === 'toTarget' && (
            <div className="absolute inset-0 mt-6 rounded-md overflow-hidden">
                <div className="w-full h-10 bg-gradient-to-r from-transparent via-gray-200/30 to-transparent animate-shimmer" 
                   style={{ 
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 1.5s infinite'
                   }} />
            </div>
          )}
        </div>
        
        {sourceValue.trim() && targetValue.trim() && (
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <Languages className="h-3 w-3 mr-1" />
            Both languages have content. Use the translate button to update between them.
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
