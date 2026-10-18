/**
 * Nombres legibles y reglas de clasificación de eventos.
 * Contrato de eventos: gsg-web/docs/analytics-events.md
 */

export const EVENT_TYPES = {
  viewProduct: "view_product",
  whatsappOpen: "whatsapp_widget_open",
  whatsappClick: "whatsapp_click",
  documentClick: "document_click",
  catalogClick: "catalog_click",
  distributorClick: "distributor_contact_click",
  viewDownloadPage: "view_download_page",
} as const;

export const TRACKED_EVENT_TYPES = Object.values(EVENT_TYPES);

export const FAMILIES = ["luminarias", "perfiles", "rollos", "accesorios", "fuentes"] as const;
export type Family = (typeof FAMILIES)[number];

export const FAMILY_LABELS: Record<Family, string> = {
  luminarias: "Luminarias",
  perfiles: "Perfiles LED",
  rollos: "Rollos LED",
  accesorios: "Accesorios",
  fuentes: "Fuentes LED",
};

export function isFamily(value: unknown): value is Family {
  return typeof value === "string" && (FAMILIES as readonly string[]).includes(value);
}

export interface AnalyticsEventRow {
  id: number | string;
  event_type: string;
  product_code: string | null;
  product_name: string | null;
  category: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const meta = (e: AnalyticsEventRow, key: string): string => {
  const v = e.metadata?.[key];
  return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v);
};

export const metaString = meta;

/**
 * Familia del producto asociado al evento, o null si es una acción general.
 * Los view_product históricos (sin versión ni familia) son luminarias: era la única familia medida.
 */
export function eventFamily(e: AnalyticsEventRow): Family | null {
  const family = meta(e, "family");
  if (isFamily(family)) return family;
  if (e.event_type === EVENT_TYPES.viewProduct && !e.metadata?.v && e.product_code) return "luminarias";
  return null;
}

export function eventProductKey(e: AnalyticsEventRow): string | null {
  const family = eventFamily(e);
  if (!family || !e.product_code) return null;
  return `${family}:${e.product_code}`;
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return "";
  }
}

const DEV_HOST_RE = /(^localhost$|^127\.0\.0\.1$|\.vercel\.app$|\.local$)/;

/**
 * Actividad de desarrollo o preview. Los eventos nuevos traen `env`; en los históricos
 * se infiere por el referrer (localhost o *.vercel.app). El resto del histórico se conserva.
 */
export function isDevEvent(e: AnalyticsEventRow): boolean {
  const env = meta(e, "env");
  if (env) return env !== "production";
  return DEV_HOST_RE.test(hostOf(meta(e, "referrer")));
}

export type SourceKind = "internal" | "search" | "social" | "ai" | "direct" | "other";

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  search: "Buscadores",
  direct: "Sin referencia",
  internal: "Navegación interna",
  social: "Redes sociales",
  ai: "Asistentes de IA",
  other: "Otros sitios",
};

const SEARCH: Array<[RegExp, string]> = [
  [/(^|\.)google\.[a-z.]+$|googlequicksearchbox/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
];
const SOCIAL: Array<[RegExp, string]> = [
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)linktr\.ee$/, "Linktree"],
  [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "LinkedIn"],
  [/(^|\.)t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X"],
  [/(^|\.)whatsapp\.com$/, "WhatsApp"],
];
const AI: Array<[RegExp, string]> = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)gemini\.google\.com$/, "Gemini"],
  [/(^|\.)claude\.ai$/, "Claude"],
  [/(^|\.)copilot\.microsoft\.com$/, "Copilot"],
];

/**
 * Agrupa el referrer (origen o URL histórica) en un tipo y un nombre. No asume campañas.
 */
export function sourceOf(referrer: string): { kind: SourceKind; label: string } {
  if (!referrer) return { kind: "direct", label: "Sin referencia" };
  const raw = referrer.toLowerCase();
  const host = hostOf(referrer) || raw.replace(/^[a-z-]+:\/\//, "").split("/")[0];
  if (host === "gsgdesign.com.ar" || host.endsWith(".gsgdesign.com.ar")) {
    return { kind: "internal", label: "Navegación interna" };
  }
  // Gemini antes que Google
  for (const [re, label] of AI) if (re.test(host)) return { kind: "ai", label };
  for (const [re, label] of SEARCH) if (re.test(host) || re.test(raw)) return { kind: "search", label };
  for (const [re, label] of SOCIAL) if (re.test(host)) return { kind: "social", label };
  return { kind: "other", label: host || "Desconocido" };
}

/**
 * Ruta técnica → nombre de página comprensible
 */
export function pageLabel(path: string): string {
  const p = (path || "").replace(/\/+$/, "") || "/";
  const seg = p.split("/").filter(Boolean);
  if (p === "/") return "Inicio";
  switch (seg[0]) {
    case "productos":
      if (seg[1] === "perfiles") return seg[2] ? "Ficha de perfil LED" : "Perfiles LED";
      if (seg.length >= 3) return "Ficha de luminaria";
      if (seg.length === 2) return "Listado de luminarias";
      return "Productos";
    case "led":
      return seg[1] ? "Ficha de rollo LED" : "Rollos LED";
    case "accesorios":
      return seg[1] ? "Ficha de accesorio" : "Accesorios";
    case "fuentes":
      return seg[1] ? "Ficha de fuente LED" : "Fuentes LED";
    case "distribuidores":
      return "Distribuidores";
    case "contacto":
      return "Contacto";
    case "nosotros":
      return "Nosotros";
    case "descargas":
      return seg[1] ? `Página de descargas "${seg[1]}"` : "Descargas";
    default:
      return p;
  }
}

export const WHATSAPP_REASON_LABELS: Record<string, string> = {
  business_inquiry: "Tengo un negocio y quiero conocer GSG",
  existing_customer: "Ya soy cliente de GSG",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  datasheet: "Ficha técnica",
  spec: "Especificaciones",
  pdf: "Documento",
  download_page_file: "Archivo de página de descargas",
};

export const DISTRIBUTOR_ACTION_LABELS: Record<string, string> = {
  phone: "Llamar",
  maps: "Ver en el mapa",
  whatsapp: "WhatsApp",
};

/** URL pública de una ficha cuando el evento no trae la ruta */
export function productFallbackPath(family: Family, code: string): string | null {
  switch (family) {
    case "perfiles":
      return `/productos/perfiles/${code}`;
    case "rollos":
      return `/led/${code}`;
    case "accesorios":
      return `/accesorios/${code}`;
    case "fuentes":
      return `/fuentes/${code}`;
    default:
      return null;
  }
}
