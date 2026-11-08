import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { ClosingSection } from '@/features/landing/closing-section';
import { FeaturesSection } from '@/features/landing/features-section';
import { HeroSection } from '@/features/landing/hero-section';
import { HowItWorksSection } from '@/features/landing/how-it-works-section';
import { LandingFooter } from '@/features/landing/landing-footer';
import { StatementSection } from '@/features/landing/statement-section';
import { StatsSection } from '@/features/landing/stats-section';

export const IndexPage = () => (
    // overflow-x-clip, never overflow-hidden: hidden overflow breaks the sticky sections
    <div className='bg-landing-bg text-landing-fg font-landing relative min-h-screen overflow-x-clip'>
        <div className='absolute top-4 right-4 z-50 flex items-center gap-2'>
            <LanguageToggle />
            <ThemeToggle />
        </div>
        <HeroSection />
        <StatementSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <ClosingSection />
        <LandingFooter />
    </div>
);

export default IndexPage;
