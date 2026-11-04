import type { ReactNode } from 'react';
import type { SectionId } from '@/features/templates/model/section-ids';
import type { ResumeView } from '@/features/templates/model/resume-view';

export type RenderCtx<S> = { styles: S };

// One renderer per section; `satisfies SectionRenderers<…>` fails the build when one is missing.
export type SectionRenderers<S> = {
    [K in SectionId]: (section: ResumeView['sections'][K], ctx: RenderCtx<S>) => ReactNode;
};

// An empty section renders nothing, header included, in every template.
export const renderSection = <K extends SectionId, S>(
    renderers: SectionRenderers<S>,
    id: K,
    view: ResumeView,
    ctx: RenderCtx<S>,
): ReactNode => (view.sections[id].items.length > 0 ? renderers[id](view.sections[id], ctx) : null);
