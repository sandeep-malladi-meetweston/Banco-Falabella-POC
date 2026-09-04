/* Weston English portal — the shared case state engine.
 *
 * One state shape, one set of transitions, both surfaces. The borrower page and
 * the lender page never reach into each other: they hand this module a state and
 * take a new state back, and the handoff in §7 is nothing more than that state
 * crossing browser storage.
 *
 * The rules this file lives by, from spec §4.4 and the reference
 * silverhill-workspace.js it is modelled on:
 *
 *   - Every transition is pure. It takes a state, returns a NEW state, and
 *     returns the *input object itself* when the transition does not apply —
 *     unknown id, blank text, a verdict that is not a verdict, an already
 *     resolved item, an invalid timestamp. Callers can therefore compare by
 *     reference to know whether anything happened.
 *   - No clock and no randomness. Ids come from `nextSequence`; timestamps are
 *     always explicit arguments. That is what makes the suite deterministic.
 *   - No DOM. This file is loaded and tested on its own, with no copy layer in
 *     the context, so it stores no English prose it invented: the `summary` of
 *     an item it raises itself is the copy key `review.<type>`, and the renderer
 *     puts it through `WestonCopy.t()`. Free text that a human or another
 *     system produced — a message, a filename, a condition — is data and is
 *     stored verbatim.
 *   - Review work never moves the stage. `deriveStage` reads workflow
 *     milestones and document verdicts, never the review queue.
 *   - Approval is derived from cleared conditions, never from elapsed time.
 */
"use strict";

