import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi } from "./page-test-helpers.mjs";

/* Same load as the board tests: every <script> of lender.html in document order,
   one vm context, no document. The drawer's render functions are pure string
   builders and its actions are pure over (state, options), so nothing here needs
   a browser — and nothing here waits on real time. */
const { api: lender, context, html } = loadPageApi("lender.html", "FalabellaLender");
const workspace = context.FalabellaWorkspace;
const credit = context.FalabellaCredit;
const copy = context.FalabellaCopy;

/* Values crossing out of the vm realm carry that realm's prototypes. */
const plain = value => JSON.parse(JSON.stringify(value));
const t = (key, params) => copy.t(key, copy.DEFAULT_LOCALE, params);
/* What the page actually writes into markup: resolved, then escaped. */
const shown = (key, params) => lender.escapeHtml(t(key, params));

/* The demo's fixed clock, and the instants the lender's gestures take. Every
   transition gets an explicit timestamp; nothing reads a real one. */
const NOW = "2026-08-06T12:00:00.000Z";
const AT = {
  query: "2026-08-06T12:05:00.000Z",
  reply: "2026-08-06T12:09:00.000Z",
  remind: "2026-08-06T12:12:00.000Z",
  upload: "2026-08-06T12:16:00.000Z",
  approve: "2026-08-06T12:20:00.000Z",
  sign: "2026-08-06T12:22:00.000Z"
};

const openingState = () => lender.fallbackCaseState();
const loanFor = state => lender.createInteractiveLoan(null, state || openingState());
const fixture = caseId => plain(lender.buildPortfolio()).find(loan => loan.caseId === caseId);
/* Fixtures come back as plain data, so hand them back a live state object. */
const fixtureLoan = caseId => {
  const loan = fixture(caseId);
  loan.state = workspace.normalizeState(loan.state);
  loan.reviewItems = loan.state.reviewItems;
  return loan;
};

const uiState = overrides => ({ ...plain(lender.DEFAULT_VIEW_STATE), ...overrides });
const verdictOf = (state, documentId) => plain(state).documents[documentId].verdict;
const conditionOf = (state, conditionId) =>
  plain(state).conditions.find(condition => condition.id === conditionId);
const actions = state => plain(state).auditEvents.map(event => event.action);
/* What one transition added. The case reaches the desk with the trail it built
   up on the way — nine uploads and nine verdicts — so "this action wrote exactly
   these events" is the tail past what it started with, never the whole list. */
const actionsAdded = (before, after) => actions(after).slice(actions(before).length);

/* A `later` double. Nothing is scheduled on the real clock; the test decides
   when the developer answers and when Javiera uploads. */
function scheduler() {
  const calls = [];
  return {
    calls,
    later(ms, fn) {
      calls.push({ ms, fn });
      return calls.length;
    },
    /* Run the oldest pending arrival. */
    fire() {
      const next = calls.shift();
      assert.ok(next, "nothing was scheduled through the later seam");
      next.fn();
      return next;
    }
  };
}

/* The whole §5.6 arc, driven synchronously: query → reply → reminder → upload. */
function walkToApproval() {
  const clock = scheduler();
  let state = openingState();
  let arrived = null;

  const query = lender.requestDeveloperConfirmation(state, {
    later: clock.later,
    timestamp: AT.query,
    arrivalTimestamp: AT.reply,
    onArrival: result => { arrived = result; }
  });
  state = query.state;
  clock.fire();
  state = arrived.state;

  const reminder = lender.remindBorrower(state, {
    later: clock.later,
    timestamp: AT.remind,
    arrivalTimestamp: AT.upload,
    onArrival: result => { arrived = result; }
  });
  state = reminder.state;
  clock.fire();
  return arrived.state;
}

/* ============================================================== the drawer */

test("the drawer is a labelled modal dialog over a backdrop", () => {
  const markup = lender.renderWorkspace(loanFor(), uiState({ selectedCaseId: lender.CASE_ID }));
  assert.match(markup, /<div class="workspace-backdrop" data-workspace-action="close"><\/div>/);
  assert.match(markup, /<aside class="loan-workspace"[^>]*id="case-workspace"/);
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  /* Labelled by its own heading, and the heading carries that id. */
  assert.match(markup, /aria-labelledby="workspace-title"/);
  assert.match(markup, /<h2 id="workspace-title">/);
  assert.ok(markup.includes(shown("lender.workspace.eyebrow", { case: lender.CASE_ID })));
  assert.ok(markup.includes(lender.escapeHtml("Aconcagua project, Maipú")));
  assert.ok(
    markup.includes(
      shown("lender.workspace.borrower-line", {
        borrower: "Javiera Soto Miranda"
      })
    )
  );
  /* Expand and close are real buttons with accessible names. */
  assert.match(markup, /data-workspace-action="expand"[^>]*aria-label="/);
  assert.match(markup, /data-workspace-action="close"[^>]*aria-label="/);
  assert.ok(markup.includes(shown("lender.workspace.close-aria")));
  assert.ok(markup.includes(shown("lender.workspace.expand-aria")));
  assert.equal(markup.includes("draggable"), false);
});

test("the header chips name the stage, the amount, the guarantee and the open work", () => {
  const markup = lender.renderWorkspace(loanFor(), uiState({}));
  assert.ok(markup.includes(shown("stage.gathering-documents")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(3150))));
  assert.ok(markup.includes(shown("lender.workspace.chip-guarantee")));
  /* Two exceptions are open at handoff, and the chip says so in words (§9). */
  assert.ok(markup.includes(shown("lender.workspace.chip-needs-review", { count: 2 })));
  assert.match(markup, /class="attention-chip"/);
});

test("full-screen mode widens the panel and offers the way back to the board", () => {
  const drawer = lender.renderWorkspace(loanFor(), uiState({ panelMode: "drawer" }));
  const full = lender.renderWorkspace(loanFor(), uiState({ panelMode: "full" }));
  assert.equal(drawer.includes("full-screen"), false);
  assert.match(full, /class="loan-workspace full-screen"/);
  assert.ok(full.includes(shown("common.back-to-board")));
  /* Nothing to expand once it is already full screen. */
  assert.equal(full.includes('data-workspace-action="expand"'), false);
});

test("the tabs are a real tablist of six and aria-selected follows the active tab", () => {
  const tabs = [...lender.WORKSPACE_TABS];
  assert.deepEqual(tabs, [
    "overview",
    "application",
    "documents",
    "conversation",
    "risk",
    "audit"
  ]);
  for (const active of tabs) {
    const markup = lender.renderWorkspace(loanFor(), uiState({ activeTab: active }));
    assert.match(markup, /<div class="workspace-tabs" role="tablist" aria-label="/);
    assert.ok(markup.includes(shown("lender.tabs.aria-label")));
    assert.equal(markup.match(/role="tab"/g).length, 6);
    for (const tab of tabs) {
      assert.match(markup, new RegExp(`id="tab-${tab}"`), `no tab button for ${tab}`);
      assert.match(
        markup,
        new RegExp(`data-workspace-tab="${tab}"[^>]*aria-selected="${tab === active}"`),
        `${tab} has the wrong aria-selected while ${active} is active`
      );
      /* Only the selected tab is in the tab order. */
      assert.match(
        markup,
        new RegExp(`data-workspace-tab="${tab}"[^>]*tabindex="${tab === active ? "0" : "-1"}"`)
      );
      assert.ok(markup.includes(shown(`lender.tab.${tab}`)), `no label for ${tab}`);
    }
    /* One panel, named by whichever tab is selected. */
    assert.match(
      markup,
      new RegExp(
        `<div class="workspace-panel" id="workspace-panel" tabindex="0" role="tabpanel" aria-labelledby="tab-${active}"`
      )
    );
    assert.match(markup, /aria-controls="workspace-panel"/);
  }
});

test("an unknown tab in the ui state renders the overview rather than an empty panel", () => {
  const markup = lender.renderWorkspace(loanFor(), uiState({ activeTab: "nonsense" }));
  assert.match(markup, /aria-labelledby="tab-overview"/);
  assert.match(markup, /data-workspace-tab="overview"[^>]*aria-selected="true"/);
  assert.ok(markup.includes(shown("lender.overview.needs-review-heading")));
});

/* ============================================================ the overview */

test("the overview shows the whole queue, each item actionable where it sits", () => {
  const loan = loanFor();
  const open = plain(workspace.openReviewItems(loan.state));
  assert.equal(open.length, 2);
  const markup = lender.renderOverviewTab(loan, uiState({}));
  assert.ok(markup.includes(shown("lender.overview.needs-review-heading")));
  assert.ok(markup.includes(shown("lender.overview.open-count", { count: 2 })));
  /* Every open item is on screen, and each carries its own controls. */
  assert.equal(markup.match(/class="review-item"/g).length, open.length);
  for (const [index, item] of open.entries()) {
    assert.match(markup, new RegExp(`data-review-item-id="${item.id}"`));
    assert.match(markup, new RegExp(`data-review-reply="${item.id}"`));
    assert.ok(
      markup.includes(
        shown("lender.overview.queue-position", { position: index + 1, total: open.length })
      )
    );
  }

  /* A single open item is not a queue, so it is not numbered. */
  const one = workspace.resolveReviewItem(loan.state, open[1].id, NOW);
  const single = lender.renderOverviewTab(loanFor(one), uiState({}));
  assert.equal(single.includes('class="review-item-position"'), false);
});

test("a case with nothing open drops the section for one quiet line", () => {
  const cleared = walkToApproval();
  assert.equal(plain(workspace.openReviewItems(cleared)).length, 0);
  const markup = lender.renderOverviewTab(loanFor(cleared), uiState({}));
  assert.ok(markup.includes(shown("lender.overview.all-clear")));
  assert.equal(markup.includes('class="review-item"'), false);
  /* No heading, no count, no bordered card announcing its own emptiness — the
     section exists to carry work and there is none. */
  assert.equal(markup.includes(shown("lender.overview.needs-review-heading")), false);
  assert.equal(markup.includes('class="no-action"'), false);
  /* And the line comes before the rest of the panel, not after it. */
  assert.ok(markup.indexOf("all-clear") < markup.indexOf("snapshot-heading"));
});

test("the snapshot reads the requested amount, deed date, document count and DTI from state", () => {
  const markup = lender.renderOverviewTab(loanFor(), uiState({}));
  const figures = plain(credit.caseFigures());
  assert.ok(markup.includes(shown("lender.overview.snapshot-heading")));
  assert.ok(markup.includes(shown("lender.overview.snapshot-requested")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(3150))));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatDate("2026-09-18"))));
  assert.ok(markup.includes(shown("lender.overview.snapshot-documents-value", { received: 7, total: 9 })));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatPct(figures.dti.ratio * 100))));
  assert.ok(markup.includes("24.7%"));
  /* Both record cards and the three most recent events, with a route to the trail. */
  assert.ok(markup.includes(shown("lender.overview.application-card")));
  assert.ok(markup.includes(shown("lender.overview.documents-card")));
  assert.ok(markup.includes(shown("lender.overview.activity-heading")));
  assert.ok(markup.includes(shown("lender.overview.view-audit")));
  assert.match(markup, /data-workspace-tab="audit"/);
  assert.ok(markup.match(/class="activity-row"/g).length <= 3);
});

