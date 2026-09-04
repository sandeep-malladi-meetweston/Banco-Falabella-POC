import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi } from "./page-test-helpers.mjs";

/* Every <script> of borrower.html in document order, one vm context, no
   document. The narrative is data, the interpreter is pure over
   (viewState, step), and every render function returns a string — so the whole
   of the borrower surface is testable without a browser and without waiting on
   real time. Autoplay is driven through the injectable `later` seam. */
const { api: borrower, context, html } = loadPageApi("borrower.html", "WestonBorrower");
const workspace = context.WestonWorkspace;
const credit = context.WestonCredit;
const copy = context.WestonCopy;

/* Values crossing out of the vm realm carry that realm's prototypes. */
const plain = value => JSON.parse(JSON.stringify(value));
const t = (key, params) => copy.t(key, copy.DEFAULT_LOCALE, params);
/* What the page actually writes into markup: resolved, then escaped. */
const shown = (key, params) => borrower.escapeHtml(t(key, params));

/* The page now opens paused — nothing plays until `Use demo data` or Play is
   pressed — so a test that is about the autoplay seam starts it explicitly. */
const start = () => borrower.setPaused(borrower.initialViewState(), false);
const finished = () => borrower.runScript();
const openItems = viewState => plain(workspace.openReviewItems(viewState.state));
const verdictOf = (viewState, documentId) => plain(viewState.state).documents[documentId].verdict;

/* A `later` double: nothing is scheduled on the real clock, the test decides
   when the next beat of the narrative plays. */
function scheduler() {
  const calls = [];
  return {
    calls,
    later(ms, fn) {
      calls.push({ ms, fn });
      return calls.length;
    },
    fire() {
      const next = calls.shift();
      assert.ok(next, "nothing was scheduled through the later seam");
      next.fn();
      return next;
    }
  };
}

/* ============================================================== the script */

test("SCRIPT is data: a flat array of steps, every one of a known kind", () => {
  const script = plain(borrower.SCRIPT);
  const kinds = plain(borrower.STEP_KINDS);

  assert.ok(Array.isArray(script));
  assert.ok(script.length > 40, "the nine-document narrative is longer than that");
  assert.deepEqual(kinds, [
    "assistant",
    "borrower",
    "document",
    "verify",
    "status",
    "escalate",
    "end"
  ]);

  for (const step of script) {
    assert.equal(typeof step, "object");
    assert.ok(kinds.includes(step.kind), `unknown step kind: ${step.kind}`);
    /* Data, not code: no step carries a function to call. */
    for (const value of Object.values(step)) {
      assert.notEqual(typeof value, "function");
    }
  }

  /* Every kind is actually exercised by the narrative. */
  const used = new Set(script.map(step => step.kind));
  assert.deepEqual([...used].sort(), [...kinds].sort());
  /* Exactly one ending, and it is the last step. */
  assert.equal(script.filter(step => step.kind === "end").length, 1);
  assert.equal(script[script.length - 1].kind, "end");
});

test("every copy key the script names exists in English", () => {
  const script = plain(borrower.SCRIPT);
  const keys = [];
  for (const step of script) {
    for (const [name, value] of Object.entries(step)) {
      if (name.endsWith("Key") && typeof value === "string") keys.push(value);
    }
  }
  assert.ok(keys.length > 40);
  assert.deepEqual(plain(copy.missingKeys("en", keys)), []);
});

test("the nine documents of the script are the nine of the engine", () => {
  const script = plain(borrower.SCRIPT);
  const touched = new Set(
    script.filter(step => step.kind === "document").map(step => step.documentId)
  );
  assert.deepEqual([...touched].sort(), [...plain(workspace.DOCUMENT_IDS)].sort());
});

/* ========================================================== the interpreter */

test("applyStep is pure over (viewState, step)", () => {
  const before = start();
  const snapshot = JSON.stringify(plain(before));
  const step = plain(borrower.SCRIPT).find(candidate => candidate.kind === "assistant");

  const after = borrower.applyStep(before, step);
  assert.notEqual(after, before, "applyStep returns a new view state");
  assert.equal(JSON.stringify(plain(before)), snapshot, "the input was mutated");
  assert.equal(plain(after).thread.length, plain(before).thread.length + 1);
});

test("an unknown step kind changes nothing", () => {
  const before = start();
  const after = borrower.applyStep(before, { kind: "nonsense" });
  assert.equal(after, before, "an unknown kind is a no-op by reference");
});

test("an assistant step appends one incoming message with its copy key", () => {
  const next = borrower.applyStep(start(), {
    kind: "assistant",
    key: "borrower.msg.doc3-request",
    documentId: "employment-tenure"
  });
  const thread = plain(next).thread;
  assert.equal(thread.length, 1);
  assert.equal(thread[0].author, "assistant");
  assert.equal(thread[0].key, "borrower.msg.doc3-request");
  assert.equal(plain(next).currentDocumentId, "employment-tenure");
});

test("a borrower step appends one outgoing message carrying its attachment", () => {
  const next = borrower.applyStep(start(), {
    kind: "borrower",
    key: "borrower.msg.here-you-go",
    fileKey: "borrower.file.payslips",
    metaKey: "borrower.file-meta.payslips",
    documentId: "payslips"
  });
  const thread = plain(next).thread;
  assert.equal(thread.length, 1);
  assert.equal(thread[0].author, "borrower");
  assert.equal(thread[0].attachment.fileKey, "borrower.file.payslips");
  /* The file is on its way but nothing is decided: the engine is untouched. */
  assert.equal(verdictOf(next, "payslips"), "not-uploaded");
  assert.ok(plain(next).analysing.includes("payslips"));
});

test("a document step registers the upload and raises the engine's own item", () => {
  const rejected = borrower.applyStep(start(), {
    kind: "document",
    documentId: "tax-folder",
    verdict: "rejected",
    fileKey: "borrower.file.tax-folder",
    feedKey: "borrower.feed.doc5-incomplete"
  });
  assert.equal(verdictOf(rejected, "tax-folder"), "rejected");
  const items = openItems(rejected);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "document-exception");
  assert.equal(items[0].documentId, "tax-folder");
  assert.equal(plain(rejected).feed.length, 1);
  assert.equal(plain(rejected).feed[0].key, "borrower.feed.doc5-incomplete");
  /* The checklist stops showing it as being analysed. */
  assert.ok(!plain(rejected).analysing.includes("tax-folder"));
});

