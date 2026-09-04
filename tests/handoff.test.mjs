import test from "node:test";
import assert from "node:assert/strict";
import { loadPageApi } from "./page-test-helpers.mjs";

/* Spec §7 — the bridge between the two surfaces.
 *
 * Both files are opened from disk with no server, so the handoff is browser
 * storage plus the `storage` event: `sessionStorage` for the case state of the
 * one interactive case, `localStorage` for the live cross-tab message bridge.
 * The mechanism is the Spanish demo's, carried over rather than reinvented.
 *
 * Two properties are load-bearing and are asserted here before anything else:
 *
 *   1. lender.html is demoable alone. Empty, malformed or future-version storage
 *      all give a complete twelve-loan board from the built-in fixture. A parse
 *      error never blanks the page.
 *   2. Restart is honest. After restart on the borrower side the shared thread is
 *      empty on both sides, and no message of a previous run can reappear —
 *      while a message written *after* the restart still arrives.
 *
 * There is no DOM here, so storage is a double: a memory map whose `setItem` can
 * be replaced with one that throws, which is how the quota path is really
 * exercised rather than assumed.
 */

const borrowerPage = loadPageApi("borrower.html", "WestonBorrower");
const lenderPage = loadPageApi("lender.html", "WestonLender");

const borrower = borrowerPage.api;
const lender = lenderPage.api;
const workspace = borrowerPage.context.WestonWorkspace;
const lenderWorkspace = lenderPage.context.WestonWorkspace;
const copy = borrowerPage.context.WestonCopy;

/* Values crossing out of a vm realm carry that realm's prototypes. */
const plain = value => JSON.parse(JSON.stringify(value));
const t = (key, params) => copy.t(key, copy.DEFAULT_LOCALE, params);

/* ------------------------------------------------------------ the double */

/**
 * A Storage-shaped memory map. `setItem` is a plain property so a test can
 * replace it with one that throws — quota, private mode — and see what the page
 * really does about it.
 */
function memoryStorage(seed) {
  const data = new Map(Object.entries(seed || {}));
  return {
    data,
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    raw(key) {
      return data.has(key) ? data.get(key) : null;
    }
  };
}

function throwingStorage(seed) {
  const storage = memoryStorage(seed);
  storage.setItem = () => {
    throw new Error("QuotaExceededError");
  };
  return storage;
}

const CASE_KEY = "bfDemoCase:H-2026-08415";
const BRIDGE_KEY = "bfDemoMessages:H-2026-08415";
const VIEW_KEY = "bfDemoBorrowerView:H-2026-08415";

/* Each page keeps its own memory of which bridge messages it has already taken
   in, so every test starts from a clean slate on both sides. */
function freshBridges() {
  borrower.bridgeClear(null);
  lender.bridgeClear(null);
  borrower.resetViewOnlyNotice();
  lender.resetViewOnlyNotice();
}

const openOf = (api, state, type) =>
  plain(api === borrower ? workspace.openReviewItems(state) : lenderWorkspace.openReviewItems(state))
    .filter(item => !type || item.type === type);

const stamp = minute => `2026-08-06T12:${String(minute).padStart(2, "0")}:00.000Z`;

/* Writes straight into the envelope, bypassing both pages' own `bridgeSend` —
   which marks whatever it just sent as already seen by the sender's own
   module (§7: "mine is already on my own surface"). That is right for a real
   send and wrong for a test standing in for the *other* side's tab, which
   must still see this as fresh. */
function seedBridge(storage, entries) {
  storage.setItem(BRIDGE_KEY, JSON.stringify({ version: 1, run: 1, entries }));
}

/* ==================================================================== keys */

test("both pages agree on the two storage keys and the bridge cap", () => {
  assert.equal(borrower.CASE_STORAGE_KEY, CASE_KEY);
  assert.equal(lender.CASE_STORAGE_KEY, CASE_KEY);
  assert.equal(borrower.MESSAGE_BRIDGE_KEY, BRIDGE_KEY);
  assert.equal(lender.MESSAGE_BRIDGE_KEY, BRIDGE_KEY);
  assert.equal(borrower.BRIDGE_LIMIT, 200);
  assert.equal(lender.BRIDGE_LIMIT, 200);
  /* The case key names the one interactive case, so a second case could never
     silently share its state. */
  assert.ok(borrower.CASE_STORAGE_KEY.endsWith(borrower.CASE_ID));
  assert.ok(lender.MESSAGE_BRIDGE_KEY.endsWith(lender.CASE_ID));
});

test("the case lives in sessionStorage and the bridge in localStorage", () => {
  /* Spec §7: session state for the case, localStorage only for the live bridge.
     Each page reaches for exactly one of the two per key. */
  for (const { html, name } of [
    { html: borrowerPage.html, name: "borrower.html" },
    { html: lenderPage.html, name: "lender.html" }
  ]) {
    assert.match(html, /globalThis\.sessionStorage/, `${name} reads sessionStorage`);
    assert.match(html, /globalThis\.localStorage/, `${name} reads localStorage`);
  }
});

/* ============================================================= the case state */

test("a state saved by the borrower loads identically on the lender side", () => {
  const storage = memoryStorage();
  const played = borrower.runScript();

  assert.equal(borrower.saveCase(storage, played.state), true);

  const loaded = lender.loadCase(storage);
  assert.equal(loaded.source, "storage");
  assert.equal(loaded.reason, null);
  assert.deepEqual(plain(loaded.state), plain(played.state));

  /* And the lender's own reader agrees with the borrower's. */
  assert.deepEqual(plain(borrower.loadCase(storage).state), plain(played.state));
});

test("the state the borrower hands over is the §3.3 handoff", () => {
  const storage = memoryStorage();
  borrower.saveCase(storage, borrower.runScript().state);
  const state = lender.loadCase(storage).state;

  const documents = plain(state).documents;
  assert.equal(documents["tax-folder"].verdict, "rejected");
  assert.equal(documents["title-certificate"].verdict, "under-review");
  assert.equal(
    Object.keys(documents).filter(id => documents[id].verdict === "accepted").length,
    7
  );
  const open = openOf(lender, state);
  assert.equal(open.length, 2);
  assert.deepEqual(open.map(item => item.type), ["document-exception", "document-exception"]);
});

test("empty storage falls back to the built-in fixture, and says so", () => {
  const loaded = lender.loadCase(memoryStorage());
  assert.equal(loaded.source, "fallback");
  assert.equal(loaded.reason, "empty");
  assert.deepEqual(plain(loaded.state), plain(lender.FALLBACK_CASE.state));
});

test("no storage at all is the same as empty storage", () => {
  for (const nothing of [null, undefined]) {
    const loaded = lender.loadCase(nothing);
    assert.equal(loaded.source, "fallback");
    assert.deepEqual(plain(loaded.state), plain(lender.FALLBACK_CASE.state));
  }
});