/* ========================================================== a review item */

test("a review item carries its reason, a reply box and two resolutions", () => {
  const loan = loanFor();
  const item = plain(workspace.openReviewItems(loan.state))[0];
  const markup = lender.renderReviewItem(loan, item);
  assert.ok(markup.includes(shown(`review.${item.type}`)));
  assert.ok(markup.includes(shown(`doc.${item.documentId}.name`)));
  /* The row is one line high, so the label is carried for assistive technology
     rather than printed above the field — but it is still a real label, still
     bound to it. */
  assert.match(markup, new RegExp(`<label class="sr-only" for="reply-${item.id}"`));
  assert.match(markup, new RegExp(`<textarea id="reply-${item.id}" data-review-reply="${item.id}"`));
  assert.ok(markup.includes(shown("lender.review.reply-label")));
  assert.ok(markup.includes(shown("lender.review.reply-placeholder", { borrower: "Javiera Soto Miranda" })));
  assert.match(markup, new RegExp(`data-review-action="resolve" data-review-id="${item.id}"`));
  assert.match(markup, new RegExp(`data-review-action="reply" data-review-id="${item.id}"`));
  assert.ok(markup.includes(shown("lender.review.mark-resolved")));
  assert.ok(markup.includes(shown("lender.review.send-reply")));
  /* The live case is not read-only, so nothing here is disabled. */
  assert.equal(markup.includes("disabled"), false);
  assert.equal(markup.includes(shown("common.readonly-loan")), false);
});

test("a read-only fixture's review controls are disabled and say why", () => {
  const loan = fixtureLoan("H-2026-08391");
  const item = plain(workspace.openReviewItems(loan.state))[0];
  const markup = lender.renderReviewItem(loan, item);
  assert.equal(markup.match(/ disabled/g).length, 3);
  assert.match(markup, /<textarea[^>]* disabled/);
  assert.match(markup, /data-review-action="resolve"[^>]* disabled/);
  assert.match(markup, /data-review-action="reply"[^>]* disabled/);
  assert.match(markup, /class="readonly-note"/);
  assert.ok(markup.includes(shown("common.readonly-loan")));

  /* And the case-level actions are disabled with the same note. */
  const bar = lender.renderActionBar(loan, uiState({}));
  assert.ok(bar.includes(shown("common.readonly-loan")));
  assert.equal(bar.includes("data-case-action") && bar.includes("disabled"), true);
  assert.equal(/data-case-action="[^"]+"(?![^>]* disabled)/.test(bar), false);
});

test("a borrower message item quotes the message it is about", () => {
  const withMessage = workspace.sendBorrowerMessage(
    openingState(),
    "tax-folder",
    "Is the page 1 upload enough or do I resend the whole folder?",
    "2026-08-06T11:40:00.000Z"
  );
  const loan = loanFor(withMessage);
  const item = plain(workspace.openReviewItems(loan.state)).find(entry => entry.type === "borrower-message");
  const markup = lender.renderReviewItem(loan, item);
  assert.match(markup, /<blockquote>/);
  assert.ok(markup.includes(lender.escapeHtml("Is the page 1 upload enough or do I resend the whole folder?")));
});

/* ================================================== resolving and replying */

test("commitReply on a blank textarea changes nothing and says what is missing", () => {
  const state = openingState();
  const item = plain(workspace.openReviewItems(state))[0];
  for (const text of ["", "   ", null, undefined]) {
    const result = lender.commitReply(state, item.id, text, { timestamp: NOW });
    assert.equal(result.changed, false);
    /* The engine's own contract: no change means the input object back. */
    assert.equal(result.state, state);
    assert.equal(result.announcement.key, "lender.review.blank-reply");
  }
});

test("commitReply appends a lender message, resolves exactly that item, and announces", () => {
  const state = openingState();
  const open = plain(workspace.openReviewItems(state));
  const target = open.find(item => item.documentId === "tax-folder");
  const result = lender.commitReply(state, target.id, "  Page 1 alone is enough — thank you.  ", {
    timestamp: NOW,
    borrowerName: "Javiera Soto Miranda"
  });
  assert.equal(result.changed, true);
  const next = plain(result.state);
  const messages = next.documents["tax-folder"].messages;
  assert.equal(messages.length, 1);
  assert.equal(messages[0].author, "lender");
  assert.equal(messages[0].text, "Page 1 alone is enough — thank you.");
  /* Exactly one item closed, by reply, and the other exception is untouched. */
  const resolved = next.reviewItems.filter(item => item.resolvedAt);
  assert.deepEqual(resolved.map(item => item.id), [target.id]);
  assert.equal(resolved[0].resolutionMethod, "reply");
  assert.equal(plain(workspace.openReviewItems(result.state)).length, 1);
  assert.deepEqual(actionsAdded(state, result.state), ["lender-reply-sent", "review-item-resolved"]);
  assert.equal(
    t(result.announcement.key, result.announcement.params),
    t("lender.review.reply-announcement", { borrower: "Javiera Soto Miranda" })
  );
});

test("commitManualResolution resolves without writing a message", () => {
  const state = openingState();
  const target = plain(workspace.openReviewItems(state))[0];
  /* The case now arrives with the handoff exchange already on it, so "wrote no
     message" is the count being unchanged rather than the count being zero. */
  const before = plain(state).documents[target.documentId].messages.length;
  const result = lender.commitManualResolution(state, target.id, { timestamp: NOW });
  assert.equal(result.changed, true);
  const next = plain(result.state);
  assert.equal(next.documents[target.documentId].messages.length, before);
  assert.equal(next.reviewItems.find(item => item.id === target.id).resolutionMethod, "manual");
  assert.deepEqual(actionsAdded(state, result.state), ["review-item-resolved"]);
  assert.equal(
    t(result.announcement.key, result.announcement.params),
    t("lender.review.resolved-announcement", { reason: t(`review.${target.type}`) })
  );
  /* An id that is not open is a no-op, not a second resolution. */
  const again = lender.commitManualResolution(result.state, target.id, { timestamp: NOW });
  assert.equal(again.changed, false);
  assert.equal(again.state, result.state);
});

/* =========================================================== the documents */

test("the documents tab renders all nine records with verdict, file and channel", () => {
  const markup = lender.renderDocumentsTab(loanFor());
  assert.equal(markup.match(/class="document-record"/g).length, 9);
  for (const documentId of [...workspace.DOCUMENT_IDS]) {
    assert.match(markup, new RegExp(`data-document-id="${documentId}"`), `no record for ${documentId}`);
    assert.ok(markup.includes(shown(`doc.${documentId}.name`)), `no name for ${documentId}`);
  }
  assert.ok(markup.includes(shown("verdict.accepted")));
  assert.ok(markup.includes(shown("verdict.rejected")));
  assert.ok(markup.includes(shown("verdict.under-review")));
  assert.match(markup, /class="verdict rejected"/);
  assert.match(markup, /class="verdict under-review"/);
  /* Every record says where the file came from (§5.5). */
  assert.ok(markup.includes(shown("lender.documents.channel-label")));
  assert.ok(markup.includes(shown("lender.documents.channel-whatsapp")));
  assert.ok(markup.includes(shown("lender.documents.checks-heading")));
  assert.ok(markup.includes(shown("lender.documents.conversation-heading")));
  assert.ok(markup.includes(shown("lender.documents.history-heading")));

  /* Once Javiera re-uploads page 1 herself, that record's channel changes. */
  const afterUpload = walkToApproval();
  const portal = lender.renderDocumentsTab(loanFor(afterUpload));
  assert.ok(portal.includes(shown("lender.documents.channel-portal")));
});

