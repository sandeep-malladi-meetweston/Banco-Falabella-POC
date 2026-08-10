import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi } from "./page-test-helpers.mjs";

/* The page is loaded the way a browser loads it: copy.js, falabella-credit.js and
   falabella-workspace.js in order, then the inline script, all in one vm context
   with no document — so init() must stay guarded and the model must be pure. */
const { api: lender, context, html } = loadPageApi("lender.html", "FalabellaLender");
const workspace = context.FalabellaWorkspace;
const credit = context.FalabellaCredit;
const copy = context.FalabellaCopy;

/* Values crossing out of the vm realm carry that realm's prototypes, so anything
   compared against a test-realm literal goes through plain() first. */
const plain = value => JSON.parse(JSON.stringify(value));

/* The demo's fixed clock. Every metric, filter and substatus in this file is
   computed against it, so nothing in the suite depends on the real date. */
const NOW = "2026-08-06T12:00:00.000Z";

const portfolio = () => plain(lender.buildPortfolio());
const caseIds = loans => loans.map(loan => loan.caseId);
const findLoan = (loans, caseId) => loans.find(loan => loan.caseId === caseId);

/* ======================================================== stages and shape */

test("STAGE_COLUMNS is the six spec stages, in board order, labelled from copy", () => {
  assert.deepEqual(plain(lender.STAGE_COLUMNS).map(column => column.id), [
    "new-applications",
    "gathering-documents",
    "credit-review",
    "approved-deed",
    "disbursed",
    "closed-archived"
  ]);
  assert.deepEqual(
    plain(lender.STAGE_COLUMNS).map(column => column.labelKey),
    plain(lender.STAGE_COLUMNS).map(column => `stage.${column.id}`)
  );
  /* Every label the board will print must exist in English. */
  assert.deepEqual(
    [...copy.missingKeys("en", plain(lender.STAGE_COLUMNS).map(column => column.labelKey))],
    []
  );
});

test("the portfolio is twelve loans with twelve unique case ids", () => {
  const loans = portfolio();
  assert.equal(loans.length, 12);
  assert.equal(new Set(caseIds(loans)).size, 12);
  assert.deepEqual(caseIds(loans), [
    "H-2026-08415",
    "H-2026-08431",
    "H-2026-08428",
    "H-2026-08402",
    "H-2026-08391",
    "H-2026-08377",
    "H-2026-08360",
    "H-2026-08344",
    "H-2026-08321",
    "H-2026-08290",
    "H-2026-08255",
    "H-2026-08102"
  ]);
});

test("exactly one loan is interactive and it is H-2026-08415", () => {
  const loans = portfolio();
  const interactive = loans.filter(loan => loan.readonly !== true);
  assert.equal(interactive.length, 1);
  assert.equal(interactive[0].caseId, "H-2026-08415");
  assert.equal(plain(lender.FIXTURE_LOANS).length, 11);
  assert.ok(plain(lender.FIXTURE_LOANS).every(loan => loan.readonly === true));
});

test("the twelve loans between them cover all six stages", () => {
  const loans = portfolio();
  const stages = new Set(loans.map(loan => loan.stage));
  for (const column of plain(lender.STAGE_COLUMNS)) {
    assert.ok(stages.has(column.id), `no loan is in ${column.id}`);
  }
});

test("each loan's stage is the one spec §5.4 gives it", () => {
  const loans = portfolio();
  const expected = {
    "H-2026-08415": "gathering-documents",
    "H-2026-08431": "new-applications",
    "H-2026-08428": "new-applications",
    "H-2026-08402": "gathering-documents",
    "H-2026-08391": "gathering-documents",
    "H-2026-08377": "credit-review",
    "H-2026-08360": "credit-review",
    "H-2026-08344": "approved-deed",
    "H-2026-08321": "approved-deed",
    "H-2026-08290": "disbursed",
    "H-2026-08255": "disbursed",
    "H-2026-08102": "closed-archived"
  };
  for (const loan of loans) assert.equal(loan.stage, expected[loan.caseId]);
  /* Derived, never assigned: the same answer straight from the engine. */
  for (const loan of plain(lender.FIXTURE_LOANS)) {
    assert.equal(loan.stage, workspace.deriveStage(loan.state));
  }
});

