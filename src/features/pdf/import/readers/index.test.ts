import { TEMPLATE_IDS } from '@/lib/template-ids';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import { SECTION_READERS } from '@/features/pdf/import/readers';

describe('SECTION_READERS', () => {
    it('should have a reader for every section when any template is picked', () => {
        for (const templateId of TEMPLATE_IDS) {
            for (const id of SECTION_IDS) {
                expect(SECTION_READERS[templateId][id]([], { lang: 'en' })).toEqual([]);
            }
        }
    });
});
