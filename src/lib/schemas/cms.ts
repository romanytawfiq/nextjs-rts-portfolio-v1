import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const url = z.string().trim().url().max(2000);
const optionalUrl = url.nullable().optional();
// Published assets are served from `/public`, so allow root-relative paths as
// well as fully qualified URLs for image, resume and certificate files.
const assetUrl = z.union([url, z.string().trim().startsWith("/").max(2000)]);
const optionalAssetUrl = assetUrl.nullable().optional();

export const profileSchema = z.object({
  name: text(120),
  title: text(120),
  location: text(160),
  summaryEn: z.string().trim().min(20).max(4000),
  summaryAr: optionalText(4000),
  imageUrl: optionalAssetUrl,
  resumeUrl: optionalAssetUrl,
});

export const contactSchema = z.object({
  phone: text(60),
  whatsapp: text(60),
  email: z.union([z.email(), z.literal("")]).optional(),
  phoneVisible: z.boolean(),
  whatsappVisible: z.boolean(),
  emailVisible: z.boolean(),
});

export const socialLinkSchema = z.object({
  id: z.number().int().positive().optional(),
  platform: text(60),
  url,
  label: text(60),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const skillSchema = z.object({
  id: z.number().int().positive().optional(),
  name: text(120),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const skillGroupSchema = z.object({
  id: z.number().int().positive().optional(),
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  labelEn: text(120),
  labelAr: optionalText(120),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
  skills: z.array(skillSchema).max(200),
});

export const projectSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  title: text(180),
  descriptionEn: z.string().trim().min(10).max(4000),
  descriptionAr: optionalText(4000),
  stack: z.array(text(80)).max(60),
  features: z.array(text(160)).max(60),
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  imageUrl: optionalAssetUrl,
  published: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const certificationSchema = z.object({
  id: z.number().int().positive().optional(),
  title: text(180),
  issuer: text(120),
  issueDate: optionalText(40),
  credentialUrl: optionalUrl,
  documentUrl: optionalAssetUrl,
  coverage: z.array(text(160)).max(60),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const settingsSchema = z.object({
  defaultLocale: z.enum(["en", "ar"]),
  themeBehavior: z.enum(["light", "dark", "system"]),
  seoTitleEn: text(160),
  seoTitleAr: optionalText(160),
  seoDescriptionEn: z.string().trim().min(10).max(400),
  seoDescriptionAr: optionalText(400),
  sectionVisibility: z.object({
    about: z.boolean(),
    skills: z.boolean(),
    projects: z.boolean(),
    github: z.boolean(),
    certification: z.boolean(),
    contact: z.boolean(),
  }),
});

export const githubSettingsSchema = z.object({
  includeForks: z.boolean(),
  includeArchived: z.boolean(),
  cacheMinutes: z.number().int().min(5).max(1440),
});

export const repoPresentationSchema = z.object({
  githubId: z.number().int().positive(),
  featured: z.boolean(),
  hidden: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const sectionSchemas = {
  profile: profileSchema,
  contact: contactSchema,
  socialLinks: z.array(socialLinkSchema).max(100),
  skills: z.array(skillGroupSchema).max(100),
  projects: z.array(projectSchema).max(200),
  certifications: z.array(certificationSchema).max(200),
  settings: settingsSchema,
  githubSettings: githubSettingsSchema,
  repoPresentation: z.array(repoPresentationSchema).max(1000),
} as const;

export type SectionKey = keyof typeof sectionSchemas;

export const sectionKeys = Object.keys(sectionSchemas) as SectionKey[];

export function isSectionKey(value: string): value is SectionKey {
  return (sectionKeys as string[]).includes(value);
}

export const contentMutationSchema = z.object({
  section: z.string(),
  values: z.unknown(),
});
