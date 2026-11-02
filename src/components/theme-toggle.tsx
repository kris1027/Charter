import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                    <Sun className='ease-standard h-4 w-4 scale-100 rotate-0 transition-transform duration-(--duration-base) dark:scale-0 dark:-rotate-90' />
                    <Moon className='ease-standard absolute h-4 w-4 scale-0 rotate-90 transition-transform duration-(--duration-base) dark:scale-100 dark:rotate-0' />
                    <span className='sr-only'>Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36'>
                <DropdownMenuItem onClick={() => setTheme('light')} className='cursor-pointer'>
                    <Sun className='mr-2 h-4 w-4' />
                    <span>Light</span>
                    {theme === 'light' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className='cursor-pointer'>
                    <Moon className='mr-2 h-4 w-4' />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className='cursor-pointer'>
                    <Monitor className='mr-2 h-4 w-4' />
                    <span>System</span>
                    {theme === 'system' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
