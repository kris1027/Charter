import { Svg, Path, Circle, Rect } from '@react-pdf/renderer';
import { GITHUB_ICON, LINKEDIN_ICON } from '@/features/templates/brand-icon-paths';
import type { ContactKind } from '@/features/templates/model/template-layouts';

/**
 * Lucide-style contact icons recreated as @react-pdf/renderer SVG primitives.
 *
 * lucide-react components cannot render inside react-pdf (different renderer),
 * so these copy the same 24x24 stroke icons. Brand icon paths live in
 * @/features/templates/brand-icon-paths; keep the others in sync with lucide.
 */
export type PDFIconProps = {
    size?: number;
    color?: string;
};

const STROKE_WIDTH = 2;

const IconBase = ({
    size = 9,
    color = '#000000',
    children,
}: PDFIconProps & { children: React.ReactNode }) => (
    <Svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        {children}
    </Svg>
);

export const GlobeIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        <Circle cx='12' cy='12' r='10' />
        <Path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' />
        <Path d='M2 12h20' />
    </IconBase>
);

export const MailIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        <Rect width='20' height='16' x='2' y='4' rx='2' />
        <Path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
    </IconBase>
);

export const PhoneIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        <Path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
    </IconBase>
);

export const MapPinIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        <Path d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' />
        <Circle cx='12' cy='10' r='3' />
    </IconBase>
);

export const GithubIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        {GITHUB_ICON.paths.map((d) => (
            <Path key={d} d={d} />
        ))}
    </IconBase>
);

export const LinkedinIcon = (props: PDFIconProps) => (
    <IconBase {...props}>
        <Path d={LINKEDIN_ICON.path} />
        <Rect {...LINKEDIN_ICON.rect} />
        <Circle {...LINKEDIN_ICON.circle} />
    </IconBase>
);

export const CONTACT_ICONS: Record<ContactKind, (props: PDFIconProps) => React.ReactNode> = {
    location: MapPinIcon,
    email: MailIcon,
    phone: PhoneIcon,
    linkedin: LinkedinIcon,
    website: GlobeIcon,
    github: GithubIcon,
};
