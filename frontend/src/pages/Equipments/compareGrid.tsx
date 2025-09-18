import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useCompareList } from "../../hooks/useCompareList";
import { formatPrice } from "../../services/helpers";
import { SELECTED_API, type CompareItem } from "../../services/compare";
import axios from "axios";
import CarCardGrid from "../../hocs/carGrid";

const keyOf = (it: CompareItem) => (it.id != null ? String(it.id) : `${it.name}-${it.price}`);

const buildTitleFromPrimary = (items: CompareItem[], urlEquipId: number | null) => {
  const primary = urlEquipId != null ? items.find((it) => it.id === urlEquipId) : null;
  const name = primary?.name ?? primary?.car_name ?? "Comparison";
  const brand = primary?.brand_name ?? "";
  const title = brand ? `${name}, ${brand}` : name;
  return { title, primary };
};

const sanitizeForFilename = (s: string) =>
  s.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim();

/**
 * Mobile-safe PDF opener:
 * - iOS & Android WebView: same-tab navigation to blob (most reliable)
 * - Desktop/Android Chrome with popups: open viewer window with toolbar + iframe
 * - Popup blocked: programmatic download
 * - Last resort: data URL navigation (for stubborn iOS cases)
 */
const openPdfCrossPlatform = (pdfBlob: Blob, title: string, safeFileName: string) => {
  const ua = navigator.userAgent || "";
  const isIOS = /\b(iPad|iPhone|iPod)\b/i.test(ua);
  const isAndroid = /\bAndroid\b/i.test(ua);
  const isAndroidWebView =
    isAndroid && (/\bVersion\/\d+\.\d+\b/i.test(ua) && /\b; wv\)\b/i.test(ua)) || /\b; wv\)\b/i.test(ua);
  const supportsDownloadAttr = "download" in document.createElement("a");

  const blobUrl = URL.createObjectURL(pdfBlob);

  // 1) Mobile-first: same-tab navigation works best on iOS & many WebViews
  if (isIOS || isAndroidWebView) {
    try {
      window.location.assign(blobUrl);
      // Keep it alive longer to avoid late load issues on mobile
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60_000);
      return;
    } catch {
      // fall through to next strategies
    }
  }

  // 2) Desktop/Android Chrome with popups -> display your viewer
  const win = window.open("", "_blank");
  if (win) {
    const html = `
      <!doctype html><html><head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html,body{height:100%;margin:0}
          .toolbar{position:sticky;top:0;padding:8px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #eee;background:#fff}
          .spacer{flex:1}
          .viewer{height:calc(100% - 49px)}
          .viewer iframe{width:100%;height:100%;border:0}
          button,a{font:14px system-ui,-apple-system,Segoe UI,Roboto,Arial}
          a.btn{display:inline-block;padding:6px 10px;border-radius:6px;background:#0ea5e9;color:#fff;text-decoration:none}
        </style>
      </head><body>
        <div class="toolbar">
          <strong>${title}</strong>
          <span class="spacer"></span>
          <a class="btn" id="dl" href="${blobUrl}" download="${safeFileName}">Yuklab olish</a>
        </div>
        <div class="viewer">
          <iframe src="${blobUrl}" title="${title}" aria-label="${title}"></iframe>
        </div>
      </body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();

    const cleanup = () => URL.revokeObjectURL(blobUrl);
    // Revoke later; desktop loads fast
    setTimeout(cleanup, 60_000);
    try {
      win.addEventListener("unload", cleanup, { once: true });
    } catch {
      // noop if cross-origin blocking
    }
    return;
  }

  // 3) Popup blocked -> programmatic download
  if (supportsDownloadAttr) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  // 4) Last resort (edge iOS cases): data URL navigation
  const reader = new FileReader();
  reader.onloadend = () => {
    try {
      window.location.assign(reader.result as string);
    } catch {
      // If even this fails, fall back to simply opening the blob URL
      window.location.assign(blobUrl);
    }
  };
  reader.readAsDataURL(pdfBlob);
};

const CompareGrid: React.FC = () => {
  const { equipmentId, id } = useParams<{ equipmentId?: string; id?: string }>();
  const urlEquipId =
    equipmentId && !Number.isNaN(Number(equipmentId))
      ? Number(equipmentId)
      : id && !Number.isNaN(Number(id))
      ? Number(id)
      : null;

  const { items, loading, error } = useCompareList();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // filter out the primary item from the grid, if needed
  const itemsToShow = useMemo(() => {
    if (urlEquipId == null) return items;
    return items.filter((it) => it.id !== urlEquipId);
  }, [items, urlEquipId]);

  const selectedItems = useMemo(
    () => itemsToShow.filter((it) => selectedKeys.includes(keyOf(it))),
    [itemsToShow, selectedKeys]
  );

  const toggleSelect = useCallback(
    (it: CompareItem) => {
      const key = keyOf(it);
      if (selectedKeys.includes(key)) {
        setSelectedKeys((prev) => prev.filter((k) => k !== key));
        setNotice(null);
        return;
      }
      if (selectedKeys.length >= 3) {
        setNotice("Siz 3 tagacha bo'lgan mashinalarni tanlay olasiz.");
        window.setTimeout(() => setNotice(null), 2000);
        return;
      }
      setSelectedKeys((prev) => [...prev, key]);
      setNotice(null);
    },
    [selectedKeys]
  );

  // map to the reusable grid item shape
  const gridItems = useMemo(
    () =>
      itemsToShow.map((it) => ({
        key: keyOf(it),
        image: it.image,
        model: `${it.brand_name ? `${it.brand_name} ` : ""}${it.car_name ?? it.name}`,
        price: formatPrice(it.price),
        equipment: it.name,
        selected: selectedKeys.includes(keyOf(it)),
        onClick: () => toggleSelect(it),
      })),
    [itemsToShow, selectedKeys, toggleSelect]
  );

  const buildFinalIds = (): number[] | { error: string } => {
    const selIds: number[] = [];
    for (const it of selectedItems) {
      if (it.id == null) return { error: `Selected item "${it.name}" has no id and cannot be sent.` };
      selIds.push(it.id);
    }
    const final: number[] = [];
    if (urlEquipId != null) final.push(urlEquipId);
    for (const id of selIds) {
      if (final.length >= (urlEquipId != null ? 4 : 3)) break;
      if (!final.includes(id)) final.push(id);
    }
    return final;
  };

  const handleCompare = async () => {
    setResultMessage(null);
    const built = buildFinalIds();
    if (typeof built === "object" && "error" in built) {
      setResultMessage(built.error);
      return;
    }
    const finalIds = built as number[];

    if (!finalIds.length) {
      setResultMessage("No IDs to send.");
      return;
    }

    const { title } = buildTitleFromPrimary(items, urlEquipId);
    const safeFileName = sanitizeForFilename(`${title}.pdf`);

    setSending(true);
    try {
      const res = await axios.post(SELECTED_API, { ids: finalIds }, { responseType: "blob" });
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });

      // 🔑 Mobile-safe open flow
      openPdfCrossPlatform(pdfBlob, title, safeFileName);

      setResultMessage("PDF generated.");
      setSelectedKeys([]);
      setNotice(null);
    } catch (e) {
      console.error(e);
      setResultMessage("Failed to generate PDF.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto px-4">
        {notice && (
          <div className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-100 p-2 rounded">
            {notice}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Avromobillarni taqqoslash </h1>

            {urlEquipId != null &&
              (() => {
                const comparedCar = items.find((it) => it.id === urlEquipId);
                return comparedCar ? (
                  <div className="text-sm text-slate-600 mt-1">
                    Tanlangan avto<span className="font-medium">{comparedCar.brand_name}</span>{" "}
                    <span className="font-medium">{comparedCar.car_name ?? comparedCar.name}</span>{" "}
                    — {formatPrice(comparedCar.price)}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 mt-1">Avtomobillar topilmadi</div>
                );
              })()}

            {selectedItems.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedItems.map((it) => (
                  <span
                    key={keyOf(it)}
                    className="inline-flex items-center gap-1 text-xs rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"
                    title={`${it.brand_name || ""} ${it.car_name ?? it.name} — ${it.name}`}
                  >
                    <span className="font-medium">{it.brand_name}</span>
                    <span>{it.car_name ?? it.name}</span>
                    <span className="text-slate-500">— {it.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-md text-sm ${
                selectedItems.length === 0
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
              onClick={handleCompare}
            >
              {sending ? "Yuklanmoqda..." : `Yuklash (${selectedItems.length})`}
            </button>
          </div>
        </div>

        {resultMessage && <div className="mb-4 text-sm text-slate-700">{resultMessage}</div>}

        {/* 👇 Reusing the same grid component */}
        {loading && <div className="py-12 text-center text-slate-600">Yuklanmoqda…</div>}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded mb-4">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <CarCardGrid items={gridItems} emptyText="No cars available for comparison." />
        )}
      </div>
    </div>
  );
};

export default CompareGrid;
