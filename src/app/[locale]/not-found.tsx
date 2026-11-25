import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-5 py-28">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">404</p>
      <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-xl leading-7 text-muted">{t("description")}</p>
      <div className="flex gap-3">
        <Link
          href="/en"
          className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
        >
          {t("english")}
        </Link>
        <Link
          href="/ar"
          className="rounded-full border border-line px-5 py-3 text-sm font-medium"
        >
          {t("arabic")}
        </Link>
      </div>
    </section>
  );
}
