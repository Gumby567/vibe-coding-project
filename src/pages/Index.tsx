import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BlockRenderer } from "@/components/BlockRenderer";
import { SeoHead } from "@/components/SeoHead";
import { createDefaultCmsPayload, sortBlocks } from "@/lib/cms-defaults";
import { loadPublicCmsPayload } from "@/lib/cms-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
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
          {blocks.length === 0 ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">No blocks found</h1>
                <p className="text-muted-foreground mb-4">CMS payload: {JSON.stringify(payload, null, 2)}</p>
                <p className="text-sm text-muted-foreground">Blocks count: {payload.blocks?.length || 0}</p>
              </div>
            </div>
          ) : (
            blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))
          )}
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
          <div className="text-center">
            <p>Loading CMS content...</p>
            <p className="text-xs mt-2">Supabase configured: {isSupabaseConfigured ? 'Yes' : 'No'}</p>
            <p className="text-xs">Blocks in payload: {payload.blocks?.length || 0}</p>
          </div>
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
