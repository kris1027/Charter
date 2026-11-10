import { describe, expect, it } from 'vitest';

import { sortableIds } from './sortable-ids';

describe('sortableIds', () => {
    it('should list one id per item in order when built for a list', () => {
        expect(sortableIds('skill', 3).all).toEqual(['skill-0', 'skill-1', 'skill-2']);
    });

    it('should read the index back when the id is from the list', () => {
        const ids = sortableIds('skill', 3);
        expect(ids.indexOf(ids.at(2))).toBe(2);
    });

    it('should return -1 when the id is from another list or out of range', () => {
        const ids = sortableIds('skill', 3);
        expect(ids.indexOf('interest-0')).toBe(-1);
        expect(ids.indexOf('skill-3')).toBe(-1);
        expect(ids.indexOf('skill-x')).toBe(-1);
    });
});

describe('findMove', () => {
    it('should map the dragged and target ids to indexes when both are in the list', () => {
        expect(sortableIds('experience', 3).findMove('experience-0', 'experience-2')).toEqual({
            from: 0,
            to: 2,
        });
    });

    it('should return null when the item is dropped on itself or nowhere', () => {
        const ids = sortableIds('skill', 3);
        expect(ids.findMove('skill-1', 'skill-1')).toBeNull();
        expect(ids.findMove('skill-1', undefined)).toBeNull();
    });

    it('should return null when an id is from another list or out of range', () => {
        const ids = sortableIds('skill', 3);
        expect(ids.findMove('interest-0', 'skill-1')).toBeNull();
        expect(ids.findMove('skill-0', 'skill-3')).toBeNull();
    });
});
