import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

type LandingCtaLinkProps = {
    className: string;
    children: ReactNode;
};

export const LandingCtaLink = ({ className, children }: LandingCtaLinkProps) => (
    <Link
        to='/templates'
        className={`bg-landing-accent text-landing-accent-fg hover:bg-landing-accent-hover rounded-full text-[17px] transition-colors duration-(--duration-fast) ${className}`}
    >
        {children}
    </Link>
);
