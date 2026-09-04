import test from "node:test";
import assert from "node:assert/strict";
import { loadScriptApi } from "./page-test-helpers.mjs";

const { api: copy, source } = loadScriptApi("assets/copy.js", "WestonCopy");
const en = copy.COPY.en;
const keys = Object.keys(en);

const NAMESPACES = [
  "common",
  "stage",
  "doc",
  "verdict",
  "review",
  "audit",
  "lender",
  "risk",
  "borrower"
];
const KEY_SHAPE = new RegExp(`^(${NAMESPACES.join("|")})(\\.[a-z0-9-]+)+$`);

function has(key) {
  return Object.prototype.hasOwnProperty.call(en, key);
}

function assertKeys(list) {
  const missing = list.filter(key => !has(key));
  assert.deepEqual(missing, [], `missing copy keys: ${missing.join(", ")}`);
}

/* ---------------------------------------------------------------- plumbing */

test("both locales are registered, each with its own number locale", () => {
  assert.equal(copy.DEFAULT_LOCALE, "en");
  assert.deepEqual([...copy.LOCALES], ["en", "es"]);
  assert.equal(copy.NUMBER_LOCALE.en, "en-US");
  assert.equal(copy.NUMBER_LOCALE.es, "es-CL");
  assert.deepEqual(Object.keys(copy.COPY), ["en", "es"]);
  assert.equal(copy.hasLocale("en"), true);
  assert.equal(copy.hasLocale("es"), true);
  assert.equal(copy.hasLocale("de"), false);
  assert.equal(copy.hasLocale(undefined), false);
});

test("the Spanish table answers for every English key, and adds none of its own", () => {
  const missing = Object.keys(copy.COPY.en).filter(key => !(key in copy.COPY.es));
  const extra = Object.keys(copy.COPY.es).filter(key => !(key in copy.COPY.en));
  assert.deepEqual(missing, [], `Spanish is missing: ${missing.join(", ")}`);
  assert.deepEqual(extra, [], `Spanish has keys English does not: ${extra.join(", ")}`);
});

