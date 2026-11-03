import { z } from 'zod';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import { LANGUAGE_LEVELS } from '@/features/resume/language-levels';

const personalInfoSchema = z.object({
    firstName: z.string().min(1, 'validation.firstNameRequired').max(100, 'validation.maxLength'),
    lastName: z.string().min(1, 'validation.lastNameRequired').max(100, 'validation.maxLength'),
    location: z.string().max(100, 'validation.maxLength'),
    title: z.string().max(100, 'validation.maxLength'),
    phone: z.string().max(30, 'validation.maxLength'),
    email: z
        .string()
        .min(1, 'validation.emailRequired')
        .email('validation.invalidEmail')
        .max(254, 'validation.maxLength'),
    website: z.string().max(200, 'validation.maxLength'),
    linkedin: z.string().max(200, 'validation.maxLength'),
    github: z.string().max(200, 'validation.maxLength'),
});

const experienceSchema = z.object({
    company: z.string().max(100, 'validation.maxLength'),
    position: z.string().max(100, 'validation.maxLength'),
    location: z.string().max(100, 'validation.maxLength'),
    startDate: z.string(),
    endDate: z.string(),
    current: z.boolean(),
    description: z.string().max(2000, 'validation.maxLength'),
});

const educationSchema = z.object({
    institution: z.string().max(100, 'validation.maxLength'),
    degree: z.string().max(100, 'validation.maxLength'),
    field: z.string().max(100, 'validation.maxLength'),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string().max(2000, 'validation.maxLength'),
});

const skillSchema = z.object({
    name: z.string().max(100, 'validation.maxLength'),
});

const languageSchema = z.object({
    language: z.string().max(100, 'validation.maxLength'),
    proficiency: z.enum(LANGUAGE_LEVELS),
});

const interestSchema = z.object({
    name: z.string().max(100, 'validation.maxLength'),
});

const gdprConsentSchema = z.object({
    enabled: z.boolean(),
    companyName: z.string().max(200, 'validation.maxLength'),
});

export const resumeFormSchema = z.object({
    templateId: z.enum(TEMPLATE_IDS),
    personalInfo: personalInfoSchema,
    experiences: z.array(experienceSchema),
    education: z.array(educationSchema),
    skills: z.array(skillSchema),
    languages: z.array(languageSchema),
    interests: z.array(interestSchema),
    gdprConsent: gdprConsentSchema,
});

export type ResumeFormValues = z.infer<typeof resumeFormSchema>;