test("a second verdict on a document closes the work the first one raised", () => {
  let view = borrower.applyStep(start(), {
    kind: "document",
    documentId: "payslips",
    verdict: "rejected",
    fileKey: "borrower.file.pension-certificate"
  });
  assert.equal(openItems(view).length, 1);

  view = borrower.applyStep(view, {
    kind: "document",
    documentId: "payslips",
    verdict: "accepted",
    fileKey: "borrower.file.payslips"
  });
  assert.equal(verdictOf(view, "payslips"), "accepted");
  assert.equal(openItems(view).length, 0, "the exception it replaced was resolved");
});

test("a verify step ticks one source check and never repeats it", () => {
  const once = borrower.applyStep(start(), { kind: "verify", checkId: "valid-rut" });
  assert.deepEqual(plain(once).verified, ["valid-rut"]);
  const twice = borrower.applyStep(once, { kind: "verify", checkId: "valid-rut" });
  assert.deepEqual(plain(twice).verified, ["valid-rut"]);
});

test("a status step moves the phase and the portal pill", () => {
  const next = borrower.applyStep(start(), {
    kind: "status",
    phase: "documents",
    statusKey: "borrower.portal.status-review"
  });
  assert.equal(plain(next).phase, "documents");
  assert.equal(plain(next).statusKey, "borrower.portal.status-review");
});

test("an escalate step leaves the document with a specialist and keeps its exception open", () => {
  let view = borrower.applyStep(start(), {
    kind: "document",
    documentId: "title-certificate",
    verdict: "rejected",
    fileKey: "borrower.file.title-certificate"
  });
  view = borrower.applyStep(view, {
    kind: "escalate",
    documentId: "title-certificate",
    verdict: "under-review"
  });
  assert.equal(verdictOf(view, "title-certificate"), "under-review");
  assert.equal(plain(view).escalated, true);
  const items = openItems(view);
  assert.equal(items.length, 1, "escalating does not close the exception");
  assert.equal(items[0].type, "document-exception");
});

test("an end step finishes the demo", () => {
  const next = borrower.applyStep(start(), { kind: "end" });
  assert.equal(plain(next).finished, true);
});

/* ================================================== the whole script, run through
   This is the handoff Task 8 depends on: whatever else the narrative does, it
   must land on exactly the case the lender portal opens onto. */

test("running the whole script ends on the §3.3 handoff", () => {
  const view = finished();
  const state = plain(view.state);

  const accepted = Object.keys(state.documents).filter(
    id => state.documents[id].verdict === "accepted"
  );
  assert.equal(accepted.length, 7, "seven documents are accepted");
  assert.equal(state.documents["tax-folder"].verdict, "rejected");
  assert.equal(state.documents["title-certificate"].verdict, "under-review");
  assert.ok(!accepted.includes("tax-folder"));
  assert.ok(!accepted.includes("title-certificate"));

  const items = openItems(view);
  assert.equal(items.length, 2, "exactly two open review items");
  assert.deepEqual(
    items.map(item => [item.type, item.documentId]).sort(),
    [
      ["document-exception", "tax-folder"],
      ["document-exception", "title-certificate"]
    ].sort()
  );

  /* The stage is derived, and review work never moved it. */
  assert.equal(workspace.deriveStage(view.state), workspace.STAGES.GATHERING);
  assert.equal(plain(view).phase, "documents");
  assert.equal(plain(view).finished, true);
  assert.equal(plain(view).escalated, true);
});

test("the run is deterministic and allocates no clock or random id", () => {
  assert.deepEqual(plain(finished().state), plain(finished().state));
  const ids = plain(finished().state).auditEvents.map(event => event.id);
  assert.equal(new Set(ids).size, ids.length, "audit ids are unique");
  for (const id of ids) assert.match(id, /^audit-\d+$/);
});

test("the whole nine-document checklist has been through the thread", () => {
  const view = finished();
  const state = plain(view.state);
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    assert.notEqual(
      state.documents[documentId].verdict,
      "not-uploaded",
      `${documentId} never arrived`
    );
    assert.ok(state.documents[documentId].history.length > 0);
  }
  assert.equal(plain(view).verified.length, plain(borrower.VERIFY_CHECKS).length);
});

/* =============================================================== the simulator */

test("every figure the simulator shows comes from WestonCredit", () => {
  const figures = credit.caseFigures();
  const markup = borrower.renderSimulator(finished());

  assert.ok(markup.includes(shown("borrower.sim.title")));
  assert.ok(markup.includes(borrower.escapeHtml(credit.formatUF(figures.propertyUF))));
  assert.ok(markup.includes(borrower.escapeHtml(credit.formatUF(figures.downPaymentUF))));
  /* To the peso. */
  assert.ok(markup.includes(borrower.escapeHtml(credit.formatCLP(figures.paymentCLP))));
  assert.ok(markup.includes(borrower.escapeHtml(credit.formatCLP(figures.incomeCLP))));
  assert.ok(
    markup.includes(borrower.escapeHtml(credit.formatPct(figures.dti.ratio * 100))),
    "the payment-to-income ratio"
  );
  assert.ok(markup.includes(borrower.escapeHtml(String(figures.termYears))));
  /* No hardcoded derived figure anywhere in the page source. */
  assert.ok(!/UF\s*3,150/.test(html), "the loan amount is derived, never written down");
  assert.ok(!/592,218/.test(html), "the payment is derived, never written down");
  assert.ok(!/24\.7%/.test(html), "the ratio is derived, never written down");
});

test("the pre-approval states what the guarantee does and does not do", () => {
  const figures = credit.caseFigures();
  const markup = borrower.renderPreApproval(finished());

  assert.ok(markup.includes(shown("borrower.result.pre-approved")));
  assert.ok(markup.includes(shown("borrower.result.guarantee-explainer")));
  assert.ok(markup.includes(borrower.escapeHtml(credit.formatCLP(figures.paymentCLP))));
  /* Both sides of the comparison, priced by the module. */
  const withoutUF = credit.monthlyPaymentUF(
    credit.loanFor(credit.PROPERTY_UF, credit.LTV_STANDARD),
    credit.RATE_STANDARD
  );
  assert.ok(
    markup.includes(borrower.escapeHtml(credit.formatCLP(credit.monthlyCLP(withoutUF)))),
    "the payment without the benefit"
  );
});

