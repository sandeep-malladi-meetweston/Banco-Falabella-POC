import test from "node:test";
import assert from "node:assert/strict";
import { loadScriptApi } from "./page-test-helpers.mjs";

/* The engine is DOM-free and dependency-free: it loads on its own, with no copy
   layer and no credit module in the context. Nothing it stores is English prose
   it invented — user-visible labels are copy keys the renderer resolves. */
const { api: ws } = loadScriptApi("assets/weston-workspace.js", "WestonWorkspace");

/* Values crossing out of the vm realm carry that realm's prototypes, so a
   strict deepEqual against a test-realm literal fails on the prototype alone.
   Everything compared against a literal goes through plain() first. */
const plain = value => JSON.parse(JSON.stringify(value));

const SUBMITTED = "2026-08-05T09:00:00.000Z";
const STARTED = "2026-08-05T09:05:00.000Z";
const T1 = "2026-08-06T12:00:00.000Z";
const T2 = "2026-08-06T12:30:00.000Z";
const T3 = "2026-08-06T13:00:00.000Z";

const STARTED_WORKFLOW = { submittedAt: SUBMITTED, checklistStartedAt: STARTED };

/* A case whose checklist is open but whose documents are all still to come. */
function gatheringState() {
  return ws.normalizeState(undefined, STARTED_WORKFLOW);
}

/* Every document accepted — the handoff shape, minus the exceptions. */
function allAcceptedState(overrides = {}) {
  let state = gatheringState();
  for (const documentId of ws.DOCUMENT_IDS) {
    const verdict = overrides[documentId] || "accepted";
    const options = verdict === "accepted-with-condition" ? { condition: "Release at Folio 1,842" } : {};
    state = ws.setVerdict(state, documentId, verdict, options, T1);
  }
  return state;
}

/* Two open review items on two different documents: the §3.3 handoff. */
function twoOpenItemsState() {
  let state = gatheringState();
  state = ws.registerUpload(state, "tax-folder", { filename: "tax_folder.pdf", verdict: "rejected" }, T1);
  state = ws.registerUpload(state, "title-certificate", { filename: "title.pdf", verdict: "under-review" }, T2);
  return state;
}

const idsOf = list => plain(list).map(entry => entry.id);

const actionsAfter = (before, after) =>
  plain(after.auditEvents.slice(before.auditEvents.length)).map(event => event.action);

/* A no-op must hand back the very object it was given, and must not have
   touched it on the way out. Reference equality is the strongest form of
   "returns the input unchanged"; the snapshot catches mutation before return. */
function assertNoOp(state, result, label) {
  const snapshot = plain(state);
  assert.equal(result, state, `${label}: expected the input state back by reference`);
  assert.deepEqual(plain(state), snapshot, `${label}: the input state was mutated`);
}

/* ============================================================= the schema */

test("the exported constants are the spec's vocabulary, frozen", () => {
  assert.equal(ws.STATE_VERSION, 1);
  assert.deepEqual(plain(Object.values(ws.STAGES)), [
    "new-applications",
    "gathering-documents",
    "credit-review",
    "approved-deed",
    "disbursed",
    "closed-archived"
  ]);
  assert.deepEqual([...ws.REVIEW_TYPES], [
    "borrower-message",
    "new-upload",
    "document-exception",
    "deed-deadline"
  ]);
  assert.deepEqual([...ws.VERDICTS], [
    "not-uploaded",
    "under-review",
    "rejected",
    "accepted",
    "accepted-with-condition"
  ]);
  assert.deepEqual([...ws.DOCUMENT_IDS], [
    "national-id",
    "payslips",
    "employment-tenure",
    "pension-contributions",
    "tax-folder",
    "down-payment-proof",
    "purchase-promise",
    "first-home-affidavit",
    "title-certificate"
  ]);
  assert.deepEqual([...ws.CONDITION_IDS], ["c1", "c2", "c3"]);
  assert.deepEqual([...ws.APPROVAL_CONDITION_IDS], ["c1", "c2"]);
  assert.ok(Object.isFrozen(ws.STAGES));
  assert.ok(Object.isFrozen(ws.REVIEW_TYPES));
  assert.ok(Object.isFrozen(ws.VERDICTS));
  assert.ok(Object.isFrozen(ws.DOCUMENT_IDS));
});

/* ========================================================== normalisation */

