import { describe, expect, it } from 'vitest';
import { resolveTemplateId, validatePreviewSearch } from '@/features/preview/preview-search';

describe('validatePreviewSearch', () => {
    it('should keep the templateId when it is a known template', () => {
        expect(validatePreviewSearch({ templateId: 'veterinary' })).toEqual({
            templateId: 'veterinary',
        });
    });

    it.each(['nope', 3, undefined])('should drop the templateId when it is %s', (value) => {
        expect(validatePreviewSearch({ templateId: value })).toEqual({ templateId: undefined });
    });
});

describe('resolveTemplateId', () => {
    it('should use the search value when there is one', () => {
        expect(resolveTemplateId('default', 'veterinary')).toBe('default');
    });

    it('should fall back to the saved template when the search has none', () => {
        expect(resolveTemplateId(undefined, 'veterinary')).toBe('veterinary');
    });

    it.each(['nope', undefined, 7])(
        'should fall back to developer when the saved template is %s',
        (saved) => {
            expect(resolveTemplateId(undefined, saved)).toBe('developer');
        },
    );
});