/* The verification list is the section she watches for four seconds, so what it
   does when nothing is happening matters as much as what it does when the
   sources are answering. */

const states = viewState => plain(borrower.verifyRowStates(viewState, borrower.figures(viewState)));

test("an untouched page has not started asking: no spinner, nothing checking", () => {
  const fresh = borrower.initialViewState();
  assert.equal(borrower.verifyStarted(fresh), false);
  assert.deepEqual(
    new Set(states(fresh)),
    new Set(["idle"]),
    "every row is at rest before she has done anything"
  );

  const markup = borrower.renderVerifyChecks(fresh, borrower.figures(fresh));
  assert.ok(!markup.includes('data-state="waiting"'), "nothing is out at a source yet");
  assert.ok(!markup.includes('data-state="done"'));
  assert.ok(markup.includes(shown("borrower.fogaes.not-checked")));
  assert.ok(!markup.includes(shown("borrower.fogaes.checking-item")));
  /* And the panel beside it does not claim to be checking either. */
  assert.ok(borrower.renderSimulator(fresh).includes(shown("borrower.fogaes.waiting")));
});

test("the first keystroke starts the run, and exactly one row spins at a time", () => {
  /* One field given: some checks can answer, the next one is out at its source,
     and the rest have not been asked. */
  const typing = borrower.setFormField(borrower.initialViewState(), "condition", "new");
  assert.equal(borrower.verifyStarted(typing), true);
  const spinning = states(typing).filter(state => state === "waiting");
  assert.equal(spinning.length, 1, "one spinner, never a column of them");

  /* Pressing `Use demo data` answers everything, so nothing is left spinning. */
  const filled = borrower.useDemoData(borrower.initialViewState());
  assert.deepEqual(new Set(states(filled)), new Set(["done"]));
});

test("a run under way spins the next unanswered check and no others", () => {
  const running = borrower.setPaused(borrower.initialViewState(), false);
  const started = { ...plain(running), started: true, verified: ["new-home"] };
  const row = states(started);
  assert.equal(row[0], "done");
  assert.equal(row[1], "waiting");
  assert.deepEqual(new Set(row.slice(2)), new Set(["idle"]));
});

/* ================================================================ the checklist */

test("the checklist renders nine documents with their verdicts and progress", () => {
  const markup = borrower.renderChecklist(finished());
  const ids = plain(workspace.DOCUMENT_IDS);

  for (const documentId of ids) {
    assert.ok(markup.includes('data-document-id="' + documentId + '"'), documentId);
    assert.ok(markup.includes(shown("doc." + documentId + ".name")), documentId);
  }
  assert.ok(markup.includes(shown("verdict.rejected")));
  assert.ok(markup.includes(shown("verdict.under-review")));
  assert.ok(
    markup.includes(shown("borrower.checklist.progress", { received: 7, total: ids.length }))
  );
  /* Attention is never colour alone: each row carries its verdict as a word. */
  assert.match(markup, /data-verdict="rejected"/);
  assert.match(markup, /data-verdict="under-review"/);
  /* Every control is a real button with an accessible name. */
  assert.match(markup, /<button[^>]+data-document-id="title-certificate"[^>]+aria-label="/);
  assert.ok(!/onclick=/.test(markup));
});

/* ================================================================== the thread */

test("the thread renders both voices, the attachments, and the day marker", () => {
  const markup = borrower.renderThread(finished());
  assert.ok(markup.includes(shown("borrower.chat.today")));
  assert.ok(markup.includes(shown("borrower.chat.assistant-name")));
  assert.ok(markup.includes(shown("borrower.file.national-id")));
  assert.ok(markup.includes(shown("borrower.file-meta.national-id")));
  assert.match(markup, /class="bubble assistant"/);
  assert.match(markup, /class="bubble borrower"/);
  /* WhatsApp emphasis survives as markup, and only from the script. */
  assert.match(markup, /<b>/);
});

test("the composer refuses blank input and posts real text once", () => {
  const view = finished();

  const blank = borrower.sendBorrowerMessage(view, "   ");
  assert.equal(blank.changed, false);
  assert.equal(blank.viewState, view, "a blank message changes nothing at all");
  assert.equal(blank.announcement.key, "borrower.chat.blank");

  const before = openItems(view).length;
  const sent = borrower.sendBorrowerMessage(view, "Can I upload page 1 tonight?");
  assert.equal(sent.changed, true);
  assert.equal(sent.announcement.key, "borrower.chat.sent");

  const thread = plain(sent.viewState).thread;
  assert.equal(thread.length, plain(view).thread.length + 1, "exactly one message appended");
  assert.equal(thread[thread.length - 1].author, "borrower");
  assert.equal(thread[thread.length - 1].text, "Can I upload page 1 tonight?");

  const raised = openItems(sent.viewState);
  assert.equal(raised.length, before + 1, "exactly one review item");
  const fresh = raised.filter(item => item.type === "borrower-message");
  assert.equal(fresh.length, 1);
  assert.ok(fresh[0].messageId, "the item is linked to the message it is about");
});

test("typed text is escaped before it reaches the thread", () => {
  const attack = '<img src=x onerror="alert(1)"> & <script>bad()</script>';
  const sent = borrower.sendBorrowerMessage(finished(), attack);
  const markup = borrower.renderThread(sent.viewState);

  assert.ok(!markup.includes("<img"), "no live element");
  /* The quotes are entities too, so the handler cannot close as an attribute. */
  assert.ok(!markup.includes('onerror="alert'), "no live handler");
  assert.ok(!markup.includes("<script>bad"), "no live script");
  assert.ok(markup.includes("&lt;img src=x onerror="), "the text is shown, inert");
  assert.ok(markup.includes("&amp;"));
});

test("typed text is never treated as WhatsApp markup", () => {
  const sent = borrower.sendBorrowerMessage(finished(), "*not bold* <b>nor this</b>");
  const markup = borrower.renderThread(sent.viewState);
  assert.ok(markup.includes("*not bold*"), "her asterisks stay hers");
  assert.ok(markup.includes("&lt;b&gt;nor this&lt;/b&gt;"));
});

/* ================================================================== the drawer */

test("the drawer is a labelled modal dialog with tabs", () => {
  const view = finished();
  const open = borrower.openDocument(view, "title-certificate");
  const markup = borrower.renderDrawer(open);

  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /aria-labelledby="borrower-drawer-title"/);
  assert.match(markup, /<h2 id="borrower-drawer-title">/);
  assert.match(markup, /role="tablist"/);
  assert.equal((markup.match(/role="tab"/g) || []).length, 4);
  assert.ok(markup.includes(shown("borrower.drawer.tab-review")));
  assert.ok(markup.includes(shown("borrower.drawer.tab-assistant")));
  assert.ok(markup.includes(shown("borrower.drawer.tab-document")));
  assert.ok(markup.includes(shown("borrower.drawer.tab-history")));
  assert.match(markup, /aria-selected="true"/);
});