test("normalizeState fills every collection from nothing at all", () => {
  const state = ws.normalizeState();
  assert.equal(state.version, 1);
  assert.equal(state.nextSequence, 1);
  assert.deepEqual(Object.keys(state.documents), [...ws.DOCUMENT_IDS]);
  for (const documentId of ws.DOCUMENT_IDS) {
    assert.deepEqual(plain(state.documents[documentId]), {
      verdict: "not-uploaded",
      currentFilename: "",
      condition: "",
      history: [],
      messages: []
    });
  }
  assert.deepEqual(plain(state.reviewItems), []);
  assert.deepEqual(plain(state.auditEvents), []);
  assert.deepEqual(plain(state.conditions), [
    { id: "c1", cleared: false, clearedAt: null },
    { id: "c2", cleared: false, clearedAt: null },
    { id: "c3", cleared: false, clearedAt: null }
  ]);
  assert.deepEqual(plain(state.workflow), {
    submittedAt: null,
    checklistStartedAt: null,
    approvedAt: null,
    disbursedAt: null,
    approvedConditions: [],
    terminal: null
  });
});

test("normalizeState takes the workflow argument, and the payload's own values win", () => {
  const fromArgument = ws.normalizeState(undefined, STARTED_WORKFLOW);
  assert.equal(fromArgument.workflow.submittedAt, SUBMITTED);
  assert.equal(fromArgument.workflow.checklistStartedAt, STARTED);

  const fromPayload = ws.normalizeState(
    { version: 1, workflow: { submittedAt: "2026-07-01T00:00:00.000Z" } },
    STARTED_WORKFLOW
  );
  assert.equal(fromPayload.workflow.submittedAt, "2026-07-01T00:00:00.000Z");
  assert.equal(fromPayload.workflow.checklistStartedAt, STARTED);
});

test("normalizeState repairs a partial payload without losing messages or history", () => {
  const payload = {
    version: 1,
    nextSequence: 7,
    documents: {
      "national-id": {
        verdict: "accepted",
        currentFilename: "id.jpg",
        history: [{ verdict: "accepted", timestamp: T1 }, "not a record"],
        messages: [
          { id: "message-3", author: "lender", text: "Thanks", timestamp: T1 },
          { author: "borrower", text: "no timestamp" }
        ]
      },
      /* Malformed: dropped and reseeded clean, messages and all. */
      payslips: { verdict: 5, currentFilename: 3, messages: [{ author: "borrower", text: "x", timestamp: T1 }] },
      /* Not one of the nine: dropped outright. */
      "not-a-document": { verdict: "accepted", currentFilename: "who.pdf" }
    },
    reviewItems: [
      {
        id: "review-4",
        type: "document-exception",
        documentId: "tax-folder",
        summary: "review.document-exception",
        createdAt: T1,
        resolvedAt: null,
        resolutionMethod: null
      },
      { id: "review-5", type: "not-a-reason", documentId: "payslips", summary: "", createdAt: T1 },
      { id: "review-6", type: "new-upload", documentId: "not-a-document", summary: "", createdAt: T1 }
    ],
    auditEvents: [
      { id: "audit-2", timestamp: T1, actor: "system", action: "document-uploaded", documentId: "national-id", details: "id.jpg" },
      { id: "audit-9", timestamp: T1, actor: "system", documentId: null, details: "no action" }
    ],
    conditions: [
      { id: "c2", cleared: true, clearedAt: T1 },
      { id: "nope", cleared: true, clearedAt: T1 }
    ],
    workflow: STARTED_WORKFLOW
  };
  const state = ws.normalizeState(payload);

  assert.equal(state.documents["national-id"].verdict, "accepted");
  assert.equal(state.documents["national-id"].currentFilename, "id.jpg");
  assert.deepEqual(plain(state.documents["national-id"].history), [{ verdict: "accepted", timestamp: T1 }]);
  assert.deepEqual(plain(state.documents["national-id"].messages), [
    { id: "message-3", author: "lender", text: "Thanks", timestamp: T1 }
  ]);

  assert.deepEqual(plain(state.documents.payslips), {
    verdict: "not-uploaded",
    currentFilename: "",
    condition: "",
    history: [],
    messages: []
  });
  assert.equal(Object.hasOwn(state.documents, "not-a-document"), false);
  assert.deepEqual(Object.keys(state.documents), [...ws.DOCUMENT_IDS]);

  assert.deepEqual(idsOf(state.reviewItems), ["review-4"]);
  assert.deepEqual(idsOf(state.auditEvents), ["audit-2"]);
  assert.deepEqual(plain(state.conditions), [
    { id: "c1", cleared: false, clearedAt: null },
    { id: "c2", cleared: true, clearedAt: T1 },
    { id: "c3", cleared: false, clearedAt: null }
  ]);
  assert.equal(state.nextSequence, 7);
});

