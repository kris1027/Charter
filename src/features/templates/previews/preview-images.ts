import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import developerEn from '@/features/templates/previews/developer-en.webp';
import developerPl from '@/features/templates/previews/developer-pl.webp';
import defaultEn from '@/features/templates/previews/default-en.webp';
import defaultPl from '@/features/templates/previews/default-pl.webp';
import veterinaryEn from '@/features/templates/previews/veterinary-en.webp';
import veterinaryPl from '@/features/templates/previews/veterinary-pl.webp';
import developerEnCard from '@/features/templates/previews/developer-en-card.webp';
import developerPlCard from '@/features/templates/previews/developer-pl-card.webp';
import defaultEnCard from '@/features/templates/previews/default-en-card.webp';
import defaultPlCard from '@/features/templates/previews/default-pl-card.webp';
import veterinaryEnCard from '@/features/templates/previews/veterinary-en-card.webp';
import veterinaryPlCard from '@/features/templates/previews/veterinary-pl-card.webp';

// Page 1 of each template's sample PDF, written by pnpm templates:previews (spec 0006).
export const PREVIEW_IMAGES: Record<TemplateId, Record<AppLang, string>> = {
    developer: { en: developerEn, pl: developerPl },
    default: { en: defaultEn, pl: defaultPl },
    veterinary: { en: veterinaryEn, pl: veterinaryPl },
};

// The same pages downscaled for the gallery cards (spec 0011).
export const PREVIEW_CARD_IMAGES: Record<TemplateId, Record<AppLang, string>> = {
    developer: { en: developerEnCard, pl: developerPlCard },
    default: { en: defaultEnCard, pl: defaultPlCard },
    veterinary: { en: veterinaryEnCard, pl: veterinaryPlCard },
};
