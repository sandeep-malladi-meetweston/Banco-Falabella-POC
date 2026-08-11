import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi, readPage } from "./page-test-helpers.mjs";

/* Spec §9, asserted against page source and against everything the two pages
   actually render.
 *
 * Two kinds of assertion live here, and the distinction matters:
 *
 *   - Static source. The `<html lang>`, the skip link, the live region, and the
 *     whole CSS block are written once, so they are checked once, as text.
 *   - Rendered markup. Every control the pages emit is emitted by a render
 *     function, so the roles, the labels, and the accessible names are checked
 *     against the union of every state those functions can be in — both drawer
 *     modes, all five lender tabs, all three borrower phases, an open borrower
 *     drawer per document, a read-only fixture, the developer draft, the signing
 *     sheet, and the signed decision record.
 *
 * Nothing here needs a browser, so nothing here can check what a browser
 * computes: contrast ratios and the 360px layout were walked by eye and are
 * written up in automation/logs/decisions.md. What is mechanically checkable is
 * checked — including the rule that lime is a border and a fill colour and never
 * a text colour, which is the one contrast failure a stylesheet can state. */

const lenderPage = loadPageApi("lender.html", "FalabellaLender");
const borrowerPage = loadPageApi("borrower.html", "FalabellaBorrower");

const lender = lenderPage.api;
const borrower = borrowerPage.api;
const workspace = lenderPage.context.FalabellaWorkspace;
const copy = lenderPage.context.FalabellaCopy;
const copySource = readPage("assets/copy.js");

const plain = value => JSON.parse(JSON.stringify(value));
const NOW = "2026-08-06T12:00:00.000Z";
const CASE_ID = "H-2026-08415";

/* ============================================================ source helpers */

/* Comments are source but they are not markup: a design note that discusses
   "Needs review" as a concept is not an English literal shipped to a reader.
   The blocklist therefore reads the page with its commentary removed, which is
   also the only reading under which it can be a useful test. */
function withoutComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

/* Every declaration block in the page's <style>, whether it sits at the top
   level or inside a media query — inner rules hold no braces of their own, so
   one pass over the stylesheet finds both. Comments are stripped first: a design
   note above a rule is not part of its selector, and leaving it in would make
   `.phase-rail` and `/* the rail *​/ .phase-rail` two different selectors. */
function styleRules(source) {
  const styles = withoutComments(
    [...source.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join("\n")
  );
  assert.ok(styles.trim(), "the page has no <style> block");
  return [...styles.matchAll(/([^{}@]+)\{([^{}]+)\}/g)].map(match => ({
    selector: match[1].trim(),
    body: match[2].replace(/\s+/g, "")
  }));
}

/* The media queries a page opens, by their max-width, so the breakpoint
   assertions name a number rather than a string of CSS. */
function mediaBreakpoints(source) {
  return [...source.matchAll(/@media\s*\(\s*max-width\s*:\s*(\d+)px\s*\)/gi)].map(match =>
    Number(match[1])
  );
}

function reducedMotionBlock(source) {
  const match = source.match(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([\s\S]*?)\n/i);
  return match ? match[1] : "";
}

/** The selectors that carry a given declaration, anywhere in the stylesheet. */
function selectorsDeclaring(source, declaration) {
  return styleRules(source)
    .filter(rule => rule.body.includes(declaration))
    .flatMap(rule => rule.selector.split(",").map(part => part.trim()));
}

/* ============================================================ markup helpers */

function openTags(markup, name) {
  return [...markup.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(match => match[0]);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"));
  return match ? match[1] : null;
}

function hasAttribute(tag, name) {
  return new RegExp(`\\s${name}(?=[\\s=>/])`, "i").test(tag);
}

/** Every `id` the markup defines, so a labelling reference can be resolved. */
function idsIn(markup) {
  return new Set([...markup.matchAll(/\sid="([^"]*)"/g)].map(match => match[1]));
}

/** Every `for` a label points at. */
function labelTargets(markup) {
  return new Set(openTags(markup, "label").map(tag => attribute(tag, "for")).filter(Boolean));
}

/** An element's own text, tags stripped — the accessible name of last resort. */
function elementsWithText(markup, name) {
  return [...markup.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, "gi"))].map(
    match => ({
      tag: `<${name}${match[1]}>`,
      text: match[2].replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, "x").trim()
    })
  );
}

