# Weston mortgage demo — English portal

Two surfaces over one mortgage case, `H-2026-08415`. No build step, no dependencies, no server:
open the file in a browser.

```
borrower.html   →  start here. Javiera's side. It plays itself.
lender.html     →  Carolina's side. It waits for you.
assets/         →  copy.js (every string), weston-credit.js (every number),
                   weston-workspace.js (the state engine both pages share)
tests/          →  node --test "portal-en/tests/*.test.mjs"
DESIGN.md       →  why it is shaped this way
```

---

## The two-minute path

Walk it in this order. It is the order the demo was built for, and the order the review
walkthrough exercises.

**1 · Open `borrower.html` and set the speed to 4×.** It starts on its own. Three phases run on
the sticky rail: **Simulation** (property value, down payment, term, and the live payment, DTI and
FOGAES eligibility test), **Pre-approval** (the result, the rate and what the state guarantee
actually does), and **Documents over WhatsApp** (the nine documents arriving in a thread while the
checklist fills in beside it). Play/pause, restart and the language control are in the topbar.

**2 · Let it finish.** It ends where it should: the current title certificate carries a mortgage in
favour of another bank that was never declared, the assistant says plainly that it cannot resolve
that, and it hands the case to a specialist. Javiera is told a specialist is reviewing it and that
she does not need to do anything. **She is never shown the officer's name, the queue, or the SLA** —
that is internal, and it belongs to the lender only.

**3 · Type something into the WhatsApp composer and send it.** The composer is real. Press Enter or
the send button; the message appears in the thread and becomes an open review item on the lender's
case.

**4 · Follow `Switch to lender view`.** The board opens on twelve loans in seven columns, three
metric tiles across the top, and a `Notifications` filter in the left nav with its count. Click that
filter to see only the loans with open work — Javiera's case is one of them, with a 4px lime left
border and a `◆ 2 notifications · Document exception` chip. Colour never carries the meaning alone.

**5 · Click her card.** The workspace drawer opens over the board with five tabs. Overview is the
record — the decision, the snapshot, the documents, the activity. Everything the case is *waiting
on* is in one place, the rail on the right. Note the **Approve with conditions** button: it is
disabled, and it says why.

- **The `⚠ Notifications · 2` button, in the case header.** It pulses, because a count in a header is
  easy to walk past, and it appears only with a case open — nothing waits on a portfolio, it waits on
  a file. Press it: the rail scrolls to the panel, rings it for a beat and puts focus there. The
  number is the same number the panel shows, from the same function, so the two cannot disagree.
  Settle everything and the button is gone, not greyed out.
- **`What the file says`**, the top of the rail. *Needs review* first, then *In good order*, and
  every line is a count against the same nine documents so nothing has to be worked out: *9 of 9
  uploaded* over the card, then *7 of 9 accepted* against *2 of 9 waiting on review*, the field
  checks matched, payment-to-income against its cap, the guarantee. Override a
  verdict and the card recomputes in place.

- **`Notifications`**, directly under the card that counts it — the one inventory of open work.
  Exceptions first, **worst document first** (the tax folder was sent back, so it is above the title
  certificate that is still under review), each named with what actually went wrong — the folio and
  the bank; the unreadable RUT — not "a check failed", and answerable where it sits: reply, or mark
  resolved, without going anywhere. The **condition** each document carries is one indented line
  inside its row — *"Condition C1 · Simultaneous release of the mortgage…"* — not a row of its own,
  because C1 *is* the title certificate and C2 *is* the tax folder. Two documents, two rows, and the
  count says **2**.