test("every Spanish value is a non-empty string with the same placeholders", () => {
  /* A translation that drops {ratio} prints a sentence with a hole in it, and
     one that invents {rate} prints the brace. Both must be caught here. */
  const names = value => [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(m => m[1]).sort().join();
  const bad = [];
  const drift = [];
  for (const key of Object.keys(copy.COPY.en)) {
    const value = copy.COPY.es[key];
    if (typeof value !== "string" || value.trim() === "") bad.push(key);
    else if (names(copy.COPY.en[key]) !== names(value)) drift.push(key);
  }
  assert.deepEqual(bad, [], `empty Spanish values: ${bad.join(", ")}`);
  assert.deepEqual(drift, [], `placeholder drift: ${drift.join(", ")}`);
});

test("the active locale is switchable, refuses an unknown one, and drives t", () => {
  assert.equal(copy.locale(), "en");
  try {
    assert.equal(copy.setLocale("es"), "es");
    assert.equal(copy.t("lender.title"), "Portal del ejecutivo");
    assert.equal(copy.setLocale("de"), "es", "an unregistered locale is refused");
  } finally {
    assert.equal(copy.setLocale("en"), "en");
  }
  assert.equal(copy.t("lender.title"), "Lender portal");
});

test("copy.js names the single place a locale is added", () => {
  assert.match(source, /globalThis\.WestonCopy/);
  assert.match(source, /\/[/*][^\n]*Spanish/i);
});

/* ----------------------------------------------------------------------- t */

test("t returns the English text for a known key", () => {
  assert.equal(copy.t("lender.title"), "Lender portal");
  assert.equal(copy.t("common.readonly-loan"), "Read-only demo loan");
});

test("t defaults to the default locale and falls back for an unregistered one", () => {
  assert.equal(copy.t("lender.title", undefined), copy.t("lender.title"));
  assert.equal(copy.t("lender.title", "es"), "Portal del ejecutivo");
  assert.equal(copy.t("lender.title", "de"), copy.t("lender.title", "en"));
});

test("t on a missing key returns the key and never throws", () => {
  assert.equal(copy.t("lender.nope"), "lender.nope");
  assert.equal(copy.t("lender.nope", "en", { name: "x" }), "lender.nope");
  assert.doesNotThrow(() => copy.t(undefined));
  assert.doesNotThrow(() => copy.t(null, "en", null));
  assert.equal(copy.t(""), "");
});

test("t interpolates {name} placeholders and leaves unknown ones intact", () => {
  assert.equal(
    copy.t("lender.status.case-opened", "en", { case: "H-2026-08415" }),
    "Opened case H-2026-08415."
  );
  /* An unsupplied placeholder stays visible rather than becoming "undefined". */
  assert.equal(
    copy.t("lender.status.case-opened", "en", {}),
    "Opened case {case}."
  );
  assert.equal(copy.t("lender.status.case-opened"), "Opened case {case}.");
  assert.equal(
    copy.t("lender.decision.signed-by", "en", { officer: "Carolina Reyes" }),
    "Signed by Carolina Reyes, {role}."
  );
  assert.equal(
    copy.t("borrower.checklist.progress", "en", { received: 7, total: 9 }),
    "7 of 9 documents verified"
  );
});

/* ---------------------------------------------------------------- coverage */

test("missingKeys reports the gaps and nothing else", () => {
  assert.deepEqual([...copy.missingKeys("en", ["lender.title", "common.close"])], []);
  assert.deepEqual([...copy.missingKeys("en", ["lender.title", "nope.nope"])], ["nope.nope"]);
  assert.deepEqual([...copy.missingKeys("es", ["lender.title"])], []);
  assert.deepEqual([...copy.missingKeys("de", ["lender.title"])], ["lender.title"]);
  assert.deepEqual([...copy.missingKeys("en", [])], []);
});

test("every key is flat, dotted, and lowercase-namespaced", () => {
  const malformed = keys.filter(key => !KEY_SHAPE.test(key));
  assert.deepEqual(malformed, [], `malformed keys: ${malformed.join(", ")}`);
});

test("every English value is a non-empty string", () => {
  const bad = keys.filter(key => typeof en[key] !== "string" || en[key].trim() === "");
  assert.deepEqual(bad, [], `empty or non-string values: ${bad.join(", ")}`);
});

test("no English value has leaked Spanish punctuation", () => {
  const bad = keys.filter(key => /[¿¡]/.test(en[key]));
  assert.deepEqual(bad, [], `Spanish punctuation in: ${bad.join(", ")}`);
});

/* -------------------------------------------------------- required tables */

test("the six stage labels of the board are present", () => {
  assertKeys([
    "stage.new-applications",
    "stage.gathering-documents",
    "stage.credit-review",
    "stage.approved-deed",
    "stage.disbursed",
    "stage.closed-archived"
  ]);
});

test("the nine documents have a name and a one-line purpose", () => {
  const ids = [
    "national-id",
    "payslips",
    "employment-tenure",
    "pension-contributions",
    "tax-folder",
    "down-payment-proof",
    "purchase-promise",
    "first-home-affidavit",
    "title-certificate"
  ];
  assertKeys(ids.flatMap(id => [`doc.${id}.name`, `doc.${id}.purpose`]));
  assert.equal(en["doc.national-id.name"], "National ID card (both sides)");
  assert.equal(en["doc.title-certificate.name"], "Current title certificate");
});

test("the five verdicts are present", () => {
  assertKeys([
    "verdict.not-uploaded",
    "verdict.under-review",
    "verdict.rejected",
    "verdict.accepted",
    "verdict.accepted-with-condition"
  ]);
});

test("the four review reasons are present", () => {
  assertKeys([
    "review.borrower-message",
    "review.new-upload",
    "review.document-exception",
    "review.deed-deadline"
  ]);
});

test("every foreseeable audit action has a label", () => {
  assertKeys([
    "audit.application-submitted",
    "audit.document-checklist-started",
    "audit.borrower-message-sent",
    "audit.lender-reply-sent",
    "audit.review-item-resolved",
    "audit.new-upload-received",
    "audit.document-uploaded",
    "audit.document-verdict-changed",
    "audit.document-exception-created",
    "audit.deed-deadline-raised",
    "audit.condition-cleared",
    "audit.stage-changed",
    "audit.developer-query-sent",
    "audit.developer-reply-received",
    "audit.borrower-reminder-sent",
    "audit.loan-approved",
    "audit.approval-signed",
    "audit.loan-disbursed",
    "audit.case-closed",
    "audit.case-reset"
  ]);
});

test("common carries the buttons, states, disclaimer, and read-only note", () => {
  assertKeys([
    "common.close",
    "common.cancel",
    "common.send",
    "common.expand",
    "common.back-to-board",
    "common.retry",
    "common.loading",
    "common.saved",
    "common.empty",
    "common.skip-link",
    "common.demo-badge",
    "common.demo-data-note",
    "common.view-only",
    "common.prototype-disclaimer",
    "common.readonly-loan",
    "common.readonly-note"
  ]);
  assert.equal(en["common.readonly-loan"], "Read-only demo loan");
});

/* ------------------------------------------------------------------ lender */

test("lender chrome, board, and toolbar copy is complete", () => {
  assertKeys([
    "lender.title",
    "lender.page-title",
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
    "lender.metric.active-origination",
    "lender.metric.needs-review",
    "lender.metric.signing-soon",
    "lender.metrics-aria-label",
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
    "lender.card.live-case"
  ]);
});

test("the twelve card substatuses are all expressible", () => {
  assertKeys([
    "lender.substatus.documents-progress",
    "lender.substatus.submitted-today",
    "lender.substatus.application-received",
    "lender.substatus.new-upload",
    "lender.substatus.appraisal-below-request",
    "lender.substatus.credit-review",
    "lender.substatus.deed-in-days",
    "lender.substatus.clear-to-sign",
    "lender.substatus.disbursed-on",
    "lender.substatus.performing",
    "lender.substatus.paid-off-on"
  ]);
  assert.equal(
    copy.t("lender.substatus.documents-progress", "en", { received: 7, total: 9 }),
    "7 of 9 documents"
  );
});

test("the five workspace tabs and the drawer chrome are named", () => {
  assertKeys([
    "lender.tabs.aria-label",
    "lender.tab.overview",
    "lender.tab.application",
    "lender.tab.documents",
    "lender.tab.risk",
    "lender.tab.audit",
    "lender.workspace.eyebrow",
    "lender.workspace.borrower-line",
    "lender.workspace.close-aria",
    "lender.workspace.expand-aria",
    "lender.workspace.chip-guarantee",
    "lender.workspace.chip-needs-review"
  ]);
});

test("every tab has its headings and helper lines", () => {
  assertKeys([
    /* Overview */
    "lender.overview.needs-review-heading",
    "lender.overview.open-count",
    "lender.overview.queue-position",
    "lender.overview.all-clear",
    "lender.overview.snapshot-heading",
    "lender.overview.snapshot-requested",
    "lender.overview.snapshot-deed-date",
    "lender.overview.snapshot-documents",
    "lender.overview.snapshot-documents-value",
    "lender.overview.snapshot-dti",
    "lender.overview.application-card",
    "lender.overview.documents-card",
    "lender.overview.activity-heading",
    "lender.overview.view-audit",
    "lender.overview.no-activity",
    "lender.review.reply-label",
    "lender.review.reply-placeholder",
    "lender.review.mark-resolved",
    "lender.review.send-reply",
    "lender.review.resolved-announcement",
    "lender.review.reply-announcement",
    "lender.review.blank-reply",
    /* Application */
    "lender.application.property-heading",
    "lender.application.loan-heading",
    "lender.application.borrower-heading",
    "lender.application.address",
    "lender.application.property-type",
    "lender.application.property-condition",
    "lender.application.property-value",
    "lender.application.project",
    "lender.application.tax-roll",
    "lender.application.loan-amount",
    "lender.application.down-payment",
    "lender.application.term",
    "lender.application.rate",
    "lender.application.financing",
    "lender.application.guarantee",
    "lender.application.name",
    "lender.application.rut",
    "lender.application.date-of-birth",
    "lender.application.income",
    "lender.application.phone",
    "lender.application.email",
    "lender.application.submitted",
    /* Documents */
    "lender.documents.heading",
    "lender.documents.no-file",
    "lender.documents.channel-label",
    "lender.documents.channel-whatsapp",
    "lender.documents.channel-portal",
    "lender.documents.page-heading",
    "lender.documents.checks-heading",
    "lender.documents.override-heading",
    "lender.documents.override-label",
    "lender.documents.override-condition-label",
    "lender.documents.override-condition-placeholder",
    "lender.documents.override-apply",
    "lender.documents.request-label",
    "lender.documents.request-placeholder",
    "lender.documents.request-again",
    "lender.documents.conversation-heading",
    "lender.documents.no-messages",
    "lender.documents.history-heading",
    "lender.documents.no-history",
    "lender.documents.comparison-heading",
    "lender.documents.comparison-field",
    "lender.documents.comparison-stated",
    "lender.documents.comparison-found",
    "lender.check.status.verified",
    "lender.check.status.mismatch",
    "lender.check.status.missing",
    "lender.check.status.waiting",
    "lender.check.status.note",
    "lender.source.heading",
    "lender.source.intro",
    /* Audit */
    "lender.audit.heading",
    "lender.audit.empty",
    "lender.actor.borrower",
    "lender.actor.assistant",
    "lender.actor.lender",
    "lender.actor.system",
    "lender.actor.third-party"
  ]);
});

test("the title-certificate comparison rows and the seven source checks are present", () => {
  assertKeys([
    "lender.check.title-certificate.encumbrances",
    "lender.check.title-certificate.owner",
    "lender.check.title-certificate.tax-roll",
    "lender.check.title-certificate.validity",
    "lender.documents.encumbrance-stated",
    "lender.documents.encumbrance-found",
    "lender.documents.encumbrance-note",
    "lender.documents.folio"
  ]);
  const sources = [
    "new-home",
    "valid-rut",
    "first-home",
    "promise-date",
    "no-subsidy",
    "not-debtor",
    "fogaes-quota"
  ];
  assertKeys(
    sources.flatMap(id => [
      `lender.source.${id}.label`,
      `lender.source.${id}.source`,
      `lender.source.${id}.result`
    ])
  );
  assert.match(en["lender.documents.encumbrance-found"], /Folio 1,842 No\.1,190/);
});

test("every document has its named review checks", () => {
  const checks = {
    "national-id": ["full-name", "rut", "date-of-birth", "validity"],
    payslips: ["stated-income", "periods", "employer", "payment-to-income"],
    "employment-tenure": ["tenure", "contract-type", "employer"],
    "pension-contributions": ["months", "continuity", "file-source"],
    "tax-folder": ["taxpayer-rut", "purpose", "periods", "issue-date"],
    "down-payment-proof": ["amount-required", "ownership", "source-of-funds"],
    "purchase-promise": ["signature-date", "price", "buyer", "condition"],
    "first-home-affidavit": ["signature", "previous-subsidy", "debtors-registry"],
    "title-certificate": ["encumbrances", "owner", "tax-roll", "validity"]
  };
  assertKeys(
    Object.entries(checks).flatMap(([id, fields]) =>
      fields.map(field => `lender.check.${id}.${field}`)
    )
  );
});

test("the lender actions, developer email, signing sheet, and decision record are written", () => {
  assertKeys([
    "lender.action.request-developer-confirmation",
    "lender.action.remind-borrower",
    "lender.action.escalate",
    "lender.action.escalate-response",
    "lender.action.approve",
    "lender.action.approve-blocked",
    "lender.action.sign",
    "lender.action.reset",
    "lender.email.heading",
    "lender.email.to-label",
    "lender.email.to",
    "lender.email.subject-label",
    "lender.email.subject",
    "lender.email.body",
    "lender.email.send",
    "lender.email.sent-announcement",
    "lender.email.reply-received",
    "lender.reminder.sent",
    "lender.reminder.upload-received",
    "lender.condition.heading",
    "lender.condition.c1",
    "lender.condition.c2",
    "lender.condition.c3",
    "lender.condition.cleared",
    "lender.condition.open",
    "lender.signing.heading",
    "lender.signing.case",
    "lender.signing.borrower",
    "lender.signing.amount",
    "lender.signing.officer",
    "lender.signing.authority",
    "lender.signing.conditions",
    "lender.signing.confirm",
    "lender.decision.heading",
    "lender.decision.outcome",
    "lender.decision.case",
    "lender.decision.signed-by",
    "lender.decision.authority",
    "lender.decision.timestamp",
    "lender.decision.conditions-heading",
    "lender.decision.announcement",
    "lender.officer.name",
    "lender.officer.role",
    "lender.officer.authority",
    "lender.team.name",
    "lender.status.board-ready",
    "lender.status.case-opened",
    "lender.status.case-closed",
    "lender.status.filtered",
    "lender.status.take-case",
    "lender.status.reset",
    "lender.status.override-applied",
    "lender.status.override-unchanged",
    "lender.status.override-needs-condition",
    "lender.status.override-refused",
    "lender.status.request-needs-reason",
    "lender.status.request-sent"
  ]);
  /* The email must actually be a letter, not a stub. */
  assert.ok(en["lender.email.body"].length > 200);
  assert.match(en["lender.email.body"], /\{case\}/);
  assert.match(en["lender.email.body"], /Folio 1,842 No\.1,190/);
});

/* -------------------------------------------------------------------- risk */

test("the risk tab copy states the ratio, the stress, the policy, and the tranche", () => {
  assertKeys([
    "risk.summary-heading",
    "risk.summary-loan",
    "risk.summary-property",
    "risk.summary-down-payment",
    "risk.summary-term",
    "risk.summary-rate",
    "risk.summary-payment",
    "risk.summary-income",
    "risk.pti-heading",
    "risk.pti-explainer",
    "risk.pti-value",
    "risk.pti-cap",
    "risk.pti-under-cap",
    "risk.stress-heading",
    "risk.stress-explainer",
    "risk.stress-over-cap",
    "risk.policy-heading",
    "risk.policy.payment-to-income",
    "risk.policy.financing",
    "risk.policy.property-cap",
    "risk.policy.employment",
    "risk.policy.appraisal",
    "risk.policy.authority",
    "risk.tranche-heading",
    "risk.tranche-explainer",
    "risk.tranche-standard-label",
    "risk.tranche-guaranteed-label",
    "risk.tranche-note"
  ]);
  /* The stress must name the shock in words a reader does not have to convert
     from basis points, give the resulting ratio, and say plainly that it lands
     above the cap. */
  const stress = en["risk.stress-explainer"];
  assert.match(stress, /2 percentage points|2 points|two points/i);
  assert.ok(!/\bbp\b|basis point/i.test(stress), "basis points came back");
  assert.match(stress, /\{ratio\}/);
  assert.match(stress, /\{cap\}/);
  assert.match(stress, /\babove\b|\bover\b/i);
  assert.match(en["risk.stress-over-cap"], /\{cap\}/);
  /* The tranche is explained as the slice above standard financing. */
  const tranche = en["risk.tranche-explainer"];
  assert.match(tranche, /\{amount\}/);
  assert.match(tranche, /\{share\}/);
  assert.match(tranche, /80%/);
  assert.match(tranche, /does not make it cheaper/i);
});

/* ---------------------------------------------------------------- borrower */

test("the borrower chrome, phase rail, and demo controls are named", () => {
  assertKeys([
    "borrower.title",
    "borrower.page-title",
    "borrower.crumb",
    "borrower.who",
    "borrower.switch-to-lender",
    "borrower.switch-to-lender-aria",
    "borrower.phase.simulate",
    "borrower.phase.pre-approval",
    "borrower.phase.documents",
    "borrower.control.play",
    "borrower.control.pause",
    "borrower.control.restart",
    "borrower.control.speed",
    "borrower.control.speed-1x",
    "borrower.control.speed-2x",
    "borrower.control.speed-4x",
    "borrower.control.language",
    "borrower.control.language-en",
    "borrower.notifications.title",
    "borrower.notifications.open",
    "borrower.notifications.empty",
    "borrower.control.demo-data",
    "borrower.control.demo-data-aria",
    "borrower.control.idle",
    "borrower.control.playing",
    "borrower.control.paused",
    "borrower.control.finished"
  ]);
});

test("the simulator, verification list, and pre-approval result are complete", () => {
  assertKeys([
    "borrower.sim.title",
    "borrower.sim.subtitle",
    "borrower.sim.section-property",
    "borrower.sim.section-details",
    "borrower.sim.section-verification",
    "borrower.sim.section-loan",
    "borrower.sim.verify-intro",
    "borrower.sim.affordability",
    "borrower.sim.property-type",
    "borrower.sim.house",
    "borrower.sim.apartment",
    "borrower.sim.condition",
    "borrower.sim.new",
    "borrower.sim.used",
    "borrower.sim.property-value",
    "borrower.sim.down-payment",
    "borrower.sim.full-name",
    "borrower.sim.rut",
    "borrower.sim.date-of-birth",
    "borrower.sim.income",
    "borrower.sim.phone",
    "borrower.sim.email",
    "borrower.sim.term",
    "borrower.sim.years",
    "borrower.sim.submit",
    "borrower.sim.footnote",
    "borrower.sim.summary",
    "borrower.sim.stated-income",
    "borrower.sim.max-payment",
    "borrower.sim.simulated-payment",
    "borrower.sim.headroom",
    "borrower.sim.uf-note",
    "borrower.fogaes.title",
    "borrower.fogaes.checking",
    "borrower.fogaes.qualifies",
    "borrower.fogaes.waiting",
    "borrower.fogaes.checking-item",
    "borrower.fogaes.not-checked",
    "borrower.fogaes.saving",
    "borrower.result.pre-approved",
    "borrower.result.title",
    "borrower.result.with-fogaes",
    "borrower.result.without-fogaes",
    "borrower.result.rate",
    "borrower.result.financing",
    "borrower.result.down-payment",
    "borrower.result.loan",
    "borrower.result.trade-heading",
    "borrower.result.trade-up-front",
    "borrower.result.trade-monthly",
    "borrower.result.trade-total",
    "borrower.result.more-monthly-value",
    "borrower.result.less-monthly-value",
    "borrower.result.less-down-payment-value",
    "borrower.result.more-monthly",
    "borrower.result.less-monthly",
    "borrower.result.rate-saving",
    "borrower.result.rate-saving-note",
    "borrower.result.trade-off",
    "borrower.result.total-saving",
    "borrower.result.less-down-payment",
    "borrower.result.apr",
    "borrower.result.apply",
    "borrower.result.simulate-again",
    "borrower.result.note",
    "borrower.result.with-financing",
    "borrower.result.without-financing",
    "borrower.result.guarantee-explainer"
  ]);
  const verifications = [
    "new-home",
    "value-cap",
    "valid-rut",
    "first-home",
    "promise-date",
    "no-subsidy",
    "not-debtor",
    "fogaes-quota",
    "affordability"
  ];
  assertKeys(
    verifications.flatMap(id => [
      `borrower.check.${id}.label`,
      `borrower.check.${id}.source`,
      `borrower.check.${id}.result`
    ])
  );
});

test("the checklist, drawer, and composer copy is complete", () => {
  assertKeys([
    "borrower.portal.title",
    "borrower.portal.application",
    "borrower.portal.property",
    "borrower.portal.status-documents",
    "borrower.portal.status-review",
    "borrower.portal.status-human",
    "borrower.portal.status-open",
    "borrower.checklist.heading",
    "borrower.checklist.progress",
    "borrower.checklist.dropzone",
    "borrower.checklist.dropzone-hint",
    "borrower.checklist.open-aria",
    "borrower.drawer.eyebrow",
    "borrower.drawer.tab-review",
    "borrower.drawer.tab-document",
    "borrower.drawer.tab-history",
    "borrower.drawer.stated",
    "borrower.drawer.found",
    "borrower.drawer.scan-stamp",
    "borrower.drawer.no-history",
    "borrower.banner.analysing.title",
    "borrower.banner.analysing.body",
    "borrower.banner.accepted.title",
    "borrower.banner.accepted.body",
    "borrower.banner.rejected.title",
    "borrower.banner.rejected.body",
    "borrower.banner.incomplete.title",
    "borrower.banner.incomplete.body",
    "borrower.banner.review.title",
    "borrower.banner.review.body",
    "borrower.tag.verified",
    "borrower.tag.mismatch",
    "borrower.tag.missing",
    "borrower.tag.note",
    "borrower.chat.assistant-name",
    "borrower.chat.online",
    "borrower.chat.typing",
    "borrower.chat.placeholder",
    "borrower.chat.today",
    "borrower.chat.send",
    "borrower.chat.you",
    "borrower.chat.team-name",
    "borrower.chat.blank",
    "borrower.chat.sent",
    "borrower.notice.escalated-title",
    "borrower.notice.escalated-body"
  ]);
  assert.equal(en["borrower.chat.placeholder"], "Type a message");
});

test("every line of the scripted narrative has a key", () => {
  assertKeys([
    "borrower.msg.greeting",
    "borrower.msg.guide",
    "borrower.msg.doc1-request",
    "borrower.msg.doc1-verified",
    "borrower.msg.doc2-request",
    "borrower.msg.here-you-go",
    "borrower.msg.doc2-wrong-document",
    "borrower.msg.sorry-here-they-are",
    "borrower.msg.doc2-verified",
    "borrower.msg.doc3-request",
    "borrower.msg.doc3-verified",
    "borrower.msg.doc4-already-covered",
    "borrower.msg.doc5-request",
    "borrower.msg.doc5-incomplete",
    "borrower.msg.will-resend-later",
    "borrower.msg.doc5-left-open",
    "borrower.msg.doc6-request",
    "borrower.msg.doc6-verified",
    "borrower.msg.doc7-request",
    "borrower.msg.doc7-verified",
    "borrower.msg.doc8-request",
    "borrower.msg.doc8-verified",
    "borrower.msg.doc9-request",
    "borrower.msg.doc9-exception",
    "borrower.msg.doc9-no-hold",
    "borrower.msg.open-items"
  ]);
  const feed = [
    "doc1-accepted",
    "doc2-rejected",
    "doc2-accepted",
    "doc3-accepted",
    "doc4-reassigned",
    "doc5-incomplete",
    "doc6-accepted",
    "doc7-accepted",
    "doc8-accepted",
    "doc9-escalated"
  ];
  assertKeys(feed.map(id => `borrower.feed.${id}`));
  const attachments = [
    "national-id",
    "pension-certificate",
    "payslips",
    "employment-tenure",
    "tax-folder",
    "savings-statement",
    "purchase-promise",
    "affidavit",
    "title-certificate"
  ];
  assertKeys(
    attachments.flatMap(id => [`borrower.file.${id}`, `borrower.file-meta.${id}`])
  );
});

test("the borrower narrative keeps derived figures as placeholders", () => {
  assert.match(en["borrower.msg.doc2-verified"], /\{payment\}/);
  assert.match(en["borrower.msg.doc2-verified"], /\{ratio\}/);
  assert.match(en["borrower.feed.doc2-accepted"], /\{ratio\}/);
  assert.match(en["borrower.msg.doc6-request"], /\{downPayment\}/);
});

test("the borrower narrative never names the officer, the SLA, or the queue", () => {
  const internals = /Carolina|Reyes|\bSLA\b|queue|mortgage officer|auto-routing/i;
  const leaks = keys
    .filter(key => key.startsWith("borrower."))
    .filter(key => internals.test(en[key]));
  assert.deepEqual(leaks, [], `borrower copy leaks lender internals: ${leaks.join(", ")}`);
});