/* ================================================== everything the pages render */

const uiState = overrides => ({ ...plain(lender.DEFAULT_VIEW_STATE), ...overrides });

const liveLoan = state => lender.createInteractiveLoan(null, state || lender.fallbackCaseState());

function fixtureLoan(caseId) {
  const loan = plain(lender.buildPortfolio()).find(item => item.caseId === caseId);
  loan.state = workspace.normalizeState(loan.state);
  loan.reviewItems = loan.state.reviewItems;
  return loan;
}

/* The state at the end of the demo path: both conditions cleared, approved and
   signed, so the signing sheet and the decision record are on the page too. The
   two delayed arrivals are fired through the injected `later`, never waited on. */
function signedLoan() {
  const queue = [];
  const later = (ms, fn) => queue.push(fn);
  let state = lender.fallbackCaseState();
  let arrived = null;
  const onArrival = result => { arrived = result; };

  state = lender.requestDeveloperConfirmation(state, {
    later,
    timestamp: "2026-08-06T12:05:00.000Z",
    arrivalTimestamp: "2026-08-06T12:09:00.000Z",
    onArrival
  }).state;
  queue.shift()();
  state = arrived.state;

  state = lender.remindBorrower(state, {
    later,
    timestamp: "2026-08-06T12:12:00.000Z",
    arrivalTimestamp: "2026-08-06T12:16:00.000Z",
    onArrival
  }).state;
  queue.shift()();
  state = arrived.state;

  state = lender.approveWithConditions(state, { timestamp: "2026-08-06T12:20:00.000Z" }).state;
  state = lender.signApproval(state, { timestamp: "2026-08-06T12:22:00.000Z" }).state;
  return liveLoan(state);
}

/* Every distinct shape of the lender surface, concatenated. */
const LENDER_MARKUP = (() => {
  const loans = lender.buildPortfolio();
  const live = liveLoan();
  const signed = signedLoan();
  let markup = lender.renderPortfolioPage(loans, uiState({}), NOW);
  markup += lender.renderPortfolioPage(loans, uiState({ view: "needs-review" }), NOW);
  /* A search that matches nothing: the reset row is a control like any other. */
  markup += lender.renderPortfolioPage(loans, uiState({ query: "no such borrower" }), NOW);
  markup += lender.renderPortfolioPage(loans, uiState({ selectedCaseId: CASE_ID }), NOW);
  for (const tab of plain(lender.WORKSPACE_TABS)) {
    for (const panelMode of ["drawer", "full"]) {
      markup += lender.renderWorkspace(live, uiState({ selectedCaseId: CASE_ID, activeTab: tab, panelMode }));
      markup += lender.renderWorkspace(signed, uiState({ selectedCaseId: CASE_ID, activeTab: tab, panelMode }));
    }
  }
  /* The drafted email, and the two read-only fixtures with open work. */
  markup += lender.renderWorkspace(
    live,
    uiState({ selectedCaseId: CASE_ID, activeTab: "overview", draft: "developer-query" })
  );
  for (const caseId of ["H-2026-08391", "H-2026-08344", "H-2026-08102"]) {
    markup += lender.renderWorkspace(fixtureLoan(caseId), uiState({ selectedCaseId: caseId }));
  }
  return markup;
})();

/* Every distinct shape of the borrower surface, concatenated. */
const BORROWER_MARKUP = (() => {
  const finished = borrower.runScript();
  let markup = "";
  for (const phase of plain(borrower.PHASES)) {
    const view = { ...plain(borrower.initialViewState()), phase };
    markup += borrower.renderPage(view);
  }
  markup += borrower.renderPage(finished);
  markup += borrower.renderPage({ ...plain(finished), paused: true });
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    let view = borrower.openDocument(finished, documentId);
    markup += borrower.renderDrawer(view);
    markup += borrower.renderDrawer(borrower.setDrawerTab(view, "history"));
  }
  return markup;
})();

