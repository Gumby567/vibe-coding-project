import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BlockRenderer } from "@/components/BlockRenderer";
import { SeoHead } from "@/components/SeoHead";
import { createDefaultCmsPayload, sortBlocks } from "@/lib/cms-defaults";
import { loadPublicCmsPayload } from "@/lib/cms-remote";
import type { CmsPayload } from "../../types/cms";

function IndexShell() {
  const { lang, payload } = useI18n();
  const blocks = useMemo(
    () => sortBlocks(payload.blocks).filter((b) => b.isVisible),
    [payload.blocks],
  );

  return (
    <>
      <SeoHead payload={payload} lang={lang} />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </main>
        <Footer />
      </div>
    </>
  );
}

const Index = () => {
  const [payload, setPayload] = useState<CmsPayload>(() => createDefaultCmsPayload());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadPublicCmsPayload();
      setPayload(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPayload(createDefaultCmsPayload());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("previewDraft") === "1") {
      const preview = window.sessionStorage.getItem("cmsPreviewPayload");
      if (preview) {
        try {
          setPayload(JSON.parse(preview) as CmsPayload);
          setLoading(false);
          return;
        } catch {
          setError("Unable to load preview draft.");
          setLoading(false);
          return;
        }
      }
    }
    void load();
  }, [load]);

  return (
    <I18nProvider payload={payload}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <>
          {error ? (
            <div className="bg-destructive/10 text-destructive text-center text-sm py-3 px-4 flex flex-wrap items-center justify-center gap-3">
              <span>{error}</span>
              <button type="button" className="underline font-medium" onClick={() => void load()}>
                Retry
              </button>
            </div>
          ) : null}
          <IndexShell />
        </>
      )}
    </I18nProvider>
  );
};

export default Index;