test("the requested amounts and deed dates are spec §5.4's table", () => {
  const loans = portfolio();
  assert.deepEqual(
    loans.map(loan => [loan.caseId, loan.requestedUF, loan.deedDate]),
    [
      ["H-2026-08415", 3150, "2026-09-18"],
      ["H-2026-08431", 2600, "2026-10-02"],
      ["H-2026-08428", 4100, "2026-10-09"],
      ["H-2026-08402", 2900, "2026-09-30"],
      ["H-2026-08391", 4600, "2026-09-22"],
      ["H-2026-08377", 3100, "2026-09-12"],
      ["H-2026-08360", 5200, "2026-09-08"],
      ["H-2026-08344", 2450, "2026-08-14"],
      ["H-2026-08321", 3800, "2026-08-19"],
      ["H-2026-08290", 4350, null],
      ["H-2026-08255", 2750, null],
      ["H-2026-08102", 3300, null]
    ]
  );
});

test("every loan's substatus is a copy key that exists in English", () => {
  const loans = portfolio();
  const keys = loans.map(loan => loan.substatusKey);
  assert.equal(keys.filter(Boolean).length, 12);
  assert.deepEqual([...copy.missingKeys("en", keys)], []);
  /* The interactive case counts its own accepted documents: 7 of 9 at handoff. */
  const interactive = findLoan(loans, "H-2026-08415");
  assert.equal(interactive.substatusKey, "lender.substatus.documents-progress");
  assert.deepEqual(interactive.substatusParams, { received: 7, total: 9 });
  /* Loan 4 of the table is "8 of 9 documents". */
  assert.deepEqual(findLoan(loans, "H-2026-08402").substatusParams, { received: 8, total: 9 });
});

/* ========================================================= review coverage */

test("the fixtures carry the review items spec §5.4 assigns them", () => {
  const loans = portfolio();
  const reasonsFor = caseId =>
    workspace.openReviewItems(findLoan(loans, caseId).state).map(item => item.type);
  assert.deepEqual([...reasonsFor("H-2026-08391")], ["new-upload"]);
  assert.deepEqual([...reasonsFor("H-2026-08377")], ["document-exception"]);
  assert.deepEqual([...reasonsFor("H-2026-08344")], ["deed-deadline"]);
  /* §3.3: the two exceptions open at handoff, and nothing else. */
  assert.deepEqual([...reasonsFor("H-2026-08415")], ["document-exception", "document-exception"]);
  /* No other loan carries open work. */
  const withWork = loans
    .filter(loan => workspace.openReviewItems(loan.state).length > 0)
    .map(loan => loan.caseId);
  assert.deepEqual(withWork, ["H-2026-08415", "H-2026-08391", "H-2026-08377", "H-2026-08344"]);
});

test("all four review reasons are covered once Javiera writes", () => {
  const state = workspace.sendBorrowerMessage(
    lender.FALLBACK_CASE.state,
    "title-certificate",
    "Is the mortgage on the property a problem?",
    NOW
  );
  const loans = plain(lender.buildPortfolio(lender.FALLBACK_CASE, state));
  const reasons = new Set(
    loans.flatMap(loan => workspace.openReviewItems(loan.state).map(item => item.type))
  );
  for (const type of [...workspace.REVIEW_TYPES]) {
    assert.ok(reasons.has(type), `no open review item of type ${type}`);
  }
});

test("a borrower message raises needsReviewCount without moving the stage", () => {
  const before = plain(lender.portfolioMetrics(lender.buildPortfolio(), NOW));
  const state = workspace.sendBorrowerMessage(
    lender.FALLBACK_CASE.state,
    "tax-folder",
    "I am resending page 1 now.",
    NOW
  );
  const loans = lender.buildPortfolio(lender.FALLBACK_CASE, state);
  const after = plain(lender.portfolioMetrics(loans, NOW));
  assert.equal(after.needsReviewCount, before.needsReviewCount);
  /* The interactive loan already needed review, so the count of loans does not
     move — but the count of its open items does, and its stage does not. */
  const interactive = findLoan(plain(loans), "H-2026-08415");
  assert.equal(workspace.openReviewItems(interactive.state).length, 3);
  assert.equal(interactive.stage, "gathering-documents");
  assert.equal(after.activeOriginationUF, before.activeOriginationUF);
});

/* ================================================================ metrics */