- **`Deal assistant`**, under the panel. It opens with what is in the way — *"2 items are
  open, and nothing can be approved until they are settled…"* — and the controls that move it. Ask
  it about the title certificate, the tax folder, what is holding approval, affordability, the
  guarantee, the documents or the borrower. **It is rule-based, not a model**: every answer is
  written copy with this case's numbers in it, so the same question always gives the same answer and
  the demo runs the same way twice. It answers and routes; it never acts on its own.
  Under the brief, a numbered **Next** list. In the composer, **`✦ Trigger agent`** — four agents,
  each of which runs a transition the case really has, so what the assistant says it did is the same
  event the audit trail records: *Follow up with the borrower* (sends the reminder; her upload
  arrives and the tax folder clears), *Ask the developer to confirm the release* (drafts the query),
  *Escalate to the Head of Risk* (checks your delegated authority), and *Scan the case for what is
  outstanding*, which reads only. On a sample case the three that act are shown disabled with the
  reason; the scan still runs.

**`UF | CLP` in the topbar and in the case header.** Chilean mortgages are written in UF and paid in
pesos. Flip it and every amount on the page — board metrics, cards, chips, the snapshot, the
analysis card — reprints in the other unit; the choice survives opening and closing a case. The Risk
tab keeps showing both side by side, which is its job.

The WhatsApp thread is **not** on this side. It is the borrower's surface; the desk reads her words
under the document she sent them about, and quoted in the review item they raised. Writing *to* her
is still here — `Send reply & resolve` on an item in the Notifications panel, or sending a document
back from its own record — and both reach her phone over the bridge.

**6 · Documents tab → open `Current title certificate`.** This is the point of the whole demo. The
record opens on **the page as received** — a facsimile of page 1, the same one the borrower portal
shows her, with the encumbrance row ringed — so the desk sees the document and not only the findings
on it. Below it, the field-by-field comparison — what was **stated** in the application against what
was **found in the document** — with the mismatched row flagged and the encumbrance cited to
**Folio 1,842 No.1,190 of 2024**. The records are ordered **worst first** — the tax folder that was
sent back, then this one — so the two that need something are at the top rather than fifth and
ninth of nine.

At the foot of each record, under the conversation, is the handoff: *"This document has open work.
Reply to her, or mark it resolved, in Notifications."* and **`Answer this in Notifications`**. Press
it — the rail opens if it was collapsed, scrolls to *this document's* row, rings it, and puts the
cursor in the reply box. The record is where you read the evidence; the panel is where every gesture
that changes the case lives, and the handoff is the sign that says so. A document with nothing
outstanding says so quietly and offers no button.

Below the nine documents, the second block lists the seven checks the system ran *at the source*
(Civil Registry, SII, Real Estate Registrar, MINVU, FOGAES). Worth saying out loud: for those seven,
the borrower was never asked for a certificate.

**7 · Back to Overview → `Request confirmation from the developer`.** The drafted email appears so
it can be read before it goes. **`Send query`.** A few seconds later the developer's reply arrives
on its own with a draft release attached; document 9 closes **accepted with a condition** — not
simply green — and condition `c1` clears.

**8 · `Remind the borrower about the document`.** A few seconds later Javiera uploads the missing
page 1 from her portal, the tax folder is accepted, the case reaches 9 of 9, and `c2` clears.

**9 · Risk tab.** Payment-to-income is 24.7% against a 30% cap. The same bar **stressed at +200 bp**
rises to **30.7%** and is declared over cap in words, not hidden. Below it: policy point by point,
and the guaranteed tranche — UF 350, 11.1% of the loan — explained as the slice above the standard
80% LTV. The state guarantee makes the loan financeable; it does not make it cheaper.

**10 · Back to Overview → `Approve with conditions` → `Sign approval`.** Only now is the approve
button enabled, because both gating conditions are genuinely cleared. Signing produces the decision
record: case id, officer, authority (UF 4,000 with FOGAES, against a UF 3,150 loan), and timestamp.
The Audit tab has the whole trail, newest first, with actor and source.

**11 · If both tabs are still open, answer her.** Reply to the borrower-message review item with
`Send reply & resolve`; the reply lands in her WhatsApp thread in the other tab.

`Reset case` in the action bar returns everything to the start.

---

## What is real and what is scripted

**Real** — it is computed or driven by your click, and behaves the same whatever order you take it in:

