import { Font } from '@react-pdf/renderer';

Font.registerHyphenationCallback((word) => [word]);

// v4: Fira Code replaces JetBrains Mono (fontkit incompatibility)
const v = '4';
const base = import.meta.env.BASE_URL;
// The preview script sets base to the absolute public/ path, so react-pdf reads files from disk.
const isFileBase = base !== '/' && !base.startsWith('http');
const url = (file: string) => (isFileBase ? `${base}fonts/${file}` : `${base}fonts/${file}?v=${v}`);

Font.register({
    family: 'Fira Code',
    fonts: [
        { src: url('fira-code-400.ttf'), fontWeight: 400 },
        { src: url('fira-code-700.ttf'), fontWeight: 700 },
    ],
});

Font.register({
    family: 'Montserrat',
    fonts: [
        { src: url('montserrat-400.ttf'), fontWeight: 400 },
        { src: url('montserrat-700.ttf'), fontWeight: 700 },
    ],
});

Font.register({
    family: 'Lato',
    fonts: [
        { src: url('lato-400.ttf'), fontWeight: 400 },
        { src: url('lato-700.ttf'), fontWeight: 700 },
    ],
});

Font.register({
    family: 'Merriweather',
    fonts: [
        { src: url('merriweather-400.ttf'), fontWeight: 400 },
        { src: url('merriweather-700.ttf'), fontWeight: 700 },
    ],
});