const PAGES = [
  { name: "lender.html", source: lenderPage.html, markup: LENDER_MARKUP, skipTarget: "loan-board" },
  {
    name: "borrower.html",
    source: borrowerPage.html,
    markup: BORROWER_MARKUP,
    skipTarget: "borrower-main"
  }
];

/* ================================================================= the shell */

test("both pages declare lang=\"en\"", () => {
  for (const page of PAGES) {
    assert.match(page.source, /<html lang="en">/, `${page.name} does not declare lang="en"`);
  }
});

test("both pages carry a skip link to a target id that exists", () => {
  for (const page of PAGES) {
    const link = page.source.match(/<a[^>]*class="skip-link"[^>]*>/);
    assert.ok(link, `${page.name} has no skip link`);
    const href = attribute(link[0], "href");
    assert.equal(href, `#${page.skipTarget}`, `${page.name}'s skip link points nowhere useful`);
    /* The target has to be something the page actually renders. */
    assert.ok(
      idsIn(page.markup).has(page.skipTarget),
      `${page.name} renders no element with id="${page.skipTarget}"`
    );
    /* And it must be the first focusable thing in the document. */
    const body = page.source.slice(page.source.indexOf("<body>"));
    assert.match(
      body,
      /<body>\s*<a[^>]*class="skip-link"/,
      `${page.name}'s skip link is not the first element in the body`
    );
  }
});

test("the skip link takes its name from copy.js, not from the markup", () => {
  for (const page of PAGES) {
    const link = page.source.match(/<a[^>]*class="skip-link"[^>]*>([\s\S]*?)<\/a>/);
    assert.ok(link, `${page.name} has no skip link`);
    const key = attribute(link[0], "data-copy");
    assert.ok(key, `${page.name}'s skip link carries no data-copy key`);
    assert.ok(
      Object.prototype.hasOwnProperty.call(copy.COPY.en, key),
      `${page.name}'s skip link names an unknown copy key: ${key}`
    );
    assert.ok(copy.COPY.en[key].trim(), `${key} is empty`);
    assert.equal(link[1].trim(), "", `${page.name}'s skip link hardcodes its own English`);
    /* Something has to fill it in. */
    assert.match(
      page.source,
      /\[data-copy\]/,
      `${page.name} never resolves its data-copy elements`
    );
  }
});

test("both pages carry one polite status region for state announcements", () => {
  for (const page of PAGES) {
    const regions = openTags(page.source, "div").filter(tag => attribute(tag, "role") === "status");
    assert.equal(regions.length, 1, `${page.name} should have exactly one role="status" region`);
    assert.equal(
      attribute(regions[0], "aria-live"),
      "polite",
      `${page.name}'s status region is not aria-live="polite"`
    );
    assert.ok(attribute(regions[0], "id"), `${page.name}'s status region has no id to write into`);
  }
});

test("both pages set their document title from copy, not from a literal <title>", () => {
  for (const page of PAGES) {
    const title = page.source.match(/<title>([\s\S]*?)<\/title>/);
    assert.ok(title, `${page.name} has no <title>`);
    /* The brand name is the same in every locale; anything more is copy. */
    assert.equal(
      title[1].trim(),
      copy.COPY.en["common.brand-name"],
      `${page.name}'s static <title> holds translatable English`
    );
    assert.match(
      page.source,
      /document\.title = t\("(lender|borrower)\.page-title"\)/,
      `${page.name} never sets its title from copy`
    );
  }
});

/* =================================================================== the CSS */