- Every figure. `assets/weston-credit.js` owns the constants and the payment function; neither
  page hardcodes a derived number. Payment, DTI, the stressed DTI, the guaranteed tranche and the
  metric tiles are all arithmetic.
- The state machine. Nine documents, five verdicts, four review reasons, two conditions, six
  stages. The stage is *derived* from workflow milestones — it is never set by hand and nothing is
  draggable.
- The approval gate. `readyToApprove(state)` reads the two conditions. **Skip the developer query
  and you cannot approve.** It is not a timer.
- Review resolution, one item at a time, recording how it was resolved (`manual` or `reply`) and
  when.
- The WhatsApp composer, and the cross-tab bridge in both directions.
- The board: search, the three selects, the seven columns, the filters, the counts.

**Scripted** — fixed content that plays back the same way every time:

- The borrower narrative. One `SCRIPT` array of steps interpreted by one loop, so the story can be
  edited without touching the engine. It is a demonstration of what would happen, not a live session.
- Loans 2–12 on the board. They exist so the seven stages and the four review reasons are all
  populated. Their workspace actions are disabled and say `Read-only demo loan`.
- The developer's reply and the borrower's re-upload — see below.
- The seven source checks and their results.
- No document is actually read. The comparison on document 9 is written down, not parsed.

## The two events that arrive on their own

Everything on the lender side is a real click except two things, and the reason is the point:

| Carolina does | Then this arrives, a few seconds later |
|---|---|
| `Send query` to the developer | Inmobiliaria Aconcagua replies with a draft release. Document 9 closes accepted-with-condition; `c1` clears. |
| `Remind the borrower about the document` | Javiera uploads page 1 from her portal. Document 5 is accepted; 9 of 9; `c2` clears. |

**Carolina cannot click on behalf of the developer or on behalf of Javiera.** If she could, the demo
would be showing an officer approving her own evidence. So the two open items close from two
different sides — one by a third party, one by the borrower — and that asymmetry is what the screen
is there to show.

Both arrivals go through one injectable `later(ms, fn)` seam, so the Node suite drives them
synchronously and never waits on real time. In the browser the delay is 4 seconds.

`Escalate to Head of Risk` deliberately does nothing except report that the case is within her
authority. That is the correct answer, and a control that lies about doing something would be worse
than one that says so.

---

## Running the tests

From the repository root. **The quoted glob is required** — `node --test portal-en/tests` fails on
this machine's Node build:

```
node --test "portal-en/tests/*.test.mjs"
```

Zero dependencies, no browser, no network. The pages' pure functions are exercised in `node:vm`.

## Notes for a presenter

- **Fonts.** The pages ask Google Fonts for Archivo, Public Sans and IBM Plex Mono and fall back to
  system faces. With no network they still lay out correctly; they just look a little different.
- **Storage.** The case lives in `sessionStorage`; the cross-tab message bridge is `localStorage`.
  If storage is refused (private mode, quota), each surface keeps working in memory and says once
  that it is view-only. `lender.html` opens on a complete built-in fixture when storage is empty, so
  it demos on its own.
- **Deep links.** `lender.html?case=H-2026-08415` opens the case workspace directly; `&take=1` also
  announces the assignment. The drawer's own state is in the hash:
  `#case=H-2026-08415&mode=full&tab=risk`.
- **Language.** English only. Every user-visible string resolves through `WestonCopy.t()`, so
  Spanish is added by filling one object in `assets/copy.js` — never by touching markup or logic.
  The language control in the borrower topbar is present and functional with one locale registered.

The Spanish demo at the repository root (`solicitante.html`, `ejecutivo.html`, `sistema.css`,
`DISENO.md`, `README.md`) is untouched. This portal replaces nothing.

> **Prototype demo.** Figures, rates, documents and decisions are illustrative and do not constitute
> a credit offer. There is no decision engine behind this, no document is really read, and nothing
> leaves the browser. Personal details are demo data.