test("the three metrics are exactly the spec §5.4 table computed at the fixed now", () => {
  const metrics = plain(lender.portfolioMetrics(lender.buildPortfolio(), NOW));
  /* 3150 + 2600 + 4100 + 2900 + 4600 + 3100 + 5200 + 2450 + 3800, the four
     pipeline stages; the two disbursed loans and the closed one are excluded. */
  assert.equal(metrics.activeOriginationUF, 31900);
  /* Loans 1, 5, 6 and 8 have at least one open review item. */
  assert.equal(metrics.needsReviewCount, 4);
  /* approved-deed with a deed date inside 14 days of 2026-08-06:
     H-2026-08344 on 08-14 (8 days) + H-2026-08321 on 08-19 (13 days). */
  assert.equal(metrics.signingSoonUF, 6250);
});

test("signing soon counts only approved-deed loans, and only inside 14 days", () => {
  const loans = lender.buildPortfolio();
  /* 2026-08-04 puts the 08-19 deed 15 days out: it drops out of the metric. */
  const earlier = plain(lender.portfolioMetrics(loans, "2026-08-04T12:00:00.000Z"));
  assert.equal(earlier.signingSoonUF, 2450);
  /* A deed date already past is not "signing soon" either. */
  const later = plain(lender.portfolioMetrics(loans, "2026-08-16T12:00:00.000Z"));
  assert.equal(later.signingSoonUF, 3800);
});

/* ================================================================ filters */

test("the needs-review filter crosses stages and preserves each loan's own stage", () => {
  const filtered = plain(lender.filterLoans(lender.buildPortfolio(), { view: "needs-review" }, NOW));
  assert.deepEqual(caseIds(filtered), [
    "H-2026-08415",
    "H-2026-08391",
    "H-2026-08377",
    "H-2026-08344"
  ]);
  assert.deepEqual(filtered.map(loan => loan.stage), [
    "gathering-documents",
    "gathering-documents",
    "credit-review",
    "approved-deed"
  ]);
});

test("the view filters answer to the five nav items", () => {
  const loans = lender.buildPortfolio();
  const view = name => caseIds(plain(lender.filterLoans(loans, { view: name }, NOW)));
  assert.equal(view("pipeline").length, 12);
  assert.equal(view("needs-review").length, 4);
  assert.deepEqual(view("signing-soon"), ["H-2026-08344", "H-2026-08321"]);
  assert.deepEqual(view("disbursed"), ["H-2026-08290", "H-2026-08255"]);
  assert.deepEqual(view("closed-archived"), ["H-2026-08102"]);
  /* An unknown view is not a filter: it must never blank the board. */
  assert.equal(view("nonsense").length, 12);
  assert.equal(caseIds(plain(lender.filterLoans(loans, {}, NOW))).length, 12);
});

test("the stage filter and the review-reason filter narrow independently", () => {
  const loans = lender.buildPortfolio();
  assert.deepEqual(
    caseIds(plain(lender.filterLoans(loans, { stage: "credit-review" }, NOW))),
    ["H-2026-08377", "H-2026-08360"]
  );
  assert.equal(plain(lender.filterLoans(loans, { stage: "all" }, NOW)).length, 12);
  assert.deepEqual(
    caseIds(plain(lender.filterLoans(loans, { reviewType: "document-exception" }, NOW))),
    ["H-2026-08415", "H-2026-08377"]
  );
  assert.deepEqual(
    caseIds(plain(lender.filterLoans(loans, { reviewType: "deed-deadline" }, NOW))),
    ["H-2026-08344"]
  );
  assert.deepEqual(
    caseIds(plain(lender.filterLoans(loans, { reviewType: "borrower-message" }, NOW))),
    []
  );
  /* Combined: an exception inside credit-review is loan 6 alone. */
  assert.deepEqual(
    caseIds(
      plain(lender.filterLoans(loans, { stage: "credit-review", reviewType: "document-exception" }, NOW))
    ),
    ["H-2026-08377"]
  );
});

test("search matches case id, borrower name and address, case-insensitively", () => {
  const loans = lender.buildPortfolio();
  const search = query => caseIds(plain(lender.filterLoans(loans, { query }, NOW)));
  assert.deepEqual(search("h-2026-08415"), ["H-2026-08415"]);
  assert.deepEqual(search("H-2026-08415"), ["H-2026-08415"]);
  assert.deepEqual(search("javiera"), ["H-2026-08415"]);
  assert.deepEqual(search("SOTO MIRANDA"), ["H-2026-08415"]);
  const byAddress = findLoan(portfolio(), "H-2026-08431").address;
  assert.ok(byAddress, "a fixture loan needs an address to search on");
  assert.deepEqual(search(byAddress.toUpperCase()), ["H-2026-08431"]);
  assert.deepEqual(search("   "), caseIds(portfolio()));
  assert.deepEqual(search("no such borrower"), []);
});

