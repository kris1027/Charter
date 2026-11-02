import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { Badge } from './badge';

describe('Badge', () => {
    it('should render its text with the default variant when no variant is given', () => {
        render(<Badge>New</Badge>);

        const badge = screen.getByText('New');
        expect(badge.tagName).toBe('SPAN');
        expect(badge).toHaveAttribute('data-variant', 'default');
        expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it.each([
        ['secondary', 'bg-secondary'],
        ['outline', 'border'],
        ['success', 'bg-success'],
        ['warning', 'bg-warning'],
        ['info', 'bg-info'],
        ['destructive', 'bg-destructive'],
    ] as const)('should use token classes when the variant is %s', (variant, className) => {
        render(<Badge variant={variant}>Label</Badge>);

        expect(screen.getByText('Label')).toHaveClass(className);
    });

    it('should merge a custom className when one is passed', () => {
        render(<Badge className='ml-2'>Tag</Badge>);

        expect(screen.getByText('Tag')).toHaveClass('ml-2', 'rounded-md');
    });
});
