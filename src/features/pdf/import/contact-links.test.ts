import { contactFromLinkUrls } from '@/features/pdf/import/contact-links';

describe('contactFromLinkUrls', () => {
    it('should sort links into website, github and linkedin exactly as reported', () => {
        expect(
            contactFromLinkUrls([
                'https://www.zaruszaj.pl/o-mnie/',
                'https://github.com/Kris1027',
                'https://www.linkedin.com/in/krzysztof-obarzanek/',
                'mailto:obarzanek.work@gmail.com',
                'tel:+48 792 542 841',
            ]),
        ).toEqual({
            website: 'https://www.zaruszaj.pl/o-mnie/',
            github: 'https://github.com/Kris1027',
            linkedin: 'https://www.linkedin.com/in/krzysztof-obarzanek/',
        });
    });

    it('should read a country linkedin subdomain as linkedin', () => {
        expect(contactFromLinkUrls(['https://pl.linkedin.com/in/a'])).toEqual({
            linkedin: 'https://pl.linkedin.com/in/a',
        });
    });

    it('should keep the first link of each kind and ignore other schemes', () => {
        expect(
            contactFromLinkUrls([
                'https://example.com',
                'https://other.com',
                'javascript:alert(1)',
            ]),
        ).toEqual({ website: 'https://example.com' });
    });

    it('should take a link without a protocol as the website only when it is printed', () => {
        expect(contactFromLinkUrls(['anna.dev'], ['anna.dev'])).toEqual({ website: 'anna.dev' });
        expect(contactFromLinkUrls(['anna.dev'], ['other'])).toEqual({});
    });
});