test("the title certificate compares stated against found and flags the mismatch", () => {
  const markup = lender.renderDocumentsTab(loanFor());
  const record = markup.slice(markup.indexOf('data-document-id="title-certificate"'));
  assert.ok(record.includes(shown("lender.documents.comparison-heading")));
  assert.ok(record.includes(shown("lender.documents.comparison-stated")));
  assert.ok(record.includes(shown("lender.documents.comparison-found")));
  /* The four fields of the certificate, stated beside found. */
  for (const key of ["encumbrances", "owner", "tax-roll", "validity"]) {
    assert.ok(
      record.includes(shown(`lender.check.title-certificate.${key}`)),
      `the comparison is missing ${key}`
    );
  }
  assert.ok(record.includes(shown("lender.documents.encumbrance-stated")));
  assert.ok(record.includes(shown("lender.documents.encumbrance-found")));
  assert.ok(record.includes(shown("lender.documents.owner-stated")));
  assert.ok(record.includes(shown("lender.documents.owner-found")));
  /* The mismatched row is flagged by more than colour: a status word and a
     glyph, plus the machine-readable attribute (§2, §9). */
  assert.match(record, /data-check-status="mismatch"/);
  assert.ok(record.includes(shown("lender.check.status.mismatch")));
  assert.match(record, /data-check-status="mismatch"[\s\S]*?aria-hidden="true">⚠/);
  assert.equal(record.match(/data-check-status="mismatch"/g).length, 1);
  /* And the registration is cited, which is the whole point of the exception. */
  assert.ok(record.includes(shown("lender.documents.folio")));
  assert.ok(record.includes("Folio 1,842 No.1,190 (2024)"));
  assert.ok(record.includes(shown("lender.documents.encumbrance-note")));
});

test("the rejected tax folder flags the field that is missing", () => {
  const markup = lender.renderDocumentsTab(loanFor());
  const record = markup.slice(
    markup.indexOf('data-document-id="tax-folder"'),
    markup.indexOf('data-document-id="down-payment-proof"')
  );
  assert.match(record, /data-check-status="missing"/);
  assert.ok(record.includes(shown("lender.check.tax-folder.taxpayer-rut")));
  assert.ok(record.includes(shown("lender.check.status.missing")));
  /* The three other checks on that folder passed. */
  assert.equal(record.match(/data-check-status="verified"/g).length, 3);
});

test("reviewChecksFor gives every document its own checks, keyed to its verdict", () => {
  const loan = loanFor();
  const state = plain(loan.state);
  for (const documentId of [...workspace.DOCUMENT_IDS]) {
    const checks = plain(lender.reviewChecksFor(loan, documentId, state.documents[documentId]));
    assert.ok(checks.length >= 3, `${documentId} has too few checks`);
    for (const check of checks) {
      assert.ok(check.labelKey.startsWith("lender.check."), `${documentId} check has no copy key`);
      assert.deepEqual(copy.missingKeys("en", [check.labelKey]).length, 0, `${check.labelKey} is not in the table`);
      assert.ok(
        ["verified", "mismatch", "missing", "waiting", "note"].includes(check.status),
        `${documentId} has an unknown check status ${check.status}`
      );
    }
  }
  /* An accepted document reads verified; a not-uploaded one is still waiting. */
  const accepted = plain(lender.reviewChecksFor(loan, "national-id", state.documents["national-id"]));
  assert.deepEqual([...new Set(accepted.map(check => check.status))], ["verified"]);
  const blank = plain(lender.reviewChecksFor(loan, "national-id", { verdict: "not-uploaded", currentFilename: "", condition: "", history: [], messages: [] }));
  assert.deepEqual([...new Set(blank.map(check => check.status))], ["waiting"]);
});

test("the seven source checks say the borrower was never asked for those certificates", () => {
  const checks = plain(lender.sourceChecks());
  assert.equal(checks.length, 7);
  const markup = lender.renderDocumentsTab(loanFor());
  /* The block is labelled so the point lands without narration (§5.5). */
  assert.ok(markup.includes(shown("lender.source.heading")));
  assert.ok(markup.includes(shown("lender.source.intro")));
  assert.match(markup, /class="source-checks"/);
  for (const check of checks) {
    assert.match(markup, new RegExp(`data-source-check="${check.id}"`), `no row for ${check.id}`);
    assert.ok(markup.includes(shown(`lender.source.${check.id}.label`)));
    /* The issuing body is named, in mono, beside every result. */
    assert.ok(markup.includes(shown(`lender.source.${check.id}.source`)));
    assert.ok(markup.includes(shown(`lender.source.${check.id}.result`)));
  }
  for (const body of ["Civil Registry", "Real Estate Registrar", "Housing Ministry (MINVU)", "FOGAES"]) {
    assert.ok(markup.includes(lender.escapeHtml(body)), `${body} is not cited`);
  }
  /* A read-only fixture has no simulation behind it, so it claims no checks. */
  assert.equal(lender.renderDocumentsTab(fixtureLoan("H-2026-08360")).includes("source-checks"), false);
});

/* The desk can see the document, not only the findings on it — and it is the
   same page the borrower portal shows her, off the same shared shape. */

test("every document that arrived carries a facsimile of its page", () => {
  const loan = loanFor();
  const markup = lender.renderDocumentsTab(loan);
  const state = plain(loan.state);
  const arrived = plain(workspace.DOCUMENT_IDS).filter(
    id => state.documents[id].verdict !== "not-uploaded"
  );
  assert.ok(arrived.length > 0, "the fallback case has no documents to preview");

  assert.equal((markup.match(/class="scan-page"/g) || []).length, arrived.length);
  assert.equal((markup.match(/lender\.documents\.page-heading/g) || []).length, 0);
  assert.ok(markup.includes(shown("lender.documents.page-heading")));

  for (const documentId of arrived) {
    const base = "borrower.scan." + documentId + ".";
    assert.ok(markup.includes(shown(base + "title")), `${documentId} has no letterhead`);
    /* Every field the document prints, named and valued. */
    for (const field of plain(workspace.scanRowsFor(documentId))) {
      assert.ok(markup.includes(shown(base + "row-" + field)), `${documentId}/${field}`);
    }
  }
});

test("the page the desk sees is the page the borrower sees, off one shared shape", () => {
  /* Two pages, no shared script: the only thing keeping the facsimiles honest
     is that both read their rows from the workspace module. */
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    assert.ok(workspace.scanRowsFor(documentId), `${documentId} has no page`);
  }
  assert.equal(workspace.scanRowsFor("not-a-document"), null);
  /* The tax folder's first scan cropped its right margin; the title certificate
     carries the encumbrance nobody declared. Both are ringed, and both come
     from the verdict rather than from either page's own opinion. */
  assert.deepEqual(plain(workspace.scanOverrideFor("tax-folder", "rejected")), {
    field: "rut",
    valueSuffix: "-unreadable"
  });
  assert.equal(workspace.scanOverrideFor("tax-folder", "accepted"), null);
  assert.deepEqual(plain(workspace.scanOverrideFor("title-certificate", "under-review")), {
    field: "encumbrances"
  });
});

test("the ringed row is never colour alone, and a fixture case shows no page", () => {
  const loan = loanFor();
  const flagged = lender.renderScanPage(
    "title-certificate",
    plain(loan.state).documents["title-certificate"]
  );
  assert.match(flagged, /class="scan-row mismatch"/);
  assert.ok(flagged.includes('class="scan-mark"'), "the ringed row carries a glyph too");
  assert.match(flagged, /aria-hidden="true"/);

  /* Nothing received, nothing to preview — and no orphan heading either. */
  const blank = lender.renderScanPage("national-id", {
    verdict: "not-uploaded",
    currentFilename: "",
    condition: "",
    history: [],
    messages: []
  });
  assert.equal(blank, "");

  /* Somebody else's case is somebody else's paperwork (§11). */
  const fixture = lender.renderDocumentsTab(fixtureLoan("H-2026-08360"));
  assert.equal(fixture.includes("scan-page"), false);
  assert.equal(fixture.includes(shown("lender.documents.page-heading")), false);
});

test("a filename or message that looks like markup is escaped in the documents tab", () => {
  const uploaded = workspace.registerUpload(
    openingState(),
    "purchase-promise",
    { filename: '<img src=x onerror="alert(1)">.pdf', verdict: "under-review" },
    NOW
  );
  const messaged = workspace.sendBorrowerMessage(uploaded, "purchase-promise", "<script>alert(2)</script>", NOW);
  const markup = lender.renderDocumentsTab(loanFor(messaged));
  assert.equal(markup.includes("<img src=x"), false);
  assert.equal(markup.includes("<script>alert(2)"), false);
  assert.ok(markup.includes("&lt;script&gt;alert(2)&lt;/script&gt;"));
  assert.ok(markup.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;.pdf"));
});

/* ================================================================= the risk */

test("the risk tab puts 24.7% under the 30% cap", () => {
  const markup = lender.renderRiskTab(loanFor());
  const figures = plain(credit.caseFigures());
  const ratio = credit.formatPct(figures.dti.ratio * 100);
  const cap = credit.formatPct(figures.dti.cap * 100);
  assert.equal(ratio, "24.7%");
  assert.equal(cap, "30.0%");
  assert.ok(markup.includes(shown("risk.pti-heading")));
  assert.ok(markup.includes(shown("risk.pti-value", { ratio })));
  assert.ok(markup.includes(shown("risk.pti-cap", { cap })));
  /* Under cap is stated, not merely implied by a short green bar. */
  assert.ok(markup.includes(shown("risk.pti-under-cap")));
  assert.ok(
    markup.includes(
      shown("risk.pti-explainer", {
        payment: credit.formatCLP(figures.dti.paymentCLP),
        ratio,
        income: credit.formatCLP(figures.incomeCLP),
        cap
      })
    )
  );
  assert.ok(markup.includes("$592,218"));
  /* The credit summary is there too, every figure from FalabellaCredit. */
  assert.ok(markup.includes(shown("risk.summary-heading")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(figures.loanUF))));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(figures.paymentUF, 2))));
});

