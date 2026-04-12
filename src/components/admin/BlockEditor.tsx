import { useState, useEffect } from "react";
import type { BlockLocalizedContent, BlockType, ContentBlock } from "../../../types/cms";

type Props = {
  block: ContentBlock;
  onSave: (next: ContentBlock) => void | Promise<void>;
  onMoveUp?: () => void | Promise<void>;
  onMoveDown?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onToggleVisible?: (visible: boolean) => void | Promise<void>;
  disableUp?: boolean;
  disableDown?: boolean;
  canDelete?: boolean;
};

function emptyLang(): BlockLocalizedContent {
  return {};
}

export function BlockEditor({
  block,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleVisible,
  disableUp,
  disableDown,
}: Props) {
  const [en, setEn] = useState<BlockLocalizedContent>(() => ({ ...block.content.en }));
  const [et, setEt] = useState<BlockLocalizedContent>(() => ({ ...block.content.et }));
  const [visible, setVisible] = useState(block.isVisible);

  useEffect(() => {
    setEn({ ...block.content.en });
    setEt({ ...block.content.et });
    setVisible(block.isVisible);
  }, [block]);

  const buildBlock = (): ContentBlock => ({
    ...block,
    isVisible: visible,
    content: { en: { ...en }, et: { ...et } },
  });

  const patchLang = (lang: "en" | "et", patch: Partial<BlockLocalizedContent>) => {
    if (lang === "en") setEn((prev) => ({ ...prev, ...patch }));
    else setEt((prev) => ({ ...prev, ...patch }));
  };

  const renderFields = (lang: "en" | "et", c: BlockLocalizedContent, t: BlockType) => {
    if (t === "hero") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Title ({lang})
            <input
              style={{ width: "100%" }}
              value={c.title ?? ""}
              onChange={(e) => patchLang(lang, { title: e.target.value })}
            />
          </label>
          <label>
            Subtitle ({lang})
            <textarea
              style={{ width: "100%" }}
              rows={3}
              value={c.subtitle ?? ""}
              onChange={(e) => patchLang(lang, { subtitle: e.target.value })}
            />
          </label>
          <label>
            CTA ({lang})
            <input
              style={{ width: "100%" }}
              value={c.cta ?? ""}
              onChange={(e) => patchLang(lang, { cta: e.target.value })}
            />
          </label>
        </div>
      );
    }
    if (t === "about") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Title ({lang})
            <input
              style={{ width: "100%" }}
              value={c.title ?? ""}
              onChange={(e) => patchLang(lang, { title: e.target.value })}
            />
          </label>
          <label>
            Paragraphs ({lang}, blank line between)
            <textarea
              style={{ width: "100%" }}
              rows={8}
              value={(c.paragraphs ?? []).join("\n\n")}
              onChange={(e) =>
                patchLang(lang, {
                  paragraphs: e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </div>
      );
    }
    if (t === "offers") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Title ({lang})
            <input
              style={{ width: "100%" }}
              value={c.title ?? ""}
              onChange={(e) => patchLang(lang, { title: e.target.value })}
            />
          </label>
          <label>
            Items ({lang}, one per line)
            <textarea
              style={{ width: "100%" }}
              rows={8}
              value={(c.items ?? []).join("\n")}
              onChange={(e) =>
                patchLang(lang, {
                  items: e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </div>
      );
    }
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Title ({lang})
          <input
            style={{ width: "100%" }}
            value={c.title ?? ""}
            onChange={(e) => patchLang(lang, { title: e.target.value })}
          />
        </label>
        <label>
          Subtitle ({lang})
          <textarea
            style={{ width: "100%" }}
            rows={3}
            value={c.subtitle ?? ""}
            onChange={(e) => patchLang(lang, { subtitle: e.target.value })}
          />
        </label>
      </div>
    );
  };

  const cEn = { ...emptyLang(), ...en };
  const cEt = { ...emptyLang(), ...et };

  return (
    <article style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <strong>{block.type}</strong>
        <span style={{ color: "#666" }}>order {block.order}</span>
        {(block.updated_at || block.updated_by_email) && (
          <span style={{ color: "#555", fontSize: "0.85em" }}>
            {block.updated_at ? `Updated ${new Date(block.updated_at).toLocaleString()}` : "Updated: unknown"}
            {block.updated_by_email ? ` by ${block.updated_by_email}` : ""}
          </span>
        )}
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => {
              const v = e.target.checked;
              setVisible(v);
              void onToggleVisible?.(v);
            }}
          />{" "}
          visible
        </label>
        <button type="button" disabled={disableUp} onClick={() => void onMoveUp?.()}>
          Move up
        </button>
        <button type="button" disabled={disableDown} onClick={() => void onMoveDown?.()}>
          Move down
        </button>
        {canDelete ? (
          <button type="button" onClick={() => void onDelete?.()}>
            Delete
          </button>
        ) : null}
        <button type="button" onClick={() => void onSave(buildBlock())}>
          Save text
        </button>
      </header>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div>{renderFields("en", cEn, block.type)}</div>
        <div>{renderFields("et", cEt, block.type)}</div>
      </div>
    </article>
  );
}