test("normalizeState gives an id to a message that arrived without one", () => {
  const state = ws.normalizeState({
    version: 1,
    documents: {
      payslips: {
        verdict: "accepted",
        currentFilename: "payslips.pdf",
        messages: [{ author: "borrower", text: "Sent", timestamp: T1 }]
      }
    }
  });
  assert.equal(state.documents.payslips.messages[0].id, "message-1");
  assert.equal(state.nextSequence, 2);
});

test("normalizeState resets an unknown or future-version payload to the clean case", () => {
  const clean = plain(ws.normalizeState());
  assert.deepEqual(plain(ws.normalizeState({ version: 2, documents: { payslips: { verdict: "accepted", currentFilename: "p.pdf" } } })), clean);
  assert.deepEqual(plain(ws.normalizeState("nonsense")), clean);
  assert.deepEqual(plain(ws.normalizeState(null)), clean);
  assert.deepEqual(plain(ws.normalizeState(42)), clean);
});

test("normalizeState is idempotent and never mutates its input", () => {
  const payload = {
    version: 1,
    documents: { payslips: { verdict: "accepted", currentFilename: "p.pdf", messages: [{ author: "borrower", text: "hi", timestamp: T1 }] } }
  };
  const snapshot = JSON.stringify(payload);
  const once = ws.normalizeState(payload);
  assert.equal(JSON.stringify(payload), snapshot);
  assert.deepEqual(plain(ws.normalizeState(once)), plain(once));
});

/* ============================================================= id allocation */

test("ids are allocated sequentially from nextSequence, never from a clock", () => {
  const state = ws.sendBorrowerMessage(gatheringState(), "tax-folder", "Page 1 is missing?", T1);
  assert.deepEqual(idsOf(state.documents["tax-folder"].messages), ["message-1"]);
  assert.deepEqual(idsOf(state.reviewItems), ["review-2"]);
  assert.deepEqual(idsOf(state.auditEvents), ["audit-3"]);
  assert.equal(state.nextSequence, 4);

  const next = ws.sendBorrowerMessage(state, "payslips", "And this one?", T2);
  assert.equal(next.documents.payslips.messages[0].id, "message-4");
  assert.equal(next.reviewItems[1].id, "review-5");
  assert.equal(next.auditEvents[1].id, "audit-6");
  assert.equal(next.nextSequence, 7);
});

/* ========================================================= borrower message */

test("sendBorrowerMessage raises one linked review item and one audit event", () => {
  const before = gatheringState();
  const state = ws.sendBorrowerMessage(before, "title-certificate", "  Is the deed still on track?  ", T1);

  const message = state.documents["title-certificate"].messages[0];
  assert.deepEqual(plain(message), {
    id: "message-1",
    author: "borrower",
    text: "Is the deed still on track?",
    timestamp: T1
  });
  assert.equal(state.reviewItems.length, 1);
  assert.deepEqual(plain(state.reviewItems[0]), {
    id: "review-2",
    type: "borrower-message",
    documentId: "title-certificate",
    messageId: "message-1",
    summary: "review.borrower-message",
    createdAt: T1,
    resolvedAt: null,
    resolutionMethod: null
  });
  assert.deepEqual(actionsAfter(before, state), ["borrower-message-sent"]);
  assert.equal(state.auditEvents[0].actor, "borrower");
  assert.equal(state.auditEvents[0].reviewItemId, "review-2");
  assert.equal(state.auditEvents[0].details, "Is the deed still on track?");
});

test("sendBorrowerMessage is a no-op on blank text, an unknown document, or a bad timestamp", () => {
  const state = gatheringState();
  assertNoOp(state, ws.sendBorrowerMessage(state, "tax-folder", "   ", T1), "blank text");
  assertNoOp(state, ws.sendBorrowerMessage(state, "tax-folder", "", T1), "empty text");
  assertNoOp(state, ws.sendBorrowerMessage(state, "tax-folder", null, T1), "null text");
  assertNoOp(state, ws.sendBorrowerMessage(state, "no-such-document", "Hello", T1), "unknown document");
  assertNoOp(state, ws.sendBorrowerMessage(state, "tax-folder", "Hello", "whenever"), "bad timestamp");
  assertNoOp(state, ws.sendBorrowerMessage(state, "tax-folder", "Hello"), "missing timestamp");
});

/* =========================================================== lender message */

test("sendLenderMessage records the reply and raises no review item", () => {
  const before = gatheringState();
  const state = ws.sendLenderMessage(before, "tax-folder", "Please re-send page 1.", T1);
  assert.deepEqual(plain(state.documents["tax-folder"].messages), [
    { id: "message-1", author: "lender", text: "Please re-send page 1.", timestamp: T1 }
  ]);
  assert.deepEqual(plain(state.reviewItems), []);
  assert.deepEqual(actionsAfter(before, state), ["lender-reply-sent"]);
  assert.equal(state.auditEvents[0].actor, "lender");
});

