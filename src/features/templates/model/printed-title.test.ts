import { describe, expect, it } from 'vitest';

import { printedTitle } from './printed-title';

describe('printedTitle', () => {
    it('should print the uppercased interests title when the template is veterinary in Polish', () => {
        expect(printedTitle('veterinary', 'interests', 'pl')).toBe('ZAINTERESOWANIA');
    });

    it('should print core competencies when the template is default', () => {
        expect(printedTitle('default', 'skills', 'en')).toBe('CORE COMPETENCIES');
    });

    it('should prefix the title with slashes when the template is developer', () => {
        expect(printedTitle('developer', 'experience', 'pl')).toBe('// DOŚWIADCZENIE ZAWODOWE');
    });

    it('should keep the title as written when veterinary prints skills', () => {
        expect(printedTitle('veterinary', 'skills', 'en')).toBe('Skills');
    });
});