test("the stressed bar renders 30.7% and says it exceeds the cap", () => {
  const markup = lender.renderRiskTab(loanFor());
  const figures = plain(credit.caseFigures());
  const stressed = credit.formatPct(figures.stressedDti.ratio * 100);
  const cap = credit.formatPct(figures.stressedDti.cap * 100);
  assert.equal(stressed, "30.7%");
  assert.equal(figures.stressedDti.overCap, true);
  assert.ok(markup.includes(shown("risk.stress-heading")));
  /* The shock is named as a rate rise, not in basis points nobody outside a
     treasury desk converts on sight. */
  assert.ok(!/\+?200 ?bp|basis point/i.test(markup), "basis points came back");
  assert.match(markup, /2 points|2 percentage points/i);
  assert.ok(markup.includes(stressed));
  /* Over cap is said in words and marked in the DOM, never colour alone. */
  assert.ok(markup.includes(shown("risk.stress-over-cap", { cap })));
  assert.match(markup, /class="risk-bar-fill over-cap"/);
  assert.match(markup, /class="over-cap-label"/);
  assert.ok(
    markup.includes(
      shown("risk.stress-explainer", {
        payment: credit.formatCLP(figures.stressedDti.paymentCLP),
        ratio: stressed,
        cap
      })
    )
  );
  /* The exception is stated, not hidden: both ratios are on the page at once. */
  assert.ok(markup.includes("24.7%"));
  assert.ok(markup.indexOf("24.7%") < markup.indexOf("30.7%"));
});

test("the guaranteed tranche is UF 350, 11.1%, and the slice above 80% LTV", () => {
  const markup = lender.renderRiskTab(loanFor());
  const figures = plain(credit.caseFigures());
  const amount = credit.formatUF(figures.guaranteedTrancheUF);
  const share = credit.formatPct(figures.guaranteedTrancheShare * 100);
  assert.equal(amount, "UF 350");
  assert.equal(share, "11.1%");
  assert.ok(markup.includes(shown("risk.tranche-heading")));
  assert.ok(markup.includes(shown("risk.tranche-explainer", { amount, share })));
  /* The explainer is the one that calls it the slice above the standard limit
     and denies that it makes the loan cheaper. */
  assert.ok(markup.includes("the slice above the standard 80% financing limit"));
  assert.ok(markup.includes("it does not make it cheaper"));
  assert.ok(markup.includes(shown("risk.tranche-standard-label")));
  assert.ok(markup.includes(shown("risk.tranche-guaranteed-label")));
  assert.ok(markup.includes(shown("risk.tranche-note")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(figures.loanUF - figures.guaranteedTrancheUF))));
});

test("the risk tab lists the policy point by point, authority included", () => {
  const markup = lender.renderRiskTab(loanFor());
  assert.ok(markup.includes(shown("risk.policy-heading")));
  assert.match(markup, /class="policy-list"/);
  for (const key of [
    "risk.policy.payment-to-income",
    "risk.policy.financing",
    "risk.policy.property-cap",
    "risk.policy.employment",
    "risk.policy.appraisal"
  ]) {
    assert.ok(markup.includes(shown(key)), `the policy list is missing ${key}`);
  }
  assert.ok(
    markup.includes(shown("risk.policy.authority", { authority: t("lender.officer.authority") }))
  );
  assert.ok(markup.includes("UF 4,000 with FOGAES"));
});

test("a read-only fixture's risk tab states the policy and claims no arithmetic", () => {
  const markup = lender.renderRiskTab(fixtureLoan("H-2026-08360"));
  assert.ok(markup.includes(shown("common.readonly-note")));
  assert.ok(markup.includes(shown("risk.policy-heading")));
  /* The live case's numbers belong to the live case only. */
  assert.equal(markup.includes("24.7%"), false);
  assert.equal(markup.includes("30.7%"), false);
});

/* ========================================================== the application */

test("the application tab is property, loan and borrower, with the demo-data note once", () => {
  const markup = lender.renderApplicationTab(loanFor());
  for (const key of [
    "lender.application.property-heading",
    "lender.application.loan-heading",
    "lender.application.borrower-heading",
    "lender.application.address",
    "lender.application.property-value",
    "lender.application.tax-roll",
    "lender.application.loan-amount",
    "lender.application.down-payment",
    "lender.application.term",
    "lender.application.rate",
    "lender.application.financing",
    "lender.application.guarantee",
    "lender.application.name",
    "lender.application.rut",
    "lender.application.income",
    "lender.application.phone",
    "lender.application.email",
    "lender.application.submitted"
  ]) {
    assert.ok(markup.includes(shown(key)), `the application tab is missing ${key}`);
  }
  assert.ok(markup.includes(lender.escapeHtml("18.452.309-4")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatCLP(credit.INCOME_CLP))));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(350))));
  assert.ok(markup.includes("1234-56"));
  /* dt/dd grids, as §5.5 asks, and the personal-data caveat exactly once. */
  assert.equal(markup.match(/<dl class="application-record">/g).length, 3);
  assert.equal(markup.split(shown("common.demo-data-note")).length - 1, 1);
});

test("a fixture with no application record shows what is known and says it is read-only", () => {
  const markup = lender.renderApplicationTab(fixtureLoan("H-2026-08344"));
  assert.ok(markup.includes(shown("common.readonly-note")));
  assert.ok(markup.includes(lender.escapeHtml("Esteban Cáceres Mella")));
  assert.ok(markup.includes(lender.escapeHtml(credit.formatUF(2450))));
  /* No invented RUT, income or phone number for a fixture. */
  assert.equal(markup.includes(shown("lender.application.rut")), false);
  assert.equal(markup.includes(shown("lender.application.income")), false);
});

/* ================================================================ the audit */

test("the audit tab is newest first and folds in the derived milestones", () => {
  const loan = loanFor(walkToApproval());
  const events = plain(lender.caseAuditEvents(loan));
  const stamps = events.map(event => event.timestamp);
  assert.deepEqual(stamps, [...stamps].sort().reverse());
  const derived = events.map(event => event.action);
  assert.ok(derived.includes("application-submitted"), "the submission milestone is missing");
  assert.ok(derived.includes("document-checklist-started"), "the checklist milestone is missing");

  const markup = lender.renderAuditTab(loan);
  assert.ok(markup.includes(shown("lender.audit.heading")));
  assert.match(markup, /class="audit-list"/);
  assert.equal(markup.match(/<li>/g).length, events.length);
  /* Every event names its actor and its action in English, and its instant in
     a machine-readable attribute. */
  for (const action of [...new Set(derived)]) {
    assert.ok(markup.includes(shown(`audit.${action}`)), `no label for ${action}`);
    assert.deepEqual([...copy.missingKeys("en", [`audit.${action}`])], []);
  }
  assert.ok(markup.includes(shown("lender.actor.lender")));
  assert.ok(markup.includes(shown("lender.actor.system")));
  assert.ok(markup.includes(shown("lender.actor.third-party")));
  assert.match(markup, new RegExp(`datetime="${events[0].timestamp}"`));

  /* A disbursed and closed fixture folds in its later milestones too. */
  const closed = plain(lender.caseAuditEvents(fixtureLoan("H-2026-08102"))).map(event => event.action);
  assert.ok(closed.includes("loan-approved"));
  assert.ok(closed.includes("loan-disbursed"));
  assert.ok(closed.includes("case-closed"));
});

test("an open review item with no audit event of its own still reaches the trail", () => {
  const loan = loanFor();
  const events = plain(lender.caseAuditEvents(loan));
  const items = plain(workspace.openReviewItems(loan.state));
  for (const item of items) {
    assert.ok(
      events.some(event => event.reviewItemId === item.id),
      `${item.id} is missing from the audit trail`
    );
  }
});

/* =========================================================== the keyboard */

test("trapFocus wraps Tab in both directions and leaves other keys alone", () => {
  const focused = [];
  const control = name => ({ hidden: false, focus: () => focused.push(name) });
  const first = control("first");
  const middle = control("middle");
  const last = control("last");
  const container = { querySelectorAll: () => [first, middle, last] };
  let prevented = 0;
  const event = (key, shiftKey) => ({ key, shiftKey, preventDefault: () => { prevented += 1; } });

  assert.equal(lender.trapFocus(event("Tab", false), container, last), true);
  assert.equal(lender.trapFocus(event("Tab", true), container, first), true);
  assert.deepEqual(focused, ["first", "last"]);
  assert.equal(prevented, 2);

  /* In the middle of the list, the browser's own order is left to do its job. */
  assert.equal(lender.trapFocus(event("Tab", false), container, middle), false);
  /* Focus that escaped the dialog is pulled back in. */
  assert.equal(lender.trapFocus(event("Tab", false), container, control("outside")), true);
  assert.equal(lender.trapFocus(event("Tab", true), container, control("outside")), true);
  assert.deepEqual(focused, ["first", "last", "first", "last"]);
  /* Not a Tab, not our business. */
  assert.equal(lender.trapFocus(event("a", false), container, first), false);
  assert.equal(lender.trapFocus(event("Tab", false), null, first), false);
  assert.equal(prevented, 4);
});

