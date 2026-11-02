import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { render, screen, userEvent } from '@/test/test-utils';

import { SegmentedControl, SegmentedControlItem } from './segmented-control';

type ModeSwitchProps = { onChange?: (value: string) => void };

const ModeSwitch = ({ onChange }: ModeSwitchProps) => {
    const [mode, setMode] = useState('edit');
    return (
        <SegmentedControl
            aria-label='Mode'
            value={mode}
            onValueChange={(value) => {
                setMode(value);
                onChange?.(value);
            }}
        >
            <SegmentedControlItem value='edit'>Edit</SegmentedControlItem>
            <SegmentedControlItem value='preview'>Preview</SegmentedControlItem>
            <SegmentedControlItem value='export'>Export</SegmentedControlItem>
        </SegmentedControl>
    );
};

describe('SegmentedControl', () => {
    it('should expose a labelled radio group with the chosen item checked when rendered with a value', () => {
        render(<ModeSwitch />);

        expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });

    it('should select an item when it is clicked', async () => {
        const user = userEvent.setup();
        render(<ModeSwitch />);

        await user.click(screen.getByRole('radio', { name: 'Preview' }));

        expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
    });

    it('should keep the value when the selected item is clicked again', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<ModeSwitch onChange={handleChange} />);

        await user.click(screen.getByRole('radio', { name: 'Edit' }));

        expect(handleChange).not.toHaveBeenCalled();
        expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
    });

    it('should move focus with arrow keys and select with Space when using the keyboard', async () => {
        const user = userEvent.setup();
        render(<ModeSwitch />);

        await user.tab();
        expect(screen.getByRole('radio', { name: 'Edit' })).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('radio', { name: 'Preview' })).toHaveFocus();
        expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');

        await user.keyboard(' ');
        expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
    });
});
