import '@/features/templates/pdf/pdf-fonts';
import { Fragment } from 'react';
import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { buildResumeView } from '@/features/templates/model/resume-view';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { CONTACT_ICONS } from '@/features/templates/pdf/pdf-icons';
import { lerp } from '@/features/templates/pdf/pdf-scale';
import { ResumeDocument } from '@/features/templates/pdf/resume-document';
import { renderSection } from '@/features/templates/pdf/section-renderers';
import type { RenderCtx, SectionRenderers } from '@/features/templates/pdf/section-renderers';

interface DeveloperPDFProps {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
}

const C = {
    purple: '#7C3AED',
    white: '#FFFFFF',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray900: '#111827',
    green400: '#4ADE80',
    cyan500: '#06B6D4',
} as const;

// Interpolate between normal and max-compact values
function createStyles(t: number) {
    const s = (n: number, m: number) => lerp(n, m, t);
    return StyleSheet.create({
        page: {
            fontFamily: 'Fira Code',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: s(20, 8),
        },
        header: {
            backgroundColor: C.purple,
            paddingTop: s(4, 2),
            paddingHorizontal: s(24, 14),
            paddingBottom: s(24, 10),
            color: C.white,
        },
        headerName: {
            fontSize: s(24, 16),
            fontFamily: 'Fira Code',
            fontWeight: 700,
            marginBottom: s(4, 1),
        },
        headerTitle: { fontSize: s(13, 10), marginBottom: s(10, 4) },
        headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(16, 8), marginTop: s(4, 1) },
        contactItem: { flexDirection: 'row', alignItems: 'center', gap: s(4, 2) },
        headerLink: { color: C.white, fontSize: s(9, 8), textDecoration: 'none' },
        body: { flexDirection: 'column', padding: s(20, 10) },
        section: { marginBottom: s(16, 6) },
        sectionHeader: {
            fontSize: s(11, 8),
            fontFamily: 'Fira Code',
            fontWeight: 700,
            color: C.purple,
            borderBottomWidth: 1.5,
            borderBottomColor: C.purple,
            paddingBottom: s(3, 1),
            marginBottom: s(8, 3),
        },
        expBlock: { marginBottom: s(10, 4) },
        expTitle: { fontSize: s(11, 8), fontFamily: 'Fira Code', fontWeight: 700 },
        expPurple: { color: C.purple },
        expMeta: { fontSize: s(9, 7), color: C.gray600, marginBottom: s(3, 1) },
        bulletRow: { flexDirection: 'row', marginBottom: s(2, 0.5) },
        bulletDot: { width: 10, fontSize: s(9, 7), color: C.gray700 },
        bulletText: { flex: 1, fontSize: s(9, 7), color: C.gray700, lineHeight: s(1.4, 1.2) },
        eduBlock: { marginBottom: s(8, 3) },
        eduField: { fontSize: s(10, 8), fontFamily: 'Fira Code', fontWeight: 700, color: C.purple },
        eduMeta: { fontSize: s(9, 7), color: C.gray700 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
        skillTag: {
            backgroundColor: C.gray900,
            color: C.green400,
            borderWidth: 1,
            borderColor: C.gray700,
            borderRadius: 3,
            paddingHorizontal: s(6, 3),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            marginRight: s(4, 2),
            marginBottom: s(4, 2),
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(4, 1) },
        langName: { fontFamily: 'Fira Code', fontWeight: 700, fontSize: s(9, 7) },
        langLevel: { color: C.purple, fontSize: s(9, 7) },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
        interestTag: {
            backgroundColor: C.cyan500,
            color: C.white,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(3, 1),
            fontSize: s(8, 6),
            marginRight: s(4, 2),
            marginBottom: s(4, 2),
        },
        gdpr: {
            fontSize: s(7, 6),
            color: '#9CA3AF',
            marginTop: s(12, 4),
            borderTopWidth: 0.5,
            borderTopColor: '#E5E7EB',
            paddingTop: s(6, 3),
            paddingHorizontal: s(20, 10),
            paddingBottom: s(20, 10),
        },
    });
}

