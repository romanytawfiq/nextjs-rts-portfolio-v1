import Image from "next/image";
import { notFound } from "next/navigation";

import { GitHubIcon, LinkedInIcon, MapPinIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import {
  Chip,
  ExternalLink,
  PendingBadge,
  PendingLink,
  SectionHeading,
} from "@/components/ui";
import { languages } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPublicContent } from "@/lib/server/content";

export default async function PortfolioPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = await getDictionary(locale);
  const content = getPublicContent();
  const visible = content.settings.sectionVisibility;
  const arabic = locale === "ar";
  const summary = arabic ? content.profile.summaryAr ?? content.profile.summaryEn : content.profile.summaryEn;
  const showWhatsapp = content.contact.whatsapp;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <Reveal className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.35fr_0.65fr] md:py-28">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">
              {t.hero.kicker}
            </p>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {content.profile.name}
            </h1>
            <p className="mt-4 text-xl text-muted sm:text-2xl">{content.profile.title}</p>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <MapPinIcon className="size-4 text-accent" />
              <span>
                {t.hero.locationLabel}: {content.profile.location}
              </span>
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-accent hover:text-accent-contrast"
              >
                {t.hero.ctaPrimary}
              </a>
              <a
                href="#contact"
                className="rounded-full border border-line px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {t.hero.ctaSecondary}
              </a>
              {content.profile.resumeUrl && (
                <a
                  href={content.profile.resumeUrl}
                  download
                  className="rounded-full border border-line px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {t.hero.cv}
                </a>
              )}
            </div>
          </div>

          <aside className="relative min-h-64 overflow-hidden rounded-2xl border border-line bg-surface">
            {content.profile.imageUrl ? (
              <Image
                src={content.profile.imageUrl}
                alt={content.profile.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-cover"
              />
            ) : (
              <div className="monogram flex h-full min-h-64 flex-col justify-between p-6">
                <span className="text-xs uppercase tracking-[0.3em] text-muted">RTS / 01</span>
                <span className="select-none text-7xl font-semibold tracking-tighter text-foreground/90">
                  RTS
                </span>
                <span className="text-xs text-muted">{content.profile.title}</span>
              </div>
            )}
          </aside>
        </Reveal>
      </section>

      {visible.about && (
        <section id="about" className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading index="01" kicker={t.about.kicker} title={t.about.title} />
          <Reveal className="grid gap-8 md:grid-cols-[1.4fr_0.6fr]">
            <div>
              {arabic && !content.profile.summaryAr && (
                <PendingBadge>{t.about.translationPending}</PendingBadge>
              )}
              <p className="mt-4 max-w-3xl text-lg leading-9 text-muted">{summary}</p>
            </div>
            <dl className="grid content-start gap-4">
              <div className="rounded-xl border border-line bg-surface p-5">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted">
                  {t.about.languageLabel}
                </dt>
                <dd className="mt-3 space-y-1 text-sm text-foreground">
                  {languages.map((language) => (
                    <p key={language.name}>
                      {language.name} — {language.level}
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
          </Reveal>
        </section>
      )}

      {visible.skills && (
        <section id="skills" className="border-y border-line bg-surface-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionHeading index="02" kicker={t.skills.kicker} title={t.skills.title} />
            <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.skillGroups.map((group) => (
                <article
                  key={group.id}
                  className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/60"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {arabic ? group.labelAr ?? group.labelEn : group.labelEn}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <Chip key={skill}>{skill}</Chip>
                    ))}
                  </ul>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {visible.projects && (
        <section id="projects" className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading index="03" kicker={t.projects.kicker} title={t.projects.title} />
          <Reveal className="grid gap-6 lg:grid-cols-2">
            {content.projects.map((project, index) => (
              <article
                key={project.slug}
                className="flex flex-col rounded-2xl border border-line bg-surface p-6"
              >
                <span className="text-xs font-medium tracking-[0.3em] text-accent">
                  {project.source === "github"
                    ? t.projects.githubSource
                    : `0${index + 1}`}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-foreground">{project.title}</h3>
                <p className="mt-3 leading-7 text-muted">
                  {arabic ? project.descriptionAr ?? project.descriptionEn : project.descriptionEn}
                </p>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {t.projects.stackLabel}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.stack.map((technology) => (
                      <Chip key={technology}>{technology}</Chip>
                    ))}
                  </ul>
                </div>

                {project.features.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      {t.projects.featuresLabel}
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                      {project.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span aria-hidden="true" className="text-accent">
                            ·
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-8">
                  {project.repoUrl ? (
                    <ExternalLink href={project.repoUrl}>GitHub</ExternalLink>
                  ) : (
                    <PendingLink>{t.projects.repoPending}</PendingLink>
                  )}
                  {project.source !== "github" &&
                    (project.demoUrl ? (
                      <ExternalLink href={project.demoUrl}>Demo</ExternalLink>
                    ) : (
                      <PendingLink>{t.projects.demoPending}</PendingLink>
                    ))}
                </div>
              </article>
            ))}
          </Reveal>
        </section>
      )}

      {visible.github && (
        <section id="github" className="border-y border-line bg-surface-muted/40">
          <Reveal className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-[1fr_1fr]">
            <div>
              <SectionHeading index="04" kicker={t.github.kicker} title={t.github.title} />
              <ExternalLink href={`https://github.com/${content.github.login}`}>
                {t.github.profileCta}
              </ExternalLink>
            </div>
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6">
              <GitHubIcon className="size-8 text-accent" />
              {content.github.repos.length === 0 ? (
                <p className="mt-5 leading-7 text-muted">{t.github.syncPending}</p>
              ) : (
                <ul className="mt-5 grid gap-3">
                  {content.github.repos.map((repo) => (
                    <li key={repo.fullName} className="rounded-lg border border-line p-3">
                      <ExternalLink href={repo.htmlUrl}>{repo.fullName}</ExternalLink>
                      {repo.description && (
                        <p className="mt-2 text-sm text-muted">{repo.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {visible.certification && (
        <section id="certification" className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            index="05"
            kicker={t.certification.kicker}
            title={t.certification.title}
          />
          <Reveal className="grid gap-4">
            {content.certifications.map((item) => (
              <article key={item.title} className="rounded-2xl border border-line bg-surface p-6">
                {arabic && (
                  <div className="mb-4">
                    <PendingBadge>{t.certification.translationPending}</PendingBadge>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-4 text-sm text-muted">
                  <span className="uppercase tracking-[0.2em]">{t.certification.issuerLabel}</span>:{" "}
                  {item.issuer}
                </p>
                {item.issueDate && (
                  <p dir="ltr" className="mt-2 text-sm text-muted">
                    {item.issueDate}
                  </p>
                )}
                {item.coverage.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      {t.certification.coverageLabel}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.coverage.map((coverage) => (
                        <Chip key={coverage}>{coverage}</Chip>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {item.credentialUrl ? (
                    <ExternalLink href={item.credentialUrl}>
                      {t.certification.issuerLabel}
                    </ExternalLink>
                  ) : (
                    <PendingLink>{t.certification.credentialPending}</PendingLink>
                  )}
                  {item.documentUrl && (
                    <ExternalLink href={item.documentUrl}>PDF</ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </Reveal>
        </section>
      )}

      {visible.contact && (
        <section id="contact" className="border-t border-line bg-surface-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionHeading index="06" kicker={t.contact.kicker} title={t.contact.title} />
            <Reveal className="grid gap-4 md:grid-cols-3">
              {content.contact.phone && (
                <a
                  href={`tel:+20${content.contact.phone.replace(/^0/, "")}`}
                  className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {t.contact.phoneLabel}
                  </p>
                  <p className="mt-3 text-lg font-medium text-foreground">
                    {content.contact.phone}
                  </p>
                </a>
              )}
              {showWhatsapp && (
                <a
                  href={`https://web.whatsapp.com/send?phone=${showWhatsapp.replace(/^0/, "20")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {t.contact.whatsappLabel}
                  </p>
                  <p className="mt-3 text-lg font-medium text-foreground">{showWhatsapp}</p>
                </a>
              )}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {t.contact.socialLabel}
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {content.socialLinks.map((link) => (
                    <ExternalLink key={link.url} href={link.url}>
                      {link.platform === "GitHub" ? (
                        <GitHubIcon className="size-4" />
                      ) : link.platform === "LinkedIn" ? (
                        <LinkedInIcon className="size-4" />
                      ) : null}
                      {link.label}
                    </ExternalLink>
                  ))}
                </div>
              </div>
            </Reveal>
            {!content.contact.email && <p className="mt-6 text-xs text-muted">{t.contact.emailNote}</p>}
          </div>
        </section>
      )}
    </>
  );
}