test("Escape closes the drawer and arrow, Home and End move between tabs", () => {
  const clicked = [];
  const tabs = [...lender.WORKSPACE_TABS].map(id => ({ id, click: () => clicked.push(id) }));
  const container = { querySelectorAll: () => tabs };
  let closed = 0;
  let prevented = 0;
  const press = (key, from) => {
    lender.handleWorkspaceKeydown(
      {
        key,
        shiftKey: false,
        target: { closest: () => (from === undefined ? null : tabs[from]) },
        preventDefault: () => { prevented += 1; }
      },
      { isOpen: true, container, activeElement: from === undefined ? null : tabs[from], close: () => { closed += 1; } }
    );
  };

  press("Escape");
  assert.equal(closed, 1);

  press("ArrowRight", 0);
  press("ArrowLeft", 0);
  press("End", 0);
  press("Home", 4);
  assert.deepEqual(clicked, ["application", "audit", "audit", "overview"]);
  assert.equal(prevented, 5);

  /* A key pressed outside the tablist moves nothing. */
  press("ArrowRight");
  assert.equal(clicked.length, 4);

  /* And a closed drawer ignores the keyboard entirely. */
  lender.handleWorkspaceKeydown(
    { key: "Escape", target: { closest: () => null }, preventDefault: () => { prevented += 1; } },
    { isOpen: false, container, activeElement: null, close: () => { closed += 1; } }
  );
  assert.equal(closed, 1);
});

/* ================================================== the two arriving events */

test("the developer's reply closes document 9 with a condition and clears c1", () => {
  const clock = scheduler();
  const state = openingState();
  let arrived = null;
  const sent = lender.requestDeveloperConfirmation(state, {
    later: clock.later,
    timestamp: AT.query,
    arrivalTimestamp: AT.reply,
    onArrival: result => { arrived = result; }
  });

  /* The query is a real gesture with its own trail entry — and nothing else. */
  assert.equal(sent.changed, true);
  assert.ok(actions(sent.state).includes("developer-query-sent"));
  assert.equal(verdictOf(sent.state, "title-certificate"), "under-review");
  assert.equal(conditionOf(sent.state, "c1").cleared, false);
  assert.equal(workspace.readyToApprove(sent.state), false);
  assert.equal(t(sent.announcement.key, sent.announcement.params), t("lender.email.sent-announcement"));
  /* Carolina cannot click for the developer: the reply is scheduled, not done. */
  assert.equal(clock.calls.length, 1);
  assert.equal(clock.calls[0].ms, lender.ARRIVAL_DELAY_MS);
  assert.ok(lender.ARRIVAL_DELAY_MS > 0);

  clock.fire();

  const next = plain(arrived.state);
  /* Accepted *with a condition* — not green (§3.2). */
  assert.equal(next.documents["title-certificate"].verdict, "accepted-with-condition");
  assert.notEqual(next.documents["title-certificate"].verdict, "accepted");
  assert.equal(next.documents["title-certificate"].condition, t("lender.condition.c1"));
  assert.equal(conditionOf(arrived.state, "c1").cleared, true);
  assert.equal(conditionOf(arrived.state, "c1").clearedAt, AT.reply);
  /* c2 is not the developer's to clear, so approval is still impossible. */
  assert.equal(conditionOf(arrived.state, "c2").cleared, false);
  assert.equal(workspace.readyToApprove(arrived.state), false);
  /* The exception it answered is closed; the tax folder's is not. */
  const open = plain(workspace.openReviewItems(arrived.state));
  assert.deepEqual(open.map(item => item.documentId), ["tax-folder"]);
  const trail = actions(arrived.state);
  assert.ok(trail.includes("developer-reply-received"));
  assert.ok(trail.includes("condition-cleared"));
  assert.ok(trail.includes("review-item-resolved"));
  assert.equal(
    t(arrived.announcement.key, arrived.announcement.params),
    t("lender.email.reply-received")
  );
  /* The reply is recorded as the third party's, not as the lender's own work. */
  const reply = plain(arrived.state).auditEvents.find(event => event.action === "developer-reply-received");
  assert.equal(reply.actor, "third-party");
  assert.equal(reply.timestamp, AT.reply);
});

test("the drafted query names the case, the folio and the officer before it is sent", () => {
  const markup = lender.renderDeveloperQuery(loanFor());
  assert.ok(markup.includes(shown("lender.email.heading")));
  assert.ok(markup.includes(shown("lender.email.to")));
  assert.ok(markup.includes(shown("lender.email.subject", { case: lender.CASE_ID })));
  assert.ok(
    markup.includes(
      shown("lender.email.body", {
        case: lender.CASE_ID,
        officer: t("lender.officer.name"),
        role: t("lender.officer.role")
      })
    )
  );
  assert.ok(markup.includes("Folio 1,842 No.1,190"));
  assert.ok(markup.includes(shown("lender.email.send")));
  assert.match(markup, /data-case-action="send-query"/);
});

test("the reminder brings Javiera's own upload, accepting document 5 and clearing c2", () => {
  const clock = scheduler();
  const state = openingState();
  let arrived = null;
  const sent = lender.remindBorrower(state, {
    later: clock.later,
    timestamp: AT.remind,
    arrivalTimestamp: AT.upload,
    onArrival: result => { arrived = result; }
  });

  assert.equal(sent.changed, true);
  assert.ok(actions(sent.state).includes("borrower-reminder-sent"));
  assert.equal(verdictOf(sent.state, "tax-folder"), "rejected");
  assert.equal(conditionOf(sent.state, "c2").cleared, false);
  assert.equal(t(sent.announcement.key, sent.announcement.params), t("lender.reminder.sent"));
  assert.equal(clock.calls.length, 1);

  clock.fire();

  assert.equal(verdictOf(arrived.state, "tax-folder"), "accepted");
  assert.equal(conditionOf(arrived.state, "c2").cleared, true);
  assert.equal(conditionOf(arrived.state, "c2").clearedAt, AT.upload);
  /* Her upload is hers: the trail records the borrower, not the lender. The
     newest one — the trail already carries the nine the case arrived with. */
  const upload = plain(arrived.state).auditEvents.findLast(
    event => event.action === "document-uploaded"
  );
  assert.equal(upload.actor, "borrower");
  assert.equal(upload.documentId, "tax-folder");
  /* Eight of nine — document 9 is still open — and the folder's exception is closed. */
  assert.deepEqual(plain(lender.documentsProgress(arrived.state)), { received: 8, total: 9 });
  const open = plain(workspace.openReviewItems(arrived.state));
  assert.deepEqual(open.map(item => item.documentId), ["title-certificate"]);
  /* c1 is the developer's, so this alone does not open approval either. */
  assert.equal(workspace.readyToApprove(arrived.state), false);
  assert.equal(
    t(arrived.announcement.key, arrived.announcement.params),
    t("lender.reminder.upload-received")
  );
});

test("both arrivals together make it nine of nine with nothing open", () => {
  const state = walkToApproval();
  assert.deepEqual(plain(lender.documentsProgress(state)), { received: 9, total: 9 });
  assert.equal(plain(workspace.openReviewItems(state)).length, 0);
  assert.equal(workspace.deriveStage(state), workspace.STAGES.CREDIT_REVIEW);
  assert.equal(workspace.readyToApprove(state), true);
});

/* ================================================================= the gate */

test("approval is refused while either condition is open and permitted once both clear", () => {
  const opening = openingState();
  /* Both open. */
  const blocked = lender.approveWithConditions(opening, { timestamp: AT.approve });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.changed, false);
  assert.equal(blocked.state, opening);
  assert.equal(blocked.announcement.key, "lender.action.approve-blocked");
  assert.equal(plain(blocked.state).workflow.approvedAt, null);

  /* Only c1 cleared — skipping the reminder must not open the gate. */
  const c1Only = workspace.clearCondition(opening, "c1", AT.reply);
  const stillBlocked = lender.approveWithConditions(c1Only, { timestamp: AT.approve });
  assert.equal(stillBlocked.allowed, false);
  assert.equal(stillBlocked.state, c1Only);

  /* Only c2 cleared — skipping the developer query must not open it either
     (§3.4: "Skipping the developer query must make approval impossible"). */
  const c2Only = workspace.clearCondition(opening, "c2", AT.upload);
  const alsoBlocked = lender.approveWithConditions(c2Only, { timestamp: AT.approve });
  assert.equal(alsoBlocked.allowed, false);
  assert.equal(alsoBlocked.state, c2Only);

  /* Both cleared, by the two arrivals of §5.6, from two different sides. */
  const ready = walkToApproval();
  const allowed = lender.approveWithConditions(ready, { timestamp: AT.approve });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.changed, true);
  assert.notEqual(allowed.state, ready);
  assert.equal(plain(allowed.state).workflow.approvedAt, AT.approve);
  assert.deepEqual([...plain(allowed.state).workflow.approvedConditions], ["c1", "c2", "c3"]);
  assert.ok(actions(allowed.state).includes("loan-approved"));
  /* The approval is what moves the case on, and it is derived, not set. */
  assert.equal(workspace.deriveStage(allowed.state), workspace.STAGES.APPROVED);
});

