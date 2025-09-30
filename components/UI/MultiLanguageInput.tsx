import React, { useState, useEffect, useRef } from 'react';
import { Languages, Globe, Loader2 } from 'lucide-react';
import Input from './Input';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiLanguageInputProps {
  values: {
    en_note: string;
    hi_note: string;
    gu_note: string;
  };
  onChange: (values: { en_note: string; hi_note: string; gu_note: string }) => void;
  labels: {
    en_note: string;
    hi_note: string;
    gu_note: string;
  };
  placeholders: {
    en_note: string;
    hi_note: string;
    gu_note: string;
  };
}

type LanguageCode = 'en' | 'hi' | 'gu';
type FieldName = 'en_note' | 'hi_note' | 'gu_note';

export default function MultiLanguageInput({
  values,
  onChange,
  labels,
  placeholders,
}: MultiLanguageInputProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingFrom, setTranslatingFrom] = useState<FieldName | null>(null);
  const [lastEditedField, setLastEditedField] = useState<FieldName | null>(null);
  
  const translationTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  // Keep track of current values to avoid stale closures
  const currentValuesRef = useRef(values);

  // Update ref whenever values change
  useEffect(() => {
    currentValuesRef.current = values;
  }, [values]);

  // Language mapping
  const langMap: { [key in FieldName]: LanguageCode } = {
    'en_note': 'en',
    'hi_note': 'hi',
    'gu_note': 'gu'
  };

  // Get other fields for translation
  const getOtherFields = (currentField: FieldName): FieldName[] => {
    return Object.keys(langMap).filter(field => field !== currentField) as FieldName[];
  };

  // Translation function
  const translate = async (text: string, from: LanguageCode, to: LanguageCode): Promise<string> => {
    try {
      const langPair = `${from}|${to}`;
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      } else {
        throw new Error(data.responseMessage || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text if translation fails
    }
  };

  // Auto-translate to other languages
  const autoTranslate = async (sourceField: FieldName, sourceText: string) => {
    if (!sourceText.trim()) return;

    const sourceLang = langMap[sourceField];
    const otherFields = getOtherFields(sourceField);
    
    setIsTranslating(true);
    setTranslatingFrom(sourceField);

    try {
      const translations = await Promise.all(
        otherFields.map(async (targetField) => {
          const targetLang = langMap[targetField];
          const translatedText = await translate(sourceText, sourceLang, targetLang);
          return { field: targetField, text: translatedText };
        })
      );

      // Use current values from ref to avoid stale state
      const currentValues = currentValuesRef.current;
      const newValues = { ...currentValues };
      
      translations.forEach(({ field, text }) => {
        // Only update if the target field is still empty (check current values)
        if (!currentValues[field].trim()) {
          newValues[field] = text;
        }
      });

      // Make sure we preserve the source field's current value
      newValues[sourceField] = currentValues[sourceField];

      onChange(newValues);
    } catch (error) {
      console.error('Auto-translation failed:', error);
    } finally {
      setTimeout(() => {
        setIsTranslating(false);
        setTranslatingFrom(null);
      }, 300);
    }
  };

  // Handle input change
  const handleInputChange = (fieldName: FieldName, value: string) => {
    // Update the current field value immediately
    const newValues = { ...values, [fieldName]: value };
    onChange(newValues);
    setLastEditedField(fieldName);

    // Update the ref with new values
    currentValuesRef.current = newValues;

    // Clear existing timer for this field
    if (translationTimers.current[fieldName]) {
      clearTimeout(translationTimers.current[fieldName]);
    }

    // Set auto-translation timer (2 seconds after user stops typing)
    if (value.trim()) {
      translationTimers.current[fieldName] = setTimeout(() => {
        // Use current values from ref to check if other fields are empty
        const currentValues = currentValuesRef.current;
        const otherFields = getOtherFields(fieldName);
        const hasEmptyFields = otherFields.some(field => !currentValues[field].trim());
        
        if (hasEmptyFields) {
          // Pass the current value from ref, not the stale closure value
          autoTranslate(fieldName, currentValues[fieldName]);
        }
      }, 2000);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(translationTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Get flag emoji for language
  const getLanguageEmoji = (fieldName: FieldName) => {
    switch (langMap[fieldName]) {
      case 'en': return '🇺🇸';
      case 'hi': return '🇮🇳';
      case 'gu': return '🇮🇳';
      default: return '🌐';
    }
  };

  // Check if field is being translated to
  const isFieldBeingTranslatedTo = (fieldName: FieldName) => {
    return isTranslating && translatingFrom !== fieldName;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center text-sm text-gray-700">
          <Languages className="h-5 w-5 mr-2 text-gray-500" />
          <span className="font-medium">Multi-Language Note Editor</span>
        </div>
        
        <AnimatePresence>
          {isTranslating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center text-xs text-gray-500"
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              <span>Auto-translating...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Language Fields */}
      <div className="grid grid-cols-1 gap-6">
        {/* English Field */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              label={`${getLanguageEmoji('en_note')} ${labels.en_note}`}
              name="en_note"
              value={values.en_note}
              onChange={(e) => handleInputChange('en_note', e.target.value)}
              placeholder={placeholders.en_note}
              className={`${lastEditedField === 'en_note' ? 'ring-2 ring-gray-500' : ''}`}
            />
            
            {/* Translation indicator */}
            <AnimatePresence>
              {isFieldBeingTranslatedTo('en_note') && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-0 right-0 -mt-2 -mr-2"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center">
            <Globe className="h-3 w-3 mr-1" />
            Primary language
          </div>
        </div>

        {/* Hindi Field */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              label={`${getLanguageEmoji('hi_note')} ${labels.hi_note}`}
              name="hi_note"
              value={values.hi_note}
              onChange={(e) => handleInputChange('hi_note', e.target.value)}
              placeholder={placeholders.hi_note}
              className={`${lastEditedField === 'hi_note' ? 'ring-2 ring-gray-500       ' : ''}`}
            />
            
            {/* Translation indicator */}
            <AnimatePresence>
              {isFieldBeingTranslatedTo('hi_note') && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-0 right-0 -mt-2 -mr-2"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center">
            <Languages className="h-3 w-3 mr-1" />
            हिंदी भाषा
          </div>
        </div>

        {/* Gujarati Field */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              label={`${getLanguageEmoji('gu_note')} ${labels.gu_note}`}
              name="gu_note"
              value={values.gu_note}
              onChange={(e) => handleInputChange('gu_note', e.target.value)}
                placeholder={placeholders.gu_note}
                className={`${lastEditedField === 'gu_note' ? 'ring-2 ring-gray-500' : ''}`}
            />
            
            {/* Translation indicator */}
            <AnimatePresence>
              {isFieldBeingTranslatedTo('gu_note') && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-0 right-0 -mt-2 -mr-2"
                >
                  <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center">
            <Languages className="h-3 w-3 mr-1" />
            ગુજરાતી ભાષા
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <Languages className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
                <p className="text-gray-800 font-medium mb-1">How it works:</p>
            <ul className="text-gray-700 space-y-1 text-xs">
              <li>• Start typing in any language field</li>
              <li>• After 2 seconds, empty fields will auto-translate</li>
              <li>• Edit any field to override translations</li>
              <li>• Blue ring shows your active field</li>
              <li>• Your original text is always preserved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