test("malformed, wrong-shaped and future-version payloads all reset to the fixture", () => {
  const cases = [
    ["{not json at all", "unreadable"],
    ["", "empty"],
    ["null", "malformed"],
    ["7", "malformed"],
    ['"a string"', "malformed"],
    ["[]", "malformed"],
    ['{"hello":"world"}', "malformed"],
    ['{"version":1}', "malformed"],
    ['{"version":2,"documents":{},"reviewItems":[],"auditEvents":[]}', "version"],
    ['{"version":99,"documents":{}}', "version"],
    ['{"version":0,"documents":{}}', "version"],
    ['{"version":"1","documents":{}}', "malformed"]
  ];

  for (const [payload, reason] of cases) {
    const storage = memoryStorage({ [CASE_KEY]: payload });
    /* Never throws — a parse error must not blank the page. */
    const loaded = lender.loadCase(storage);
    assert.equal(loaded.source, "fallback", payload);
    assert.equal(loaded.reason, reason, payload);
    assert.deepEqual(plain(loaded.state), plain(lender.FALLBACK_CASE.state), payload);
    /* The borrower's reader is the same reader. */
    assert.equal(borrower.loadCase(storage).source, "fallback", payload);
  }
});

test("a storage whose getItem throws is read as empty, not as a crash", () => {
  const storage = memoryStorage();
  storage.getItem = () => {
    throw new Error("SecurityError");
  };
  const loaded = lender.loadCase(storage);
  assert.equal(loaded.source, "fallback");
  assert.equal(loaded.reason, "unreadable");
  assert.deepEqual(plain(loaded.state), plain(lender.FALLBACK_CASE.state));
});

/* ==================================================== her place on the page */

test("her place on the page survives a reload: same phase, same thread, same progress", () => {
  const storage = memoryStorage();
  const finished = borrower.runScript();
  assert.equal(finished.finished, true, "the fixture is supposed to have completed");

  assert.equal(borrower.saveView(storage, finished), true);
  const reloaded = borrower.loadView(storage);

  assert.equal(reloaded.resumed, true);
  assert.equal(reloaded.view.phase, finished.phase);
  assert.equal(reloaded.view.cursor, finished.cursor);
  assert.equal(reloaded.view.finished, true);
  assert.equal(reloaded.view.started, finished.started);
  assert.deepEqual(plain(reloaded.view.thread), plain(finished.thread));
  assert.deepEqual(plain(reloaded.view.state), plain(finished.state));
});

test("a reload never resumes autoplay on its own, even if she left mid-play", () => {
  const storage = memoryStorage();
  /* `runScript` is the pure engine fast-forwarding through every step; it
     never flips the UI's own "she pressed play" flag, so that is set by
     hand here to stand in for a run that really was mid-flight. */
  const midPlay = Object.assign({}, borrower.setPaused(borrower.runScript(), false), {
    started: true
  });
  assert.equal(midPlay.paused, false);

  borrower.saveView(storage, midPlay);
  const reloaded = borrower.loadView(storage);
  /* Everything else about where she was is kept; only the clock stops, so
     the page does not race ahead of a screen nobody has looked at yet. */
  assert.equal(reloaded.view.paused, true);
  assert.equal(reloaded.view.started, true);
  assert.equal(reloaded.view.cursor, midPlay.cursor);
});

test("empty view storage is the same as never having visited: the opening view, not resumed", () => {
  const loaded = borrower.loadView(memoryStorage());
  assert.equal(loaded.resumed, false);
  assert.deepEqual(plain(loaded.view), plain(borrower.initialViewState()));
  assert.deepEqual(plain(loaded.bridgeSeen), {});
  assert.equal(loaded.bridgeRun, 0);
});

test("malformed, wrongly shaped or future-version view storage all reset to the opening view, not resumed", () => {
  const cases = [
    "{not json at all",
    "",
    "null",
    "7",
    '"a string"',
    "[]",
    '{"hello":"world"}',
    '{"phase":"documents"}',
    '{"version":2,"phase":"documents"}',
    '{"version":0,"phase":"documents"}',
    '{"version":"1","phase":"documents"}'
  ];
  for (const payload of cases) {
    const storage = memoryStorage({ [VIEW_KEY]: payload });
    const loaded = borrower.loadView(storage);
    assert.equal(loaded.resumed, false, payload);
    assert.deepEqual(plain(loaded.view), plain(borrower.initialViewState()), payload);
  }
});

test("one corrupted field in an otherwise-valid saved view does not sink the rest", () => {
  const storage = memoryStorage({
    [VIEW_KEY]: JSON.stringify({
      version: borrower.BORROWER_VIEW_VERSION,
      phase: "not-a-real-phase",
      cursor: -5,
      speed: 999,
      drawerTab: "not-a-real-tab",
      thread: "not-an-array",
      started: true,
      finished: true
    })
  });
  const loaded = borrower.loadView(storage);
  const opening = borrower.initialViewState();
  assert.equal(loaded.resumed, true, "the payload is otherwise a real, valid save");
  /* Each bad field falls back to its own default... */
  assert.equal(loaded.view.phase, opening.phase);
  assert.equal(loaded.view.cursor, opening.cursor);
  assert.equal(loaded.view.speed, opening.speed);
  assert.equal(loaded.view.drawerTab, opening.drawerTab);
  assert.deepEqual(plain(loaded.view.thread), plain(opening.thread));
  /* ...without erasing the fields that were actually fine. */
  assert.equal(loaded.view.started, true);
  assert.equal(loaded.view.finished, true);
});

test("restart clears her saved place on the page, not just the bridge", () => {
  const storage = memoryStorage();
  borrower.saveView(storage, borrower.setPaused(borrower.runScript(), false));
  assert.notEqual(storage.raw(VIEW_KEY), null);

  borrower.restart({ storage: storage });
  assert.equal(storage.raw(VIEW_KEY), null);
  assert.equal(borrower.loadView(storage).resumed, false);
  assert.deepEqual(plain(borrower.loadView(storage).view), plain(borrower.initialViewState()));
});

/* ============================== a reply sent while her tab was closed */