test("sendLenderMessage is a no-op on blank text or an unknown document", () => {
  const state = gatheringState();
  assertNoOp(state, ws.sendLenderMessage(state, "tax-folder", "  ", T1), "blank text");
  assertNoOp(state, ws.sendLenderMessage(state, "no-such-document", "Hi", T1), "unknown document");
});

/* ================================================================== uploads */

test("registerUpload maps rejected to a document exception", () => {
  const before = gatheringState();
  const state = ws.registerUpload(before, "tax-folder", { filename: "tax_folder.pdf", verdict: "rejected" }, T1);
  const document = state.documents["tax-folder"];
  assert.equal(document.verdict, "rejected");
  assert.equal(document.currentFilename, "tax_folder.pdf");
  assert.deepEqual(plain(document.history), [
    { filename: "tax_folder.pdf", verdict: "rejected", timestamp: T1 }
  ]);
  const items = ws.openReviewItems(state);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "document-exception");
  assert.equal(items[0].documentId, "tax-folder");
  assert.equal(items[0].filename, "tax_folder.pdf");
  assert.equal(items[0].summary, "review.document-exception");
  assert.deepEqual(actionsAfter(before, state), [
    "document-uploaded",
    "document-verdict-changed",
    "document-exception-created"
  ]);
});

test("registerUpload maps under-review to a new upload", () => {
  const before = gatheringState();
  const state = ws.registerUpload(before, "title-certificate", { filename: "title.pdf", verdict: "under-review" }, T1);
  const items = ws.openReviewItems(state);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "new-upload");
  assert.equal(items[0].summary, "review.new-upload");
  assert.deepEqual(actionsAfter(before, state), [
    "document-uploaded",
    "document-verdict-changed",
    "new-upload-received"
  ]);
});

test("registerUpload raises nothing when the verdict is accepted", () => {
  const before = gatheringState();
  const state = ws.registerUpload(before, "payslips", { filename: "payslips.pdf", verdict: "accepted" }, T1);
  assert.equal(state.documents.payslips.verdict, "accepted");
  assert.deepEqual(plain(state.reviewItems), []);
  assert.deepEqual(actionsAfter(before, state), ["document-uploaded", "document-verdict-changed"]);
});

test("registerUpload defaults a missing verdict to under-review", () => {
  const state = ws.registerUpload(gatheringState(), "payslips", { filename: "payslips.pdf" }, T1);
  assert.equal(state.documents.payslips.verdict, "under-review");
  assert.equal(ws.openReviewItems(state)[0].type, "new-upload");
});

test("registerUpload is a no-op on an unknown document, a blank filename, or a bad verdict", () => {
  const state = gatheringState();
  assertNoOp(state, ws.registerUpload(state, "no-such-document", { filename: "x.pdf", verdict: "accepted" }, T1), "unknown document");
  assertNoOp(state, ws.registerUpload(state, "payslips", { filename: "  ", verdict: "accepted" }, T1), "blank filename");
  assertNoOp(state, ws.registerUpload(state, "payslips", {}, T1), "no upload fields");
  assertNoOp(state, ws.registerUpload(state, "payslips", { filename: "x.pdf", verdict: "invented" }, T1), "unknown verdict");
  assertNoOp(state, ws.registerUpload(state, "payslips", null, T1), "no upload at all");
});

/* ================================================================ verdicts */

test("setVerdict with accepted-with-condition records the condition text", () => {
  const before = ws.registerUpload(gatheringState(), "title-certificate", { filename: "title.pdf", verdict: "under-review" }, T1);
  const condition = "Simultaneous release of the mortgage at Folio 1,842 No.1,190 (2024) in the same deed";
  const state = ws.setVerdict(before, "title-certificate", "accepted-with-condition", { condition }, T2);
  const document = state.documents["title-certificate"];
  assert.equal(document.verdict, "accepted-with-condition");
  assert.equal(document.condition, condition);
  assert.deepEqual(plain(document.history.at(-1)), {
    verdict: "accepted-with-condition",
    condition,
    timestamp: T2
  });
  assert.deepEqual(actionsAfter(before, state), ["document-verdict-changed"]);
  assert.equal(state.auditEvents.at(-1).details, condition);
});

test("setVerdict to any other verdict clears a condition that was carried", () => {
  let state = ws.setVerdict(gatheringState(), "title-certificate", "accepted-with-condition", { condition: "Release the mortgage" }, T1);
  state = ws.setVerdict(state, "title-certificate", "accepted", {}, T2);
  assert.equal(state.documents["title-certificate"].verdict, "accepted");
  assert.equal(state.documents["title-certificate"].condition, "");
});

