import type { LanguageLevelProps } from '@/features/resume/form-types';
import type { TFunction } from 'i18next';

// European framework levels plus NATIVE; the schema and the select both read this list
export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'] as const;

export const getLanguageLevels = (t: TFunction): { value: LanguageLevelProps; label: string }[] =>
    LANGUAGE_LEVELS.map((level) => ({ value: level, label: t(`proficiency.${level}`) }));
