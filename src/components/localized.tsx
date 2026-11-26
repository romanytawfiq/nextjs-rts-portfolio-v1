import { localize, needsEnglishTag } from "@/lib/arabic-copy";

// Renders owner-approved Arabic copy when one exists. Stored English that has
// no approved translation yet keeps its original text but is tagged as English
// so assistive technology switches language correctly.
export function Localized({ value, arabic }: { value: string; arabic: boolean }) {
  return (
    <span lang={needsEnglishTag(value, arabic) ? "en" : undefined}>
      {localize(value, arabic)}
    </span>
  );
}