test("the approve control is disabled until the gate opens, and says why", () => {
  const blockedBar = lender.renderActionBar(loanFor(), uiState({}));
  assert.ok(blockedBar.includes(shown("lender.action.approve")));
  assert.match(blockedBar, /data-case-action="approve"[^>]* disabled/);
  assert.ok(blockedBar.includes(shown("lender.action.approve-blocked")));
  /* The two gestures that clear the conditions are the ones available now. */
  assert.match(blockedBar, /data-case-action="developer-query"(?![^>]* disabled)/);
  assert.match(blockedBar, /data-case-action="remind-borrower"(?![^>]* disabled)/);
  assert.ok(blockedBar.includes(shown("lender.action.request-developer-confirmation")));
  assert.ok(blockedBar.includes(shown("lender.action.remind-borrower")));
  assert.ok(blockedBar.includes(shown("lender.action.escalate")));
  assert.ok(blockedBar.includes(shown("lender.action.reset")));

  const readyBar = lender.renderActionBar(loanFor(walkToApproval()), uiState({}));
  assert.match(readyBar, /data-case-action="approve"(?![^>]* disabled)/);
  assert.equal(readyBar.includes(shown("lender.action.approve-blocked")), false);
});

test("the conditions block shows all three with their state, derived from state", () => {
  const markup = lender.renderConditions(loanFor());
  assert.ok(markup.includes(shown("lender.condition.heading")));
  for (const conditionId of [...workspace.CONDITION_IDS]) {
    assert.match(markup, new RegExp(`data-condition-id="${conditionId}"`));
    assert.ok(markup.includes(shown(`lender.condition.${conditionId}`)));
  }
  assert.equal(markup.match(/class="open"/g).length, 3);
  assert.ok(markup.includes(shown("lender.condition.open")));

  const cleared = lender.renderConditions(loanFor(walkToApproval()));
  assert.equal(cleared.match(/class="cleared"/g).length, 2);
  assert.ok(cleared.includes(shown("lender.condition.cleared")));
  assert.ok(cleared.includes(shown("lender.condition.cleared-on", { date: credit.formatDate(AT.reply) })));
});

/* ======================================================= signing the record */

test("the signing sheet states the case, the conditions and the authority", () => {
  const approved = lender.approveWithConditions(walkToApproval(), { timestamp: AT.approve });
  const markup = lender.renderSigningSheet(loanFor(approved.state));
  assert.ok(markup.includes(shown("lender.signing.heading")));
  assert.ok(markup.includes(lender.escapeHtml(lender.CASE_ID)));
  assert.ok(markup.includes(shown("lender.signing.officer")));
  assert.ok(markup.includes(shown("lender.officer.name")));
  assert.ok(markup.includes(shown("lender.signing.authority")));
  assert.ok(markup.includes(shown("lender.officer.authority")));
  assert.ok(markup.includes(shown("lender.signing.conditions")));
  assert.ok(markup.includes(shown("lender.condition.c1")));
  assert.ok(markup.includes(shown("lender.signing.confirm")));
  assert.match(markup, /data-case-action="sign"/);
});

test("signApproval issues a decision record naming the case, officer and authority", () => {
  const ready = walkToApproval();
  /* Unsigned before it is approved: the signature cannot lead the decision. */
  const early = lender.signApproval(ready, { timestamp: AT.sign });
  assert.equal(early.changed, false);
  assert.equal(early.state, ready);
  assert.equal(early.record, null);

  const approved = lender.approveWithConditions(ready, { timestamp: AT.approve });
  const signed = lender.signApproval(approved.state, { timestamp: AT.sign });
  assert.equal(signed.changed, true);
  const record = plain(signed.record);
  assert.equal(record.caseId, lender.CASE_ID);
  assert.equal(record.officer, t("lender.officer.name"));
  assert.equal(record.role, t("lender.officer.role"));
  assert.equal(record.authority, t("lender.officer.authority"));
  assert.equal(record.timestamp, AT.sign);
  assert.deepEqual([...record.conditions], ["c1", "c2", "c3"]);
  assert.ok(actions(signed.state).includes("approval-signed"));
  assert.equal(
    t(signed.announcement.key, signed.announcement.params),
    t("lender.decision.announcement", { case: lender.CASE_ID })
  );
  /* Signing twice is one signature. */
  const again = lender.signApproval(signed.state, { timestamp: AT.sign });
  assert.equal(again.changed, false);

  const markup = lender.renderDecisionRecord(loanFor(signed.state));
  assert.ok(markup.includes(shown("lender.decision.heading")));
  assert.ok(markup.includes(shown("lender.decision.outcome")));
  assert.ok(markup.includes(shown("lender.decision.case", { case: lender.CASE_ID })));
  assert.ok(
    markup.includes(
      shown("lender.decision.signed-by", {
        officer: t("lender.officer.name"),
        role: t("lender.officer.role")
      })
    )
  );
  assert.ok(
    markup.includes(shown("lender.decision.authority", { authority: t("lender.officer.authority") }))
  );
  assert.ok(markup.includes(shown("lender.decision.conditions-heading")));
  assert.ok(markup.includes(shown("lender.condition.c3")));
});

test("escalating reports that the case is within her authority and changes nothing", () => {
  const state = openingState();
  const result = lender.escalate(state, { timestamp: AT.approve });
  assert.equal(result.changed, false);
  assert.equal(result.state, state);
  assert.equal(
    t(result.announcement.key, result.announcement.params),
    t("lender.action.escalate-response", { authority: t("lender.officer.authority") })
  );
});

test("resetCase returns the case to its opening state", () => {
  const walked = walkToApproval();
  const signed = lender.signApproval(
    lender.approveWithConditions(walked, { timestamp: AT.approve }).state,
    { timestamp: AT.sign }
  );
  const result = lender.resetCase(signed.state, {});
  assert.equal(result.changed, true);
  assert.deepEqual(plain(result.state), plain(lender.fallbackCaseState()));
  assert.equal(plain(workspace.openReviewItems(result.state)).length, 2);
  assert.equal(verdictOf(result.state, "title-certificate"), "under-review");
  assert.equal(verdictOf(result.state, "tax-folder"), "rejected");
  assert.equal(workspace.readyToApprove(result.state), false);
  assert.equal(result.announcement.key, "lender.status.reset");
});

/* ============================================================== the seam */