test("focus is visible as a 3px brand outline with an offset on both pages", () => {
  for (const page of PAGES) {
    const rules = styleRules(page.source).filter(rule => rule.selector.includes(":focus-visible"));
    assert.ok(rules.length, `${page.name} has no :focus-visible rule`);
    const focus = rules.find(rule => rule.body.includes("outline:3pxsolidvar(--brand)"));
    assert.ok(focus, `${page.name}'s focus outline is not 3px solid var(--brand)`);
    assert.match(
      focus.body,
      /outline-offset:3px/,
      `${page.name}'s focus outline has no offset`
    );
    /* Every kind of control the pages emit, not just buttons. */
    for (const control of ["button", "a", "input", "select", "textarea"]) {
      assert.ok(
        rules.some(rule =>
          rule.selector.split(",").some(part => part.trim().startsWith(`${control}:focus-visible`))
        ),
        `${page.name} does not give ${control} a visible focus ring`
      );
    }
  }
});

test("a prefers-reduced-motion block neutralises transitions and animations", () => {
  for (const page of PAGES) {
    const block = reducedMotionBlock(page.source);
    assert.ok(block, `${page.name} has no @media (prefers-reduced-motion: reduce) block`);
    assert.match(block, /\*\s*,\s*\*::before\s*,\s*\*::after/, `${page.name} exempts pseudo-elements`);
    assert.match(block, /animation-duration:\s*\.?0*1?ms\s*!important/, `${page.name} keeps its animations`);
    assert.match(block, /transition-duration:\s*\.?0*1?ms\s*!important/, `${page.name} keeps its transitions`);
    assert.match(
      block,
      /animation-iteration-count:\s*1\s*!important/,
      `${page.name} lets a looping animation keep looping`
    );
    assert.match(block, /scroll-behavior:\s*auto\s*!important/, `${page.name} keeps smooth scrolling`);
  }
});

test("both pages break at 900px and at 620px", () => {
  for (const page of PAGES) {
    const breakpoints = mediaBreakpoints(page.source);
    for (const width of [900, 620]) {
      assert.ok(
        breakpoints.includes(width),
        `${page.name} has no ${width}px breakpoint (found ${breakpoints.join(", ") || "none"})`
      );
    }
  }
});

test("wide content scrolls inside its own container rather than the page", () => {
  /* The board, the tab strips and the nav scroller are the only things wider
     than a 360px viewport, and each one owns its own overflow. */
  const owners = {
    "lender.html": [".loan-board", ".portfolio-nav", ".workspace-tabs"],
    "borrower.html": [".phase-rail", ".drawer-tabs"]
  };
  for (const page of PAGES) {
    const scrollers = selectorsDeclaring(page.source, "overflow-x:auto");
    for (const selector of owners[page.name]) {
      assert.ok(
        scrollers.includes(selector),
        `${page.name}: ${selector} does not scroll inside itself`
      );
    }
    /* Nothing may be pinned wider than the narrowest viewport the demo claims
       to support. A bare 152px logo is fine; a bare 400px anything is not, and a
       min()/clamp() width is by construction not pinned at all. */
    const NARROWEST = 360;
    for (const rule of styleRules(page.source)) {
      for (const match of rule.body.matchAll(/(?:^|;)(?:min-)?width:(\d+)px(?=;|$)/g)) {
        assert.ok(
          Number(match[1]) < NARROWEST,
          `${page.name}: ${rule.selector} pins ${match[1]}px, wider than a ${NARROWEST}px viewport`
        );
      }
    }
  }
});

test("addresses, filenames and message bodies wrap instead of overflowing", () => {
  /* One selector per kind of unbroken user content, per page. */
  const wrappers = {
    "lender.html": {
      address: [".workspace-header h2", ".loan-borrower"],
      filename: [".document-title small", ".history-row strong"],
      message: [".record-message p", ".review-item-detail"]
    },
    "borrower.html": {
      address: [".rail-case", ".drawer-header h2"],
      filename: [".attachment .file-name", ".history-row span"],
      message: [".bubble"]
    }
  };
  for (const page of PAGES) {
    const wrapping = selectorsDeclaring(page.source, "overflow-wrap:anywhere");
    for (const [kind, selectors] of Object.entries(wrappers[page.name])) {
      for (const selector of selectors) {
        assert.ok(
          wrapping.includes(selector),
          `${page.name}: ${kind} at ${selector} has no overflow-wrap:anywhere`
        );
      }
    }
  }
});