(function () {
  var STATE_VERSION = 1;

  /* Insertion order is the board's left-to-right order; Task 4 reads it with
     Object.values(STAGES).

     Seven columns, and the last two are in the order this desk works in: a deed
     closes at the notary and the money moves afterwards, so Closed sits before
     Disbursed rather than after it. Every id is the word on the column, so a
     stage read out of a hash or a saved filter says what it is. */
  var STAGES = Object.freeze({
    NEW: "new-applications",
    GATHERING: "gathering-information",
    UNDERWRITING: "underwriting",
    APPROVED: "approved",
    WAITING_TO_CLOSE: "waiting-to-close",
    CLOSED: "closed",
    DISBURSED: "disbursed"
  });

  var REVIEW_TYPES = Object.freeze([
    "borrower-message",
    "new-upload",
    "document-exception",
    "deed-deadline"
  ]);

  /* The kinds of work that a document arriving actually answers. A new verdict
     on a document settles the question the document raised — and nothing else.
     A `borrower-message` is a person waiting for a person: it is closed by a
     human replying to it (`replyAndResolve`), never by a file landing, however
     tidily the file matches the document she happened to be asking about.
     Spec §4.2: resolve one item at a time, never clear unrelated items. */
  var DOCUMENT_WORK_TYPES = Object.freeze(["new-upload", "document-exception"]);

  function isDocumentWork(item) {
    return Boolean(item) && DOCUMENT_WORK_TYPES.indexOf(item.type) !== -1;
  }

  /* Ordered worst to best. The fifth is load-bearing: document 9 ends accepted
     with a condition, not green (§3.2). */
  var VERDICTS = Object.freeze([
    "not-uploaded",
    "under-review",
    "rejected",
    "accepted",
    "accepted-with-condition"
  ]);

  /* A document in either of these counts as done for the stage ladder (§4.1). */
  var READY_VERDICTS = Object.freeze(["accepted", "accepted-with-condition"]);

  var DOCUMENT_IDS = Object.freeze([
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

  /* ------------------------------------------------- the page, as it prints
   *
   * Both surfaces show a facsimile of page 1 of each document — she opens it
   * from her checklist, the desk opens it from the case record — and the two
   * must be looking at the same page. So which fields the document prints, and
   * which row is wrong while the document is still wrong, are stated once here
   * rather than twice in two pages that share no script. The words themselves
   * are copy keys (`borrower.scan.<document>.*`, named for the surface that
   * printed the first facsimile); this is only their shape.
   */
  var SCAN_ROWS = Object.freeze({
    "national-id": Object.freeze(["run", "given-names", "surnames", "date-of-birth", "expiry"]),
    payslips: Object.freeze(["employee", "rut", "base-salary", "deductions", "net-pay"]),
    "employment-tenure": Object.freeze(["employee", "role", "contract-start", "contract-type"]),
    "pension-contributions": Object.freeze(["member", "rut", "periods", "months"]),
    "tax-folder": Object.freeze(["taxpayer", "rut", "periods", "issue-date", "purpose"]),
    "down-payment-proof": Object.freeze(["holder", "balance", "seasoning"]),
    "purchase-promise": Object.freeze(["seller", "buyer", "price", "signature-date"]),
    "first-home-affidavit": Object.freeze(["declarant", "rut", "subject", "signature"]),
    "title-certificate": Object.freeze(["owner", "tax-roll", "registration", "encumbrances"])
  });

  /* Which row the eye should be pulled to, and what it says while the document
     is still wrong. Keyed by the verdict the document carries. */
  var SCAN_OVERRIDES = Object.freeze({
    "tax-folder": Object.freeze({
      rejected: Object.freeze({ field: "rut", valueSuffix: "-unreadable" })
    }),
    "title-certificate": Object.freeze({
      "under-review": Object.freeze({ field: "encumbrances" }),
      "accepted-with-condition": Object.freeze({ field: "encumbrances" })
    })
  });

  function scanRowsFor(documentId) {
    return SCAN_ROWS[documentId] || null;
  }

  function scanOverrideFor(documentId, verdict) {
    var byVerdict = SCAN_OVERRIDES[documentId];
    return (byVerdict && byVerdict[verdict]) || null;
  }

  /* Two conditions, and both of them gate. There was a third — order the
     appraisal — which was settled *on* approval and so could never be cleared
     before it: a permanent open row that no work could close, explaining itself
     at the bottom of every list it appeared in. A standing instruction is not a
     condition the desk can act on, and the demo is clearer without it. What it
     was there to say (the appraisal covers the stressed ratio) is said on the
     Risk tab, where the stressed ratio is. */
  var CONDITION_IDS = Object.freeze(["c1", "c2"]);
  var APPROVAL_CONDITION_IDS = CONDITION_IDS;

  /* Which document settles which condition. c1 is the encumbrance release and
     is read off the title certificate; c2 is the legible RUT and is read off
     the tax folder. Every condition has one, which is what makes the rule below
     total: a condition is exactly as settled as the document behind it.
     Stated once, because a condition must not depend on which route settled the
     document: the developer's answer, the borrower's re-upload and the
     officer's own override all mean the same thing about the file. */
  var CONDITION_DOCUMENTS = Object.freeze({ c1: "title-certificate", c2: "tax-folder" });

  var ACTORS = Object.freeze(["borrower", "assistant", "lender", "system", "third-party"]);
  var RESOLUTION_METHODS = Object.freeze(["manual", "reply"]);

  /* ============================================================ predicates */

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function validTimestamp(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.length > 0;
  }

  function cleanText(value) {
    return String(value === null || value === undefined ? "" : value).trim();
  }

  function optionalString(value) {
    return typeof value === "string" ? value : null;
  }

  function validDocument(value) {
    return isRecord(value)
      && VERDICTS.indexOf(value.verdict) !== -1
      && typeof value.currentFilename === "string";
  }

  function validMessage(value) {
    return isRecord(value)
      && typeof value.author === "string"
      && typeof value.text === "string"
      && Boolean(validTimestamp(value.timestamp));
  }

  function cleanDocument() {
    return { verdict: "not-uploaded", currentFilename: "", condition: "", history: [], messages: [] };
  }

  /* Repairs rather than rejects the optional fields, so a fixture that omits
     resolvedAt survives; drops the item outright when its identity, its reason
     or its creation time is unusable. */
  function normalizeReviewItem(value) {
    if (!isRecord(value)) return null;
    if (!nonEmptyString(value.id)) return null;
    if (REVIEW_TYPES.indexOf(value.type) === -1) return null;
    var createdAt = validTimestamp(value.createdAt);
    if (!createdAt) return null;
    var item = {
      id: value.id,
      type: value.type,
      documentId: optionalString(value.documentId),
      summary: typeof value.summary === "string" ? value.summary : "review." + value.type,
      createdAt: createdAt,
      resolvedAt: validTimestamp(value.resolvedAt),
      resolutionMethod: RESOLUTION_METHODS.indexOf(value.resolutionMethod) === -1 ? null : value.resolutionMethod
    };
    if (nonEmptyString(value.messageId)) item.messageId = value.messageId;
    if (typeof value.filename === "string") item.filename = value.filename;
    if (!item.resolvedAt) item.resolutionMethod = null;
    return item;
  }

  function normalizeAuditEvent(value) {
    if (!isRecord(value)) return null;
    if (!nonEmptyString(value.id)) return null;
    var timestamp = validTimestamp(value.timestamp);
    if (!timestamp) return null;
    if (ACTORS.indexOf(value.actor) === -1) return null;
    if (!nonEmptyString(value.action)) return null;
    var event = {
      id: value.id,
      timestamp: timestamp,
      actor: value.actor,
      action: value.action,
      documentId: optionalString(value.documentId),
      details: typeof value.details === "string" ? value.details : ""
    };
    if (nonEmptyString(value.reviewItemId)) event.reviewItemId = value.reviewItemId;
    /* Free text a human or another system produced is data and is stored
       verbatim (see the header). An entry the demo itself wrote is not: it is
       prose this project owns, and prose this project owns lives in the copy
       table so the language switch reaches it. Such an entry carries the key
       instead, and the renderer resolves it. Both never travel together. */
    if (nonEmptyString(value.detailsKey)) {
      event.detailsKey = value.detailsKey;
      event.details = "";
    }
    return event;
  }

  /* ======================================================== normalize/repair */

  function allocateId(state, prefix) {
    var sequence = Number.isInteger(state.nextSequence) && state.nextSequence > 0 ? state.nextSequence : 1;
    state.nextSequence = sequence + 1;
    return prefix + "-" + sequence;
  }

  function normalizeWorkflow(source, requested) {
    var own = isRecord(source) ? source : {};
    var asked = isRecord(requested) ? requested : {};
    var conditions = Array.isArray(own.approvedConditions)
      ? own.approvedConditions
      : Array.isArray(asked.approvedConditions) ? asked.approvedConditions : [];
    var terminal = isRecord(own.terminal) ? own.terminal : isRecord(asked.terminal) ? asked.terminal : null;
    /* A decision the officer took by hand carries the words she took it in.
       They are hers, not ours, so they are stored verbatim like any other free
       text and printed unchanged on the record. */
    var reason = nonEmptyString(own.decisionReason)
      ? own.decisionReason
      : nonEmptyString(asked.decisionReason) ? asked.decisionReason : "";
    return {
      submittedAt: validTimestamp(own.submittedAt) || validTimestamp(asked.submittedAt),
      checklistStartedAt: validTimestamp(own.checklistStartedAt) || validTimestamp(asked.checklistStartedAt),
      approvedAt: validTimestamp(own.approvedAt) || validTimestamp(asked.approvedAt),
      declinedAt: validTimestamp(own.declinedAt) || validTimestamp(asked.declinedAt),
      /* The deed being signed is what moves a case out of Approved and into
         Waiting to close, so it is a milestone like any other rather than a
         fact only the audit trail happens to know. */
      signedAt: validTimestamp(own.signedAt) || validTimestamp(asked.signedAt),
      /* When the property inspection came back. Unset means it is still out —
         which is one half of the flag Underwriting cards carry. */
      inspectionAt: validTimestamp(own.inspectionAt) || validTimestamp(asked.inspectionAt),
      disbursedAt: validTimestamp(own.disbursedAt) || validTimestamp(asked.disbursedAt),
      approvedConditions: conditions.filter(nonEmptyString),
      overridden: own.overridden === true || asked.overridden === true,
      decisionReason: reason,
      terminal: terminal
    };
  }

  function normalizeConditions(source) {
    var supplied = Array.isArray(source) ? source : [];
    return CONDITION_IDS.map(function (conditionId) {
      var found = null;
      for (var index = 0; index < supplied.length; index += 1) {
        if (isRecord(supplied[index]) && supplied[index].id === conditionId) found = supplied[index];
      }
      var clearedAt = found ? validTimestamp(found.clearedAt) : null;
      var cleared = Boolean(found && found.cleared === true && clearedAt);
      return { id: conditionId, cleared: cleared, clearedAt: cleared ? clearedAt : null };
    });
  }

  /**
   * Validate and repair a payload into a version-1 state. Malformed documents,
   * review items and audit events are dropped, never thrown on: a bad payload
   * out of storage must degrade to the clean case, not blank the page (§7).
   * All nine documents always exist afterwards, so the stage ladder and the
   * "n of 9" counter have something honest to count.
   */
  function normalizeState(value, workflow) {
    var source = isRecord(value) && value.version === STATE_VERSION ? clone(value) : {};
    var documents = isRecord(source.documents) ? source.documents : {};
    var state = {
      version: STATE_VERSION,
      nextSequence: Number.isInteger(source.nextSequence) && source.nextSequence > 0 ? source.nextSequence : 1,
      documents: {},
      reviewItems: [],
      auditEvents: [],
      conditions: normalizeConditions(source.conditions),
      workflow: normalizeWorkflow(source.workflow, workflow)
    };

    DOCUMENT_IDS.forEach(function (documentId) {
      var supplied = documents[documentId];
      if (!validDocument(supplied)) {
        state.documents[documentId] = cleanDocument();
        return;
      }
      var record = {
        verdict: supplied.verdict,
        currentFilename: supplied.currentFilename,
        condition: typeof supplied.condition === "string" ? supplied.condition : "",
        history: Array.isArray(supplied.history) ? supplied.history.filter(isRecord) : [],
        messages: Array.isArray(supplied.messages) ? supplied.messages.filter(validMessage) : []
      };
      record.messages.forEach(function (message) {
        if (!nonEmptyString(message.id)) message.id = allocateId(state, "message");
      });
      state.documents[documentId] = record;
    });

    if (Array.isArray(source.reviewItems)) {
      source.reviewItems.forEach(function (supplied) {
        var item = normalizeReviewItem(supplied);
        /* An item about a document that did not survive has nothing to point at. */
        if (!item) return;
        if (item.documentId !== null && !Object.hasOwn(state.documents, item.documentId)) return;
        state.reviewItems.push(item);
      });
    }

    if (Array.isArray(source.auditEvents)) {
      source.auditEvents.forEach(function (supplied) {
        var event = normalizeAuditEvent(supplied);
        if (event) state.auditEvents.push(event);
      });
    }

    return state;
  }

  function appendAudit(state, entry) {
    var event = {
      id: allocateId(state, "audit"),
      timestamp: entry.timestamp,
      actor: entry.actor,
      action: entry.action,
      documentId: entry.documentId === undefined ? null : entry.documentId,
      details: entry.details === undefined ? "" : entry.details
    };
    if (entry.reviewItemId) event.reviewItemId = entry.reviewItemId;
    state.auditEvents.push(event);
    return event;
  }

  function raiseItem(state, item) {
    state.reviewItems.push(item);
    return item;
  }

  function newReviewItem(state, type, documentId, timestamp, summary) {
    return {
      id: allocateId(state, "review"),
      type: type,
      documentId: documentId === undefined ? null : documentId,
      summary: cleanText(summary) || "review." + type,
      createdAt: timestamp,
      resolvedAt: null,
      resolutionMethod: null
    };
  }

  /* =============================================================== queries */

  function openReviewItems(state) {
    var items = state && Array.isArray(state.reviewItems) ? state.reviewItems : [];
    return items.filter(function (item) {
      return isRecord(item) && !item.resolvedAt;
    });
  }

  function deriveStage(value) {
    var state = normalizeState(value);
    if (state.workflow.terminal && state.workflow.terminal.at) return STAGES.CLOSED;
    /* A declined case is finished. It gets no column of its own — the board
       has six and a seventh for the one outcome nobody wants would be a column
       that is empty in every demo but this one — so it archives like any other
       ending, and the record on the case says which ending it was. */
    if (state.workflow.declinedAt) return STAGES.CLOSED;
    if (state.workflow.disbursedAt) return STAGES.DISBURSED;
    /* Signed, not yet closed: the deed is with the notary. */
    if (state.workflow.signedAt) return STAGES.WAITING_TO_CLOSE;
    if (state.workflow.approvedAt) return STAGES.APPROVED;
    if (!state.workflow.checklistStartedAt) return STAGES.NEW;
    var documents = Object.keys(state.documents).map(function (documentId) {
      return state.documents[documentId];
    });
    var ready = documents.length > 0 && documents.every(function (record) {
      return READY_VERDICTS.indexOf(record.verdict) !== -1;
    });
    return ready ? STAGES.UNDERWRITING : STAGES.GATHERING;
  }

  /**
   * What underwriting is still waiting on from outside the file: the title and
   * the inspection. Both are things a third party owes the desk rather than
   * things the borrower can upload, which is why they are worth flagging on the
   * card — a case can look complete on documents and still be unable to move.
   *
   * Derived like every other query here. The title counts as pending while its
   * certificate is not accepted or while the condition riding on it is open;
   * the inspection counts as pending until it has come back.
   */
  function pendingChecks(value) {
    var state = normalizeState(value);
    var pending = [];
    var title = state.documents["title-certificate"];
    var titleCondition = state.conditions.filter(function (condition) {
      return CONDITION_DOCUMENTS[condition.id] === "title-certificate";
    });
    var titleOpen =
      !title ||
      READY_VERDICTS.indexOf(title.verdict) === -1 ||
      titleCondition.some(function (condition) {
        return !condition.cleared;
      });
    if (titleOpen) pending.push("title");
    if (!state.workflow.inspectionAt) pending.push("inspection");
    return pending;
  }

  /* The deed signed, as a milestone and a trail entry in one gesture. The
     lender surface used to write the event and nothing else, which left the
     board unable to tell an approved case from a signed one. */
  function recordSignature(value, options, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    if (!state.workflow.approvedAt || state.workflow.signedAt) return value;
    state.workflow.signedAt = stamp;
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "approval-signed",
      documentId: null,
      details: isRecord(options) && typeof options.details === "string" ? options.details : ""
    });
    return state;
  }

  /* A fresh inspection: the case goes back to owing one, exactly as it did
     before the first result ever came back, and the board's pending flag
     follows the same field it always reads (§ pendingChecks). The title and
     the appraisal are not carried as a timestamp of their own — the title's
     status already lives on its document and condition, and the appraisal is
     never ordered before approval — so re-ordering a service only ever
     touches this one field; the case action that calls it says as much
     rather than claiming the other two moved too. */
  function reorderInspection(value, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    state.workflow.inspectionAt = null;
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "inspection-reordered",
      documentId: null,
      details: ""
    });
    return state;
  }

  /* Reads cleared conditions and nothing else. No timer, no elapsed time, no
     "it has been a while": skipping the developer query leaves c1 open and
     approval genuinely impossible (§3.4). */
  function readyToApprove(value) {
    var state = normalizeState(value);
    return APPROVAL_CONDITION_IDS.every(function (conditionId) {
      return state.conditions.some(function (condition) {
        return condition.id === conditionId && condition.cleared === true;
      });
    });
  }

  /* =========================================================== transitions */

  function sendMessage(value, documentId, author, text, timestamp, action, raiseReview) {
    var stamp = validTimestamp(timestamp);
    var body = cleanText(text);
    if (!stamp || !body) return value;
    var state = normalizeState(value);
    if (!Object.hasOwn(state.documents, documentId)) return value;
    var message = { id: allocateId(state, "message"), author: author, text: body, timestamp: stamp };
    state.documents[documentId].messages.push(message);
    var item = raiseReview
      ? raiseItem(state, newReviewItem(state, "borrower-message", documentId, stamp))
      : null;
    if (item) item.messageId = message.id;
    appendAudit(state, {
      timestamp: stamp,
      actor: author,
      action: action,
      documentId: documentId,
      reviewItemId: item ? item.id : undefined,
      details: body
    });
    return state;
  }

  function sendBorrowerMessage(value, documentId, text, timestamp) {
    return sendMessage(value, documentId, "borrower", text, timestamp, "borrower-message-sent", true);
  }

  /* The lender writing to the borrower is not work for the lender: no item. */
  function sendLenderMessage(value, documentId, text, timestamp) {
    return sendMessage(value, documentId, "lender", text, timestamp, "lender-reply-sent", false);
  }

  /* The assistant answering her raises nothing either — it is the machine
     keeping her informed, not a person asking for a person. It is recorded so
     the lender's desk can show the same conversation she is having on her
     phone; a queue item would say a human is needed, and none is. */
  function sendAssistantMessage(value, documentId, text, timestamp) {
    return sendMessage(value, documentId, "assistant", text, timestamp, "assistant-message-sent", false);
  }

  function registerUpload(value, documentId, upload, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp || !isRecord(upload)) return value;
    var filename = cleanText(upload.filename);
    if (!filename) return value;
    var verdict = upload.verdict === undefined || upload.verdict === null ? "under-review" : upload.verdict;
    if (VERDICTS.indexOf(verdict) === -1) return value;
    var state = normalizeState(value);
    var record = state.documents[documentId];
    if (!record) return value;

    record.currentFilename = filename;
    record.verdict = verdict;
    /* An upload carries no condition text; only setVerdict can attach one. */
    if (verdict !== "accepted-with-condition") record.condition = "";
    record.history.push({ filename: filename, verdict: verdict, timestamp: stamp });
    appendAudit(state, { timestamp: stamp, actor: "borrower", action: "document-uploaded", documentId: documentId, details: filename });
    appendAudit(state, { timestamp: stamp, actor: "system", action: "document-verdict-changed", documentId: documentId, details: verdict });

    var type = verdict === "rejected" ? "document-exception" : verdict === "under-review" ? "new-upload" : null;
    if (!type) return state;
    var item = raiseItem(state, newReviewItem(state, type, documentId, stamp));
    item.filename = filename;
    appendAudit(state, {
      timestamp: stamp,
      actor: "system",
      action: type === "document-exception" ? "document-exception-created" : "new-upload-received",
      documentId: documentId,
      reviewItemId: item.id,
      details: filename
    });
    return state;
  }

  /**
   * `accepted-with-condition` must carry its condition text — that text is what
   * the drawer shows and what the deed inherits — so the verdict without it is
   * refused rather than silently recorded as a bare acceptance.
   */
  function setVerdict(value, documentId, verdict, options, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp || VERDICTS.indexOf(verdict) === -1) return value;
    var condition = cleanText(isRecord(options) ? options.condition : "");
    if (verdict === "accepted-with-condition" && !condition) return value;
    if (verdict !== "accepted-with-condition") condition = "";
    var state = normalizeState(value);
    var record = state.documents[documentId];
    if (!record) return value;
    if (record.verdict === verdict && record.condition === condition) return value;

    record.verdict = verdict;
    record.condition = condition;
    var entry = { verdict: verdict, timestamp: stamp };
    if (condition) entry = { verdict: verdict, condition: condition, timestamp: stamp };
    record.history.push(entry);
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "document-verdict-changed",
      documentId: documentId,
      details: condition || verdict
    });
    return state;
  }

  function clearCondition(value, conditionId, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    var condition = null;
    state.conditions.forEach(function (candidate) {
      if (candidate.id === conditionId) condition = candidate;
    });
    if (!condition || condition.cleared) return value;
    condition.cleared = true;
    condition.clearedAt = stamp;
    appendAudit(state, {
      timestamp: stamp,
      actor: "system",
      action: "condition-cleared",
      documentId: null,
      details: conditionId
    });
    return state;
  }

  /* The mirror of `clearCondition`. The document a condition was cleared by has
     gone back to being wrong — the desk overrode it, or sent it back to her —
     so the condition is open again and the audit trail says when and why. A
     cleared condition sitting over a rejected document is the file telling the
     officer something it cannot support. */
  function reopenCondition(value, conditionId, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    var condition = null;
    state.conditions.forEach(function (candidate) {
      if (candidate.id === conditionId) condition = candidate;
    });
    if (!condition || !condition.cleared) return value;
    condition.cleared = false;
    condition.clearedAt = null;
    appendAudit(state, {
      timestamp: stamp,
      actor: "system",
      action: "condition-reopened",
      documentId: null,
      details: conditionId
    });
    return state;
  }

  /**
   * The conditions this document carries, brought into line with the verdict it
   * now holds. One rule, read in both directions: a document that is accepted
   * (with or without a condition of its own) clears the condition it answers,
   * and a document that is anything else leaves it open. Callers hand every
   * verdict change through here rather than clearing conditions by hand, so
   * that an officer's override auto-processes exactly as the developer's reply
   * does and the approval gate never disagrees with the record beneath it.
   *
   * Returns the state untouched when this document settles no condition, so a
   * no-op stays a no-op for callers that compare by identity.
   */
  function settleConditionsFor(value, documentId, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var documents = isRecord(value) && isRecord(value.documents) ? value.documents : null;
    var record = documents ? documents[documentId] : null;
    if (!record) return value;
    var ready = READY_VERDICTS.indexOf(record.verdict) !== -1;
    var next = value;
    CONDITION_IDS.forEach(function (conditionId) {
      if (CONDITION_DOCUMENTS[conditionId] !== documentId) return;
      next = ready
        ? clearCondition(next, conditionId, stamp)
        : reopenCondition(next, conditionId, stamp);
    });
    return next;
  }

  /* A case-level item: it belongs to the deed, not to any one document, so its
     documentId is null and it cannot be closed by a reply. */
  function raiseDeedDeadline(value, summary, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    var item = raiseItem(state, newReviewItem(state, "deed-deadline", null, stamp, summary));
    appendAudit(state, {
      timestamp: stamp,
      actor: "system",
      action: "deed-deadline-raised",
      documentId: null,
      reviewItemId: item.id,
      details: item.summary
    });
    return state;
  }

  function findOpenItem(state, reviewItemId) {
    var found = null;
    state.reviewItems.forEach(function (item) {
      if (item.id === reviewItemId && !item.resolvedAt) found = item;
    });
    return found;
  }

  /* One at a time, by id. Unrelated open work is never touched. */
  function resolveReviewItem(value, reviewItemId, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var state = normalizeState(value);
    var item = findOpenItem(state, reviewItemId);
    if (!item) return value;
    item.resolvedAt = stamp;
    item.resolutionMethod = "manual";
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "review-item-resolved",
      documentId: item.documentId,
      reviewItemId: item.id,
      details: "manual"
    });
    return state;
  }

  function replyAndResolve(value, reviewItemId, text, timestamp) {
    var stamp = validTimestamp(timestamp);
    var body = cleanText(text);
    if (!stamp || !body) return value;
    var state = normalizeState(value);
    var item = findOpenItem(state, reviewItemId);
    var record = item && item.documentId ? state.documents[item.documentId] : null;
    if (!item || !record) return value;

    var message = { id: allocateId(state, "message"), author: "lender", text: body, timestamp: stamp };
    record.messages.push(message);
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "lender-reply-sent",
      documentId: item.documentId,
      reviewItemId: item.id,
      details: body
    });
    item.resolvedAt = stamp;
    item.resolutionMethod = "reply";
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "review-item-resolved",
      documentId: item.documentId,
      reviewItemId: item.id,
      details: "reply"
    });
    return state;
  }

  /* Stages are derived, so this only writes the trail entry. */
  function recordStageChange(value, fromStage, toStage, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp || !fromStage || !toStage || fromStage === toStage) return value;
    var state = normalizeState(value);
    appendAudit(state, {
      timestamp: stamp,
      actor: "system",
      action: "stage-changed",
      documentId: null,
      details: fromStage + " → " + toStage
    });
    return state;
  }

  /**
   * Approve. The gate is `readyToApprove` and it is derived, so the only way
   * past it with conditions still open is `options.override` — and an override
   * is not a flag, it is a sentence: without a written reason it is refused
   * exactly as an unready approval is. What the officer typed goes on the
   * record and into the trail under an action of its own, so a file approved
   * outside the gate never reads afterwards as one that passed it.
   */
  function approve(value, options, timestamp) {
    var stamp = validTimestamp(timestamp);
    if (!stamp) return value;
    var asked = isRecord(options) ? options : {};
    var reason = nonEmptyString(asked.reason) ? cleanText(asked.reason) : "";
    var override = asked.override === true && Boolean(reason);
    if (!override && !readyToApprove(value)) return value;
    var state = normalizeState(value);
    if (state.workflow.approvedAt || state.workflow.declinedAt) return value;
    var supplied = Array.isArray(asked.conditions) ? asked.conditions.filter(nonEmptyString) : null;
    var conditions = supplied && supplied.length
      ? supplied
      : state.conditions.map(function (condition) { return condition.id; });
    state.workflow.approvedAt = stamp;
    state.workflow.approvedConditions = conditions;
    state.workflow.overridden = override;
    if (override) state.workflow.decisionReason = reason;
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: override ? "loan-approved-override" : "loan-approved",
      documentId: null,
      details: override ? reason : conditions.join("; ")
    });
    return state;
  }

  /**
   * Decline. The mirror of an override and refused on the same terms: no
   * reason, no decision. A case that already has an outcome keeps it — the way
   * back from either is the reset, not a second decision written over the
   * first.
   */
  function decline(value, options, timestamp) {
    var stamp = validTimestamp(timestamp);
    var reason = isRecord(options) ? cleanText(options.reason) : "";
    if (!stamp || !reason) return value;
    var state = normalizeState(value);
    if (state.workflow.approvedAt || state.workflow.declinedAt) return value;
    state.workflow.declinedAt = stamp;
    state.workflow.decisionReason = reason;
    appendAudit(state, {
      timestamp: stamp,
      actor: "lender",
      action: "loan-declined",
      documentId: null,
      details: reason
    });
    return state;
  }

  /* =================================================================== api */

  globalThis.WestonWorkspace = {
    STATE_VERSION: STATE_VERSION,
    STAGES: STAGES,
    REVIEW_TYPES: REVIEW_TYPES,
    DOCUMENT_WORK_TYPES: DOCUMENT_WORK_TYPES,
    isDocumentWork: isDocumentWork,
    VERDICTS: VERDICTS,
    READY_VERDICTS: READY_VERDICTS,
    DOCUMENT_IDS: DOCUMENT_IDS,
    SCAN_ROWS: SCAN_ROWS,
    SCAN_OVERRIDES: SCAN_OVERRIDES,
    scanRowsFor: scanRowsFor,
    scanOverrideFor: scanOverrideFor,
    CONDITION_IDS: CONDITION_IDS,
    APPROVAL_CONDITION_IDS: APPROVAL_CONDITION_IDS,
    CONDITION_DOCUMENTS: CONDITION_DOCUMENTS,
    ACTORS: ACTORS,

    normalizeState: normalizeState,
    sendBorrowerMessage: sendBorrowerMessage,
    sendLenderMessage: sendLenderMessage,
    sendAssistantMessage: sendAssistantMessage,
    registerUpload: registerUpload,
    setVerdict: setVerdict,
    clearCondition: clearCondition,
    reopenCondition: reopenCondition,
    settleConditionsFor: settleConditionsFor,
    raiseDeedDeadline: raiseDeedDeadline,
    resolveReviewItem: resolveReviewItem,
    replyAndResolve: replyAndResolve,
    recordStageChange: recordStageChange,
    approve: approve,
    decline: decline,
    recordSignature: recordSignature,
    reorderInspection: reorderInspection,

    openReviewItems: openReviewItems,
    deriveStage: deriveStage,
    pendingChecks: pendingChecks,
    readyToApprove: readyToApprove
  };
})();
