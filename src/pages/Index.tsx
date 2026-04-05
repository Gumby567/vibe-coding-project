import { useSearchParams } from "react-router-dom";
import { useSiteCms } from "@/hooks/useSiteCms";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import { BlockRenderer } from "@/components/BlockRenderer";
import { SeoHead } from "@/components/SeoHead";
import type { CmsPayload } from "../../types/cms";
import { sortBlocks } from "@/lib/cms-defaults";

function IndexInner() {
  const { lang, payload } = useI18n();
  const sorted = sortBlocks(payload.blocks).filter((b) => b.isVisible);

  return (
    <>
      <SeoHead payload={payload} lang={lang} />
      <div className="min-h-screen">
        <Navbar />
        {sorted.map((block) =>
          block.type === "contact" ? (
            <ContactSection key={block.id} block={block} />
          ) : (
            <BlockRenderer key={block.id} block={block} lang={lang} />
          ),
        )}
        <Footer />
      </div>
    </>
  );
}

const Index = () => {
  const { data, isLoading, isError, error, refetch } = useSiteCms();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("preview") === "1";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Loading content…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">Could not load CMS content.</p>
        <p className="text-sm text-muted-foreground max-w-md">{String(error)}</p>
        <button type="button" className="text-primary underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const payload = data as CmsPayload;

  return (
    <I18nProvider payload={payload}>
      {preview && (
        <div
          role="status"
          className="bg-amber-500 text-black text-center text-sm font-medium py-2 px-4"
        >
          Preview — public content is read from Supabase. Add ?preview=1 to any URL to show this banner.
        </div>
      )}
      <IndexInner />
    </I18nProvider>
  );
};

export default Index;