test("setVerdict is a no-op on an unknown document, an unknown verdict, or no change", () => {
  const state = ws.setVerdict(gatheringState(), "payslips", "accepted", {}, T1);
  assertNoOp(state, ws.setVerdict(state, "no-such-document", "accepted", {}, T2), "unknown document");
  assertNoOp(state, ws.setVerdict(state, "payslips", "green", {}, T2), "unknown verdict");
  assertNoOp(state, ws.setVerdict(state, "payslips", "accepted", {}, T2), "same verdict, same condition");
});

test("setVerdict refuses accepted-with-condition without condition text", () => {
  const state = gatheringState();
  assertNoOp(state, ws.setVerdict(state, "title-certificate", "accepted-with-condition", {}, T1), "no options");
  assertNoOp(state, ws.setVerdict(state, "title-certificate", "accepted-with-condition", { condition: "   " }, T1), "blank condition");
});

/* ============================================================== conditions */

test("clearCondition clears one condition and records who did it", () => {
  const before = gatheringState();
  const state = ws.clearCondition(before, "c1", T1);
  assert.deepEqual(plain(state.conditions), [
    { id: "c1", cleared: true, clearedAt: T1 },
    { id: "c2", cleared: false, clearedAt: null },
    { id: "c3", cleared: false, clearedAt: null }
  ]);
  assert.deepEqual(actionsAfter(before, state), ["condition-cleared"]);
  assert.equal(state.auditEvents.at(-1).details, "c1");
});

test("clearCondition is a no-op on an unknown id or one already cleared", () => {
  const state = ws.clearCondition(gatheringState(), "c1", T1);
  assertNoOp(state, ws.clearCondition(state, "c9", T2), "unknown condition");
  assertNoOp(state, ws.clearCondition(state, "c1", T2), "already cleared");
});

/* ============================================================ deed deadline */

test("raiseDeedDeadline opens a case-level review item without touching the stage", () => {
  const before = allAcceptedState();
  const stageBefore = ws.deriveStage(before);
  const state = ws.raiseDeedDeadline(before, "Deed signing slot expires in 5 days", T2);
  const item = ws.openReviewItems(state)[0];
  assert.equal(item.type, "deed-deadline");
  assert.equal(item.documentId, null);
  assert.equal(item.summary, "Deed signing slot expires in 5 days");
  assert.equal(item.resolvedAt, null);
  assert.deepEqual(actionsAfter(before, state), ["deed-deadline-raised"]);
  assert.equal(ws.deriveStage(state), stageBefore);
});

test("raiseDeedDeadline falls back to the copy key when no summary is given", () => {
  const state = ws.raiseDeedDeadline(gatheringState(), "   ", T1);
  assert.equal(ws.openReviewItems(state)[0].summary, "review.deed-deadline");
});

/* ================================================== resolving, one at a time */

test("resolveReviewItem resolves its own item and leaves the other open, untouched", () => {
  const before = twoOpenItemsState();
  const [taxItem, titleItem] = before.reviewItems;
  const titleSnapshot = plain(titleItem);

  const state = ws.resolveReviewItem(before, taxItem.id, T3);
  const resolved = state.reviewItems.find(item => item.id === taxItem.id);
  const untouched = state.reviewItems.find(item => item.id === titleItem.id);

  assert.equal(resolved.resolvedAt, T3);
  assert.equal(resolved.resolutionMethod, "manual");
  assert.deepEqual(plain(untouched), titleSnapshot);
  assert.deepEqual(idsOf(ws.openReviewItems(state)), [titleItem.id]);
  assert.deepEqual(actionsAfter(before, state), ["review-item-resolved"]);
  assert.equal(state.auditEvents.at(-1).reviewItemId, taxItem.id);
});

test("resolveReviewItem is a no-op on an unknown id or an already-resolved item", () => {
  const state = ws.resolveReviewItem(twoOpenItemsState(), "review-2", T3);
  assertNoOp(state, ws.resolveReviewItem(state, "review-2", T3), "already resolved");
  assertNoOp(state, ws.resolveReviewItem(state, "review-999", T3), "unknown review item");
  assertNoOp(state, ws.resolveReviewItem(state, undefined, T3), "no review item id");
});

