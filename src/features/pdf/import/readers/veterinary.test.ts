import { readers } from '@/features/pdf/import/readers/veterinary';
import { line } from '@/test/pdf-lines';

const ctx = { lang: 'en' } as const;

describe('veterinary readers', () => {
    it('should read position then company above the date line', () => {
        expect(
            readers.experience(
                [
                    line('Vet Surgeon', { size: 10 }),
                    line('Happy Pets Clinic'),
                    line('June 2021 - Present | Warsaw'),
                    line('• Performed surgeries'),
                ],
                ctx,
            ),
        ).toEqual([
            {
                position: 'Vet Surgeon',
                company: 'Happy Pets Clinic',
                location: 'Warsaw',
                startDate: '2021-06',
                endDate: '',
                current: true,
                description: '• Performed surgeries',
            },
        ]);
    });

    it('should tell a lone position from a lone company by its size', () => {
        const [onlyPosition] = readers.experience(
            [line('Vet', { size: 10 }), line('June 2021 - Present')],
            ctx,
        );
        const [onlyCompany] = readers.experience(
            [line('Clinic'), line('June 2021 - Present')],
            ctx,
        );
        expect(onlyPosition).toMatchObject({ position: 'Vet', company: '' });
        expect(onlyCompany).toMatchObject({ position: '', company: 'Clinic' });
    });

    it('should read degree in field, institution, years and description', () => {
        expect(
            readers.education([
                line('DVM in Veterinary Medicine', { size: 10 }),
                line('Warsaw University'),
                line('2015 - 2021'),
                line('Thesis'),
            ]),
        ).toEqual([
            {
                degree: 'DVM',
                field: 'Veterinary Medicine',
                institution: 'Warsaw University',
                startDate: '2015-01',
                endDate: '2021-01',
                description: 'Thesis',
            },
        ]);
    });
});
