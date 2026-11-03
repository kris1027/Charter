import { describe, expect, it } from 'vitest';

import { findMove, sortableId } from './sortable-ids';

describe('sortableId', () => {
    it('should join the prefix and index when called', () => {
        expect(sortableId('skill', 2)).toBe('skill-2');
    });
});

describe('findMove', () => {
    it('should map the dragged and target ids to indexes when both are in the list', () => {
        expect(findMove('experience', 3, 'experience-0', 'experience-2')).toEqual({
            from: 0,
            to: 2,
        });
    });

    it('should return null when the item is dropped on itself or nowhere', () => {
        expect(findMove('skill', 3, 'skill-1', 'skill-1')).toBeNull();
        expect(findMove('skill', 3, 'skill-1', undefined)).toBeNull();
    });

    it('should return null when an id is from another list or out of range', () => {
        expect(findMove('skill', 3, 'interest-0', 'skill-1')).toBeNull();
        expect(findMove('skill', 3, 'skill-0', 'skill-3')).toBeNull();
    });
});