test("the loan assistant tab is empty until this document has a message on it", () => {
  const opened = borrower.setDrawerTab(
    borrower.openDocument(finished(), "national-id"),
    "assistant"
  );
  const markup = borrower.renderDrawer(opened);
  assert.ok(markup.includes(shown("borrower.drawer.assistant-empty")));
  assert.ok(markup.includes('id="drawer-composer"'));
  assert.ok(markup.includes('data-document-id="national-id"'));
});

test("sending from the loan assistant tab files the message on that document, not the ambient thread", () => {
  const view = finished();
  const sent = borrower.sendDrawerMessage(view, "payslips", "Is anything else needed here?");

  assert.equal(sent.changed, true);
  const documents = plain(sent.viewState).state.documents;
  assert.equal(documents.payslips.messages.length, 1);
  assert.equal(documents.payslips.messages[0].author, "borrower");
  assert.equal(documents.payslips.messages[0].text, "Is anything else needed here?");
  /* The scripted narrative's thread is untouched — this is the document's own
     channel, not a second way to talk to the ambient composer. */
  assert.deepEqual(plain(sent.viewState).thread, plain(view).thread);

  const open = openItems(sent.viewState).filter(item => item.type === "borrower-message");
  assert.equal(open.length, 1);
  assert.equal(open[0].documentId, "payslips");

  const opened = borrower.setDrawerTab(
    borrower.openDocument(sent.viewState, "payslips"),
    "assistant"
  );
  const markup = borrower.renderDrawer(opened);
  assert.ok(markup.includes(borrower.escapeHtml("Is anything else needed here?")));
});

test("a blank message from the loan assistant tab does nothing", () => {
  const view = finished();
  const result = borrower.sendDrawerMessage(view, "payslips", "   ");
  assert.equal(result.changed, false);
  assert.equal(result.viewState, view);
  assert.deepEqual(plain(result.announcement), { key: "borrower.chat.blank" });
});

test("the drawer shows the title certificate comparison with the folio cited", () => {
  const view = borrower.openDocument(finished(), "title-certificate");
  const markup = borrower.renderDrawer(view);

  assert.ok(markup.includes(shown("borrower.drawer.stated")));
  assert.ok(markup.includes(shown("borrower.drawer.found")));
  assert.ok(markup.includes(shown("lender.documents.encumbrance-stated")));
  assert.ok(markup.includes(shown("lender.documents.encumbrance-found")));
  assert.ok(markup.includes(shown("lender.documents.folio")), "the registration is cited");
  /* The mismatched row is flagged by a word and a glyph, never colour alone. */
  assert.match(markup, /data-check-status="mismatch"/);
  assert.ok(markup.includes(shown("borrower.tag.mismatch")));
  /* And she is told a specialist has it, with nothing expected from her. */
  assert.ok(markup.includes(shown("borrower.banner.review.title")));
  assert.ok(markup.includes(shown("borrower.banner.review.body")));
});

test("the drawer explains the tax folder as the one field she can fix", () => {
  const view = borrower.openDocument(finished(), "tax-folder");
  const markup = borrower.renderDrawer(view);
  assert.ok(markup.includes(shown("borrower.banner.incomplete.title")));
  assert.ok(markup.includes(shown("borrower.banner.incomplete.body")));
  assert.match(markup, /data-check-status="missing"/);
  assert.ok(markup.includes(shown("lender.check.tax-folder.taxpayer-rut")));
});

test("an accepted document reads as accepted, and a closed drawer renders nothing", () => {
  const accepted = borrower.openDocument(finished(), "national-id");
  const markup = borrower.renderDrawer(accepted);
  assert.ok(markup.includes(shown("borrower.banner.accepted.title")));
  assert.match(markup, /data-check-status="verified"/);

  assert.equal(borrower.renderDrawer(finished()), "");
  /* A document that never arrived has no review to open. */
  assert.equal(plain(borrower.openDocument(start(), "payslips")).openDocumentId, null);
  assert.equal(borrower.renderDrawer(borrower.openDocument(start(), "payslips")), "");
});

test("the history tab lists what was uploaded for the document", () => {
  let view = borrower.openDocument(finished(), "payslips");
  view = borrower.setDrawerTab(view, "history");
  const markup = borrower.renderDrawer(view);
  assert.ok(markup.includes(shown("borrower.file.payslips")));
  assert.ok(markup.includes(shown("verdict.accepted")));
});

/* ============================================== the borrower sees nothing internal
   Spec §7: the internal routing alert belongs to the lender only. Her portal
   says a specialist is reviewing it and that she need do nothing. */

const INTERNAL = [
  [/officer/i, "the officer's role"],
  [/carolina/i, "the officer's given name"],
  [/reyes/i, "the officer's surname"],
  [/\bSLA\b/i, "a service level"],
  [/\bqueue[ds]?\b/i, "queue internals"],
  [/\brouted?\b/i, "routing"],
  [/routing/i, "routing"],
  [/head of risk/i, "the escalation path"],
  [/delegated authority/i, "the authority limit"],
  [/\b4[-\s]?hours?\b/i, "the four-hour promise"],
  [/assigned to you/i, "case assignment"],
  [/needs review/i, "the lender's review queue label"]
];

test("the borrower page source carries no officer, SLA, queue or routing copy", () => {
  for (const [pattern, what] of INTERNAL) {
    assert.ok(!pattern.test(html), `borrower.html mentions ${what}: ${pattern}`);
  }
});

