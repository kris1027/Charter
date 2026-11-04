import { findHeaderIndex } from '@/features/pdf/import/section-headers';
import { lines } from '@/test/pdf-lines';

describe('findHeaderIndex', () => {
    it('should find a developer header when the line includes the title', () => {
        expect(findHeaderIndex(lines('Name', 'x // TECH STACK'), 'developer', 'skills', 'en')).toBe(
            1,
        );
    });

    it('should need the whole line for default headers', () => {
        const page = lines('CORE COMPETENCIES and more', 'CORE COMPETENCIES');
        expect(findHeaderIndex(page, 'default', 'skills', 'en')).toBe(1);
    });

    it('should match a legacy header only for English', () => {
        const page = lines('Name', 'SKILLS');
        expect(findHeaderIndex(page, 'veterinary', 'skills', 'en')).toBe(1);
        expect(findHeaderIndex(page, 'veterinary', 'skills', 'pl')).toBe(-1);
    });

    it('should compare case sensitively', () => {
        expect(findHeaderIndex(lines('core competencies'), 'default', 'skills', 'en')).toBe(-1);
    });

    it('should find a Polish title when the export is in Polish', () => {
        expect(findHeaderIndex(lines('JĘZYKI'), 'default', 'languages', 'pl')).toBe(0);
    });
});
