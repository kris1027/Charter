import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

export const LanguageToggle = () => {
    const { t, i18n } = useTranslation();
    useEffect(() => {
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    const currentLanguage = languages.find((l) => l.code === i18n.language) || languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                    <Languages className='h-4 w-4' />
                    <span className='sr-only'>{t('accessibility.toggleLanguage')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36'>
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => i18n.changeLanguage(language.code)}
                        className='cursor-pointer'
                    >
                        <span className='mr-2'>{language.flag}</span>
                        <span>{language.name}</span>
                        {currentLanguage.code === language.code && (
                            <Check className='ml-auto h-4 w-4' />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