type Styles = ReturnType<typeof createStyles>;

const renderers = {
    experience: (section, { styles }) => (
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.items.map((exp, i) => (
                <View key={i} style={styles.expBlock} wrap={false}>
                    <Text style={styles.expTitle}>
                        {exp.company}
                        <Text style={styles.expPurple}>
                            {' | '}
                            {exp.position}
                        </Text>
                    </Text>
                    {/* Keep the text runs split as before the model: other splits shift glyphs */}
                    <Text style={styles.expMeta}>
                        {exp.start}
                        {' -'} {exp.end}
                        {exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.bullets.map((line, j) => (
                        <View key={j} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>{'• '}</Text>
                            <Text style={styles.bulletText}>{line}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    ),
    education: (section, { styles }) => (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.items.map((edu, i) => (
                <View key={i} style={styles.eduBlock} wrap={false}>
                    <Text style={styles.eduField}>{edu.field}</Text>
                    <Text style={styles.eduMeta}>
                        {edu.degree}
                        {edu.degree && edu.institution ? ' - ' : ''}
                        {edu.institution}
                    </Text>
                    <Text style={styles.eduMeta}>
                        {edu.startYear} - {edu.endYear}
                    </Text>
                    {edu.description ? (
                        <Text style={styles.bulletText}>{edu.description}</Text>
                    ) : null}
                </View>
            ))}
        </View>
    ),
    skills: (section, { styles }) => (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.skillsWrap}>
                {section.items.map((skill, i) => (
                    <Text key={i} style={styles.skillTag}>
                        {skill}
                    </Text>
                ))}
            </View>
        </View>
    ),
    languages: (section, { styles }) => (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.items.map((l, i) => (
                <View key={i} style={styles.langRow}>
                    <Text style={styles.langName}>{l.name}</Text>
                    <Text style={styles.langLevel}>{l.level}</Text>
                </View>
            ))}
        </View>
    ),
    interests: (section, { styles }) => (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.interestsWrap}>
                {section.items.map((interest, i) => (
                    <Text key={i} style={styles.interestTag}>
                        {interest}
                    </Text>
                ))}
            </View>
        </View>
    ),
} satisfies SectionRenderers<Styles>;

export function DeveloperPDF({ data, compactScale = 0, lang = 'en' }: DeveloperPDFProps) {
    const styles = createStyles(compactScale);
    const iconSize = lerp(9, 8, compactScale);
    const view = buildResumeView('developer', data, lang);
    const ctx: RenderCtx<Styles> = { lang, compactScale, styles, contactIconColor: C.white };

    return (
        <ResumeDocument
            templateId='developer'
            data={data}
            view={view}
            lang={lang}
            pageStyle={styles.page}
        >
            <View style={styles.header}>
                <Text style={styles.headerName}>
                    {view.name.first} {view.name.last}
                </Text>
                {view.title ? <Text style={styles.headerTitle}>{view.title}</Text> : null}
                {view.contactRows.map((row, i) => (
                    <View key={i} style={styles.headerRow}>
                        {row.map((item) => {
                            const Icon = CONTACT_ICONS[item.kind];
                            return (
                                <View key={item.kind} style={styles.contactItem}>
                                    <Icon size={iconSize} color={ctx.contactIconColor} />
                                    {item.href ? (
                                        <Link src={item.href} style={styles.headerLink}>
                                            {item.text}
                                        </Link>
                                    ) : (
                                        <Text style={styles.headerLink}>{item.text}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>

            <View style={styles.body}>
                {TEMPLATE_LAYOUTS.developer.sections.map((id) => (
                    <Fragment key={id}>{renderSection(renderers, id, view, ctx)}</Fragment>
                ))}
            </View>

            {view.gdpr ? <Text style={styles.gdpr}>{view.gdpr}</Text> : null}
        </ResumeDocument>
    );
}