test("nothing internal reaches the rendered borrower portal either", () => {
  const view = finished();
  let rendered = borrower.renderPage(view);
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    rendered += borrower.renderDrawer(borrower.openDocument(view, documentId));
  }
  for (const [pattern, what] of INTERNAL) {
    assert.ok(!pattern.test(rendered), `the rendered portal mentions ${what}: ${pattern}`);
  }
});

test("she is told a specialist has it and that nothing is expected from her", () => {
  const rendered = borrower.renderPage(finished());
  assert.ok(rendered.includes(shown("borrower.notice.escalated-title")));
  assert.ok(rendered.includes(shown("borrower.notice.escalated-body")));
  assert.ok(rendered.includes(shown("borrower.portal.status-open", { count: 2 })));
});

/* ================================================= the rail and the demo controls */

test("the phase rail carries the three phases and marks where she is", () => {
  const markup = borrower.renderPhaseRail(finished());
  for (const phase of plain(borrower.PHASES)) {
    assert.ok(markup.includes(shown("borrower.phase." + phase)), phase);
    assert.ok(markup.includes('data-phase="' + phase + '"'));
  }
  assert.match(markup, /aria-current="step"/);
  assert.match(markup, /<button/);
});

test("the open-items status pill is a real button that opens the same tray as the bell", () => {
  const view = finished();
  const markup = borrower.renderPhaseRail(view);
  assert.match(markup, /<button type="button" class="status-pill" data-notifications="toggle"/);
  assert.ok(markup.includes(shown("borrower.portal.status-open", { count: 2 })));
  assert.match(markup, /class="status-pill"[^>]*aria-expanded="false"[^>]*aria-controls="notification-panel"/);

  const opened = borrower.toggleNotifications(view);
  assert.equal(opened.notificationsOpen, true);
  const openMarkup = borrower.renderPhaseRail(opened);
  assert.match(openMarkup, /class="status-pill"[^>]*aria-expanded="true"/);
});

/* The tray is two lists, because the two kinds are answered in two different
   places. At the handoff the case is waiting on two documents and the team has
   had the last word in the conversation, so it reads 2 and 1. */