test("lime is a border and a fill colour, never a text colour", () => {
  /* #c3d600 on white is 1.62:1. It carries no text on either surface, and the
     stylesheet has to keep saying so. */
  for (const page of PAGES) {
    for (const rule of styleRules(page.source)) {
      assert.doesNotMatch(
        rule.body,
        /(^|;)color:var\(--brand-lime\)/,
        `${page.name}: ${rule.selector} paints text in lime`
      );
    }
    assert.doesNotMatch(
      page.source.replace(/--brand-lime:#c3d600/g, ""),
      /(^|[;{])color:#c3d600/,
      `${page.name} paints text in lime`
    );
  }
});

/* ============================================================== the controls */

test("no control is a div or a span with a click handler, anywhere", () => {
  for (const page of PAGES) {
    for (const source of [page.source, page.markup]) {
      assert.doesNotMatch(source, /<(div|span)\b[^>]*\bonclick=/i, `${page.name} clicks a div or span`);
      /* Nor any other inline handler, on any element. */
      assert.doesNotMatch(source, /\son[a-z]+="/i, `${page.name} carries an inline event handler`);
    }
  }
});

test("nothing is draggable: stages are derived, never dragged", () => {
  for (const page of PAGES) {
    for (const source of [page.source, page.markup]) {
      assert.doesNotMatch(source, /\bdraggable\b/i, `${page.name} declares something draggable`);
    }
    assert.doesNotMatch(page.source, /\bdragstart\b|\bdrop\b|\bdataTransfer\b/, `${page.name} handles a drag`);
  }
});

test("every input, select and textarea has a label or an aria-label", () => {
  for (const page of PAGES) {
    const markup = page.source + page.markup;
    const targets = labelTargets(markup);
    const ids = idsIn(markup);
    const controls = ["input", "select", "textarea"].flatMap(name =>
      openTags(markup, name).map(tag => ({ name, tag }))
    );
    assert.ok(controls.length, `${page.name} renders no form controls at all`);
    for (const control of controls) {
      const id = attribute(control.tag, "id");
      const labelled = Boolean(id) && targets.has(id);
      const ariaLabel = attribute(control.tag, "aria-label");
      const ariaLabelledBy = attribute(control.tag, "aria-labelledby");
      assert.ok(
        labelled || (ariaLabel && ariaLabel.trim()) || (ariaLabelledBy && ids.has(ariaLabelledBy)),
        `${page.name}: ${control.name} ${id || control.tag} has no accessible name`
      );
      /* A placeholder is a hint, not a name. */
      if (!labelled && !ariaLabel && !ariaLabelledBy) {
        assert.fail(`${page.name}: ${control.name} ${id || ""} relies on its placeholder`);
      }
    }
  }
});

test("every button and link has an accessible name", () => {
  for (const page of PAGES) {
    for (const name of ["button", "a"]) {
      const elements = elementsWithText(page.markup, name);
      for (const element of elements) {
        const ariaLabel = attribute(element.tag, "aria-label");
        assert.ok(
          element.text || (ariaLabel && ariaLabel.trim()),
          `${page.name}: a ${name} has no accessible name — ${element.tag}`
        );
      }
    }
  }
});

test("decorative glyphs are hidden from assistive technology", () => {
  /* §2: attention is never colour alone, so the pages are full of glyphs. Every
     one of them sits beside a word and is therefore decorative. */
  for (const page of PAGES) {
    const glyphs = [...page.markup.matchAll(/<span([^>]*)>([◆✓✕×↗⌄★🔍📄])/g)];
    assert.ok(glyphs.length, `${page.name} renders no glyphs at all`);
    for (const glyph of glyphs) {
      assert.match(
        glyph[1],
        /aria-hidden="true"/,
        `${page.name}: the ${glyph[2]} glyph is read out as content`
      );
    }
  }
});

/* ================================================================ the drawer */

test("both drawers are modal dialogs labelled by their own heading", () => {
  for (const page of PAGES) {
    const dialogs = [...page.markup.matchAll(/<(aside|section)\b[^>]*role="dialog"[^>]*>/g)].map(
      match => match[0]
    );
    assert.ok(dialogs.length, `${page.name} renders no role="dialog"`);
    const ids = idsIn(page.markup);
    for (const dialog of dialogs) {
      assert.equal(attribute(dialog, "aria-modal"), "true", `${page.name}: a dialog is not modal`);
      const labelledBy = attribute(dialog, "aria-labelledby");
      assert.ok(labelledBy, `${page.name}: a dialog carries no labelling reference`);
      assert.ok(ids.has(labelledBy), `${page.name}: a dialog points at a missing id ${labelledBy}`);
      /* The reference has to be the heading, not just any element. */
      assert.match(
        page.markup,
        new RegExp(`<h2[^>]*id="${labelledBy}"`),
        `${page.name}: ${labelledBy} is not the dialog's heading`
      );
    }
  }
});

test("the background is inert while a drawer is open", () => {
  const board = lender.renderPortfolioPage(
    lender.buildPortfolio(),
    uiState({ selectedCaseId: CASE_ID }),
    NOW
  );
  assert.match(board, /<header class="topbar" inert aria-hidden="true">/);
  assert.match(board, /<div class="portal-layout" inert aria-hidden="true">/);
  /* And not when it is closed. */
  const open = lender.renderPortfolioPage(lender.buildPortfolio(), uiState({}), NOW);
  assert.doesNotMatch(open, /inert/);
  /* Both pages lock the body scroll behind the drawer, and style [inert]. */
  for (const page of PAGES) {
    assert.ok(
      styleRules(page.source).some(rule => rule.selector === "[inert]"),
      `${page.name} does not style [inert] for browsers that only polyfill it`
    );
    assert.ok(
      styleRules(page.source).some(rule => /body\.(workspace|drawer)-open/.test(rule.selector)),
      `${page.name} does not lock the body scroll behind its drawer`
    );
  }
});

test("escape closes the drawer, focus is trapped inside it, and focus is restored", () => {
  for (const page of PAGES) {
    assert.match(page.source, /"Escape"/, `${page.name} does not handle Escape`);
    assert.match(
      page.source,
      /addEventListener\("keydown"/,
      `${page.name} never listens for a key`
    );
    /* Closing has to put focus back somewhere deliberate. The two pages restore
       to different things — the lender to the card that opened the case, the
       borrower to the checklist row — so this asserts that a close path calls
       focus() at all, and the shape of each trap is asserted below. */
    assert.match(page.source, /\.focus\(\)/, `${page.name} never moves focus`);
  }
  /* Both traps are pure over (event, container, activeElement), which is what
     makes them assertable without a browser. */
  for (const api of [lender, borrower]) {
    assert.equal(typeof api.trapFocus, "function");
  }
  assert.equal(typeof lender.handleWorkspaceKeydown, "function");
  assert.equal(typeof borrower.handleDrawerKeydown, "function");
});

/* ================================================================== the tabs */

test("both tab strips are real tablists with one selected tab", () => {
  const strips = {
    "lender.html": lender.renderWorkspace(liveLoan(), uiState({ selectedCaseId: CASE_ID, activeTab: "risk" })),
    "borrower.html": borrower.renderDrawer(
      borrower.openDocument(borrower.runScript(), "title-certificate")
    )
  };
  for (const page of PAGES) {
    const markup = strips[page.name];
    const ids = idsIn(markup);

    const tablists = openTags(markup, "div").filter(tag => attribute(tag, "role") === "tablist");
    assert.equal(tablists.length, 1, `${page.name} should render exactly one tablist`);
    assert.ok(attribute(tablists[0], "aria-label"), `${page.name}'s tablist has no name`);

    const tabs = openTags(markup, "button").filter(tag => attribute(tag, "role") === "tab");
    assert.ok(tabs.length >= 2, `${page.name} renders fewer than two tabs`);
    const selected = tabs.filter(tag => attribute(tag, "aria-selected") === "true");
    assert.equal(selected.length, 1, `${page.name} should have exactly one aria-selected tab`);
    for (const tab of tabs) {
      const chosen = attribute(tab, "aria-selected") === "true";
      assert.ok(attribute(tab, "id"), `${page.name}: a tab has no id for its panel to point at`);
      assert.equal(
        attribute(tab, "tabindex"),
        chosen ? "0" : "-1",
        `${page.name}: the tab strip is not one tab stop`
      );
      const controls = attribute(tab, "aria-controls");
      assert.ok(controls && ids.has(controls), `${page.name}: a tab controls a missing panel`);
    }

    const panels = openTags(markup, "div").filter(tag => attribute(tag, "role") === "tabpanel");
    assert.equal(panels.length, 1, `${page.name} should render exactly one tabpanel`);
    assert.equal(attribute(panels[0], "tabindex"), "0", `${page.name}'s panel is not reachable`);
    const labelledBy = attribute(panels[0], "aria-labelledby");
    assert.equal(
      labelledBy,
      attribute(selected[0], "id"),
      `${page.name}'s panel is not labelled by its selected tab`
    );
  }
});

/* A tab strip thin enough to hand to a keydown handler: five tabs that record
   the clicks they receive, inside a container that answers querySelectorAll. */
function fakeTabStrip(count) {
  const clicked = [];
  const tabs = Array.from({ length: count }, (unused, index) => ({
    index,
    hidden: false,
    click() { clicked.push(index); },
    focus() {},
    closest(selector) { return selector === '[role="tab"]' ? this : null; }
  }));
  return {
    tabs,
    clicked,
    container: { querySelectorAll: () => tabs }
  };
}

test("arrow, Home and End move between tabs on both pages", () => {
  const handlers = {
    "lender.html": (event, container) =>
      lender.handleWorkspaceKeydown(event, {
        isOpen: true,
        container,
        activeElement: null,
        close() {}
      }),
    "borrower.html": (event, container) =>
      borrower.handleDrawerKeydown(event, {
        isOpen: true,
        container,
        activeElement: null,
        close() {}
      })
  };
  const expected = [
    { key: "ArrowRight", from: 0, lands: 1 },
    { key: "ArrowRight", from: 4, lands: 0, why: "wraps forward" },
    { key: "ArrowLeft", from: 0, lands: 4, why: "wraps backward" },
    { key: "ArrowLeft", from: 3, lands: 2 },
    { key: "Home", from: 3, lands: 0 },
    { key: "End", from: 1, lands: 4 }
  ];
  for (const page of PAGES) {
    for (const move of expected) {
      const strip = fakeTabStrip(5);
      let prevented = false;
      handlers[page.name](
        { key: move.key, target: strip.tabs[move.from], preventDefault() { prevented = true; } },
        strip.container
      );
      assert.deepEqual(
        strip.clicked,
        [move.lands],
        `${page.name}: ${move.key} from tab ${move.from} should land on ${move.lands}` +
          (move.why ? ` — it ${move.why}` : "")
      );
      assert.ok(prevented, `${page.name}: ${move.key} should not also scroll the panel`);
    }
    /* A key that is not a tab key is left alone. */
    const strip = fakeTabStrip(5);
    handlers[page.name](
      { key: "a", target: strip.tabs[0], preventDefault() {} },
      strip.container
    );
    assert.deepEqual(strip.clicked, [], `${page.name} hijacks ordinary typing`);
  }
});

test("Tab and Shift+Tab wrap inside both drawers", () => {
  for (const api of [lender, borrower]) {
    const strip = fakeTabStrip(3);
    const focused = [];
    strip.tabs.forEach(tab => { tab.focus = () => focused.push(tab.index); });

    /* Forward off the last control returns to the first. */
    assert.equal(
      api.trapFocus(
        { key: "Tab", shiftKey: false, preventDefault() {} },
        strip.container,
        strip.tabs[2]
      ),
      true
    );
    /* Backward off the first control goes to the last. */
    assert.equal(
      api.trapFocus(
        { key: "Tab", shiftKey: true, preventDefault() {} },
        strip.container,
        strip.tabs[0]
      ),
      true
    );
    assert.deepEqual(focused, [0, 2]);
    /* Focus that escaped the dialog is pulled back in. */
    assert.equal(
      api.trapFocus({ key: "Tab", shiftKey: false, preventDefault() {} }, strip.container, null),
      true
    );
    /* In the middle of the strip the browser is left to do its own job. */
    assert.equal(
      api.trapFocus(
        { key: "Tab", shiftKey: false, preventDefault() {} },
        strip.container,
        strip.tabs[1]
      ),
      false
    );
    /* And a key that is not Tab is not the trap's business. */
    assert.equal(
      api.trapFocus({ key: "Escape", preventDefault() {} }, strip.container, strip.tabs[0]),
      false
    );
  }
});

test("every rendered tab of the lender drawer keeps its aria-selected honest", () => {
  const loan = liveLoan();
  for (const tab of plain(lender.WORKSPACE_TABS)) {
    const markup = lender.renderWorkspace(loan, uiState({ selectedCaseId: CASE_ID, activeTab: tab }));
    const tabs = openTags(markup, "button").filter(item => attribute(item, "role") === "tab");
    const selected = tabs.filter(item => attribute(item, "aria-selected") === "true");
    assert.equal(selected.length, 1, `${tab} does not select exactly one tab`);
    assert.equal(attribute(selected[0], "data-workspace-tab"), tab);
  }
});

/* ================================================== §8's literal blocklist */

/* User-visible English that belongs to copy.js and to nowhere else. Every entry
   is a whole phrase rather than a single word: "Risk" and "Audit" are also the
   names of functions in the page, and a blocklist that cannot tell a heading
   from an identifier is a blocklist that gets weakened the first time it fires. */
const BLOCKED_LITERALS = [
  "Lender portal",
  "Home loan application",
  "Skip to main content",
  "Switch to borrower view",
  "Switch to lender view",
  "New applications",
  "Gathering documents",
  "Credit review",
  "Approved · awaiting deed",
  "Closed / archived",
  "Needs review",
  "Signing soon",
  "Active origination",
  "Not uploaded",
  "Under review",
  "Accepted with condition",
  "Borrower message",
  "Document exception",
  "Closing deadline",
  "New upload",
  "Mark resolved",
  "Send reply & resolve",
  "Approve with conditions",
  "Sign approval",
  "Escalate to manager",
  "Reset case",
  "Send query",
  "Back to board",
  "Read-only demo loan",
  "Current title certificate",
  "Tax folder for credit purposes (SII)"
];

test("every blocked literal is copy.js's to own", () => {
  const values = Object.values(copy.COPY.en);
  for (const literal of BLOCKED_LITERALS) {
    assert.ok(
      copySource.includes(literal),
      `${literal} is on the blocklist but is not in copy.js`
    );
    assert.ok(
      values.some(value => value.includes(literal)),
      `${literal} is in copy.js but not as a copy value`
    );
  }
});

test("no blocked literal appears in either page's source", () => {
  for (const page of PAGES) {
    const source = withoutComments(page.source);
    for (const literal of BLOCKED_LITERALS) {
      assert.ok(
        !source.includes(literal),
        `${page.name} hardcodes "${literal}" instead of resolving it through t()`
      );
    }
  }
});

test("no blocked literal appears in what the pages render either — it comes from copy", () => {
  /* The point of the blocklist is not that the words never reach the reader; it
     is that they reach the reader from copy.js. So they must be in the rendered
     markup, and must have arrived through t(). */
  const rendered = LENDER_MARKUP + BORROWER_MARKUP;
  const reaching = BLOCKED_LITERALS.filter(literal => rendered.includes(literal));
  assert.ok(
    reaching.length > BLOCKED_LITERALS.length / 2,
    "the blocklist has drifted away from what the pages actually show"
  );
});
