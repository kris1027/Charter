import { findHeaderIndex } from '@/features/pdf/import/section-headers';
import { lines } from '@/test/pdf-lines';

describe('findHeaderIndex', () => {
    it('should find a developer header when the line includes the title', () => {
        expect(findHeaderIndex(lines('Name', 'x // TECH STACK'), 'developer', 'skills', 'en')).toBe(
            1,
        );
    });

    it('should match a default header only when it is the whole line', () => {
        const page = lines('CORE COMPETENCIES and more', 'CORE COMPETENCIES');
        expect(findHeaderIndex(page, 'default', 'skills', 'en')).toBe(1);
    });

    it('should match a legacy header only when the language is English', () => {
        const page = lines('Name', 'SKILLS');
        expect(findHeaderIndex(page, 'veterinary', 'skills', 'en')).toBe(1);
        expect(findHeaderIndex(page, 'veterinary', 'skills', 'pl')).toBe(-1);
    });

    it('should not match when the case differs', () => {
        expect(findHeaderIndex(lines('core competencies'), 'default', 'skills', 'en')).toBe(-1);
    });

    it('should find a Polish title when the export is in Polish', () => {
        expect(findHeaderIndex(lines('JĘZYKI'), 'default', 'languages', 'pl')).toBe(0);
    });
});
