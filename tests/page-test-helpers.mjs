import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Everything is addressed relative to portal-en/, the portal root. */
const PORTAL_ROOT = new URL("../", import.meta.url);

function portalUrl(relativePath) {
  return new URL(relativePath, PORTAL_ROOT);
}

export function readPage(relativePath) {
  return readFileSync(portalUrl(relativePath), "utf8");
}

/* The globals a classic script may rely on. No document: page logic must be
   pure and guard its own init() behind `typeof document !== "undefined"`. */
function createPageContext() {
  const context = {
    console,
    URLSearchParams,
    structuredClone,
    setTimeout,
    clearTimeout,
    Intl,
    Date
  };
  return vm.createContext(context);
}

function missingGlobal(globalName, relativePath) {
  return new Error(
    `${globalName} was not exposed on globalThis by ${relativePath}. ` +
      `Check that the script assigns globalThis.${globalName}.`
  );
}

/**
 * Load a single classic script asset (and, optionally, the assets it depends
 * on) into one vm context and return the global it exposes.
 */
export function loadScriptApi(relativePath, globalName, dependencies = []) {
  const context = createPageContext();
  for (const dependency of dependencies) {
    vm.runInContext(readPage(dependency), context, { filename: dependency });
  }
  const source = readPage(relativePath);
  vm.runInContext(source, context, { filename: relativePath });
  if (!context[globalName]) throw missingGlobal(globalName, relativePath);
  return { source, api: context[globalName], context };
}

/**
 * Load an HTML page the way a browser would: every <script> in document order,
 * external `src` assets read from disk and resolved relative to the page's own
 * directory, all sharing one vm context.
 */
export function loadPageApi(relativePath, globalName) {
  const html = readPage(relativePath);
  const tags = [...html.matchAll(/<script(?:\s([^>]*))?>([\s\S]*?)<\/script>/gi)];
  if (!tags.length) throw new Error(`${relativePath} has no scripts`);
  const pageUrl = portalUrl(relativePath);
  const context = createPageContext();
  for (const [, attributes = "", inlineSource] of tags) {
    const sourcePath = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (sourcePath) {
      /* Resolved against the page, not the portal root, so a page in a
         subdirectory still finds its own assets. */
      const resolved = new URL(sourcePath, pageUrl);
      vm.runInContext(readFileSync(resolved, "utf8"), context, { filename: sourcePath });
    } else {
      vm.runInContext(inlineSource, context, { filename: relativePath });
    }
  }
  if (!context[globalName]) throw missingGlobal(globalName, relativePath);
  return { html, api: context[globalName], context };
}