test("a reply sent while her tab was closed is on the bridge, unabsorbed, when she reopens it", () => {
  freshBridges();
  const storage = memoryStorage();
  const bridge = memoryStorage();

  /* She played the demo, then closed the tab — her place is saved. */
  const played = borrower.runScript();
  borrower.saveView(storage, played);

  /* A fresh page load starts with no memory of the bridge at all — this is
     what a real reload does before init() runs; a test that skipped it would
     be trading on memory the page load itself does not have. */
  freshBridges();
  seedBridge(bridge, [
    {
      id: "borrower-1-1",
      run: 1,
      seq: 1,
      from: "borrower",
      text: "Any news on the title?",
      timestamp: stamp(10),
      documentId: "title-certificate"
    }
  ]);

  /* The desk replies while nothing of hers is running to hear it. */
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: bridge });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  lender.commitReply(absorbed.state, item.id, "Still there? Following up on the title.", {
    timestamp: stamp(30),
    storage: bridge
  });

  /* Reopening the tab must not throw the pending reply away the way a fresh
     run's bridge always was (§ her place on the page) — this is the actual
     bug: init() used to call bridgeClear() unconditionally on every load. */
  const loaded = borrower.loadView(storage);
  assert.equal(loaded.resumed, true);
  borrower.applyBridgeMemory(loaded);
  const received = borrower.bridgeAbsorb(loaded.view, { storage: bridge });
  assert.equal(received.changed, true, "the reply sent while she was away was lost");
  const thread = plain(received.viewState).thread;
  assert.equal(thread[thread.length - 1].text, "Still there? Following up on the title.");
});

test("resuming never re-absorbs a reply already folded into the saved state", () => {
  freshBridges();
  const storage = memoryStorage();
  const bridge = memoryStorage();

  seedBridge(bridge, [
    {
      id: "borrower-1-1",
      run: 1,
      seq: 1,
      from: "borrower",
      text: "About the tax folder?",
      timestamp: stamp(10),
      documentId: "tax-folder"
    }
  ]);
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: bridge });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  lender.commitReply(absorbed.state, item.id, "One reply, told once.", {
    timestamp: stamp(30),
    storage: bridge
  });

  /* She is on the page when it arrives — absorbed once, saved as it stands,
     bridge memory saved right alongside it. */
  const live = borrower.bridgeAbsorb(borrower.runScript(), { storage: bridge });
  assert.equal(live.changed, true);
  borrower.saveView(storage, live.viewState);

  /* The tab closes and reopens: a real reload's module memory starts from
     nothing, restored only from what was saved — not from whatever this
     process happens to still remember from the call above. */
  freshBridges();
  const loaded = borrower.loadView(storage);
  borrower.applyBridgeMemory(loaded);
  const again = borrower.bridgeAbsorb(loaded.view, { storage: bridge });
  assert.equal(again.changed, false, "a reload must not re-absorb what it already saved");
  const count = plain(loaded.view).thread.filter(m => m.text === "One reply, told once.").length;
  assert.equal(count, 1);
});

test("a genuinely fresh visit still clears a previous demo run's leftover bridge", () => {
  freshBridges();
  const bridge = memoryStorage({
    [BRIDGE_KEY]: JSON.stringify({
      run: 1,
      entries: [
        {
          id: "lender-1-1",
          run: 1,
          seq: 1,
          from: "lender",
          text: "Old run's leftover",
          timestamp: stamp(1),
          documentId: "tax-folder"
        }
      ]
    })
  });
  /* No saved view at all: never visited, or restarted since — this is what
     init() checks to choose clearing over absorbing. */
  const loaded = borrower.loadView(memoryStorage());
  assert.equal(loaded.resumed, false);
  borrower.bridgeClear(bridge);
  assert.deepEqual(plain(borrower.bridgeRead(bridge).entries), []);
  /* And a page that loads afterwards has nothing left to absorb. */
  const result = borrower.bridgeAbsorb(borrower.initialViewState(), { storage: bridge });
  assert.equal(result.changed, false);
});

/* ================================================= lender.html stands alone */

test("with empty storage the lender still renders a complete twelve-loan board", () => {
  const loans = lender.buildPortfolio(lender.FALLBACK_CASE, lender.loadCase(memoryStorage()).state);
  const list = plain(loans);

  assert.equal(list.length, 12);
  assert.equal(new Set(list.map(loan => loan.caseId)).size, 12);
  assert.equal(list.filter(loan => !loan.readonly).length, 2);

  /* All six columns are occupied, so no stage is ever demoed empty (§5.4). */
  const stages = new Set(list.map(loan => loan.stage));
  for (const column of plain(lender.STAGE_COLUMNS)) {
    assert.ok(stages.has(column.id), `no loan in ${column.id}`);
  }

  const markup = lender.renderPortfolioPage(loans, {}, lender.DEMO_NOW);
  for (const loan of list) {
    assert.ok(markup.includes(loan.caseId), `${loan.caseId} is missing from the board`);
  }
  const metrics = plain(lender.portfolioMetrics(loans, lender.DEMO_NOW));
  assert.ok(metrics.activeOriginationUF > 0);
  assert.ok(metrics.needsReviewCount > 0);
});

test("a malformed payload still renders the whole board", () => {
  const storage = memoryStorage({ [CASE_KEY]: "{oops" });
  const loans = lender.buildPortfolio(lender.FALLBACK_CASE, lender.loadCase(storage).state);
  assert.equal(plain(loans).length, 12);
  const markup = lender.renderPortfolioPage(loans, {}, lender.DEMO_NOW);
  assert.ok(markup.includes(lender.CASE_ID));
  assert.ok(markup.length > 2000, "the board rendered, not a blank page");
});

/* ============================================================ saving, refused */

test("a setItem that throws returns false and the caller announces view-only", () => {
  freshBridges();
  const storage = throwingStorage();

  assert.equal(borrower.saveCase(storage, borrower.initialViewState().state), false);
  assert.equal(storage.raw(CASE_KEY), null);

  /* Said once, into the page's role="status" region, and not again. */
  assert.deepEqual(plain(borrower.viewOnlyAnnouncement()), {
    key: "common.view-only",
    params: null
  });
  assert.equal(borrower.viewOnlyAnnouncement(), null);
  assert.equal(borrower.viewOnlyAnnouncement(), null);
  assert.ok(t("common.view-only").length > 0);
});

test("the lender announces view-only for a refused save too, once", () => {
  freshBridges();
  const storage = throwingStorage();
  assert.equal(lender.saveCase(storage, lender.FALLBACK_CASE.state), false);
  assert.deepEqual(plain(lender.viewOnlyAnnouncement()), { key: "common.view-only", params: null });
  assert.equal(lender.viewOnlyAnnouncement(), null);
});

test("a refused save leaves the surface working in memory", () => {
  freshBridges();
  const storage = throwingStorage();
  const played = borrower.runScript();
  assert.equal(borrower.saveCase(storage, played.state), false);
  /* Nothing was lost: the view state is the same object it always was. */
  assert.equal(openOf(borrower, played.state).length, 2);
  assert.ok(borrower.renderThread(played).length > 0);
});

