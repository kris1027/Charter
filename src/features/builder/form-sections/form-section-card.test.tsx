import { Star } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { FormSectionCard } from './form-section-card';

describe('FormSectionCard', () => {
    it('renders title and description', () => {
        render(
            <FormSectionCard
                icon={Star}
                sectionId='skills'
                title='Test Title'
                description='Test description'
            >
                <p>Content</p>
            </FormSectionCard>,
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders children', () => {
        render(
            <FormSectionCard icon={Star} sectionId='skills' title='Title' description='Desc'>
                <p>Child content here</p>
            </FormSectionCard>,
        );
        expect(screen.getByText('Child content here')).toBeInTheDocument();
    });

    it('renders optional headerAction', () => {
        render(
            <FormSectionCard
                icon={Star}
                sectionId='skills'
                title='Title'
                description='Desc'
                headerAction={<button>Action</button>}
            >
                <p>Content</p>
            </FormSectionCard>,
        );
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('does not render headerAction when not provided', () => {
        render(
            <FormSectionCard icon={Star} sectionId='skills' title='Title' description='Desc'>
                <p>Content</p>
            </FormSectionCard>,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

describe('FormSectionCard landmarks', () => {
    it('should render a section labelled by a focusable h2 when rendered', () => {
        render(
            <FormSectionCard sectionId='skills' icon={Star} title='Skills' description='Desc'>
                <p>Content</p>
            </FormSectionCard>,
        );

        const heading = screen.getByRole('heading', { level: 2, name: 'Skills' });
        expect(screen.getByRole('region', { name: 'Skills' })).toHaveAttribute(
            'id',
            'section-skills',
        );
        expect(heading).toHaveAttribute('tabindex', '-1');
    });
});
