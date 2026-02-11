// lib/accept.ts
// for handling file acceptance and validation in FileUpload component

/**
 * Utility for handling file acceptance and validation.
 */

const DEFAULT_ACCEPT = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

/**
 * Returns the provided list or the default fallback list of accepted extensions.
 */
export function acceptList(list?: string[]): string[] {
  return list && list.length ? list : DEFAULT_ACCEPT;
}

/**
 * Joins accepted types into a comma-separated string for the HTML 'accept' attribute.
 */
export function buildAcceptAttr(list?: string[]): string {
  return acceptList(list).join(",");
}

/**
 * Validates if a file matches the allowed types (supports extensions, mime-types, and wildcards).
 */
export function hasAllowedType(file: File, accept: string[]): boolean {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  for (const rule of accept) {
    const r = rule.trim().toLowerCase();
    if (!r) continue;
    if (r.startsWith(".")) {
      if (name.endsWith(r)) return true;
    } else if (r.endsWith("/*")) {
      const major = r.slice(0, -2);
      if (mime.startsWith(major + "/")) return true;
    } else {
      if (mime === r) return true;
    }
  }
  return false;
}

/**
 * Formats a list of accepted types into a human-readable helper string.
 */
export function acceptHelperText(acceptArr: string[]): string {
  return acceptArr
    .map((x) => (x.endsWith("/*") ? x.replace("/*", "") : x))
    .join(", ");
}
