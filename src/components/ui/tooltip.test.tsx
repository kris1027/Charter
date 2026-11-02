import { describe, expect, it } from 'vitest';

import { render, screen, userEvent, waitFor } from '@/test/test-utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const renderTooltip = () =>
    render(
        <Tooltip delayDuration={0}>
            <TooltipTrigger>Export</TooltipTrigger>
            <TooltipContent>Download as PDF</TooltipContent>
        </Tooltip>,
    );

describe('Tooltip', () => {
    it('should stay closed when nothing hovers or focuses the trigger', () => {
        renderTooltip();

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should open when the trigger is hovered', async () => {
        const user = userEvent.setup();
        renderTooltip();

        await user.hover(screen.getByRole('button', { name: 'Export' }));

        expect(await screen.findByRole('tooltip')).toHaveTextContent('Download as PDF');
    });

    it('should open on keyboard focus and close on Escape', async () => {
        const user = userEvent.setup();
        renderTooltip();

        await user.tab();
        expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus();
        expect(await screen.findByRole('tooltip')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    });
});
