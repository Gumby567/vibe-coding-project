import { Helmet } from "react-helmet-async";
import type { CmsPayload } from "../../types/cms";
import type { LangKey } from "../../types/cms";

type Props = {
  payload: CmsPayload;
  lang: LangKey;
};

export function SeoHead({ payload, lang }: Props) {
  const title = payload.seo.title[lang] ?? payload.seo.title.en ?? "";
  const description = payload.seo.description[lang] ?? payload.seo.description.en ?? "";
  const ogTitle = payload.seo.ogTitle?.[lang] ?? payload.seo.ogTitle?.en ?? title;
  const ogDesc = payload.seo.ogDescription?.[lang] ?? payload.seo.ogDescription?.en ?? description;
  const team = import.meta.env.VITE_TEAM_SLUG ?? "<TEAM_SLUG>";

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="mainor-assignment" content="ai-web-2026" />
      <meta name="team-slug" content={team} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