test("a bridge send onto a refused storage reports failure and keeps the message", () => {
  freshBridges();
  const storage = throwingStorage();
  const sent = borrower.bridgeSend(storage, {
    from: "borrower",
    text: "Is the tax folder still missing?",
    timestamp: stamp(10)
  });
  assert.equal(sent.ok, false);
  /* The message still exists — it simply never reached the other tab. */
  assert.equal(plain(sent.message).text, "Is the tax folder still missing?");
  assert.deepEqual(plain(borrower.viewOnlyAnnouncement()), { key: "common.view-only", params: null });
});

/* ================================================================ the bridge */

test("bridgeSend writes a versioned, run-stamped envelope", () => {
  freshBridges();
  const storage = memoryStorage();
  const sent = borrower.bridgeSend(storage, {
    from: "borrower",
    text: "Hello",
    timestamp: stamp(1),
    documentId: "tax-folder"
  });

  assert.equal(sent.ok, true);
  const envelope = JSON.parse(storage.raw(BRIDGE_KEY));
  assert.equal(envelope.version, 1);
  assert.equal(typeof envelope.run, "number");
  assert.equal(envelope.entries.length, 1);
  assert.deepEqual(envelope.entries[0], {
    id: plain(sent.message).id,
    run: envelope.run,
    seq: 1,
    from: "borrower",
    text: "Hello",
    timestamp: stamp(1),
    documentId: "tax-folder"
  });
});

test("bridgeSend refuses blank text and an unknown sender", () => {
  freshBridges();
  const storage = memoryStorage();
  for (const message of [
    { from: "borrower", text: "   ", timestamp: stamp(1) },
    { from: "borrower", text: "", timestamp: stamp(1) },
    { from: "borrower", timestamp: stamp(1) },
    { from: "someone-else", text: "Hi", timestamp: stamp(1) },
    { text: "Hi", timestamp: stamp(1) }
  ]) {
    const sent = borrower.bridgeSend(storage, message);
    assert.equal(sent.ok, false, JSON.stringify(message));
    assert.equal(sent.message, null);
  }
  assert.equal(storage.raw(BRIDGE_KEY), null);
  /* A refusal is not a storage failure, and the two are told apart by the message:
     a refused send has none, a failed one still hands back what it could not
     deliver. */
  assert.equal(
    plain(borrower.bridgeSend(throwingStorage(), { from: "borrower", text: "real", timestamp: stamp(1) }).message)
      .text,
    "real"
  );
});

test("ids are deterministic: no clock and no randomness in the bridge", () => {
  freshBridges();
  const first = memoryStorage();
  const second = memoryStorage();
  const a = borrower.bridgeSend(first, { from: "borrower", text: "same", timestamp: stamp(2) });
  freshBridges();
  const b = borrower.bridgeSend(second, { from: "borrower", text: "same", timestamp: stamp(2) });
  assert.equal(plain(a.message).id, plain(b.message).id);
  assert.deepEqual(JSON.parse(first.raw(BRIDGE_KEY)), JSON.parse(second.raw(BRIDGE_KEY)));
});

test("the bridge caps at the last 200 messages", () => {
  freshBridges();
  const storage = memoryStorage();
  for (let index = 1; index <= 205; index += 1) {
    const sent = borrower.bridgeSend(storage, {
      from: "borrower",
      text: "message " + index,
      timestamp: stamp(1)
    });
    assert.equal(sent.ok, true, "send " + index);
  }

  const envelope = JSON.parse(storage.raw(BRIDGE_KEY));
  assert.equal(envelope.entries.length, 200);
  /* The oldest five were dropped, not the newest. */
  assert.equal(envelope.entries[0].text, "message 6");
  assert.equal(envelope.entries[199].text, "message 205");
  /* Sequence numbers survive the truncation, so no id is ever reused. */
  assert.equal(envelope.entries[0].seq, 6);
  assert.equal(envelope.entries[199].seq, 205);
  assert.equal(new Set(envelope.entries.map(entry => entry.id)).size, 200);
});

test("a malformed bridge payload reads as an empty thread", () => {
  freshBridges();
  for (const payload of [
    "{not json",
    "null",
    "42",
    "[]",
    '{"version":9,"run":1,"entries":[{"id":"x","from":"borrower","text":"hi"}]}',
    '{"version":1,"entries":"nope"}'
  ]) {
    const storage = memoryStorage({ [BRIDGE_KEY]: payload });
    const read = lender.bridgeRead(storage);
    assert.deepEqual(plain(read.entries), [], payload);
  }
});

test("a bridge entry missing its id, sender or text is dropped on the way in", () => {
  freshBridges();
  const storage = memoryStorage({
    [BRIDGE_KEY]: JSON.stringify({
      version: 1,
      run: 1,
      entries: [
        { id: "borrower-1-1", run: 1, seq: 1, from: "borrower", text: "kept", timestamp: stamp(3) },
        { run: 1, seq: 2, from: "borrower", text: "no id", timestamp: stamp(3) },
        { id: "borrower-1-3", run: 1, seq: 3, text: "no sender", timestamp: stamp(3) },
        { id: "borrower-1-4", run: 1, seq: 4, from: "borrower", text: "  ", timestamp: stamp(3) },
        "not an object"
      ]
    })
  });
  const entries = plain(lender.bridgeRead(storage).entries);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].text, "kept");
});

/* ================================================== borrower → lender → borrower */

test("a borrower message round-trips into an open lender review item", () => {
  freshBridges();
  const storage = memoryStorage();

  /* She writes, from her own portal. */
  const played = borrower.runScript();
  const typed = borrower.sendBorrowerMessage(
    played,
    "Has anyone looked at the title certificate yet?",
    { storage: storage }
  );
  assert.equal(typed.changed, true);

  const envelope = JSON.parse(storage.raw(BRIDGE_KEY));
  assert.equal(envelope.entries.length, 1);
  assert.equal(envelope.entries[0].from, "borrower");

  /* The lender tab, a second later. */
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  assert.equal(absorbed.changed, true);
  assert.equal(plain(absorbed.absorbed).length, 1);
  assert.deepEqual(plain(absorbed.announcement), {
    key: "lender.status.borrower-message",
    params: { count: 1 }
  });

  const messages = openOf(lender, absorbed.state, "borrower-message");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].resolvedAt, null);
  /* The two exceptions of §3.3 are untouched: one item at a time, never a sweep. */
  assert.equal(openOf(lender, absorbed.state).length, 3);

  /* Her words reached the document record the item points at. */
  const record = plain(absorbed.state).documents[messages[0].documentId];
  assert.ok(
    record.messages.some(message => message.text === "Has anyone looked at the title certificate yet?"),
    "the borrower's text is on the document"
  );

  /* And the board now counts her case as needing review. */
  const loans = lender.buildPortfolio(lender.FALLBACK_CASE, absorbed.state);
  const metrics = plain(lender.portfolioMetrics(loans, lender.DEMO_NOW));
  assert.ok(metrics.needsReviewCount >= 1);
  const live = plain(loans)[0];
  assert.equal(live.caseId, lender.CASE_ID);
  /* Review work never moves a stage (§4.1). */
  assert.equal(live.stage, "gathering-documents");
});