test("the later seam is injectable and replaceable, and nothing else waits on time", () => {
  assert.equal(typeof lender.later, "function");
  assert.equal(typeof lender.setLater, "function");
  assert.equal(typeof lender.DEFAULT_LATER, "function");

  const seen = [];
  const previous = lender.setLater((ms, fn) => {
    seen.push(ms);
    fn();
    return "token";
  });
  assert.equal(lender.later(1234, () => seen.push("ran")), "token");
  assert.deepEqual(seen, [1234, "ran"]);
  /* The action functions use the seam when no `later` is passed. */
  let arrived = null;
  lender.requestDeveloperConfirmation(openingState(), {
    timestamp: AT.query,
    arrivalTimestamp: AT.reply,
    onArrival: result => { arrived = result; }
  });
  assert.equal(verdictOf(arrived.state, "title-certificate"), "accepted-with-condition");
  /* setLater hands back the scheduler it displaced, so a caller can restore it
     and no later test inherits this one's. */
  assert.equal(previous, lender.DEFAULT_LATER);
  lender.setLater(previous);

  /* One setTimeout in the whole page: the seam's own default (shared rules). */
  assert.equal(html.match(/setTimeout\(/g).length, 1);
  assert.equal(html.includes("Date.now("), false);
  assert.equal(html.includes("Math.random("), false);
});

/* ================================================================= wiring */

test("the page exposes Task 6's functions and wires the drawer's own events", () => {
  for (const name of [
    "renderWorkspace",
    "renderOverviewTab",
    "renderApplicationTab",
    "renderDocumentsTab",
    "renderRiskTab",
    "renderAuditTab",
    "renderReviewItem",
    "renderConditions",
    "renderActionBar",
    "renderDeveloperQuery",
    "renderSigningSheet",
    "renderDecisionRecord",
    "reviewChecksFor",
    "sourceChecks",
    "caseAuditEvents",
    "decisionRecord",
    "trapFocus",
    "handleWorkspaceKeydown",
    "commitReply",
    "commitManualResolution",
    "requestDeveloperConfirmation",
    "remindBorrower",
    "approveWithConditions",
    "signApproval",
    "escalate",
    "resetCase",
    "later",
    "setLater"
  ]) {
    assert.equal(typeof lender[name], "function", `FalabellaLender.${name} is missing`);
  }
  /* Escape, the focus trap, the body scroll lock and the focus return (§5.5). */
  assert.match(html, /addEventListener\("keydown"/);
  assert.match(html, /classList\.toggle\("workspace-open"/);
  assert.match(html, /body\.workspace-open\{overflow:hidden\}/);
  assert.match(html, /data-case-id="/);
  assert.match(html, /\[inert\]\{pointer-events:none/);
  /* The drawer's own controls are all bound by data attribute. */
  for (const hook of [
    'data-workspace-action="close"',
    'data-workspace-action="expand"',
    "data-workspace-tab",
    'data-review-action="reply"',
    'data-review-action="resolve"',
    "data-case-action"
  ]) {
    assert.ok(html.includes(hook), `${hook} is never bound`);
  }
  /* And every §5.6 gesture the action bar emits is handled by name. */
  for (const action of [
    "developer-query",
    "send-query",
    "remind-borrower",
    "escalate",
    "approve",
    "sign",
    "reset"
  ]) {
    assert.ok(html.includes(`"${action}"`), `the ${action} action is never handled`);
    assert.ok(
      lender.renderActionBar(loanFor()).includes(`data-case-action="${action}"`) ||
        ["send-query", "sign"].includes(action),
      `the action bar has no ${action} control`
    );
  }
  assert.match(html, /typeof document !== "undefined"/);
});

test("every copy key the workspace prints exists in English", () => {
  const keys = [
    "common.back-to-board",
    "common.demo-data-note",
    "common.readonly-loan",
    "common.readonly-note",
    "lender.tabs.aria-label",
    "lender.workspace.eyebrow",
    "lender.workspace.borrower-line",
    "lender.workspace.close-aria",
    "lender.workspace.expand-aria",
    "lender.workspace.chip-guarantee",
    "lender.workspace.chip-needs-review",
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
    "lender.documents.heading",
    "lender.documents.no-file",
    "lender.documents.channel-label",
    "lender.documents.channel-whatsapp",
    "lender.documents.channel-portal",
    "lender.documents.checks-heading",
    "lender.documents.conversation-heading",
    "lender.documents.no-messages",
    "lender.documents.history-heading",
    "lender.documents.no-history",
    "lender.documents.comparison-heading",
    "lender.documents.comparison-field",
    "lender.documents.comparison-stated",
    "lender.documents.comparison-found",
    "lender.documents.folio",
    "lender.source.heading",
    "lender.source.intro",
    "lender.audit.heading",
    "lender.audit.empty",
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
    "lender.condition.cleared-on",
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
    "lender.status.reset",
    "risk.summary-heading",
    "risk.pti-heading",
    "risk.pti-explainer",
    "risk.pti-value",
    "risk.pti-cap",
    "risk.pti-under-cap",
    "risk.stress-heading",
    "risk.stress-explainer",
    "risk.stress-over-cap",
    "risk.policy-heading",
    "risk.tranche-heading",
    "risk.tranche-explainer",
    "risk.tranche-standard-label",
    "risk.tranche-guaranteed-label",
    "risk.tranche-note"
  ];
  assert.deepEqual([...copy.missingKeys("en", keys)], []);
});

/* ============================== an arrival closes its own work and nothing else */

/* Spec §4.2: "Resolve one item at a time… Never clear unrelated items."
   Both arrivals used to resolve *every* open item filed against the document,
   and the borrower's composer files her message against the document she is
   looking at — always the title certificate by the end of her narrative. So the
   developer's reply closed her message along with the exception: unread,
   un-replied, and stamped as though a human had dealt with it. On the intended
   demo path the presenter could never answer the message they had just typed. */

test("the developer's reply closes the exception but not her message about the same document", () => {
  const clock = scheduler();
  const asked = workspace.sendBorrowerMessage(
    openingState(),
    "title-certificate",
    "Should I chase the developer myself?",
    "2026-08-06T11:50:00.000Z"
  );
  /* The case opens with two exceptions of its own — document 5 and document 9 —
     so everything here is scoped to the document the arrival is about. */
  const on = (state, documentId) =>
    plain(workspace.openReviewItems(state)).filter(item => item.documentId === documentId);

  const before = on(asked, "title-certificate");
  assert.deepEqual(before.map(item => item.type).sort(), ["borrower-message", "document-exception"]);

  let arrived = null;
  lender.requestDeveloperConfirmation(asked, {
    later: clock.later,
    timestamp: AT.query,
    arrivalTimestamp: AT.reply,
    onArrival: result => { arrived = result; }
  });
  clock.fire();

  /* Her message is still open, still hers to answer. */
  const open = on(arrived.state, "title-certificate");
  assert.deepEqual(open.map(item => item.type), ["borrower-message"], `left open: ${JSON.stringify(open)}`);
  assert.equal(open[0].resolvedAt, null);

  /* The exception it *was* about is closed, at the arrival's own timestamp. */
  const exception = plain(arrived.state).reviewItems.find(
    item => item.type === "document-exception" && item.documentId === "title-certificate"
  );
  assert.equal(exception.resolvedAt, AT.reply);

  /* And the other document's work is untouched by any of it. */
  assert.equal(on(arrived.state, "tax-folder").length, 1);
});

test("her upload closes the tax folder's exception but not her message about it", () => {
  const clock = scheduler();
  const asked = workspace.sendBorrowerMessage(
    openingState(),
    "tax-folder",
    "Is page 1 enough or do I resend the whole folder?",
    "2026-08-06T11:52:00.000Z"
  );

  let arrived = null;
  lender.remindBorrower(asked, {
    later: clock.later,
    timestamp: AT.remind,
    arrivalTimestamp: AT.upload,
    onArrival: result => { arrived = result; }
  });
  clock.fire();

  const open = plain(workspace.openReviewItems(arrived.state)).filter(
    item => item.documentId === "tax-folder"
  );
  assert.deepEqual(open.map(item => item.type), ["borrower-message"]);
  /* The upload still landed and still cleared its condition. */
  assert.equal(verdictOf(arrived.state, "tax-folder"), "accepted");
  assert.equal(conditionOf(arrived.state, "c2").cleared, true);
});

test("nothing but a human reply resolves a borrower message", () => {
  const clock = scheduler();
  const asked = workspace.sendBorrowerMessage(
    openingState(),
    "title-certificate",
    "Any news?",
    "2026-08-06T11:55:00.000Z"
  );
  let arrived = null;
  lender.requestDeveloperConfirmation(asked, {
    later: clock.later,
    timestamp: AT.query,
    arrivalTimestamp: AT.reply,
    onArrival: result => { arrived = result; }
  });
  clock.fire();

  const stillOpen = plain(workspace.openReviewItems(arrived.state)).filter(
    item => item.type === "borrower-message"
  );
  /* Without this the test passes vacuously: if the arrival already swallowed the
     message there is nothing left to reply to, and an empty queue looks like
     success. */
  assert.equal(stillOpen.length, 1, "her message was gone before anyone answered it");
  const message = stillOpen[0];
  const answered = workspace.replyAndResolve(
    arrived.state,
    message.id,
    "The specialist has it; I will come back to you today.",
    AT.approve
  );
  assert.equal(
    plain(workspace.openReviewItems(answered)).filter(item => item.type === "borrower-message").length,
    0,
    "the reply did not close her message"
  );
  /* And when a human does it, the trail says so. */
  const resolved = plain(answered).reviewItems.find(item => item.id === message.id);
  assert.equal(resolved.resolutionMethod, "reply");
});

/* ================================= what the desk sends her, and what reaches it */

/* The engine files each message under its document — that is what lets a reply
   from the desk land back on the one document it was about — and the
   conversation tab is the one place that reads them back as her single
   WhatsApp thread, in the order she read it in. These tests read the same
   per-document filing the tab and the review queue both draw from. */

/* The engine files each message under its document; this is the case's whole
   exchange in time order, stable across a shared timestamp because the demo's
   clock is coarse and id order is the order things were recorded in. */
const threadOf = state => {
  const plainState = plain(state);
  const sequence = id => Number(String(id).replace(/^\D+/, "")) || 0;
  return plain(workspace.DOCUMENT_IDS)
    .flatMap(documentId =>
      plainState.documents[documentId].messages.map(message => ({ ...message, documentId }))
    )
    .sort((left, right) =>
      left.timestamp === right.timestamp
        ? sequence(left.id) - sequence(right.id)
        : left.timestamp < right.timestamp
          ? -1
          : 1
    );
};

const conversationState = () => {
  let state = workspace.sendBorrowerMessage(
    openingState(),
    "title-certificate",
    "Any news on the certificate?",
    "2026-08-06T11:50:00.000Z"
  );
  state = workspace.sendAssistantMessage(
    state,
    "title-certificate",
    "A specialist has it. Nothing needed from you.",
    "2026-08-06T11:50:30.000Z"
  );
  return workspace.sendBorrowerMessage(
    state,
    "tax-folder",
    "And the tax folder?",
    "2026-08-06T11:51:00.000Z"
  );
};

test("the conversation is one thread across every document, oldest first", () => {
  const thread = threadOf(conversationState());

  /* Two seeded handoff lines, then the three this test added. */
  assert.equal(thread.length, 5);
  assert.deepEqual(thread.map(message => message.author), [
    "assistant",
    "borrower",
    "borrower",
    "assistant",
    "borrower"
  ]);
  /* Messages filed under two different documents, in one time order. */
  assert.deepEqual(thread.slice(-3).map(message => message.documentId), [
    "title-certificate",
    "title-certificate",
    "tax-folder"
  ]);
  for (let index = 1; index < thread.length; index++) {
    assert.ok(thread[index - 1].timestamp <= thread[index].timestamp, "out of time order");
  }
});

test("messages sharing a timestamp keep the order they were recorded in", () => {
  const same = "2026-08-06T12:00:00.000Z";
  let state = workspace.sendBorrowerMessage(openingState(), "payslips", "first", same);
  state = workspace.sendAssistantMessage(state, "payslips", "second", same);
  state = workspace.sendLenderMessage(state, "payslips", "third", same);
  const thread = threadOf(state)
    .filter(message => ["first", "second", "third"].includes(message.text));
  assert.deepEqual(thread.map(message => message.text), ["first", "second", "third"]);
});

test("the conversation tab is her whole WhatsApp thread, read from the desk", () => {
  const state = conversationState();
  const loan = loanFor(state);
  const markup = lender.renderWorkspace(loan, {
    selectedCaseId: loan.caseId,
    activeTab: "conversation"
  });

  assert.ok(markup.includes('class="wa-thread"'), "the thread panel is missing");
  const thread = threadOf(state);
  /* Every message that document filing carries is on the page, escaped. */
  for (const message of thread) {
    assert.ok(markup.includes(lender.escapeHtml(message.text)), `missing "${message.text}"`);
  }
  /* Settled messages read chronologically; a borrower message still waiting
     on an answer moves to the end, in the order it arrived relative to the
     other messages still open — the tab's own version of a queue that never
     lets an unanswered question scroll out of sight. */
  const pendingIds = new Set(
    plain(workspace.openReviewItems(state))
      .filter(item => item.type === "borrower-message")
      .map(item => item.messageId)
  );
  const expectedOrder = thread
    .filter(message => !pendingIds.has(message.id))
    .concat(thread.filter(message => pendingIds.has(message.id)));
  const order = expectedOrder.map(message => markup.indexOf(lender.escapeHtml(message.text)));
  for (let index = 1; index < order.length; index++) {
    assert.ok(order[index - 1] < order[index], "messages are out of order in the markup");
  }
  /* A live case gets a composer wired to the same commit the overview and the
     queue already use. */
  assert.match(markup, /<form class="wa-composer" data-case-action="send-conversation-message">/);
  assert.match(markup, /id="conversation-composer-input"/);
});

test("a read-only sample's conversation tab has no composer", () => {
  const readonly = fixtureLoan("H-2026-08391");
  const markup = lender.renderWorkspace(readonly, {
    selectedCaseId: readonly.caseId,
    activeTab: "conversation"
  });
  assert.ok(!/data-case-action="send-conversation-message"/.test(markup));
  assert.ok(markup.includes(shown("lender.conversation.readonly")));
});

test("a message still waiting on a reply carries the pending tag; a settled one does not", () => {
  const state = conversationState();
  const loan = loanFor(state);
  const markup = lender.renderWorkspace(loan, {
    selectedCaseId: loan.caseId,
    activeTab: "conversation"
  });

  const pendingIds = new Set(
    plain(workspace.openReviewItems(state))
      .filter(item => item.type === "borrower-message")
      .map(item => item.messageId)
  );
  assert.ok(pendingIds.size > 0, "the fixture is supposed to leave messages open");

  const bubbles = [...markup.matchAll(/<article class="wa-bubble[^>]*data-pending="(true|false)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(bubbles.length, threadOf(state).length);
  for (const [, pending, body] of bubbles) {
    assert.equal(
      body.includes(shown("lender.conversation.pending")),
      pending === "true",
      "the tag and the data-pending attribute disagree"
    );
  }
  /* At least one of each, or the fixture is not testing what it claims to. */
  assert.ok(bubbles.some(([, pending]) => pending === "true"));
  assert.ok(bubbles.some(([, pending]) => pending === "false"));
});

test("replying settles the pending tag and the message returns to its chronological place", () => {
  var state = conversationState();
  /* Both of the fixture's open messages, not just one — the assertions below
     read the whole thread as fully settled. */
  plain(workspace.openReviewItems(state))
    .filter(row => row.type === "borrower-message")
    .forEach((item, index) => {
      /* Distinct text per reply: indexOf below can only tell two messages
         apart in the markup if they don't read identically. */
      state = lender.commitReply(state, item.id, "A specialist is on reply " + index + ".", {
        timestamp: index === 0 ? AT.reply : AT.remind
      }).state;
    });
  const replied = state;
  const loan = loanFor(replied);
  const markup = lender.renderWorkspace(loan, {
    selectedCaseId: loan.caseId,
    activeTab: "conversation"
  });

  /* No open borrower-message items left over from that one, so nothing in
     the thread is still pinned as pending. */
  const stillPending = plain(workspace.openReviewItems(replied)).filter(
    row => row.type === "borrower-message"
  );
  assert.equal(stillPending.length, 0);
  assert.ok(!markup.includes(shown("lender.conversation.pending")));
  assert.ok(!markup.includes('data-pending="true"'));

  const thread = threadOf(replied);
  const order = thread.map(message => markup.indexOf(lender.escapeHtml(message.text)));
  for (let index = 1; index < order.length; index++) {
    assert.ok(order[index - 1] < order[index], "settled messages should read in plain chronological order");
  }
});

test("the assistant's needs-review card links to the conversation tab only when a message is waiting", () => {
  const withMessage = loanFor(conversationState());
  const withMessageMarkup = lender.renderNeedsReview(withMessage);
  const pendingCount = plain(workspace.openReviewItems(withMessage.state)).filter(
    row => row.type === "borrower-message"
  ).length;
  assert.ok(pendingCount > 0);
  assert.match(withMessageMarkup, /<button type="button" class="review-queue-link" data-assistant-action="conversation-tab">/);
  assert.ok(withMessageMarkup.includes(shown("lender.conversation.pending-link", { count: pendingCount })));

  /* The built-in fixture's two open items are both document exceptions, not
     messages, so the link has nothing to point at. */
  const withoutMessage = loanFor();
  const withoutMessageMarkup = lender.renderNeedsReview(withoutMessage);
  assert.ok(!withoutMessageMarkup.includes('data-assistant-action="conversation-tab"'));
});

test("what she said is still on the desk, under the document she said it about", () => {
  /* Removing the panel must not lose her words: the document record shows them,
     escaped, and the review item quotes the one it was raised by. */
  const nasty = workspace.sendBorrowerMessage(
    openingState(),
    "payslips",
    "<script>alert(1)</script>",
    "2026-08-06T12:00:00.000Z"
  );
  const markup = lender.renderDocumentsTab(loanFor(nasty));
  assert.ok(!/<script>alert/.test(markup));
  assert.match(markup, /&lt;script&gt;/);

  const loan = loanFor(conversationState());
  const documents = lender.renderDocumentsTab(loan);
  assert.ok(documents.includes(lender.escapeHtml("Any news on the certificate?")));
  assert.ok(documents.includes(lender.escapeHtml("A specialist has it. Nothing needed from you.")));
});

test("a sample loan is not offered a way to write to her", () => {
  /* The unprompted message box is gone from the overview; what is left is the
     reply on a queue item, and on a fixture that is disabled with the reason. */
  const readonly = fixtureLoan("H-2026-08391");
  const item = plain(workspace.openReviewItems(readonly.state))[0];
  const markup = lender.renderReviewItem(readonly, item);
  assert.match(markup, /data-review-action="reply"[^>]* disabled/);
  assert.ok(markup.includes(shown("common.readonly-loan")));
});

test("the officer can write to her without going through a queue item", () => {
  const state = conversationState();
  const before = plain(workspace.openReviewItems(state)).length;
  const sent = lender.commitConversationMessage(state, "I will confirm today, Javiera.", {
    timestamp: AT.remind
  });

  assert.equal(sent.changed, true);
  const thread = threadOf(sent.state);
  const last = thread[thread.length - 1];
  assert.equal(last.author, "lender");
  assert.equal(last.text, "I will confirm today, Javiera.");
  /* Writing to her is not work for anyone, and it resolves nobody's question. */
  assert.equal(plain(workspace.openReviewItems(sent.state)).length, before);
  assert.equal(t(sent.announcement.key), t("lender.conversation.sent"));
});

test("an unprompted message is filed against the document that needs attention", () => {
  /* Two items are open on the fallback case; the first still-open document wins,
     so the message lands where the conversation actually is. */
  const documentId = lender.conversationDocumentId(openingState());
  const open = plain(workspace.openReviewItems(openingState()));
  assert.equal(documentId, open[0].documentId);
  assert.ok(plain(workspace.DOCUMENT_IDS).includes(documentId));
});

test("a blank message is refused and says why", () => {
  const state = conversationState();
  const blank = lender.commitConversationMessage(state, "   ", { timestamp: AT.remind });
  assert.equal(blank.changed, false);
  assert.equal(blank.state, state);
  assert.equal(t(blank.announcement.key), t("lender.conversation.blank"));
});

test("the officer's message crosses the bridge to her thread", () => {
  /* Storage-shaped, like the handoff suite's double: the bridge speaks
     getItem/setItem, not Map. */
  const data = new Map();
  const storage = {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
  const sent = lender.commitConversationMessage(conversationState(), "On it.", {
    timestamp: AT.remind,
    storage: storage
  });
  assert.equal(sent.bridged, true);
  const envelope = JSON.parse(data.get("bfDemoMessages:H-2026-08415"));
  const last = envelope.entries[envelope.entries.length - 1];
  assert.equal(last.from, "lender");
  assert.equal(last.text, "On it.");
});

test("the assistant's line arrives over the bridge as the assistant, and asks nothing of anyone", () => {
  const state = openingState();
  const before = plain(workspace.openReviewItems(state)).length;
  const absorbed = lender.bridgeAbsorb(state, {
    entries: [
      {
        id: "assistant-1-1",
        from: "assistant",
        text: "A specialist has it; nothing needed from you.",
        timestamp: "2026-08-06T11:59:00.000Z",
        documentId: "title-certificate",
        seq: 1
      }
    ]
  });

  assert.equal(absorbed.changed, true);
  const thread = threadOf(absorbed.state);
  assert.equal(thread[thread.length - 1].author, "assistant");
  /* The machine talking is not a queue item, and it is not announced as one. */
  assert.equal(plain(workspace.openReviewItems(absorbed.state)).length, before);
  assert.equal(absorbed.announcement, null);
});

test("her line over the bridge is still work, and is still announced", () => {
  const absorbed = lender.bridgeAbsorb(openingState(), {
    entries: [
      {
        id: "borrower-1-1",
        from: "borrower",
        text: "Any news?",
        timestamp: "2026-08-06T11:59:00.000Z",
        documentId: "title-certificate",
        seq: 1
      }
    ]
  });
  assert.equal(absorbed.changed, true);
  assert.ok(absorbed.announcement, "her message was not announced");
  const items = plain(workspace.openReviewItems(absorbed.state)).filter(
    item => item.type === "borrower-message"
  );
  assert.equal(items.length, 1);
});