test("the tray separates the document notifications from the message one", () => {
  const view = finished();
  assert.deepEqual(
    plain(borrower.notificationsFor(view)).map(item => item.kind),
    ["document", "document", "chat"]
  );
  assert.equal(borrower.unseenNotifications(view).length, 3);

  const markup = borrower.renderTopbar(borrower.toggleNotifications(view));
  assert.match(markup, /data-notification-kind="document"[\s\S]*data-notification-kind="chat"/);
  assert.ok(markup.includes(shown("borrower.notifications.group-documents")));
  assert.ok(markup.includes(shown("borrower.notifications.group-chat")));
  /* Each group counts its own, so neither heading speaks for the other. */
  assert.match(markup, /notification-group-count">2</);
  assert.match(markup, /notification-group-count">1</);
  /* And each names its own door out: the document's page, or the conversation. */
  assert.match(markup, /data-preview-document="tax-folder"/);
  assert.match(markup, /data-notification-chat="open"/);
  assert.ok(markup.includes(shown("borrower.notifications.chat-title")));
});

test("the message notification is derived from whose turn it is", () => {
  const view = finished();
  const answered = borrower.sendBorrowerMessage(view, "Mando la página completa hoy").viewState;
  assert.deepEqual(
    plain(borrower.notificationsFor(answered)).map(item => item.kind),
    ["document", "document"],
    "she has answered, so nothing is waiting on her in the conversation"
  );

  /* Read the tray, then hear back: the reply is a new unread line rather than
     one the last opening already marked read. */
  const read = borrower.toggleNotifications(answered);
  assert.equal(borrower.unseenNotifications(read).length, 0);
  const replied = borrower.assistantReplies(read, "tax-folder");
  const waiting = plain(borrower.notificationsFor(replied)).filter(item => item.kind === "chat");
  assert.equal(waiting.length, 1);
  assert.equal(borrower.unseenNotifications(replied).length, 1);
});

test("following the message notification lands her on the conversation", () => {
  const away = borrower.goToPhase(borrower.toggleNotifications(finished(), true), "simulate");
  const followed = borrower.openChat(away);
  assert.equal(followed.phase, "documents");
  assert.equal(followed.scrollTop, true, "a page change asks for the top of the page");
  assert.equal(followed.notificationsOpen, false);
  assert.equal(followed.openDocumentId, null, "the drawer does not stay over the thread");

  /* Already there is not a page change. */
  const stayed = borrower.openChat(borrower.toggleNotifications(finished(), true));
  assert.equal(stayed.phase, "documents");
  assert.equal(stayed.scrollTop, false);
});

test("the demo controls play, pause, change speed, restart and switch language", () => {
  const paused = borrower.setPaused(finished(), true);
  const markup = borrower.renderDemoControls(paused);

  assert.match(markup, /data-demo-action="play-pause"/);
  assert.match(markup, /data-demo-action="restart"/);
  assert.ok(markup.includes(shown("borrower.control.play")), "paused offers play");
  assert.ok(borrower.renderDemoControls(finished()).includes(shown("borrower.control.restart")));

  /* The speeds are one choice, so they are one select — labelled, and with the
     current speed selected rather than merely listed first. */
  assert.match(markup, /<select[^>]*id="speed-select"[^>]*data-speed-select/);
  assert.match(markup, /<label[^>]*for="speed-select"/);
  for (const speed of plain(borrower.SPEEDS)) {
    assert.ok(markup.includes('<option value="' + speed + '"'), String(speed));
    assert.ok(markup.includes(shown("borrower.control.speed-" + speed + "x")));
  }
  assert.match(markup, /<option value="1" selected/);

  /* Both locales are offered, and the control is real rather than decorative. */
  assert.ok(markup.includes(shown("borrower.control.language")));
  const locales = plain(copy.LOCALES);
  assert.deepEqual(locales, ["en", "es"]);
  assert.equal((markup.match(/data-locale="/g) || []).length, locales.length);
  for (const locale of locales) {
    assert.ok(markup.includes('data-locale="' + locale + '"'));
    assert.ok(markup.includes(shown("borrower.control.language-" + locale)));
  }
  /* Switching is real, and an unregistered locale is still refused rather than
     half-applied. Put back to English before the next test reads the page. */
  try {
    assert.equal(borrower.setLocale("es"), "es");
    assert.equal(borrower.setLocale("de"), "es", "an unregistered locale is refused");
  } finally {
    assert.equal(borrower.setLocale("en"), "en");
  }

  /* And the unit switch beside it, the same one the officer has. */
  assert.ok(markup.includes(shown("borrower.control.money")));
  for (const unit of plain(borrower.MONEY_UNITS)) {
    assert.ok(markup.includes('data-money-unit="' + unit + '"'), unit);
  }
});

test("speed and pause are view state, not globals", () => {
  const fast = borrower.setSpeed(finished(), 4);
  assert.equal(plain(fast).speed, 4);
  assert.match(borrower.renderDemoControls(fast), /<option value="4" selected/);
  /* An unknown speed is refused rather than applied. */
  assert.equal(plain(borrower.setSpeed(finished(), 7)).speed, 1);
});

/* ====================================================== autoplay and the seam */

test("autoplay runs through the injectable later seam, never a bare timer", () => {
  const clock = scheduler();
  let view = start();
  const played = borrower.play(view, {
    later: clock.later,
    onStep: next => {
      view = next;
    }
  });
  assert.ok(played, "play hands back the handle its own scheduler returned");
  assert.equal(clock.calls.length, 1, "one beat is scheduled at a time");
  assert.equal(clock.calls[0].ms, plain(borrower.SCRIPT)[0].delay);

  clock.fire();
  assert.equal(plain(view).cursor, 1, "the first step played");
  assert.equal(clock.calls.length, 1, "and the next one is scheduled");
});

test("speed divides the delay the seam is given", () => {
  const clock = scheduler();
  borrower.play(borrower.setSpeed(start(), 4), { later: clock.later, onStep() {} });
  assert.equal(clock.calls[0].ms, Math.round(plain(borrower.SCRIPT)[0].delay / 4));
});

test("a paused demo schedules nothing, and the whole script drains", () => {
  const clock = scheduler();
  assert.equal(borrower.play(borrower.setPaused(start(), true), { later: clock.later }), null);
  assert.equal(clock.calls.length, 0);

  let view = start();
  const step = () => {
    borrower.play(view, {
      later: clock.later,
      onStep: next => {
        view = next;
      }
    });
  };
  step();
  let guard = 0;
  while (clock.calls.length && guard < 500) {
    clock.fire();
    step();
    guard += 1;
  }
  assert.ok(guard < 500, "the narrative terminates");
  assert.equal(plain(view).finished, true);
  assert.equal(plain(view).cursor, plain(borrower.SCRIPT).length);
  assert.equal(openItems(view).length, 2);
});

test("there is exactly one setTimeout on the page, inside the default scheduler", () => {
  assert.equal((html.match(/setTimeout\(/g) || []).length, 1);
  assert.match(html, /function DEFAULT_LATER\(ms, fn\) \{\s*return setTimeout\(fn, ms\);/);
  assert.ok(!/Date\.now\(\)/.test(html), "no clock inside the page");
  assert.ok(!/Math\.random\(\)/.test(html), "no randomness inside the page");
});

/* ================================================================== restart */

test("restart returns to the opening state and clears the message bridge", () => {
  const storage = new Map([
    [borrower.MESSAGE_BRIDGE_KEY, JSON.stringify([{ id: "message-1", text: "hello" }])],
    [borrower.VIEW_STORAGE_KEY, JSON.stringify({ version: borrower.BORROWER_VIEW_VERSION, phase: "documents" })],
    ["unrelated", "keep me"]
  ]);
  const store = {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };

  const opening = borrower.restart({ storage: store });
  assert.deepEqual(plain(opening), plain(borrower.initialViewState()));
  assert.equal(plain(opening).thread.length, 0);
  assert.equal(plain(opening).cursor, 0);
  assert.equal(plain(opening).finished, false);
  assert.equal(openItems(opening).length, 0);
  /* Task 8 gave the bridge its shape: restart empties the shared thread rather than
     deleting the key, because the envelope also carries the run counter that keeps
     the first message of the next run from colliding with a remembered id. What
     matters, and what this asserts, is that the thread reads back empty. */
  assert.deepEqual(plain(borrower.bridgeRead(store).entries), []);
  /* Her saved place on the page is a plain key, so restart really can delete
     it — the next load has nothing to resume into but the opening state. */
  assert.equal(store.getItem(borrower.VIEW_STORAGE_KEY), null);
  assert.equal(store.getItem("unrelated"), "keep me", "and nothing else was touched");
  /* And a lender tab already open on this case — which cannot see this
     tab's sessionStorage at all — hears about the restart over the one
     thing they do share. */
  assert.match(store.getItem(borrower.CASE_RESET_KEY), /^\d+$/);
});

test("each restart's broadcast is a higher number than the one before it", () => {
  const storage = new Map();
  const store = {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };
  borrower.restart({ storage: store });
  const first = Number(store.getItem(borrower.CASE_RESET_KEY));
  borrower.restart({ storage: store });
  const second = Number(store.getItem(borrower.CASE_RESET_KEY));
  assert.ok(second > first, `expected ${second} > ${first}`);
});

test("restart survives a storage that throws", () => {
  const hostile = {
    getItem() {
      throw new Error("private mode");
    },
    setItem() {
      throw new Error("private mode");
    },
    removeItem() {
      throw new Error("private mode");
    }
  };
  const opening = borrower.restart({ storage: hostile });
  assert.deepEqual(plain(opening), plain(borrower.initialViewState()));
});

/* ===================================================================== page */

test("the page is a real document with the seams the suite needs", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /id="borrower-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<script src="assets\/copy\.js">/);
  assert.match(html, /<script src="assets\/weston-credit\.js">/);
  assert.match(html, /<script src="assets\/weston-workspace\.js">/);
  assert.match(html, /if \(typeof document !== "undefined"\) init\(\);/);
  assert.ok(!/draggable/.test(html), "no drag and drop anywhere");
  /* A real typable composer, not a decorative one. */
  assert.match(html, /id="borrower-app"/);
  const composer = borrower.renderThread(finished());
  assert.match(composer, /<input[^>]+id="composer-input"/);
  assert.match(composer, /<button[^>]+id="composer-send"/);
  assert.ok(composer.includes(shown("borrower.chat.placeholder")));
});

test("no user-visible English literal lives outside copy.js", () => {
  /* A sample of the narrative's own sentences: every one must come from t(). */
  const literals = [
    "Simulate your home loan",
    "Type a message",
    "Your documents",
    "Pre-approval",
    "Documents over WhatsApp",
    "Document review",
    "Restart",
    "Weston mortgage assistant"
  ];
  for (const literal of literals) {
    assert.ok(!html.includes(literal), `"${literal}" is written into borrower.html`);
  }
});

/* ======================================= the three phases are three pages (improvement 1) */

/* The Spanish original shows exactly one phase at a time and scrolls back to the
   top when it changes; the English build stacked all three in one column, so by
   the documents phase the simulator was still above the WhatsApp thread and the
   thread sat below the fold. Each phase is its own page again. */

const PANEL = phase => new RegExp('<div class="phase-panel" data-phase="' + phase + '"([^>]*)>');

const panelHidden = (markup, phase) => {
  const found = markup.match(PANEL(phase));
  assert.ok(found, `no panel rendered for ${phase}`);
  return / hidden/.test(found[1]);
};

test("exactly one phase panel is visible, whichever phase she is on", () => {
  const phases = plain(borrower.PHASES);
  for (const current of phases) {
    const markup = borrower.renderPage(borrower.goToPhase(start(), current));
    const visible = phases.filter(phase => !panelHidden(markup, phase));
    assert.deepEqual(visible, [current], `on ${current} the visible panels were ${visible}`);
  }
});

test("the simulator is hidden once she is past it", () => {
  const documents = borrower.renderPage(borrower.goToPhase(start(), "documents"));
  assert.ok(panelHidden(documents, "simulate"), "the simulator still shows on the documents phase");
  assert.ok(panelHidden(documents, "pre-approval"), "pre-approval still shows on the documents phase");
});

test("goToPhase moves her, refuses an unknown phase, and asks for a scroll to the top", () => {
  assert.equal(plain(borrower.goToPhase(start(), "documents")).phase, "documents");
  assert.equal(plain(borrower.goToPhase(start(), "nowhere")).phase, "simulate");
  /* The rail is real navigation: a phase change is a page change, so the page
     goes back to the top rather than leaving her mid-scroll. */
  assert.equal(plain(borrower.goToPhase(start(), "documents")).scrollTop, true);
  assert.equal(plain(borrower.goToPhase(start(), "simulate")).scrollTop, false, "same phase, no jump");
});

/* =========================================== the document preview (improvement 2) */

/* The Spanish drawer opens on a facsimile of the scanned page - letterhead, the
   fields as they appear on the document, the offending row ringed - and that
   picture is what makes the review legible to her. The English build had the
   caption and no page. */

const scanOf = documentId => {
  const view = borrower.openDocument(finished(), documentId);
  return borrower.renderDrawer(view);
};

test("every uploaded document opens on a facsimile of the scanned page", () => {
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    const markup = scanOf(documentId);
    assert.match(markup, /class="scan-page"/, documentId);
    assert.match(markup, /class="scan-org"/, documentId);
    assert.match(markup, /class="scan-title"/, documentId);
    assert.ok(markup.includes(shown("borrower.drawer.scan-stamp")), documentId);
    /* Ruled lines stand in for the body text nobody needs to read. */
    assert.match(markup, /class="scan-lines"/, documentId);
  }
});

test("the title certificate rings the encumbrance row on the page itself", () => {
  const markup = scanOf("title-certificate");
  assert.match(markup, /class="scan-row mismatch"/);
  assert.ok(markup.includes(shown("borrower.scan.title-certificate.row-encumbrances")));
  assert.ok(markup.includes(shown("borrower.scan.title-certificate.value-encumbrances")));
  /* The registrar's letterhead, not a generic one. */
  assert.ok(markup.includes(shown("borrower.scan.title-certificate.org")));
  /* Exactly one row is marked, and it carries a glyph as well as the colour. */
  assert.equal((markup.match(/class="scan-row mismatch"/g) || []).length, 1);
  assert.match(markup, /class="scan-mark"/);
});

test("the tax folder's page shows the unreadable RUT before she fixes it, and a clean one after", () => {
  const rejected = borrower.runScript();
  assert.equal(verdictOf(rejected, "tax-folder"), "rejected");
  const before = borrower.renderDrawer(borrower.openDocument(rejected, "tax-folder"));
  assert.ok(before.includes(shown("borrower.scan.tax-folder.value-rut-unreadable")));
  assert.match(before, /class="scan-row mismatch"/);

  /* After her re-upload the same page reads clean - no ringed row left over. */
  /* The same shape the narrative uses for her re-upload: the filename comes
     from a copy key, and registerUpload refuses a step without one. */
  const fixed = borrower.applyStep(rejected, {
    kind: "document",
    documentId: "tax-folder",
    verdict: "accepted",
    fileKey: "borrower.file.tax-folder"
  });
  assert.equal(verdictOf(fixed, "tax-folder"), "accepted", "the re-upload did not land");
  const after = borrower.renderDrawer(borrower.openDocument(fixed, "tax-folder"));
  assert.ok(!/class="scan-row mismatch"/.test(after), "the corrected folder still shows a ringed row");
  assert.ok(after.includes(shown("borrower.scan.tax-folder.value-rut")));
});

test("the facsimile escapes everything it prints", () => {
  const markup = scanOf("national-id");
  assert.ok(!/<script/i.test(markup));
  /* Values come from copy or from the case, never raw into markup. */
  assert.ok(markup.includes(shown("borrower.scan.national-id.org")));
});

test("a document that never arrived has no page to show", () => {
  const view = borrower.openDocument(start(), "title-certificate");
  assert.equal(plain(view).openDocumentId, null);
  assert.equal(borrower.renderDrawer(view), "");
});

/* ================== an upload closes its own work and nothing else (§4.2) */

/* The borrower page has its own copy of the same resolver, so it had the same
   defect: her document arriving closed any message she had filed against that
   document, without anyone reading it. */

test("her upload closes the document's exception but never her own message", () => {
  /* Her composer files against the document she is looking at, which at the end
     of the narrative is the title certificate — the same document the exception
     is about. That collision is the whole defect. */
  const sent = borrower.sendBorrowerMessage(
    borrower.runScript(),
    "Is page 1 enough, or the whole folder?"
  );
  assert.equal(sent.changed, true);
  let view = sent.viewState;

  const asked = openItems(view).filter(item => item.type === "borrower-message");
  assert.equal(asked.length, 1, "her message did not raise an item");
  const documentId = asked[0].documentId;
  const messageId = asked[0].id;
  assert.equal(
    openItems(view).filter(
      item => item.type === "document-exception" && item.documentId === documentId
    ).length,
    1,
    "the document she is asking about has no exception, so nothing would collide"
  );

  /* A new verdict on that document arrives. */
  view = borrower.applyStep(view, {
    kind: "document",
    documentId: documentId,
    verdict: "accepted",
    fileKey: "borrower.file.tax-folder"
  });

  const open = openItems(view);
  assert.ok(
    open.some(item => item.id === messageId),
    "her message was closed by a document arriving"
  );
  assert.equal(
    open.filter(item => item.type === "document-exception" && item.documentId === documentId).length,
    0,
    "the exception the upload answered is still open"
  );
});

/* ============================== the assistant keeps talking to her (demo only) */

/* She writes, and a beat later the assistant answers on its own — no click, and
   nobody driving it. The answer is decided by the state of the document she is
   asking about, so the same question twice gets the same reply and the demo is
   repeatable. The reply goes three places: her thread, the shared case state,
   and the bridge, which is how the lender's desk shows the same conversation. */

test("which answer she gets is decided by the case, never at random", () => {
  const view = finished();
  /* Document 9 is with a specialist. */
  assert.equal(
    borrower.assistantReplyKey(view, "title-certificate"),
    "borrower.assistant.reply-specialist"
  );
  /* Document 5 came back rejected: she is told exactly what to re-send. */
  assert.equal(borrower.assistantReplyKey(view, "tax-folder"), "borrower.assistant.reply-rejected");
  /* An accepted document needs nothing. */
  assert.equal(borrower.assistantReplyKey(view, "payslips"), "borrower.assistant.reply-accepted");

  /* Same state, same answer — twice. */
  assert.equal(
    borrower.assistantReplyKey(view, "tax-folder"),
    borrower.assistantReplyKey(view, "tax-folder")
  );
  /* And every key it can return is real copy. */
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    const key = borrower.assistantReplyKey(view, documentId);
    assert.deepEqual(plain(copy.missingKeys("en", [key])), [], key);
  }
});

test("her message schedules the assistant's answer through the later seam", () => {
  const clock = scheduler();
  let replied = null;
  const result = borrower.sendBorrowerMessage(finished(), "Any news on the certificate?", {
    later: clock.later,
    onReply: next => { replied = next; }
  });

  assert.equal(result.changed, true);
  /* Nothing has answered yet: it is scheduled, not done. */
  assert.equal(clock.calls.length, 1);
  assert.ok(clock.calls[0].ms > 0, "the assistant answers instantly, which reads as an echo");
  assert.equal(replied, null);

  clock.fire();

  assert.ok(replied, "the assistant never answered");
  const thread = plain(replied).thread;
  const last = thread[thread.length - 1];
  assert.equal(last.author, "assistant");
  assert.equal(last.key, "borrower.assistant.reply-specialist");
});

test("the assistant's answer reaches the shared state, so the lender's desk shows it", () => {
  const clock = scheduler();
  let replied = null;
  borrower.sendBorrowerMessage(finished(), "Any news?", {
    later: clock.later,
    onReply: next => { replied = next; }
  });
  clock.fire();

  const documents = plain(replied).state.documents;
  const messages = [];
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    messages.push(...documents[documentId].messages);
  }
  const authors = messages.map(message => message.author);
  assert.ok(authors.includes("borrower"), "her message is not in the shared state");
  assert.ok(authors.includes("assistant"), "the assistant's answer is not in the shared state");

  /* Answering her is not work for anyone: it raises no queue item. Hers still
     stands, because a machine reply is not an answer from a person. */
  const open = openItems(replied);
  assert.equal(open.filter(item => item.type === "borrower-message").length, 1);
});

test("the assistant reads the state as it is when it answers, not as it was at the click", () => {
  const clock = scheduler();
  let replied = null;
  /* She sends while document 5 is still rejected... */
  const first = borrower.sendBorrowerMessage(finished(), "About the tax folder?", {
    later: clock.later,
    readState: () => later,
    onReply: next => { replied = next; }
  });
  /* ...and it is accepted before the assistant gets to answer. */
  const later = borrower.applyStep(first.viewState, {
    kind: "document",
    documentId: "tax-folder",
    verdict: "accepted",
    fileKey: "borrower.file.tax-folder"
  });
  clock.fire();

  const thread = plain(replied).thread;
  assert.equal(thread[thread.length - 1].author, "assistant");
  /* It answered about the state at the moment it spoke. */
  assert.equal(verdictOf(replied, "tax-folder"), "accepted");
});

test("no reply is scheduled for a blank message", () => {
  const clock = scheduler();
  const result = borrower.sendBorrowerMessage(finished(), "   ", { later: clock.later });
  assert.equal(result.changed, false);
  assert.equal(clock.calls.length, 0, "the assistant answered a message she never sent");
});

test("the handoff carries what she was told, so the desk is never an empty thread", () => {
  /* Everything before the escalation is her conversation with a machine and
     stays on her page. The routing message is the context the officer inherits. */
  const view = finished();
  const messages = [];
  for (const documentId of plain(workspace.DOCUMENT_IDS)) {
    messages.push(...plain(view).state.documents[documentId].messages);
  }
  const fromAssistant = messages.filter(message => message.author === "assistant");
  assert.equal(fromAssistant.length, 1, "exactly the routing message, not the whole narrative");
  assert.ok(
    fromAssistant[0].text.includes("mortgage from another bank"),
    "the routing message does not say what was found"
  );

  /* It is the assistant talking, so it asks nothing of anyone: the two open
     items at handoff are still the tax folder and the title certificate. */
  const open = openItems(view);
  assert.equal(open.length, 2);
  assert.equal(open.filter(item => item.type === "borrower-message").length, 0);
});