test("a lender reply round-trips back into the WhatsApp thread", () => {
  freshBridges();
  const storage = memoryStorage();

  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, "Any news on the title?", { storage: storage });
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];

  const replied = lender.commitReply(
    absorbed.state,
    item.id,
    "We have asked the developer to release the earlier mortgage in the same deed.",
    { timestamp: stamp(20), storage: storage, borrowerName: "Javiera Soto Miranda" }
  );
  assert.equal(replied.changed, true);
  /* Her item is closed by the reply, and only hers. */
  assert.equal(openOf(lender, replied.state, "borrower-message").length, 0);
  assert.equal(openOf(lender, replied.state).length, 2);

  const envelope = JSON.parse(storage.raw(BRIDGE_KEY));
  assert.equal(envelope.entries.length, 2);
  assert.equal(envelope.entries[1].from, "lender");

  /* Back on her tab. */
  const received = borrower.bridgeAbsorb(played, { storage: storage });
  assert.equal(received.changed, true);
  assert.equal(plain(received.absorbed).length, 1);
  assert.deepEqual(plain(received.announcement), {
    key: "borrower.chat.received",
    params: { count: 1 }
  });

  const thread = plain(received.viewState).thread;
  const last = thread[thread.length - 1];
  assert.equal(last.text, "We have asked the developer to release the earlier mortgage in the same deed.");
  /* Never as an officer: her thread only ever knows the mortgage team (§7). */
  assert.notEqual(last.author, "borrower");
  const markup = borrower.renderThread(received.viewState);
  assert.ok(markup.includes(borrower.escapeHtml(last.text)));
  assert.ok(markup.includes(t("borrower.chat.team-name")));
});

test("a lender reply is stamped on her own clock on arrival, not the desk's", () => {
  /* Same asymmetry the lender's own bridgeAbsorb already fixed, the other
     way round (§7): her narrative starts a day before the desk's DEMO_NOW,
     so a reply kept at the timestamp it was written with would read as
     though it arrived a day after the message it answers — the exact "not
     in sync" a real back-and-forth conversation must not show. */
  freshBridges();
  const storage = memoryStorage();

  const played = borrower.runScript();
  const sentByHer = borrower.sendBorrowerMessage(played, "Any news on the title?", {
    storage: storage
  });
  const herOwnStamp = plain(sentByHer.viewState).state.documents["title-certificate"].messages.slice(-1)[0]
    .timestamp;

  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  const replied = lender.commitReply(absorbed.state, item.id, "We are on it.", {
    /* The desk's clock: a full day ahead of her narrative's own start. */
    timestamp: stamp(20),
    storage: storage
  });
  assert.equal(replied.changed, true);

  const received = borrower.bridgeAbsorb(sentByHer.viewState, { storage: storage });
  const messages = plain(received.viewState).state.documents["title-certificate"].messages;
  const reply = messages[messages.length - 1];
  assert.equal(reply.text, "We are on it.");
  /* Not the desk's literal stamp — that is the bug — and strictly after her
     own last message on her own clock, the way a reply that "just arrived"
     always reads. */
  assert.notEqual(reply.timestamp, stamp(20));
  assert.ok(
    Date.parse(reply.timestamp) > Date.parse(herOwnStamp),
    `expected the reply (${reply.timestamp}) after her own message (${herOwnStamp})`
  );
});

test("a lender reply round-trips onto the document's own review page, not just the WhatsApp thread", () => {
  freshBridges();
  const storage = memoryStorage();

  const played = borrower.runScript();
  /* Sent from the tax folder's own review page, not the ambient composer — so
     it must be filed against tax-folder regardless of whatever document the
     scripted narrative last touched. */
  const sent = borrower.sendDrawerMessage(played, "tax-folder", "Is page 1 enough now?", {
    storage: storage
  });
  assert.equal(sent.changed, true);

  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  assert.equal(item.documentId, "tax-folder");

  const replied = lender.commitReply(absorbed.state, item.id, "Yes, page 1 is legible now.", {
    timestamp: stamp(20),
    storage: storage,
    borrowerName: "Javiera Soto Miranda"
  });
  assert.equal(replied.changed, true);

  const received = borrower.bridgeAbsorb(sent.viewState, { storage: storage });
  assert.equal(received.changed, true);

  const documents = plain(received.viewState).state.documents;
  const taxMessages = documents["tax-folder"].messages;
  const last = taxMessages[taxMessages.length - 1];
  assert.equal(last.author, "lender");
  assert.equal(last.text, "Yes, page 1 is legible now.");
  /* Filed on the document it actually answers — a reply about the tax folder
     must not also appear on an unrelated document's own page. */
  assert.ok(
    !documents["title-certificate"].messages.some(message => message.text === last.text)
  );

  const opened = borrower.setDrawerTab(
    borrower.openDocument(received.viewState, "tax-folder"),
    "assistant"
  );
  const markup = borrower.renderDrawer(opened);
  assert.ok(markup.includes(borrower.escapeHtml(last.text)));
  assert.ok(markup.includes(t("borrower.drawer.tab-assistant")));
});

test("neither side absorbs its own messages", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  const typed = borrower.sendBorrowerMessage(played, "Mine", { storage: storage });

  /* Her own message is already in her thread; absorbing must not double it. */
  const back = borrower.bridgeAbsorb(typed.viewState, { storage: storage });
  assert.equal(back.changed, false);
  assert.equal(back.viewState, typed.viewState);
  assert.equal(plain(back.absorbed).length, 0);
  assert.equal(back.announcement, null);

  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  lender.commitReply(absorbed.state, item.id, "Ours", { timestamp: stamp(21), storage: storage });

  const again = lender.bridgeAbsorb(absorbed.state, { storage: storage });
  assert.equal(again.changed, false);
  assert.equal(again.state, absorbed.state);
});

test("bridgeAbsorb is idempotent over already-seen ids", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, "First", { storage: storage });
  borrower.sendBorrowerMessage(played, "Second", { storage: storage });

  const first = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  assert.equal(plain(first.absorbed).length, 2);
  assert.equal(openOf(lender, first.state, "borrower-message").length, 2);

  /* The same storage, absorbed again and again: nothing new, no new items, and
     the state comes back by reference so a re-render can be skipped. */
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const repeat = lender.bridgeAbsorb(first.state, { storage: storage });
    assert.equal(repeat.changed, false, "attempt " + attempt);
    assert.equal(repeat.state, first.state);
    assert.equal(plain(repeat.absorbed).length, 0);
    assert.equal(openOf(lender, repeat.state, "borrower-message").length, 2);
  }

  /* A third message written afterwards is still absorbed. */
  borrower.sendBorrowerMessage(played, "Third", { storage: storage });
  const third = lender.bridgeAbsorb(first.state, { storage: storage });
  assert.equal(plain(third.absorbed).length, 1);
  assert.equal(plain(third.absorbed)[0].text, "Third");
  assert.equal(openOf(lender, third.state, "borrower-message").length, 3);
});

