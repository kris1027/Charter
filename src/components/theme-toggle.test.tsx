import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import { render, screen, userEvent } from '@/test/test-utils';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
    it('should show translated theme options when the menu is opened', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

        expect(await screen.findByRole('menuitem', { name: 'Light' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Dark' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'System' })).toBeInTheDocument();
    });
});
