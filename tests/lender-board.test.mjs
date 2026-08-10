import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi } from "./page-test-helpers.mjs";

/* Same load as lender-model.test.mjs: every <script> of the page in document
   order, one vm context, no document. The render functions under test are pure
   string builders, so they need nothing else. */
const { api: lender, context, html } = loadPageApi("lender.html", "FalabellaLender");
const workspace = context.FalabellaWorkspace;
const credit = context.FalabellaCredit;
const copy = context.FalabellaCopy;

/* Values crossing out of the vm realm carry that realm's prototypes. */
const plain = value => JSON.parse(JSON.stringify(value));
const t = (key, params) => copy.t(key, copy.DEFAULT_LOCALE, params);

const NOW = "2026-08-06T12:00:00.000Z";

const portfolio = () => plain(lender.buildPortfolio());
const findLoan = caseId => portfolio().find(loan => loan.caseId === caseId);

/* The board's own defaults, spread over by each test that cares. */
const viewState = overrides => ({ ...plain(lender.DEFAULT_VIEW_STATE), ...overrides });

/* ============================================================== the metrics */

test("the three metric tiles carry spec §5.2's labels and formatted values", () => {
  const markup = lender.renderMetrics(lender.buildPortfolio(), NOW);
  for (const key of [
    "lender.metric.active-origination",
    "lender.metric.needs-review",
    "lender.metric.signing-soon"
  ]) {
    assert.ok(markup.includes(t(key)), `the metrics are missing ${key}`);
  }
  /* The numbers are the model's, formatted by FalabellaCredit — never written
     down here. */
  const metrics = plain(lender.portfolioMetrics(lender.buildPortfolio(), NOW));
  assert.ok(markup.includes(credit.formatUF(metrics.activeOriginationUF)));
  assert.ok(markup.includes(credit.formatUF(metrics.signingSoonUF)));
  assert.equal(credit.formatUF(metrics.activeOriginationUF), "UF 31,900");
  assert.equal(credit.formatUF(metrics.signingSoonUF), "UF 6,250");
  assert.match(markup, />4</);
  /* Needs review is the lime attention tile, and it is the only one. */
  assert.equal(markup.match(/class="metric attention"/g).length, 1);
  assert.match(markup, /aria-label="Portfolio summary"/);
});

/* ============================================================ the navigation */

test("the five nav filters carry aria-pressed and their own counts", () => {
  const loans = lender.buildPortfolio();
  const markup = lender.renderNavigation(loans, "needs-review", NOW);
  for (const view of ["pipeline", "needs-review", "signing-soon", "disbursed", "closed-archived"]) {
    assert.match(markup, new RegExp(`data-view="${view}"`), `no nav filter for ${view}`);
    assert.ok(markup.includes(t(`lender.nav.${view}`)), `no label for ${view}`);
  }
  assert.match(markup, /data-view="needs-review"[^>]*aria-pressed="true"/);
  assert.match(markup, /data-view="pipeline"[^>]*aria-pressed="false"/);
  /* Every count is the count filterLoans gives for that view. */
  const count = view => plain(lender.filterLoans(loans, { view }, NOW)).length;
  assert.match(markup, new RegExp(`data-view="pipeline"[\\s\\S]*?<span>${count("pipeline")}</span>`));
  assert.match(
    markup,
    new RegExp(`data-view="needs-review"[\\s\\S]*?<span>${count("needs-review")}</span>`)
  );
  assert.equal(count("needs-review"), 4);
  /* Needs review pairs its colour with the glyph and the count (§9). */
  assert.match(markup, /data-view="needs-review"[^>]*class="[^"]*attention/);
  assert.match(markup, /◆/);
});

/* =============================================================== the toolbar */

