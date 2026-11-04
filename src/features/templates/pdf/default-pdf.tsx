import '@/features/templates/pdf/pdf-fonts';
import { Fragment } from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { buildResumeView } from '@/features/templates/model/resume-view';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { ContactRows } from '@/features/templates/pdf/contact-rows';
import { lerp } from '@/features/templates/pdf/pdf-scale';
import { ResumeDocument } from '@/features/templates/pdf/resume-document';
import { renderSection } from '@/features/templates/pdf/section-renderers';
import type { RenderCtx, SectionRenderers } from '@/features/templates/pdf/section-renderers';

type DefaultPDFProps = {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
};

const C = {
    white: '#FFFFFF',
    slateBlue: '#1E40AF',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB',
} as const;

function createStyles(t: number) {
    const s = (n: number, m: number) => lerp(n, m, t);
    return StyleSheet.create({
        page: {
            fontFamily: 'Montserrat',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: s(20, 8),
        },
        headerBlock: {
            backgroundColor: C.gray50,
            paddingHorizontal: s(32, 18),
            paddingTop: s(4, 1),
            paddingBottom: s(16, 6),
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
            marginBottom: s(8, 2),
        },
        headerFirstName: { fontSize: s(22, 15), letterSpacing: 2, color: C.gray800 },
        headerLastName: {
            fontSize: s(22, 15),
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 2,
            color: C.gray800,
        },
        headerNameRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: s(4, 1) },
        headerTitle: {
            textAlign: 'center',
            fontSize: s(11, 8),
            color: C.gray500,
            marginBottom: s(8, 2),
        },
        contactRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: s(16, 8),
        },
        contactItem: { flexDirection: 'row', alignItems: 'center', gap: s(4, 2) },
        contactLink: { fontSize: s(9, 7), color: C.gray500, textDecoration: 'none' },
        body: { paddingHorizontal: s(32, 18), paddingBottom: s(24, 10) },
        section: { marginBottom: s(14, 5) },
        sectionHeader: {
            fontSize: s(9, 7),
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 1.5,
            color: C.slateBlue,
            borderBottomWidth: 1.5,
            borderBottomColor: C.slateBlue,
            paddingBottom: s(3, 1),
            marginBottom: s(8, 3),
        },
        expBlock: { marginBottom: s(10, 4) },
        expTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(2, 1) },
        expPosition: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(10, 8) },
        expDate: { fontSize: s(9, 7), color: C.gray500 },
        expCompanyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: s(3, 1),
        },
        expCompany: {
            fontFamily: 'Montserrat',
            fontWeight: 700,
            color: C.gray700,
            fontSize: s(9, 7),
        },
        expLocation: { fontSize: s(8, 6), color: C.gray500 },
        bulletRow: { flexDirection: 'row', marginBottom: s(1.5, 0.5) },
        bulletDot: { width: 10, fontSize: s(9, 7) },
        bulletText: { flex: 1, fontSize: s(9, 7), color: C.gray700, lineHeight: s(1.4, 1.2) },
        eduBlock: { marginBottom: s(8, 3) },
        eduTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
        eduDegree: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(10, 8) },
        eduYears: { fontSize: s(9, 7), color: C.gray500 },
        eduInstitution: { fontSize: s(9, 7), color: C.gray700 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(4, 2) },
        skillTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            color: C.gray700,
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(3, 1) },
        langName: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(9, 7) },
        langLevel: { fontSize: s(9, 7), color: C.gray500 },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(4, 2) },
        interestTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            color: C.gray700,
        },
        gdpr: {
            fontSize: s(7, 6),
            color: '#9CA3AF',
            marginTop: s(12, 4),
            borderTopWidth: 0.5,
            borderTopColor: C.gray200,
            paddingTop: s(6, 3),
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
                    <View style={styles.expTopRow}>
                        <Text style={styles.expPosition}>{exp.position}</Text>
                        <Text style={styles.expDate}>
                            {exp.start} - {exp.end}
                        </Text>
                    </View>
                    <View style={styles.expCompanyRow}>
                        <Text style={styles.expCompany}>{exp.company}</Text>
                        {exp.location ? (
                            <Text style={styles.expLocation}>{exp.location}</Text>
                        ) : null}
                    </View>
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
                    <View style={styles.eduTopRow}>
                        <Text style={styles.eduDegree}>
                            {edu.degree}
                            {edu.degree && edu.field ? ' in ' : ''}
                            {edu.field}
                        </Text>
                        <Text style={styles.eduYears}>
                            {edu.startYear} - {edu.endYear}
                        </Text>
                    </View>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
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

export const DefaultPDF = ({ data, compactScale = 0, lang = 'en' }: DefaultPDFProps) => {
    const styles = createStyles(compactScale);
    const view = buildResumeView('default', data, lang);
    const ctx: RenderCtx<Styles> = { styles };

    return (
        <ResumeDocument
            templateId='default'
            data={data}
            view={view}
            lang={lang}
            pageStyle={styles.page}
        >
            <View style={styles.headerBlock}>
                <View style={styles.headerNameRow}>
                    <Text style={styles.headerFirstName}>{view.name.first} </Text>
                    <Text style={styles.headerLastName}>{view.name.last}</Text>
                </View>
                {view.title ? <Text style={styles.headerTitle}>{view.title}</Text> : null}

                <ContactRows
                    rows={view.contactRows}
                    rowStyle={styles.contactRow}
                    itemStyle={styles.contactItem}
                    textStyle={styles.contactLink}
                    iconSize={lerp(9, 7, compactScale)}
                    iconColor={C.gray500}
                />
            </View>

            <View style={styles.body}>
                {TEMPLATE_LAYOUTS.default.sections.map((id) => (
                    <Fragment key={id}>{renderSection(renderers, id, view, ctx)}</Fragment>
                ))}

                {view.gdpr ? <Text style={styles.gdpr}>{view.gdpr}</Text> : null}
            </View>
        </ResumeDocument>
    );
};
