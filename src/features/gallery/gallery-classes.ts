// Shared by both gallery pages. Join with a template string, not cn: tailwind-merge drops
// the headline's leading when a text size follows it.
export const GALLERY_PAGE_CLASS = 'bg-background text-foreground min-h-dvh overflow-x-clip';
export const GALLERY_CONTAINER_CLASS = 'mx-auto max-w-[1100px] px-6';
export const GALLERY_HEADLINE_CLASS =
    'font-display leading-[1.05] font-bold tracking-[-0.04em] text-balance';