test("replyAndResolve appends exactly lender-reply-sent then review-item-resolved", () => {
  const before = twoOpenItemsState();
  const [taxItem, titleItem] = before.reviewItems;
  const titleSnapshot = plain(titleItem);

  const state = ws.replyAndResolve(before, taxItem.id, "  Page 1 re-uploaded, thank you.  ", T3);

  assert.deepEqual(actionsAfter(before, state), ["lender-reply-sent", "review-item-resolved"]);
  assert.deepEqual(plain(state.documents["tax-folder"].messages), [
    { id: "message-" + (before.nextSequence), author: "lender", text: "Page 1 re-uploaded, thank you.", timestamp: T3 }
  ]);
  const resolved = state.reviewItems.find(item => item.id === taxItem.id);
  assert.equal(resolved.resolvedAt, T3);
  assert.equal(resolved.resolutionMethod, "reply");
  assert.deepEqual(plain(state.reviewItems.find(item => item.id === titleItem.id)), titleSnapshot);
  assert.deepEqual(idsOf(ws.openReviewItems(state)), [titleItem.id]);
});

test("replyAndResolve is a no-op on blank text, an unknown id, or a resolved item", () => {
  const state = twoOpenItemsState();
  const [taxItem] = state.reviewItems;
  assertNoOp(state, ws.replyAndResolve(state, taxItem.id, "   ", T3), "blank text");
  assertNoOp(state, ws.replyAndResolve(state, "review-999", "Hello", T3), "unknown review item");
  const resolvedState = ws.resolveReviewItem(state, taxItem.id, T3);
  assertNoOp(resolvedState, ws.replyAndResolve(resolvedState, taxItem.id, "Hello", T3), "already resolved");
});

test("replyAndResolve cannot reply to a case-level item that has no document", () => {
  const state = ws.raiseDeedDeadline(gatheringState(), "Deed slot expires", T1);
  const item = ws.openReviewItems(state)[0];
  assertNoOp(state, ws.replyAndResolve(state, item.id, "Noted", T2), "deed-deadline item");
  /* It can still be closed by hand. */
  assert.equal(ws.resolveReviewItem(state, item.id, T2).reviewItems[0].resolutionMethod, "manual");
});

/* ================================================================== stages */

test("deriveStage walks the six-stage precedence ladder", () => {
  assert.equal(ws.deriveStage(ws.normalizeState()), "new-applications");
  assert.equal(ws.deriveStage(ws.normalizeState(undefined, { submittedAt: SUBMITTED })), "new-applications");
  assert.equal(ws.deriveStage(gatheringState()), "gathering-documents");
  assert.equal(ws.deriveStage(allAcceptedState()), "credit-review");

  const approved = ws.normalizeState(undefined, { ...STARTED_WORKFLOW, approvedAt: T1 });
  assert.equal(ws.deriveStage(approved), "approved-deed");
  const disbursed = ws.normalizeState(undefined, { ...STARTED_WORKFLOW, approvedAt: T1, disbursedAt: T2 });
  assert.equal(ws.deriveStage(disbursed), "disbursed");
  const closed = ws.normalizeState(undefined, {
    ...STARTED_WORKFLOW,
    approvedAt: T1,
    disbursedAt: T2,
    terminal: { at: T3, reason: "closed" }
  });
  assert.equal(ws.deriveStage(closed), "closed-archived");
});

test("deriveStage counts accepted-with-condition as ready, but not under-review or rejected", () => {
  assert.equal(ws.deriveStage(allAcceptedState({ "title-certificate": "accepted-with-condition" })), "credit-review");
  assert.equal(ws.deriveStage(allAcceptedState({ "tax-folder": "rejected" })), "gathering-documents");
  assert.equal(ws.deriveStage(allAcceptedState({ "tax-folder": "under-review" })), "gathering-documents");
});

test("deriveStage puts a case with no checklist in new-applications however complete it is", () => {
  let state = ws.normalizeState(undefined, { submittedAt: SUBMITTED });
  for (const documentId of ws.DOCUMENT_IDS) {
    state = ws.setVerdict(state, documentId, "accepted", {}, T1);
  }
  assert.equal(ws.deriveStage(state), "new-applications");
});

test("review work never changes the stage", () => {
  const base = allAcceptedState({ "title-certificate": "accepted-with-condition" });
  assert.equal(ws.deriveStage(base), "credit-review");
  const messaged = ws.sendBorrowerMessage(base, "tax-folder", "Any news?", T2);
  assert.equal(ws.deriveStage(messaged), "credit-review");
  assert.equal(ws.openReviewItems(messaged).length, 1);
  const flagged = ws.raiseDeedDeadline(messaged, "Deed slot expires", T2);
  assert.equal(ws.deriveStage(flagged), "credit-review");
  const resolvedAll = ws.openReviewItems(flagged).reduce(
    (state, item) => ws.resolveReviewItem(state, item.id, T3),
    flagged
  );
  assert.equal(ws.deriveStage(resolvedAll), "credit-review");
  assert.deepEqual(plain(ws.openReviewItems(resolvedAll)), []);
});