test("bridgeAbsorb takes entries directly as well as from storage", () => {
  freshBridges();
  const entries = [
    {
      id: "borrower-1-1",
      run: 1,
      seq: 1,
      from: "borrower",
      text: "Handed over by hand",
      timestamp: stamp(30),
      documentId: "tax-folder"
    }
  ];
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { entries: entries });
  assert.equal(plain(absorbed.absorbed).length, 1);
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  assert.equal(item.documentId, "tax-folder");
});

test("an absorbed message with an unknown document id still lands somewhere real", () => {
  freshBridges();
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, {
    entries: [
      {
        id: "borrower-1-9",
        run: 1,
        seq: 9,
        from: "borrower",
        text: "About my file",
        timestamp: stamp(31),
        documentId: "not-a-document"
      }
    ]
  });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  assert.ok(plain(workspace.DOCUMENT_IDS).includes(item.documentId));
});

test("typed text is escaped when the other surface renders it", () => {
  freshBridges();
  const storage = memoryStorage();
  const nasty = '<img src=x onerror="alert(1)">';

  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, nasty, { storage: storage });
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];

  /* On the lender's document record. */
  const record = plain(absorbed.state).documents[item.documentId];
  assert.ok(record.messages.some(message => message.text === nasty), "stored verbatim");
  const documents = lender.renderDocumentsTab(
    lender.buildPortfolio(lender.FALLBACK_CASE, absorbed.state)[0]
  );
  assert.ok(documents.includes("&lt;img src=x onerror="));
  assert.ok(!/onerror="alert/.test(documents), "the handler cannot close as an attribute");

  /* And on the way back into her thread. */
  const replied = lender.commitReply(absorbed.state, item.id, nasty, {
    timestamp: stamp(22),
    storage: storage
  });
  const received = borrower.bridgeAbsorb(played, { storage: storage });
  const markup = borrower.renderThread(received.viewState);
  assert.ok(markup.includes("&lt;img src=x onerror="));
  assert.ok(!/onerror="alert/.test(markup));
  assert.ok(replied.changed);
});

/* ==================================================== the backlog on first paint */

test("a case switched to in her own tab does not double her messages", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  /* She writes, and the borrower page hands the case over with the message already
     recorded in it. */
  const typed = borrower.sendBorrowerMessage(played, "Before I switched", { storage: storage });
  borrower.saveCase(storage, typed.viewState.state);

  const opened = lender.loadCase(storage);
  assert.equal(opened.source, "storage");
  const backlog = lender.absorbBacklog(opened.state, opened.source, storage);
  assert.equal(backlog.changed, false);
  assert.equal(backlog.state, opened.state);
  /* Once, from the handed-over state — not twice. */
  assert.equal(openOf(lender, backlog.state, "borrower-message").length, 1);

  /* And what she writes next still arrives. */
  borrower.sendBorrowerMessage(typed.viewState, "After I switched", { storage: storage });
  const live = lender.bridgeAbsorb(backlog.state, { storage: storage });
  assert.equal(plain(live.absorbed).length, 1);
  assert.equal(openOf(lender, live.state, "borrower-message").length, 2);
});

test("a case opened in a second tab absorbs the backlog it would otherwise lose", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, "Written in the other tab", { storage: storage });

  /* This tab has its own session storage, so the case is the built-in fixture and
     the bridge is the only place her message exists. */
  const opened = lender.loadCase(memoryStorage());
  assert.equal(opened.source, "fallback");
  const backlog = lender.absorbBacklog(opened.state, opened.source, storage);
  assert.equal(backlog.changed, true);
  assert.equal(openOf(lender, backlog.state, "borrower-message").length, 1);
});

/* ============================================================ restart is honest */

test("restart empties the shared thread on both sides", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, "Before the restart", { storage: storage });
  assert.equal(plain(lender.bridgeRead(storage).entries).length, 1);

  borrower.restart({ storage: storage });

  assert.deepEqual(plain(borrower.bridgeRead(storage).entries), []);
  assert.deepEqual(plain(lender.bridgeRead(storage).entries), []);

  /* Nothing from the previous run can reach the lender any more. */
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  assert.equal(absorbed.changed, false);
  assert.equal(openOf(lender, absorbed.state, "borrower-message").length, 0);
});

test("a message written after a restart still arrives", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();

  borrower.sendBorrowerMessage(played, "Old run", { storage: storage });
  const beforeRestart = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  assert.equal(plain(beforeRestart.absorbed).length, 1);

  const restarted = borrower.restart({ storage: storage });
  borrower.sendBorrowerMessage(restarted, "New run", { storage: storage });

  /* The run counter moved, so the lender's memory of the old ids cannot swallow
     the new message even though the sequence started again at 1. */
  const after = lender.bridgeAbsorb(beforeRestart.state, { storage: storage });
  const absorbed = plain(after.absorbed);
  assert.equal(absorbed.length, 1);
  assert.equal(absorbed[0].text, "New run");
  assert.equal(absorbed[0].seq, 1);
  assert.notEqual(absorbed[0].run, plain(beforeRestart.absorbed)[0].run);
  assert.notEqual(absorbed[0].id, plain(beforeRestart.absorbed)[0].id);
});

test("restart clears the case state as well as the bridge", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  borrower.saveCase(storage, played.state);
  assert.ok(storage.raw(CASE_KEY));

  const restarted = borrower.restart({ storage: storage });
  assert.deepEqual(
    plain(restarted.state),
    plain(borrower.initialViewState().state),
    "the narrative is back at the beginning"
  );
  /* Whatever the lender reads next is an opening case, not the finished one.
     A restart leaves her narrative at the beginning, and a case at the beginning
     is a case nothing has happened to — which is not a handoff, so the desk
     seeds itself from its own fixture rather than showing nine documents as
     Not uploaded on a case that reached it days ago. What matters here is that
     none of the finished run survives. */
  const loaded = lender.loadCase(storage);
  const documents = plain(loaded.state).documents;
  assert.equal(loaded.source, "fallback");
  assert.equal(loaded.reason, "pristine");
  assert.deepEqual(plain(loaded.state), plain(lender.fallbackCaseState()));
  assert.equal(documents["title-certificate"].verdict, "under-review");
  assert.equal(openOf(lender, loaded.state).length, 2);
});