test("the toolbar is a stage select, a reason select and a sort select", () => {
  const markup = lender.renderToolbar(viewState({ stage: "credit-review", reviewType: "new-upload", sort: "amount" }));
  assert.match(markup, /<select id="stage-filter"/);
  assert.match(markup, /<select id="review-filter"/);
  assert.match(markup, /<select id="case-sort"/);
  for (const column of plain(lender.STAGE_COLUMNS)) {
    assert.match(markup, new RegExp(`value="${column.id}"`), `no stage option for ${column.id}`);
    assert.ok(markup.includes(t(column.labelKey)));
  }
  for (const type of [...workspace.REVIEW_TYPES]) {
    assert.match(markup, new RegExp(`value="${type}"`), `no reason option for ${type}`);
    assert.ok(markup.includes(t(`review.${type}`)));
  }
  for (const key of [
    "lender.toolbar.sort-deed-date",
    "lender.toolbar.sort-newest",
    "lender.toolbar.sort-amount"
  ]) {
    assert.ok(markup.includes(t(key)), `no sort option for ${key}`);
  }
  /* The current selection is reflected, so a re-render never loses it. */
  assert.match(markup, /value="credit-review" selected/);
  assert.match(markup, /value="new-upload" selected/);
  assert.match(markup, /value="amount" selected/);
  /* Every select has an accessible name and the sort defaults to the deed date. */
  assert.ok(markup.includes(t("lender.toolbar.stage")));
  assert.ok(markup.includes(t("lender.toolbar.reason")));
  assert.ok(markup.includes(t("lender.toolbar.sort")));
  assert.match(lender.renderToolbar(viewState({})), /value="deed-date" selected/);
});

/* ================================================================= the card */

test("a card carries case id, borrower, formatted UF, substatus and deed date", () => {
  const loan = findLoan("H-2026-08402");
  const markup = lender.renderLoanCard(loan);
  assert.match(markup, /^<button class="loan-card"/);
  assert.match(markup, /type="button"/);
  assert.match(markup, /data-case-id="H-2026-08402"/);
  assert.ok(markup.includes("H-2026-08402"));
  assert.ok(markup.includes("Rodrigo Peña Vidal"));
  assert.ok(markup.includes(credit.formatUF(2900)));
  assert.ok(markup.includes("UF 2,900"));
  /* The substatus is its copy key resolved with its own params: 8 of 9. */
  assert.ok(markup.includes(t("lender.substatus.documents-progress", { received: 8, total: 9 })));
  assert.ok(markup.includes("8 of 9 documents"));
  assert.ok(markup.includes(t("lender.card.deed-date", { date: credit.formatDate("2026-09-30") })));
  assert.ok(markup.includes("Sep 30, 2026"));
  /* The card names the case it opens, and nothing on the board is draggable. */
  assert.ok(
    markup.includes(t("lender.card.open-aria", { case: "H-2026-08402", borrower: "Rodrigo Peña Vidal" }))
  );
  assert.equal(markup.includes("draggable"), false);
});

test("a loan with open review items gets both the lime border class and a reason chip", () => {
  const flagged = lender.renderLoanCard(findLoan("H-2026-08377"));
  /* Colour alone is a spec violation: the class carries the border, the chip
     carries the words (§9). */
  assert.match(flagged, /class="loan-card needs-review"/);
  assert.match(flagged, /class="review-reason"/);
  assert.ok(flagged.includes(t("lender.card.review-chip", { reason: t("review.document-exception") })));
  assert.ok(flagged.includes("Needs review · Document exception"));
  assert.ok(flagged.includes("◆"));

  const clear = lender.renderLoanCard(findLoan("H-2026-08360"));
  assert.equal(clear.includes("needs-review"), false);
  assert.equal(clear.includes("review-reason"), false);

  /* The chip names the reason of the item, whatever the reason is. */
  const upload = lender.renderLoanCard(findLoan("H-2026-08391"));
  assert.ok(upload.includes(t("review.new-upload")));
  const deadline = lender.renderLoanCard(findLoan("H-2026-08344"));
  assert.ok(deadline.includes(t("review.deed-deadline")));
});

test("a loan with no deed date renders no deed line", () => {
  const markup = lender.renderLoanCard(findLoan("H-2026-08290"));
  assert.equal(markup.includes("loan-deed"), false);
  assert.equal(markup.includes("Closing "), false);
});