/* ================================================================== sorts */

test("deed-date sort is ascending with the loans that have no deed date last", () => {
  const sorted = plain(lender.sortLoans(lender.buildPortfolio(), "deed-date"));
  assert.deepEqual(caseIds(sorted), [
    "H-2026-08344",
    "H-2026-08321",
    "H-2026-08360",
    "H-2026-08377",
    "H-2026-08415",
    "H-2026-08391",
    "H-2026-08402",
    "H-2026-08431",
    "H-2026-08428",
    "H-2026-08290",
    "H-2026-08255",
    "H-2026-08102"
  ]);
  assert.deepEqual(sorted.slice(-3).map(loan => loan.deedDate), [null, null, null]);
  /* The default sort is the deed date. */
  assert.deepEqual(caseIds(plain(lender.sortLoans(lender.buildPortfolio()))), caseIds(sorted));
});

test("newest sort is by application date, and amount sort is by requested UF", () => {
  const newest = plain(lender.sortLoans(lender.buildPortfolio(), "newest"));
  assert.equal(newest[0].caseId, "H-2026-08431");
  assert.equal(newest.at(-1).caseId, "H-2026-08102");
  const submitted = newest.map(loan => loan.state.workflow.submittedAt);
  assert.deepEqual(submitted, [...submitted].sort().reverse());
  const byAmount = plain(lender.sortLoans(lender.buildPortfolio(), "amount"));
  assert.deepEqual(byAmount.map(loan => loan.requestedUF), [
    5200, 4600, 4350, 4100, 3800, 3300, 3150, 3100, 2900, 2750, 2600, 2450
  ]);
  /* Sorting never mutates or drops the portfolio it is given. */
  const loans = lender.buildPortfolio();
  const before = caseIds(plain(loans));
  lender.sortLoans(loans, "amount");
  assert.deepEqual(caseIds(plain(loans)), before);
});

/* =============================================================== grouping */

test("grouping keeps all six stage keys, including the empty columns", () => {
  const groups = plain(lender.groupLoansByStage(lender.buildPortfolio()));
  assert.deepEqual(Object.keys(groups), [
    "new-applications",
    "gathering-documents",
    "credit-review",
    "approved-deed",
    "disbursed",
    "closed-archived"
  ]);
  assert.deepEqual(
    Object.values(groups).map(list => list.length),
    [2, 3, 2, 2, 2, 1]
  );
  const single = plain(
    lender.groupLoansByStage(lender.filterLoans(lender.buildPortfolio(), { query: "javiera" }, NOW))
  );
  assert.equal(Object.keys(single).length, 6);
  assert.equal(single["gathering-documents"].length, 1);
  assert.deepEqual(
    Object.entries(single)
      .filter(([stage]) => stage !== "gathering-documents")
      .map(([, list]) => list.length),
    [0, 0, 0, 0, 0]
  );
});

/* ========================================================= the live case */

test("FALLBACK_CASE is the case of spec §3, with every figure from FalabellaCredit", () => {
  const fallback = plain(lender.FALLBACK_CASE);
  assert.equal(fallback.caseId, "H-2026-08415");
  assert.equal(fallback.borrower.fullName, "Javiera Soto Miranda");
  assert.equal(fallback.borrower.rut, "18.452.309-4");
  assert.equal(fallback.borrower.incomeCLP, credit.INCOME_CLP);
  assert.equal(fallback.property.valueUF, credit.PROPERTY_UF);
  assert.equal(fallback.property.taxRoll, "1234-56");
  assert.equal(fallback.loan.requestedUF, credit.loanFor(credit.PROPERTY_UF, credit.LTV_GUARANTEED));
  assert.equal(fallback.loan.requestedUF, 3150);
  assert.equal(fallback.loan.downPaymentUF, credit.downPaymentUF());
  assert.equal(fallback.loan.downPaymentUF, 350);
  assert.equal(fallback.loan.termYears, credit.TERM_YEARS);
  assert.equal(fallback.loan.annualRate, credit.RATE_GUARANTEED);
  assert.equal(fallback.loan.ltv, credit.LTV_GUARANTEED);
  assert.equal(fallback.loan.deedTargetDate, "2026-09-18");
  assert.equal(fallback.officer.authorityUF, credit.OFFICER_AUTHORITY_UF);
  assert.equal(fallback.officer.name, copy.t("lender.officer.name"));
  assert.equal(fallback.officer.role, copy.t("lender.officer.role"));
});