test("recordStageChange writes one audit event, and nothing when the stage is unchanged", () => {
  const before = gatheringState();
  assertNoOp(before, ws.recordStageChange(before, "credit-review", "credit-review", T1), "same stage");
  assertNoOp(before, ws.recordStageChange(before, "", "credit-review", T1), "no from stage");
  assertNoOp(before, ws.recordStageChange(before, "credit-review", null, T1), "no to stage");

  const state = ws.recordStageChange(before, "gathering-documents", "credit-review", T1);
  assert.deepEqual(actionsAfter(before, state), ["stage-changed"]);
  assert.equal(state.auditEvents.at(-1).actor, "system");
  assert.equal(state.auditEvents.at(-1).details, "gathering-documents → credit-review");
  assert.equal(state.auditEvents.at(-1).documentId, null);
});

/* ========================================================= the approval gate */

test("readyToApprove is false until both c1 and c2 are cleared", () => {
  const base = allAcceptedState({ "title-certificate": "accepted-with-condition" });
  assert.equal(ws.readyToApprove(base), false);
  assert.equal(ws.readyToApprove(ws.clearCondition(base, "c1", T1)), false);
  assert.equal(ws.readyToApprove(ws.clearCondition(base, "c2", T1)), false);
  assert.equal(ws.readyToApprove(ws.clearCondition(ws.clearCondition(base, "c3", T1), "c1", T2)), false);

  const both = ws.clearCondition(ws.clearCondition(base, "c1", T1), "c2", T2);
  assert.equal(ws.readyToApprove(both), true);
});

test("readyToApprove survives garbage without throwing", () => {
  assert.equal(ws.readyToApprove(undefined), false);
  assert.equal(ws.readyToApprove("nonsense"), false);
  assert.equal(ws.readyToApprove({ conditions: [{ id: "c1", cleared: true }] }), false);
});

test("approve refuses while the gate is closed, however late the timestamp", () => {
  const base = allAcceptedState({ "title-certificate": "accepted-with-condition" });
  assertNoOp(base, ws.approve(base, {}, T1), "no conditions cleared");

  const onlyC1 = ws.clearCondition(base, "c1", T1);
  assertNoOp(onlyC1, ws.approve(onlyC1, {}, T2), "only c1 cleared");
  /* Nothing may derive approval from elapsed time: a year later is still no. */
  assertNoOp(onlyC1, ws.approve(onlyC1, {}, "2027-08-06T12:00:00.000Z"), "a year later, still not ready");
  assert.equal(ws.deriveStage(onlyC1), "credit-review");
});

test("approve records the decision once the gate is open", () => {
  const before = ws.clearCondition(
    ws.clearCondition(allAcceptedState({ "title-certificate": "accepted-with-condition" }), "c1", T1),
    "c2",
    T2
  );
  const state = ws.approve(before, { conditions: ["c1", "c2", "c3"] }, T3);
  assert.equal(state.workflow.approvedAt, T3);
  assert.deepEqual([...state.workflow.approvedConditions], ["c1", "c2", "c3"]);
  assert.deepEqual(actionsAfter(before, state), ["loan-approved"]);
  assert.equal(state.auditEvents.at(-1).actor, "lender");
  assert.equal(ws.deriveStage(state), "approved-deed");

  /* Twice is once. */
  assertNoOp(state, ws.approve(state, { conditions: ["c1"] }, "2026-08-07T09:00:00.000Z"), "already approved");
});

test("approve defaults to carrying every condition of the case", () => {
  const ready = ws.clearCondition(ws.clearCondition(allAcceptedState(), "c1", T1), "c2", T2);
  const state = ws.approve(ready, {}, T3);
  assert.deepEqual([...state.workflow.approvedConditions], ["c1", "c2", "c3"]);
});

test("approve is a no-op without a valid timestamp", () => {
  const ready = ws.clearCondition(ws.clearCondition(allAcceptedState(), "c1", T1), "c2", T2);
  assertNoOp(ready, ws.approve(ready, {}, "sometime"), "bad timestamp");
});

/* ============================================================ open work, purity */

test("openReviewItems returns only unresolved items and tolerates nonsense", () => {
  const state = twoOpenItemsState();
  const [taxItem] = state.reviewItems;
  assert.equal(ws.openReviewItems(state).length, 2);
  assert.equal(ws.openReviewItems(ws.resolveReviewItem(state, taxItem.id, T3)).length, 1);
  assert.deepEqual(plain(ws.openReviewItems(undefined)), []);
  assert.deepEqual(plain(ws.openReviewItems({})), []);
});