test("a borrower name that looks like markup is escaped, not injected", () => {
  const loan = findLoan("H-2026-08360");
  loan.borrowerName = "<script>alert(1)</script>";
  loan.address = "\"Quote\" & <b>bold</b>";
  const markup = lender.renderLoanCard(loan);
  assert.ok(markup.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.equal(markup.includes("<script>"), false);
  assert.equal(markup.includes("</script>"), false);
  /* The same value goes into the aria-label, so its quotes must be escaped too. */
  const page = lender.renderPortfolioPage([loan], viewState({}), NOW);
  assert.equal(page.includes("<script>alert(1)"), false);
  assert.ok(page.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
});

/* ================================================================ the board */

test("all six columns render with a heading and a count, and empty ones keep a placeholder", () => {
  const groups = lender.groupLoansByStage(lender.buildPortfolio());
  const markup = lender.renderBoardColumns(groups);
  const counts = Object.values(plain(groups)).map(list => list.length);
  const columns = plain(lender.STAGE_COLUMNS);
  columns.forEach((column, index) => {
    assert.match(markup, new RegExp(`data-stage="${column.id}"`), `no column for ${column.id}`);
    assert.match(
      markup,
      new RegExp(`id="stage-${column.id}"[\\s\\S]*?<span class="stage-count">${counts[index]}</span>`)
    );
    assert.ok(markup.includes(t(column.labelKey)));
  });
  assert.equal(markup.match(/class="stage-column"/g).length, 6);
  assert.equal(markup.includes("empty-column"), false);

  /* Filtered down to one loan, the other five columns stay on the board. */
  const single = lender.groupLoansByStage(lender.filterLoans(lender.buildPortfolio(), { query: "javiera" }, NOW));
  const narrow = lender.renderBoardColumns(single);
  assert.equal(narrow.match(/class="stage-column"/g).length, 6);
  assert.equal(narrow.match(/class="empty-column"/g).length, 5);
  assert.ok(narrow.includes(t("lender.board.empty-column")));
});

/* ========================================================== the whole page */

test("the page is topbar, nav, heading, metrics, toolbar and board", () => {
  const loans = lender.buildPortfolio();
  const markup = lender.renderPortfolioPage(loans, viewState({}), NOW);
  assert.match(markup, /<header class="topbar"/);
  assert.match(markup, /class="topbar-logo"/);
  assert.ok(markup.includes(t("lender.title")));
  assert.match(markup, /<input class="global-search" id="case-search"/);
  assert.ok(markup.includes(t("lender.search-label")));
  assert.match(markup, /class="demo-role-switch"[^>]*href="borrower\.html"/);
  assert.ok(markup.includes(t("lender.switch-to-borrower")));
  assert.match(markup, /<nav class="portfolio-nav"[^>]*aria-label="Portfolio views"/);
  assert.match(markup, /<main class="portal-main" id="loan-board"/);
  assert.ok(markup.includes(t("lender.page.eyebrow")));
  assert.ok(markup.includes(t("lender.page.matching", { count: 12 })));
  assert.match(markup, /class="metrics"/);
  assert.match(markup, /class="board-toolbar"/);
  assert.match(markup, /class="loan-board"/);
  /* The board is the six columns and the twelve cards, nothing dragged. */
  assert.equal(markup.match(/class="stage-column"/g).length, 6);
  assert.equal(markup.match(/data-case-id=/g).length, 12);
  assert.equal(markup.includes("draggable"), false);
  /* The heading names the current view. */
  assert.ok(markup.includes(t("lender.nav.pipeline")));
  assert.ok(
    lender
      .renderPortfolioPage(loans, viewState({ view: "signing-soon" }), NOW)
      .includes(t("lender.nav.signing-soon"))
  );
});

test("the page honours the view state's filters, search box and sort", () => {
  const loans = lender.buildPortfolio();
  const markup = lender.renderPortfolioPage(loans, viewState({ view: "disbursed", query: "camila" }), NOW);
  assert.equal(markup.match(/data-case-id=/g).length, 1);
  assert.match(markup, /data-case-id="H-2026-08255"/);
  assert.ok(markup.includes(t("lender.page.matching", { count: 1 })));
  /* The query is echoed back into the search box, escaped. */
  assert.match(markup, /id="case-search"[^>]*value="camila"/);
  const quoted = lender.renderPortfolioPage(loans, viewState({ query: '"x"' }), NOW);
  assert.match(quoted, /value="&quot;x&quot;"/);
  /* The sort reaches the cards: amount puts UF 5,200 before UF 4,600. */
  const byAmount = lender.renderPortfolioPage(loans, viewState({ stage: "credit-review", sort: "amount" }), NOW);
  assert.ok(byAmount.indexOf("H-2026-08360") < byAmount.indexOf("H-2026-08377"));
});

test("a board filtered to nothing shows the empty-search row with a reset button", () => {
  const loans = lender.buildPortfolio();
  const markup = lender.renderPortfolioPage(loans, viewState({ query: "no such borrower" }), NOW);
  assert.match(markup, /class="empty-search"/);
  assert.ok(markup.includes(t("lender.toolbar.no-match")));
  assert.match(markup, /id="clear-search"/);
  assert.ok(markup.includes(t("lender.toolbar.clear-search")));
  /* Not a blank page: the six columns and their placeholders are still there. */
  assert.equal(markup.match(/class="stage-column"/g).length, 6);
  assert.equal(markup.match(/class="empty-column"/g).length, 6);
  assert.ok(markup.includes(t("lender.page.matching", { count: 0 })));
  /* A view with genuinely nothing in it is not a failed search: no reset row. */
  const noQuery = lender.renderPortfolioPage(loans, viewState({ reviewType: "borrower-message" }), NOW);
  assert.equal(noQuery.match(/data-case-id=/g), null);
  assert.equal(noQuery.includes("empty-search"), false);
  /* And a search that matches is not an empty search. */
  assert.equal(
    lender.renderPortfolioPage(loans, viewState({ query: "javiera" }), NOW).includes("empty-search"),
    false
  );
});

test("the open case makes the board inert so the drawer is the only live surface", () => {
  const loans = lender.buildPortfolio();
  const closed = lender.renderPortfolioPage(loans, viewState({}), NOW);
  assert.equal(closed.includes("inert"), false);
  const open = lender.renderPortfolioPage(loans, viewState({ selectedCaseId: "H-2026-08415" }), NOW);
  assert.equal(open.match(/ inert aria-hidden="true"/g).length, 2);
});

/* ========================================================== the case hash */

test("caseHash and parseCaseHash round-trip a selected case, mode and tab", () => {
  const state = { selectedCaseId: "H-2026-08415", panelMode: "full", activeTab: "risk" };
  assert.equal(lender.caseHash(state), "#case=H-2026-08415&mode=full&tab=risk");
  assert.deepEqual(plain(lender.parseCaseHash(lender.caseHash(state))), state);
  for (const tab of ["overview", "application", "documents", "risk", "audit"]) {
    const round = { selectedCaseId: "H-2026-08415", panelMode: "drawer", activeTab: tab };
    assert.deepEqual(plain(lender.parseCaseHash(lender.caseHash(round))), round);
  }
  /* No selection is no hash at all, so a closed board leaves a clean URL. */
  assert.equal(lender.caseHash({ selectedCaseId: null, panelMode: "full", activeTab: "risk" }), "");
  assert.deepEqual(plain(lender.parseCaseHash("")), {
    selectedCaseId: null,
    panelMode: "drawer",
    activeTab: "overview"
  });
});

test("an unknown mode or tab in the hash falls back to drawer and overview", () => {
  assert.deepEqual(plain(lender.parseCaseHash("#case=H-2026-08415&mode=weird&tab=unknown")), {
    selectedCaseId: "H-2026-08415",
    panelMode: "drawer",
    activeTab: "overview"
  });
  assert.deepEqual(plain(lender.parseCaseHash("#case=H-2026-08415&tab=documents")), {
    selectedCaseId: "H-2026-08415",
    panelMode: "drawer",
    activeTab: "documents"
  });
  /* An out-of-range tab is dropped on the way out too. */
  assert.equal(
    lender.caseHash({ selectedCaseId: "H-2026-08415", panelMode: "sideways", activeTab: "nonsense" }),
    "#case=H-2026-08415&mode=drawer&tab=overview"
  );
});

test("an unknown case id resets to no selection, drawer mode and the overview tab", () => {
  const ids = new Set(plain(lender.buildPortfolio()).map(loan => loan.caseId));
  const current = viewState({ view: "needs-review", query: "javiera", selectedCaseId: "H-2026-08415", panelMode: "full", activeTab: "risk" });
  const missing = plain(lender.viewStateForCaseHash(current, "#case=H-9999-00000&mode=full&tab=risk", ids));
  assert.equal(missing.selectedCaseId, null);
  assert.equal(missing.panelMode, "drawer");
  assert.equal(missing.activeTab, "overview");
  /* The board's own filters survive the reset: only the case selection clears. */
  assert.equal(missing.view, "needs-review");
  assert.equal(missing.query, "javiera");

  const known = plain(lender.viewStateForCaseHash(current, "#case=H-2026-08344&mode=full&tab=audit", ids));
  assert.equal(known.selectedCaseId, "H-2026-08344");
  assert.equal(known.panelMode, "full");
  assert.equal(known.activeTab, "audit");
  assert.equal(known.view, "needs-review");

  /* An empty hash closes the drawer rather than leaving a stale case open. */
  const cleared = plain(lender.viewStateForCaseHash(current, "", ids));
  assert.equal(cleared.selectedCaseId, null);
  assert.equal(cleared.activeTab, "overview");
});

test("syncCaseHistory replaces by default and pushes when asked", () => {
  const location = { pathname: "/portal-en/lender.html", search: "?demo=1" };
  const calls = [];
  const historyApi = {
    replaceState: (state, title, url) => calls.push(["replaceState", url]),
    pushState: (state, title, url) => calls.push(["pushState", url])
  };
  const open = { selectedCaseId: "H-2026-08415", panelMode: "drawer", activeTab: "overview" };
  lender.syncCaseHistory(historyApi, location, open, "push");
  lender.syncCaseHistory(historyApi, location, { ...open, activeTab: "risk" });
  lender.syncCaseHistory(historyApi, location, { ...open, selectedCaseId: null });
  assert.deepEqual(calls, [
    ["pushState", "/portal-en/lender.html?demo=1#case=H-2026-08415&mode=drawer&tab=overview"],
    ["replaceState", "/portal-en/lender.html?demo=1#case=H-2026-08415&mode=drawer&tab=risk"],
    ["replaceState", "/portal-en/lender.html?demo=1"]
  ]);
  /* The URL a push leaves behind parses back to the state that made it. */
  const parsed = plain(lender.parseCaseHash(new URL(calls[0][1], "https://example.test").hash));
  assert.deepEqual(parsed, open);
});

/* ================================================================== wiring */

test("the page wires the board's events and announces filter results", () => {
  for (const name of [
    "renderMetrics",
    "renderNavigation",
    "renderToolbar",
    "renderLoanCard",
    "renderBoardColumns",
    "renderPortfolioPage",
    "parseCaseHash",
    "caseHash",
    "syncCaseHistory",
    "viewStateForCaseHash"
  ]) {
    assert.equal(typeof lender[name], "function", `FalabellaLender.${name} is missing`);
  }
  /* The board is driven by the four event surfaces of Task 5 step 3. */
  assert.match(html, /addEventListener\("hashchange"/);
  assert.match(html, /addEventListener\("popstate"/);
  assert.match(html, /data-case-id/);
  assert.match(html, /"lender\.status\.filtered"/);
  /* Still pure: loading the page with no document has not thrown. */
  assert.match(html, /typeof document !== "undefined"/);
  assert.equal(html.includes("Math.random("), false);
  assert.equal(html.includes("Date.now("), false);
});

test("every copy key the board prints exists in English", () => {
  const keys = [
    "lender.title",
    "lender.logo-alt",
    "lender.search-label",
    "lender.search-placeholder",
    "lender.switch-to-borrower",
    "lender.switch-to-borrower-aria",
    "lender.nav.aria-label",
    "lender.nav.pipeline",
    "lender.nav.needs-review",
    "lender.nav.signing-soon",
    "lender.nav.disbursed",
    "lender.nav.closed-archived",
    "lender.metrics-aria-label",
    "lender.metric.active-origination",
    "lender.metric.needs-review",
    "lender.metric.signing-soon",
    "lender.toolbar.stage",
    "lender.toolbar.all-stages",
    "lender.toolbar.reason",
    "lender.toolbar.all-reasons",
    "lender.toolbar.sort",
    "lender.toolbar.sort-deed-date",
    "lender.toolbar.sort-newest",
    "lender.toolbar.sort-amount",
    "lender.toolbar.no-match",
    "lender.toolbar.clear-search",
    "lender.page.eyebrow",
    "lender.page.matching",
    "lender.board.aria-label",
    "lender.board.empty-column",
    "lender.card.open-aria",
    "lender.card.needs-review",
    "lender.card.review-chip",
    "lender.card.deed-date",
    "lender.status.filtered"
  ];
  assert.deepEqual([...copy.missingKeys("en", keys)], []);
});