test("restart survives a storage that throws", () => {
  freshBridges();
  const storage = throwingStorage();
  const restarted = borrower.restart({ storage: storage });
  assert.deepEqual(plain(restarted.state), plain(borrower.initialViewState().state));
  assert.deepEqual(plain(borrower.viewOnlyAnnouncement()), { key: "common.view-only", params: null });
});

/* ================================== restart reaches a lender tab already open */

/* "restart clears the case state as well as the bridge" (above) covers the
   case `untouched` already handled: a lender tab that reads her sessionStorage
   fresh, with nothing of its own, falls back to the fixture on its own. What
   that does not cover is a lender tab that was already open and had already
   absorbed a live conversation into its *own* sessionStorage before the
   restart — by then its copy is no longer "untouched", so `loadCase` would
   otherwise keep treating it as the live case forever. This is what
   CASE_RESET_KEY is for: a signal on the one thing every tab does share. */

test("restart reaches a lender tab that is already open, mid-conversation", () => {
  freshBridges();
  const bridge = memoryStorage();
  const lenderSession = memoryStorage();

  /* A live conversation the lender tab has already taken in and saved as
     its own — not "untouched" any more. */
  borrower.sendBorrowerMessage(borrower.runScript(), "Any news on the title?", { storage: bridge });
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: bridge });
  lender.saveCase(lenderSession, absorbed.state);
  assert.equal(openOf(lender, lender.loadCase(lenderSession).state, "borrower-message").length, 1);

  /* She restarts, from a tab of her own — the lender tab above never reads
     her sessionStorage, only the bridge they share. */
  borrower.restart({ storage: bridge });

  assert.equal(lender.pendingCaseReset(bridge, lenderSession), true);
  const result = lender.applyCaseReset(bridge, lenderSession);
  assert.equal(result.changed, true);
  /* Back to the opening documents and review queue, same as a manual
     "Reset case" — but with every document's own conversation cleared too,
     including the fixture's own seeded handoff exchange, so nothing is left
     for her testing to trip over on the next run. */
  const documents = plain(result.state).documents;
  workspace.DOCUMENT_IDS.forEach(documentId => {
    assert.deepEqual(documents[documentId].messages, [], documentId);
  });
  const withoutMessages = plain(lender.fallbackCaseState());
  workspace.DOCUMENT_IDS.forEach(documentId => {
    withoutMessages.documents[documentId].messages = [];
  });
  assert.deepEqual(plain(result.state), withoutMessages);
  assert.equal(openOf(lender, result.state, "borrower-message").length, 0);
  assert.equal(result.announcement.key, "lender.status.reset");

  /* Applying it is remembered, so the same live event does not reset the
     desk a second time and lose whatever happens on the case after. */
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), false);
});

test("a lender tab that opens after the restart still picks it up", () => {
  freshBridges();
  const bridge = memoryStorage();
  const lenderSession = memoryStorage();

  borrower.sendBorrowerMessage(borrower.runScript(), "Any news on the title?", { storage: bridge });
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: bridge });
  lender.saveCase(lenderSession, absorbed.state);

  /* The restart happens while nothing is open to hear it live. */
  borrower.restart({ storage: bridge });

  /* A fresh lender.html load — mirroring what its own init() does before the
     first paint — still finds the reset waiting on the bridge. */
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), true);
  const result = lender.applyCaseReset(bridge, lenderSession);
  const documents = plain(result.state).documents;
  workspace.DOCUMENT_IDS.forEach(documentId => {
    assert.deepEqual(documents[documentId].messages, [], documentId);
  });
});

test("two restarts in a row are each their own signal", () => {
  freshBridges();
  const bridge = memoryStorage();
  const lenderSession = memoryStorage();

  borrower.restart({ storage: bridge });
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), true);
  lender.applyCaseReset(bridge, lenderSession);
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), false);

  borrower.restart({ storage: bridge });
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), true, "the second restart is missed");
});

test("no restart has ever happened is not mistaken for one", () => {
  const bridge = memoryStorage();
  const lenderSession = memoryStorage();
  assert.equal(lender.pendingCaseReset(bridge, lenderSession), false);
  assert.equal(lender.applyCaseReset(bridge, lenderSession), null);
});

/* ========================================================= the role switches */

test("the borrower's topbar links straight into her case on the lender's desk", () => {
  const markup = borrower.renderTopbar(borrower.initialViewState());
  /* Named in the query, so the desk opens on this case's overview rather than
     the bare board — the same case whichever tab last had it open. */
  assert.ok(markup.includes('href="lender.html?case=' + borrower.CASE_ID + '"'));
  assert.ok(markup.includes(borrower.escapeHtml(t("borrower.switch-to-lender"))));
  assert.match(markup, /<a[^>]*class="demo-role-switch"/);
  assert.ok(markup.includes('aria-label="' + borrower.escapeHtml(t("borrower.switch-to-lender-aria")) + '"'));
});

test("the borrower's link round-trips: the lender opens exactly the case it names, quietly", () => {
  const markup = borrower.renderTopbar(borrower.initialViewState());
  const href = markup.match(/href="lender\.html\?case=([^"]+)"/)[1];
  const known = new Set(plain(lender.buildPortfolio(lender.FALLBACK_CASE, null)).map(loan => loan.caseId));
  const opened = lender.applyCaseQuery(lender.DEFAULT_VIEW_STATE, "?case=" + href, known);
  assert.equal(plain(opened.viewState).selectedCaseId, borrower.CASE_ID);
  assert.equal(plain(opened.viewState).activeTab, "overview");
  /* Quiet every time: repeating "now assigned to you" on every back-and-forth
     during a demo would be wrong the second time it was said. */
  assert.deepEqual(plain(opened.announcement), {
    key: "lender.status.case-opened",
    params: { case: borrower.CASE_ID }
  });
});

test("the lender's topbar links back to the borrower view", () => {
  const loans = lender.buildPortfolio(lender.FALLBACK_CASE, lender.FALLBACK_CASE.state);
  const markup = lender.renderPortfolioPage(loans, {}, lender.DEMO_NOW);
  assert.ok(markup.includes('href="borrower.html"'));
  assert.ok(markup.includes(lender.escapeHtml(t("lender.switch-to-borrower"))));
  assert.ok(markup.includes('aria-label="' + lender.escapeHtml(t("lender.switch-to-borrower-aria")) + '"'));
});