test("no transition mutates the state it was given", () => {
  const base = twoOpenItemsState();
  const snapshot = JSON.stringify(plain(base));
  const [taxItem] = base.reviewItems;
  ws.sendBorrowerMessage(base, "payslips", "Hello", T3);
  ws.sendLenderMessage(base, "payslips", "Hello", T3);
  ws.registerUpload(base, "payslips", { filename: "p.pdf", verdict: "accepted" }, T3);
  ws.setVerdict(base, "payslips", "accepted", {}, T3);
  ws.clearCondition(base, "c1", T3);
  ws.raiseDeedDeadline(base, "Deed slot expires", T3);
  ws.resolveReviewItem(base, taxItem.id, T3);
  ws.replyAndResolve(base, taxItem.id, "Noted", T3);
  ws.recordStageChange(base, "gathering-documents", "credit-review", T3);
  ws.approve(base, {}, T3);
  ws.deriveStage(base);
  ws.readyToApprove(base);
  ws.openReviewItems(base);
  assert.equal(JSON.stringify(plain(base)), snapshot);
});

test("the module holds no clock and no randomness in its source", () => {
  const { source } = loadScriptApi("assets/weston-workspace.js", "WestonWorkspace");
  assert.equal(/Date\.now|Math\.random/.test(source), false);
  assert.equal(/\bwindow\b|getElementById|addEventListener/.test(source), false);
});

/* ================================ the assistant as a third voice on the thread */

/* The assistant answers her on her own page, and the lender's desk shows the
   same conversation. That makes it a message like any other — recorded, in the
   trail, attributable — except that it asks nothing of anyone, so it raises no
   review item. A queue entry would say a human is needed, and none is. */

test("sendAssistantMessage records the message and raises no review item", () => {
  const before = gatheringState();
  const after = ws.sendAssistantMessage(before, "tax-folder", "Page 1 in full is all we need.", T1);
  assert.notEqual(after, before);

  const messages = plain(after).documents["tax-folder"].messages;
  assert.equal(messages.length, 1);
  assert.equal(messages[0].author, "assistant");
  assert.equal(messages[0].text, "Page 1 in full is all we need.");
  assert.equal(messages[0].timestamp, T1);

  /* The whole point: nobody is being asked for anything. */
  assert.deepEqual(plain(ws.openReviewItems(after)), []);
});

test("the assistant's message is in the trail, attributed to the assistant", () => {
  const after = ws.sendAssistantMessage(gatheringState(), "payslips", "Got it, thank you.", T1);
  const events = plain(after).auditEvents.filter(event => event.action === "assistant-message-sent");
  assert.equal(events.length, 1);
  assert.equal(events[0].actor, "assistant");
  assert.equal(events[0].documentId, "payslips");
  assert.equal(events[0].details, "Got it, thank you.");
  assert.equal(events[0].reviewItemId, undefined, "an assistant message links to no item");
});

test("sendAssistantMessage is a no-op on blank text, an unknown document, or a bad timestamp", () => {
  const state = gatheringState();
  assert.equal(ws.sendAssistantMessage(state, "tax-folder", "   ", T1), state);
  assert.equal(ws.sendAssistantMessage(state, "tax-folder", "", T1), state);
  assert.equal(ws.sendAssistantMessage(state, "no-such-document", "Hello", T1), state);
  assert.equal(ws.sendAssistantMessage(state, "tax-folder", "Hello", "not-a-time"), state);
  /* And it never mutates what it was handed. */
  const snapshot = JSON.stringify(plain(state));
  ws.sendAssistantMessage(state, "tax-folder", "Hello", T1);
  assert.equal(JSON.stringify(plain(state)), snapshot);
});

test("her message still raises work; the assistant's answer to it does not", () => {
  let state = ws.sendBorrowerMessage(gatheringState(), "tax-folder", "Is page 1 enough?", T1);
  assert.equal(plain(ws.openReviewItems(state)).length, 1);
  state = ws.sendAssistantMessage(state, "tax-folder", "Page 1 in full is enough.", T2);
  assert.equal(
    plain(ws.openReviewItems(state)).length,
    1,
    "the assistant answering closed or added work"
  );
  /* Her item is untouched: a machine reply is not an answer from a person. */
  const item = plain(ws.openReviewItems(state))[0];
  assert.equal(item.type, "borrower-message");
  assert.equal(item.resolvedAt, null);
});

test("document work types exclude the two voices that are not work", () => {
  assert.deepEqual(plain(ws.DOCUMENT_WORK_TYPES), ["new-upload", "document-exception"]);
  assert.equal(ws.isDocumentWork({ type: "borrower-message" }), false);
  assert.equal(ws.isDocumentWork({ type: "deed-deadline" }), false);
  assert.equal(ws.isDocumentWork({ type: "document-exception" }), true);
  assert.equal(ws.isDocumentWork(null), false);
});