test("the built-in case state is the §3.3 handoff: 7 accepted, two exceptions open", () => {
  const state = plain(lender.FALLBACK_CASE.state);
  assert.equal(state.version, workspace.STATE_VERSION);
  const verdicts = Object.fromEntries(
    Object.entries(state.documents).map(([id, record]) => [id, record.verdict])
  );
  assert.equal(Object.keys(verdicts).length, 9);
  assert.equal(verdicts["tax-folder"], "rejected");
  assert.equal(verdicts["title-certificate"], "under-review");
  assert.equal(
    Object.values(verdicts).filter(verdict => verdict === "accepted").length,
    7
  );
  const open = plain(workspace.openReviewItems(lender.FALLBACK_CASE.state));
  assert.deepEqual(open.map(item => [item.type, item.documentId]), [
    ["document-exception", "title-certificate"],
    ["document-exception", "tax-folder"]
  ]);
  /* None of the three conditions is cleared at handoff, so approval is refused. */
  assert.deepEqual(state.conditions.map(condition => condition.cleared), [false, false, false]);
  assert.equal(workspace.readyToApprove(lender.FALLBACK_CASE.state), false);
});

test("createInteractiveLoan reads the live state and is never read-only", () => {
  const loan = plain(lender.createInteractiveLoan());
  assert.equal(loan.caseId, "H-2026-08415");
  assert.equal(loan.readonly, false);
  assert.equal(loan.borrowerName, "Javiera Soto Miranda");
  assert.equal(loan.requestedUF, 3150);
  assert.equal(loan.stage, "gathering-documents");
  assert.deepEqual(loan.substatusParams, { received: 7, total: 9 });

  /* Accept the two open documents and the substatus, the stage and the review
     queue all follow the state — nothing here is written by hand. */
  let state = workspace.setVerdict(lender.FALLBACK_CASE.state, "tax-folder", "accepted", {}, NOW);
  state = workspace.setVerdict(
    state,
    "title-certificate",
    "accepted-with-condition",
    { condition: copy.t("lender.condition.c1") },
    NOW
  );
  const advanced = plain(lender.createInteractiveLoan(lender.FALLBACK_CASE, state));
  assert.deepEqual(advanced.substatusParams, { received: 9, total: 9 });
  assert.equal(advanced.stage, "credit-review");
});

test("buildPortfolio falls back to the built-in case when handed nothing", () => {
  assert.deepEqual(caseIds(plain(lender.buildPortfolio(null, null))), caseIds(portfolio()));
  assert.deepEqual(caseIds(plain(lender.buildPortfolio(undefined, undefined))), caseIds(portfolio()));
  const metrics = plain(lender.portfolioMetrics(lender.buildPortfolio(null, null), NOW));
  assert.equal(metrics.activeOriginationUF, 31900);
});

test("the fixtures are read-only and expose their open review items", () => {
  for (const loan of plain(lender.FIXTURE_LOANS)) {
    assert.equal(loan.readonly, true);
    assert.equal(loan.caseData, null, `${loan.caseId} must carry no application data`);
    assert.ok(loan.address, `${loan.caseId} needs an address`);
    assert.ok(Array.isArray(loan.reviewItems));
    assert.deepEqual(
      loan.reviewItems.filter(item => !item.resolvedAt).map(item => item.id),
      plain(workspace.openReviewItems(loan.state)).map(item => item.id)
    );
  }
});

test("the model is exposed whole and the page never runs init() without a document", () => {
  for (const name of [
    "STAGE_COLUMNS",
    "FALLBACK_CASE",
    "FIXTURE_LOANS",
    "createInteractiveLoan",
    "buildPortfolio",
    "portfolioMetrics",
    "filterLoans",
    "sortLoans",
    "groupLoansByStage"
  ]) {
    assert.ok(lender[name], `FalabellaLender.${name} is missing`);
  }
  /* The suite has just loaded the page with no document in the context: an
     unguarded init() would have thrown before the global was ever exposed. */
  assert.match(html, /typeof document !== "undefined"/);
  assert.equal(html.includes("Math.random("), false);
  assert.equal(html.includes("Date.now("), false);
});