test("both switches are demo affordances, never an identity or authorization control", () => {
  /* Spec §5.1: styled as the demo affordance, and worded as a view switch. */
  for (const [name, markup] of [
    ["borrower.html", borrower.renderTopbar(borrower.initialViewState())],
    [
      "lender.html",
      lender.renderPortfolioPage(
        lender.buildPortfolio(lender.FALLBACK_CASE, lender.FALLBACK_CASE.state),
        {},
        lender.DEMO_NOW
      )
    ]
  ]) {
    const link = markup.match(/<a[^>]*class="demo-role-switch"[^>]*>[^<]*<\/a>/);
    assert.ok(link, `${name} has no role-switch link`);
    for (const forbidden of [/sign[ -]?in/i, /log[ -]?in/i, /log[ -]?out/i, /switch user/i, /as another user/i]) {
      assert.ok(!forbidden.test(link[0]), `${name} presents the switch as ${forbidden}`);
    }
  }
  /* Both pages carry the affordance's own styling hook. */
  assert.match(borrowerPage.html, /\.demo-role-switch\{/);
  assert.match(lenderPage.html, /\.demo-role-switch\{/);
});

/* ============================================================== ?case= &take=1 */

test("lender.html parses ?case= and &take=1", () => {
  assert.deepEqual(plain(lender.parseCaseQuery("?case=H-2026-08415")), {
    caseId: "H-2026-08415",
    take: false
  });
  assert.deepEqual(plain(lender.parseCaseQuery("?case=H-2026-08415&take=1")), {
    caseId: "H-2026-08415",
    take: true
  });
  /* take without a case has nothing to assign. */
  assert.deepEqual(plain(lender.parseCaseQuery("?take=1")), { caseId: null, take: true });
  for (const search of ["", "?", "?other=1", null, undefined, "?case=", "?case=%20"]) {
    assert.equal(plain(lender.parseCaseQuery(search)).caseId, null, String(search));
  }
  /* Only an explicit 1 takes the case. */
  assert.equal(plain(lender.parseCaseQuery("?case=H-2026-08415&take=0")).take, false);
  assert.equal(plain(lender.parseCaseQuery("?case=H-2026-08415&take=maybe")).take, false);
});

test("?case= opens the case and &take=1 announces the assignment", () => {
  const known = new Set(plain(lender.buildPortfolio(lender.FALLBACK_CASE, null)).map(loan => loan.caseId));
  const base = lender.DEFAULT_VIEW_STATE;

  const opened = lender.applyCaseQuery(base, "?case=H-2026-08415", known);
  assert.equal(plain(opened.viewState).selectedCaseId, "H-2026-08415");
  assert.equal(plain(opened.viewState).panelMode, "drawer");
  assert.equal(plain(opened.viewState).activeTab, "overview");
  assert.deepEqual(plain(opened.announcement), {
    key: "lender.status.case-opened",
    params: { case: "H-2026-08415" }
  });

  const taken = lender.applyCaseQuery(base, "?case=H-2026-08415&take=1", known);
  assert.equal(plain(taken.viewState).selectedCaseId, "H-2026-08415");
  assert.deepEqual(plain(taken.announcement), {
    key: "lender.status.take-case",
    params: { case: "H-2026-08415" }
  });
  assert.ok(t("lender.status.take-case", { case: "H-2026-08415" }).includes("H-2026-08415"));
});

test("a ?case= naming a case that is not in the portfolio is ignored", () => {
  const known = new Set(plain(lender.buildPortfolio(lender.FALLBACK_CASE, null)).map(loan => loan.caseId));
  for (const search of ["?case=H-9999-00000", "?case=<script>", "?take=1", ""]) {
    const result = lender.applyCaseQuery(lender.DEFAULT_VIEW_STATE, search, known);
    /* Returned by reference: nothing happened, so nothing needs re-rendering. */
    assert.equal(result.viewState, lender.DEFAULT_VIEW_STATE, search);
    assert.equal(result.announcement, null, search);
  }
});

test("a read-only fixture can be opened from ?case= too", () => {
  const known = new Set(plain(lender.buildPortfolio(lender.FALLBACK_CASE, null)).map(loan => loan.caseId));
  const result = lender.applyCaseQuery(lender.DEFAULT_VIEW_STATE, "?case=H-2026-08360&take=1", known);
  assert.equal(plain(result.viewState).selectedCaseId, "H-2026-08360");
});

/* ============================================================== the wiring */

test("each page listens for the storage event on the bridge key", () => {
  for (const { html, name } of [
    { html: borrowerPage.html, name: "borrower.html" },
    { html: lenderPage.html, name: "lender.html" }
  ]) {
    assert.match(html, /addEventListener\("storage"/, `${name} has no storage listener`);
    /* And the handler cares which key changed. */
    assert.match(
      html,
      /event\.key === MESSAGE_BRIDGE_KEY|event\.key !== MESSAGE_BRIDGE_KEY/,
      `${name} does not filter the storage event by key`
    );
    /* Absorbing is followed by a re-render on both pages. */
    assert.match(html, /bridgeAbsorb\(/, `${name} never absorbs`);
  }
});

test("each page saves the case and reports a refused save into its status region", () => {
  for (const { html, name } of [
    { html: borrowerPage.html, name: "borrower.html" },
    { html: lenderPage.html, name: "lender.html" }
  ]) {
    /* Defined, and called at least once from the page's own wiring. */
    assert.ok(
      html.split("viewOnlyAnnouncement(").length > 2,
      `${name} defines viewOnlyAnnouncement but never calls it`
    );
    assert.match(html, /saveCase\(/, `${name} never saves the case`);
    assert.match(html, /role="status"/, `${name} has no live region to announce into`);
  }
});

test("the bridge holds no clock and no randomness", () => {
  /* Ids come from the envelope's own run and sequence, never from a clock (the
     shared rule for every id in this build). */
  for (const { html, name } of [
    { html: borrowerPage.html, name: "borrower.html" },
    { html: lenderPage.html, name: "lender.html" }
  ]) {
    assert.ok(!/Math\.random/.test(html), `${name} uses Math.random`);
    assert.ok(!/Date\.now\(\)/.test(html), `${name} uses Date.now()`);
  }
});

test("the borrower page still leaks nothing internal through the bridge", () => {
  freshBridges();
  const storage = memoryStorage();
  const played = borrower.runScript();
  borrower.sendBorrowerMessage(played, "Any news?", { storage: storage });
  const absorbed = lender.bridgeAbsorb(lender.FALLBACK_CASE.state, { storage: storage });
  const item = openOf(lender, absorbed.state, "borrower-message")[0];
  lender.commitReply(absorbed.state, item.id, "We are on it.", {
    timestamp: stamp(23),
    storage: storage
  });
  const received = borrower.bridgeAbsorb(played, { storage: storage });
  const markup =
    borrower.renderThread(received.viewState) + borrower.renderPage(received.viewState);

  for (const pattern of [/officer/i, /carolina/i, /reyes/i, /\bSLA\b/i, /needs review/i, /\brouted?\b/i]) {
    assert.ok(!pattern.test(markup), `the borrower thread shows ${pattern}`);
  }
});
