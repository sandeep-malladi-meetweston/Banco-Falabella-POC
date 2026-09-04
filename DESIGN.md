# Two surfaces, one case

Why `borrower.html` and `lender.html` are shaped the way they are: what they share, what they
deliberately do not, and where the Silver Hill structure was taken as it stood and where it was left
behind.

The Spanish demo at the repository root (`solicitante.html`, `ejecutivo.html`, `sistema.css`,
`DISENO.md`) is the ancestor and is untouched. This is not a translation of it. It is the same case,
rebuilt against a different engineering standard.

---

## 1. The two inheritances

This portal has two parents, and the seam between them is the whole design.

**The borrower page inherits from Weston.** The autoplaying WhatsApp narrative, the
simulator, the pre-approval, the nine documents, the phase rail, the demo controls and the
second-person voice were Weston's and stay Weston's. Nothing about that story needed to change; it was
already the best thing in the Spanish demo, and it already stops in exactly the right place.

**The lender page inherits its information architecture from Silver Hill.** Seven-stage board, three
metric tiles, a cross-stage `Notifications` filter, a search-and-sort toolbar, and a right-side
workspace drawer with tabs, a focus trap and hash-addressable state. Weston's colour and
logo sit on Silver Hill's layout, density and interaction model.

The reason for splitting the inheritance that way is that the two pages answer different questions.
The Spanish `ejecutivo.html` was a good single-case desk, but a mortgage officer does not open a
single case — she opens a queue and picks. Silver Hill had already solved the queue. Rebuilding
around it cost the three-column desk and bought the thing the demo was missing: **Javiera's case in
the context of eleven others**, so that "this one needs me" is something you can see rather than
something you are told.

## 2. What the two surfaces share

Literally the same, and asserted by tests:

- **`assets/copy.js`.** Every user-visible string on both pages, flat dotted keys namespaced by
  surface. Neither page contains an English literal outside it. Adding Spanish is filling one object.
- **`assets/weston-credit.js`.** Every constant and the payment function. Neither page hardcodes
  a derived figure. This is the one defect the Spanish `DISENO.md` §2 warns about — two files each
  holding their own copy of `RATE_FOG` — and it is the one that must not come back. The borrower's
  simulator and the lender's Risk tab compute the same 24.7% from the same call.
- **`assets/weston-workspace.js`.** The state engine: nine documents, five verdicts, four review
  reasons, two conditions, seven derived stages, and a pure transition per action. DOM-free, so the
  Node suite exercises it directly.
- **The design tokens.** Identical `:root` — the same brand greens off the official SVG, the same
  Silver Hill neutrals, the same type scale, radii and shadows. Copied into both files rather than
  extracted to a shared stylesheet, because the rule for this build is one HTML file per surface.
- **The review drawer's grammar.** Both pages open a document record showing what was compared and
  what was found; the borrower sees it because she is curious, the lender because she has to decide.
- **The accessibility contract.** Skip link, `role="status"` live region, real controls with
  accessible names, dialog semantics with a focus trap, the same 3px brand focus outline, the same
  900/620px breakpoints, the same reduced-motion block.

## 3. What they deliberately do not share

| | Borrower | Lender |
|---|---|---|
| Who drives | it plays itself | every step is a real click |
| Density | airy, one thing at a time | tabular, twelve loans at once |
| Voice | second person, explains why | third person, cites the source |
| Progress | "7 of 9 documents" | "Notifications · 3", SLA, deed date |
| Chrome | play/pause, speed, restart, language | search, filters, sort |
| What it hides | officer, queue, SLA, authority | nothing; it is the internal view |

**The borrower page autoplays and the lender page does not.** This is the deepest difference and it
is deliberate. The borrower page is a demonstration of what *would* happen — nobody drives it, and
adding a play button to the lender page would ruin the only interesting question that page asks,
which is *what would Carolina do?* A screen that answers itself cannot pose that question. So the
lender page opens in the state the case was handed over in and waits.

**The internal routing alert belongs to the lender only.** The Spanish demo ends the borrower's
story on an internal card naming the officer, the desk and a 4-hour SLA. That card is good
television and wrong product: Javiera is not staff. Here she is told a specialist is reviewing it and
that she does not need to do anything, and the officer, the queue and the SLA appear on the other
surface where they belong.

**The lender page has no autoplay, and the borrower page has no queue.** Neither is a subset of the
other. They are the same truth said for two different jobs.

## 4. Where Silver Hill was adopted as it stood

- **The seven-stage board, derived and not draggable.** `deriveStage(state)` reads workflow milestones
  in a fixed precedence and returns a stage. Nothing sets a stage by hand and nothing is `draggable`.
  A board you can drag cards on is a board that lies about where the truth lives.
- **`Notifications` as a cross-stage filter, never a stage.** Review work is orthogonal to progress:
  a loan in `underwriting` with an open exception is still in `underwriting`. Making it a column of
  its own would have been easier to build and wrong. The one thing underwriting *does* carry on the
  card is the title/inspection flag — a fact about what the stage is waiting on, not a stage.
- **The workspace drawer.** `min(680px, 100%)`, expandable to full screen, over a backdrop, with
  `role="dialog"`, `aria-modal`, body scroll lock, focus trap, `Escape`, focus restored to the
  invoking card, and a real `tablist` with arrow/Home/End. Taken whole.
- **Hash-addressable state.** `#case=H-2026-08415&mode=full&tab=risk`. An unknown case id resets to a
  plain board before first paint rather than erroring.
- **The empty-column placeholder.** A stage with nothing in it keeps a dashed box. Collapsing empty
  columns makes the board's shape change under you as work moves.
- **The structural neutrals, verbatim.** Only the accent changed.

## 5. Where it departed, and why

**One document record, not one row.** Silver Hill's document list is a table row per file. Here each
of the nine is a `<details>` carrying a verdict, the current filename, the source channel, the review
checks, its own conversation and its upload history. The case turns on what is *inside* document 9 —
a comparison of what was stated against what the document says, and a folio number — and that does
not fit in a row.

**A fifth verdict: `accepted-with-condition`.** The reference has accepted and rejected. Document 9
does not end green and it does not end red; it ends accepted *because* the developer will release
the mortgage in the same deed. Collapsing that into "accepted" would delete the reason the case
needed a human. It is load-bearing, so it is a verdict.

**A Risk tab with no equivalent upstream.** Silver Hill's workspace does not have to argue that a
loan holds. This one does, so the tab states payment-to-income against the cap, the same bar
stressed at +200 bp, the policy point by point, and the guaranteed tranche. The stressed figure is
**30.7%, over the 30% cap, and the page says so in words and in red.** Hiding it would have been
trivial and would have made the whole screen worthless: a risk view that only shows you passing
numbers is decoration.

**The two arrivals.** Silver Hill's lender acts and the world responds instantly. Here two events
land a few seconds after the action that provoked them, through one injectable `later(ms, fn)` seam.
The reason is not realism for its own sake — it is that **Carolina cannot click on behalf of the
developer or on behalf of Javiera**, and the two open items therefore close from two different
sides, one by a third party and one by the borrower. Building it any other way would have shown an
officer approving her own evidence.

**An approval gate derived from state, not from progress.** `readyToApprove(state)` reads `c1` and
`c2`. Skip the developer query and the approve button stays disabled and says why. It is not a step
counter and not a timer; there is no hidden "step 3 of 9".

**A second block under the nine documents: the seven checks run at the source.** Civil Registry,
SII, Real Estate Registrar, MINVU, FOGAES. It is not a Silver Hill pattern and it is not strictly
needed to decide the case. It is there to make one point that no other part of the screen makes: for
those seven, the borrower was never asked for a certificate.

**Deterministic ids, explicit timestamps.** Every id comes from `nextSequence`; no `Date.now()` or
`Math.random()` appears inside a state transition, and every transition takes its timestamp as an
argument. That is not a design choice about the product — it is what lets the whole engine be tested
without a browser and without waiting on real time.

**Attention is never colour alone.** Silver Hill's lime left border stays, but it never appears
without a `Needs review` reason chip carrying a glyph and words next to it. A 4px stripe is not a
message.

**The borrower page looks like the Spanish demo again, on purpose.** The first English build spent
Silver Hill's flat, quiet chrome on both surfaces. On the lender board that is right — it is a work
queue. On the borrower page it was wrong: this page is a *simulation being played*, and a page that
plays itself has to look alive. So the borrower surface takes `sistema.css`'s shape back — dark green
topbar with pill controls, 14px radius, the green-cast shadow, a `Playing demo` pulse in the phase
rail — and the documents phase is again a state tile, a document, why it is wanted, and the verdict
in words, as in `solicitante.html`. What it does not take back is the Spanish page's engineering:
every string still comes from `copy.js`, every icon is inline SVG rather than an emoji, and nothing
carries an inline handler.

**Motion is diffed, not declared.** The page repaints itself whole on every beat — that is what keeps
the render functions pure and testable. A CSS entry animation on `.bubble` would therefore replay on
every bubble at every beat and the thread would strobe. So the paint keeps a small `painted` record —
how many bubbles it drew, which verdict each row held, where the progress bar stood, which phase was
open — and animates only the difference: the new messages slide in, the changed row flashes and is
scrolled into its frame, the bar eases from its old width, the opened phase fades up. Everything
unchanged is painted already at rest. The typing indicator lives in the same layer: it is a fact
about the page, not about the narrative, so it is a page variable and never enters the view state.

**Scroll survives the repaint.** A rebuilt scroller starts at the top, so the first version of the
above sent the WhatsApp thread back to its first message and glided it all the way down again on
every single upload. The paint now reads every scroller's position before the swap and puts it back
before the browser gets a frame — so the only movement left is the height of what just arrived.
Whether the thread follows the conversation down is tracked as a **gesture**, not as a measurement:
at 4× a beat lands while the previous glide is still in the air, and a position check mistakes that
for "she has scrolled back". Wheel or touch inside the thread decides it; scroll back and the
conversation stops chasing you, return to the newest message and it resumes.

**The simulator is a form, not a transcript of one.** It used to print Javiera's answers into a
read-only grid, which made the first phase of the demo a screenshot: nothing to touch, and no way to
see that the bank computes as you type. It is now the Spanish demo's form for real — choice tiles
with icons for property type, condition and term, live fields for value, down payment, RUT, date of
birth and income — beside a summary rail that recomputes on every keystroke: loan amount, payment,
the affordability bar against the 30% cap (red the moment the payment goes over it), and the FOGAES
panel, which only says *Qualifies* when every source check is answered **and** the payment fits.
A figure she has not typed is a dash, never the reference case's answer. All of it came from copy
keys that already existed — `copy.js` had been written for the whole form and only half of it was
ever rendered.

**`Use demo data` fills the form; it does not paste it.** Pasting nine answers in at once would hide
the only thing the first phase has to show — that each answer is checked at the source *as it is
given*. So the button runs a small script of its own through the same `later` seam the narrative
uses: scroll to the question, press the tile, type the value a character at a time, watch the source
checks tick and the affordability bar fill as they land, then press `See my result` and hand over to
the story at the beat that opens the conversation (the nine checks are already answered, so those
beats are skipped rather than replayed). The speed control governs it, Pause stops the hand where it
stands and Play finishes what was left, and touching the form yourself takes it back from the demo.
One consequence worth stating: a half-typed income is not an income, so the affordability panel says
nothing until the figure is plausible rather than reporting several million percent against the
first digit.

**A bell, and one place for what needs her.** The specialist notice used to be a banner over the
conversation, which meant it existed only on the phase it happened on and pushed the thread down
while it was there. It is a notification now: a bell in the topbar with an unread count, and a tray
listing what the case is waiting on — the escalated title certificate and the tax folder's missing
page — each naming its document, stamped with the narrative's clock. They are **derived from the
state, not queued**: a notification is a fact about the case, so nothing has to be pushed for one to
appear, and opening the tray is what marks them read. The page itself no longer repeats any of it.

**The verification is the point of phase one, so it is given time.** The nine source checks tick one
at a time, about two thirds of a second apart, and `See my result` stays dark until the last one
answers — the button is the *end* of the verification, not the start of it. Deriving the checks from
the form is kept for a page nobody is driving: once the demo is running, they are the run's to tick,
because a form that answers all nine the instant the last digit is typed shows none of the thing
being demonstrated. Pre-approval then holds for five seconds before the conversation opens.

**Monthly saving is the rate's, not the loan's.** The pre-approval page used to subtract the 80%-LTV
payment from the 90%-LTV one and call the difference a saving, which made it *negative*: the
guaranteed loan costs more a month precisely because it lends more. The saving from the subsidy is
the same loan priced at the standard rate; the saving from the guarantee is the smaller down
payment. They are two different rows and they are now computed two different ways.

**Nothing plays until it is asked to.** The page used to start the narrative on load, which meant
the demo was always half-finished by the time anyone looked at it, and the form could not be tried
at all. It now opens idle: the rail says *Ready*, and one topbar button — **Use demo data** — fills
the form with this case's answers and plays the story from the top. Pressing Play on an unfilled
page does the same thing first, because a story that quoted figures nobody typed would be lying.
`See my result` prices *her* numbers and moves to the pre-approval page; the narrative's own
sentences interpolate the same `figures(viewState)`, so the demo run and a hand-typed run are the
same code path.

**The case moved into the rail.** Application id, property and status were a masthead over the
documents phase, costing a screenful of height to say three things that never change. They sit at
the right-hand end of the phase rail now, next to the live indicator, and drop out one at a time as
the window narrows.

**The activity feed left the screen; the speed is a select, not three buttons.** The feed hung off
the bottom of the checklist, then became its own card in a third column. Neither placement fixed
what was actually wrong with it: on the documents phase it restated, in the past tense and in a
third place, what the thread had just said in her own conversation and what the checklist was
already showing as a verdict — three columns to say one thing three times. The card is gone and the
phase is two columns, thread and checklist, at every width. `viewState.feed` stays: it is the
narrative's own record of what happened and the model tests read it, it simply no longer has a
panel. And the three speed buttons were three controls expressing one choice, so they are one
labelled `<select>` in the bar.

**The desk gets a bell, and it is per case.** The sample-case notice used to be a dashed card at the
top of the workspace panel, sitting between the officer and the record she opened the case to read —
a permanent interruption to say one thing that never changes. It is gone. What a case is waiting on
now lives in a bell in the *case header*, mirroring the borrower's, and it is derived from state the
same way hers is: nothing is pushed, nothing is stored, and resolving an item removes its line
without anyone clearing it. The bell is deliberately **not** on the board — nothing waits on a
portfolio, it waits on a file — so there is no global tray and no global count. Each line names the
document before it says what is wrong, spells out the actual finding (the folio and the bank on the
title certificate; the unreadable RUT on the tax folder) rather than "a check failed", and ends in
one button that opens that document unfolded, scrolled to and focused, with the comparison and the
**Officer decision** override under it.

**Every case reports its own work, fixture or live.** The bell's first version put one line on a
sample case — *this case is a sample* — which is the demo talking about itself: it tells an officer
nothing about a file, and it is the one notification on this surface that could never appear in
production. The fixtures carry real open items, so the bell reads theirs the same way it reads
Javiera's, and a fixture with nothing open says exactly that. Two things are withheld from a
fixture, because both would be inventing evidence: the *specific* finding (the folio, the unreadable
RUT — Javiera's, not theirs, so their exception falls back to the generic sentence) and the promise
that the verdict can be overridden, which is made only where the control exists. That a case is
read-only is still said twice, where it bites — in the header, and on the message box it disables.

**"What the file says" is a card, not a reading exercise.** Whether to worry about an application
was previously answerable only by crossing four tabs. The right-hand rail now carries a summary
card: *Needs review* first, then *In good order*, both read out of the case — documents accepted,
documents still being looked at, field checks matched, payment-to-income against its cap, the
guarantee, the condition gate. A fixture reports the part it genuinely knows — its documents, its
checks, its open work — and stays silent on the arithmetic it has no application for and on the
condition gate, which belongs to the live case's narrative.

**The card counts; the queue names.** Both halves are counted against the same nine, so the file
adds up on sight rather than by subtraction: *9 of 9 uploaded* above the card, then *7 of 9
accepted* on one side and *2 of 9 waiting on review* on the other. It used to say "8 of 9 settled"
over "7 documents accepted" and leave the officer to work out both what *settled* meant and how many
had even been sent. And it used to repeat every open item as a clickable destination — directly
above the queue that already carried those same items, with their reasons and their reply boxes.
The items went back to the queue and the card kept the arithmetic; the assistant's brief and its
next steps stopped enumerating them too, so the rail states the same two exceptions once instead of
three times. *Needs review* is amber rather than red, and its glyph is a bullet rather than a cross:
nothing under that heading has failed, it is work that has not been done yet, and a column of red
crosses read as an accusation the officer had to talk herself out of.

**The work has one home, and it is the rail.** *Needs review* was the top section of the Overview
tab and, item by item, a block of the card in the rail — so the officer met the same two exceptions
twice before reaching anything she had opened the Overview to read. The queue now sits in the rail
under the card that counts it and above the assistant that advises on it, and reads top to bottom as
one thought: how the file stands, what is waiting, what to do about it. Overview is the record —
decision, snapshot, documents, conditions, activity. Nothing about the items themselves changed:
each is still answerable where it sits, and in a 372px rail the reply box takes the full width with
its two resolutions beneath it rather than three cramped columns.

**A card that cannot be answered is an accusation.** The first version of it read three things that
no amount of work could change. *Needs review* counted a condition — order the appraisal — that was
settled **on** approval, so the gate was reported shut by the one condition only approving could
open. It was first narrowed to the conditions that actually gated; then the appraisal was dropped
from the case altogether (below), which removed the distinction at its source and left one set of
conditions that all gate. The encumbrance field check was frozen
at *mismatch* for as long as the certificate existed, so it survived the officer's own override and
went on counting a field she had already decided; it now takes its status from the verdict —
mismatch while unsettled, *note* once carried under the release condition, verified once accepted
outright — and keeps its stated-beside-found comparison either way, because the registrar found
what it found. And a condition was cleared by whichever *route* happened to settle its document, so
the developer's reply and the borrower's re-upload moved the file and the officer's identical
decision did not. One rule now, in `settleConditionsFor`: a condition is exactly as settled as the
document behind it, read in both directions — accepting the certificate by hand clears c1 as the
developer's answer would, and sending the tax folder back re-opens c2 rather than leaving a green
condition standing over a document the desk has just rejected.

**One inventory of open work, and one pointer to it.** The drawer told the officer what was waiting
in four places at once: a `Needs review` chip in the case header, a bell whose tray listed every
item in full with its finding and an `Open the document` button, the analysis card's own list of the
same items, and the queue itself. She had to check all four to be sure she had seen everything,
which is the opposite of what any of them were for — and they could disagree, which one build of
them did: the header counted the conditions that gated, the panel counted every open one, and 4 sat over
5. What is left is a count on the card, one panel that carries the work, and — in the header, where
the bell was — a button that says how much is waiting and takes you to it. The chip is gone (the
alert is on the same line and, unlike a chip, goes somewhere; the chip on the *board* card stays,
because out there a case is a tile among thirty with no header to put a button in), the tray is gone
(the listing you cannot reply in is the one to lose), and both counts come from `needsReviewCount`,
so they cannot drift apart again. There is no unread count and nothing to mark as seen: the work is
either open or it is not, and *seen* was a third state that meant nothing to the file.

**A condition is a line inside its document's row, not a row of its own.** Conditions had their own
section on the Overview tab, which meant "what is holding this case" was answered half in the rail
and half a scroll away, the two halves never on screen together. Moving them into the panel fixed
that and created a worse problem: C1 *is* the title certificate and C2 *is* the tax folder — the
same two documents the exceptions are about — so the panel listed each document twice, its name
twice, its way in twice, and reported **4** for two things to deal with. The condition is not a
second piece of work; it is a term attached to the first. It is now one indented line under the
finding it belongs to, and the count counts rows: **2**, which is how many things the officer has to
pick up. It still earns its line, because it says what the finding does not — that this document is
gating the approval, and on what terms. On the certificate the two are plainly different: the
finding is a mortgage at Folio 1,842, the condition is its release in the same deed.

A condition whose document has no open exception left — settled by hand while the document stayed
unaccepted — still gets a row of its own, because a condition nobody can see is one that surprises
somebody at signing. Cleared conditions are in neither place: the panel is what needs the desk, and
a cleared condition needs nobody. It is in the audit trail with the moment it cleared, and on the
approval it is granted under.

**A record with no controls needs to say where the controls went.** Moving every gesture into the
rail left the document record with nothing under the conversation — no reply, no resolve, no
override, and no explanation — which does not read as *work lives elsewhere*, it reads as a dead
end. The record now ends in a handoff: one sentence saying what is outstanding on this document, and
one button that goes to the row carrying it. Not a second set of controls, which is the duplication
the rail exists to remove — a signpost. It comes in three states, and the third is the one that
matters: *open work* → **Answer this in Needs review**; *a condition still standing* → **See the
condition in Needs review**; *nothing outstanding* → a quiet grey line and no button, because a
button that lands on nothing is worse than no button.

The jump lands on **that document's row**, not the top of the panel — arriving from the tax folder
and being dropped at the head of a list you then have to search is not an answer to "where do I
reply to this?" — and focus goes to the reply box inside it, so the next keystroke is the reply. The
rail opens first if it is collapsed. Rows carry `data-review-document` for exactly this, and the
header alert, the collapsed launcher's badge and the panel heading all read `needsReviewCount`, so
the three places that show a number cannot show different ones.

**Officer decision had the same dead end and no signpost of its own.** *Blocked* said how many
conditions were open and named none of them, so knowing what the panel meant required leaving it to
go find out — the one surface built to answer "should I be worried?" sent the officer looking
somewhere else for the answer to her own next question. The fix is the document record's, not a new
one: a line naming where the answer lives, and a button that goes there, using the same
`data-workspace-action="needs-review"` jump the header alert and every document's handoff already
share. It carries no document of its own, so it lands on the panel rather than a row — right, since
more than one condition can be open at once and the panel is what all of them share. The conditions
still are not repeated here; this is the address, not a second copy of the letter.

**The same repetition, chased out of the card and the Next list.** With each condition tracking one
document, *"2 of 9 documents waiting on review"* over *"2 conditions still to clear"* is one fact
wearing a second hat, and *"Settle the 2 items"* over *"Clear the 2 conditions"* is one instruction
written twice — the second of which cannot be followed on its own. Both condition lines now appear
only when they say something the line above them does not: when conditions stand and the documents
are no longer flagged. `gate-open` is unconditional, because a gate that has opened is news no
document count can give.

**And there are two conditions, not three.** The third was *order the appraisal*, which is settled
on approval and so could never be cleared before it: a permanently open row that no work could
close, explaining itself at the bottom of every list it appeared in. A standing instruction is not
a condition the desk can act on. Dropping it took the count of open work down by one that was never
true, collapsed `gatingConditionsOf` back into `openConditionsOf` — every condition gates now, so
one function answers it everywhere — and removed the two dead branches in the condition row that
handled a condition with no document behind it. What it was there to say, that the appraisal covers
the stressed ratio, is said on the Risk tab where the stressed ratio is.

**Worst first, everywhere a document is listed.** The two documents this case turns on were the
fifth and the ninth of nine, so the Documents tab opened on six accepted records and the officer
scrolled past all of them to reach the work. `documentsByAttention` orders by verdict — sent back,
then under review, then not yet arrived, then the settled ones in checklist order — and the queue
uses the same rank, so an exception on a rejected document sorts above one on a document still being
read. The checklist position is the tie-break, so two accepted documents keep the order the
checklist asks for them in.

**The alert pulses, within the rules.** A count in a header is easy to walk past, so the button
glows on a slow two-second cycle — WCAG 2.3.1 rules out anything above three flashes a second — and
`prefers-reduced-motion` drops it to a static ring carrying the same meaning without the movement.
Pressing it scrolls the rail, rings the panel for a beat so the eye finishes the journey, and moves
focus there: a jump a keyboard user cannot follow is not a jump. It changes nothing about the case,
so there is no re-render and no state written — this is the one control here that only moves the
view. And it is absent, not disabled, when the case is clear: a button reading "nothing is waiting"
is a control that does nothing.

**Language and unit are one cluster, not two pills.** They are the same control twice — two states,
pick one — and rendering them as two separate bordered groups put four buttons and two boxes in a
header that also carries a bell, an expand and a close: a row of controls to work out rather than
two settings. One border around both with a hairline between them (`renderControlCluster`), and the
semantics are untouched — each is still a labelled group of two `aria-pressed` buttons, so the state
stays audible as well as visible. The peso option says `CLP` rather than a bare `$`, which beside
`UF` reads as the other unit instead of as a button that might do something to the money.

**The queue is a list, and each item says its reason once.** A review item used to be a card the
height of a screen: a heading reading *Document exception*, then — in the space where the reason
belonged — `item.summary`, which resolves to the item's own type and so printed *Document exception*
again. Under that, a labelled three-row textarea and a button row. Two open items were two screens,
and the second was found by scrolling past the first. They are now rows of one bordered list, ruled
off from each other: index, reason, document and date on one line; what actually went wrong on the
next; the reply field and its two resolutions on the third. Two items went from ~560px to 257px, so
the queue, the message box and the snapshot share one screen. The sentence under the heading comes
from `reviewItemDetail`, which the bell also calls — one source, so the tray and the queue cannot
describe the same item two different ways. Her own words still displace it where there are any: a
quote is the reason. And the caption above the list stopped repeating the count the heading beside
it already carries, and says how to read the list instead.

**Both rails stay put, but only one of them needed fixing.** The workspace rail never scrolled away:
the tab panel is the scroll container inside a fixed-height flex body, so the rail is a sibling that
cannot move — measured at 201px before and after scrolling the Application tab to its end. Adding
`position:sticky` there would have been cargo cult. The board's left nav *did* scroll away, because
there the window is the scroll container; it is pinned under the topbar now, at a fixed
`100vh - 64px` so its white column still reaches the floor. Pinning it exposed that the topbar was
`rgba(255,255,255,.97)` and had been ghosting scrolled content through itself all along — opaque
now. Below 900px the rail stacks under the panel, where it was claiming 541 of 699 available pixels
and leaving the tab a 158px sliver; it is capped at 46% now, so the panel gets 377px and the
assistant keeps its composer pinned rather than scrolling it away.

**A deal assistant that reads the case, and says that is all it does.** Under the analysis card, a
panel that answers questions about the open case. It is deliberately **not** a language model and
does not dress as one: every answer is a written sentence in `copy.js` with this case's own numbers
interpolated into it, selected by what the question is about and by what the state says about that
thing. Ask the same question twice and you get the same answer — which is what makes the demo
repeatable, and the only basis on which an underwriting desk could trust the panel at all. The
subtitle says *Answers from this case only*, on the surface, where someone deciding whether to
believe it will read it.

It opens with a standing brief rather than an empty box, because the first question is always the
same one and the case already knows the answer: what is open, what holds approval, what is left to
sign. And it answers; it never acts. Where an answer has a next step, it offers the control that
already exists elsewhere on the case — *Open the tax folder*, *Draft the query to the developer*,
*Approve with conditions* — and routes to it. Nothing here is a second implementation of an action,
so there is no second place for the audit trail to be wrong. On a fixture it says it has no
application behind it rather than producing arithmetic it does not have, and on a question it has no
answer for it says which subjects it does cover instead of guessing.

**Spanish, on the seam the copy layer was built for.** `copy.js` has always said that adding Spanish
means appending `"es"` to `LOCALES`, adding `es-CL` to `NUMBER_LOCALE`, and adding a `COPY.es` object
with the same keys — and that "nothing in borrower.html or lender.html changes". That claim held for
the strings; it did not hold for the *switch*, because both pages resolved copy against
`DEFAULT_LOCALE` rather than against anything switchable. So the active locale now lives in the copy
layer itself, with `locale()` and `setLocale()`, and `t(key)` with no locale argument means "whatever
is switched on" rather than "English". `weston-credit.js` already read `NUMBER_LOCALE` through
`numberLocale()`; pointing that one line at `copy.locale()` means every `formatUF`, `formatCLP` and
`formatDate` call already written in both pages follows the switch with no edit at the call site.
That is the whole point of having had one arithmetic module: **UF 3,150** becomes **UF 3.150** and
*Sep 18, 2026* becomes *18 sept 2026* for free. A Spanish page printing English thousands separators
would have been worse than an English page.

All 831 keys are translated, and the terminology is the ancestor demo's own rather than invented
here — `DISENO.md`, `solicitante.html` and `ejecutivo.html` carry `{es, en}` pairs for this exact
case, so *Carpeta Tributaria*, *certificado de dominio vigente*, *Fojas 1.842 N°1.190*, *alzamiento*,
*pie*, *dividendo*, *rol de avalúo* and *cotizaciones* are the words the Spanish build used. Three
tests hold the two tables to each other: same key set in both directions, no empty values, and — the
one that matters — **the same `{placeholders}` in both**, because a translation that drops `{ratio}`
prints a sentence with a hole in it and nothing else would catch it.

The choice is written to `sessionStorage` under `bfDemoLocale` by whichever surface changes it, so
switching roles mid-demo does not switch language underneath the presenter. It is a way of reading
the demo rather than part of the case, so it is deliberately not in the case state and not in the
hash. The borrower page also gains the `UF | $` toggle the officer already had, in the same demo bar
as the language: the same case, in either currency, in either language.

**Trigger agent, borrowed from the Silver Hill demo and made to mean something.** That build put a
`✦ Trigger agent` menu in the assistant's composer — *Order appraisal*, *Scan inbox*, *Alert team
member*, *Follow up with borrower* — and answered each with a line saying the agent "has been
triggered for this deal in this demo". The affordance is the right idea and the answer is the one
thing this build will not do: a control that reports work nobody did is the failure mode the whole
surface is built against. So the menu is here and each entry runs a transition the case already has,
which means triggering one moves the file and lands in the audit trail — *Collect outstanding
documents* is the reminder (her upload arrives, the tax folder clears), *Escalate* checks the real
delegated authority. *Check quality of the file* says **Reads only — changes nothing** in its own
description, and is therefore the only one a read-only fixture will run; the other three are offered
and disabled with the reason. The fourth, *Re-order a service (inspection, title, appraisal)*, holds
the same rule against a service rather than a document: the case tracks a timestamp of its own for
exactly one third party, the inspection, so that is the only field the transition moves — back to
pending, the same flag the board already reads — and its own response says so, naming the title and
the appraisal as governed elsewhere rather than claiming they moved too. Deliberately absent is the
reference's *Order appraisal* as something a fresh agent *originates*: the appraisal is ordered *on
approval*, so an agent that ordered it now would contradict the file it is reading; re-ordering one
already out is a real transition, ordering one that was never placed is not. *Ask the developer*
drafts the real query same as before, reached from the assistant's own title answer rather than from
this menu, since the desk asked for four agents here and not five. Also taken from that build: the
numbered **Next** list under the brief, because the order is the useful part — the second step is
usually blocked by the first — and a live status line beside the composer, since a triggered agent
changes the case and should not be announced only into a page-level region nobody is looking at.

**UF or pesos, one click, everywhere at once.** Chilean mortgages are written in UF and paid in
pesos, and which one a reader wants depends on the reader: an officer checking policy works in UF,
an officer on the phone to a borrower needs the number that will leave her account. The case stores
UF — that is the unit the contract is in, and converting on the way *in* would lose it — and a
`UF | $` toggle decides how every amount is printed on the way out. It appears twice, on the board
and in the case header, because the drawer covers the board and a mode switch you cannot reach is
not a switch; both write one view-state field and one render redraws the page. The unit is not
threaded through twenty render signatures to be read by one function: it is set once per render and
read only by `money()`. The Risk tab's paired rows are left alone — showing both units side by side
is that tab's whole job.

**Basis points are not a unit anyone should have to convert on sight, and the scenario is not a
finding.** The analysis card read *At +200 bp it is 30.7%* and the Risk tab was headed *Stressed at
+200 bp*. The Risk tab now says what the shock is — *If rates rise 2 points* — with the arithmetic
unchanged; only the trade shorthand is gone, and the copy tests assert the *absence* of `bp` and
`basis point` so it cannot come back by accident. The card dropped the line entirely. Rewriting it
in plain words made the real problem legible: the card answers *what is true of this file*, and a
rate rise that has not happened is not true of it. Sitting under **Not holding up** it read as a
defect the officer had to go and disprove, when it is the reason a condition exists. It keeps its
own section, its own bar and its own explainer on the Risk tab, where a scenario is the point.

**The WhatsApp thread left the desk.** It was mirrored into the rail on the argument that the
officer should see what the borrower had been told without hunting for it. In use it was a second
inbox in front of someone who already reads her words twice — under the document she sent them
about, and quoted in the review item they raised — and it spent a third of the workspace saying it.
The thread is the borrower's surface and now lives only there. What the desk kept is the *sending*:
`Send reply & resolve` on a queue item, and the message box on the overview. Both still cross the
bridge into her phone within a second, so §6's seam is untouched; only the mirror is gone.

## 6. The seam between the surfaces

Both files are opened from disk with no server, so the bridge is browser storage.

- `sessionStorage` holds the version-1 case state under `bfDemoCase:H-2026-08415`.
- `localStorage` carries the live cross-tab message bridge, capped at the last 200 messages.
- The borrower page seeds the case on load; the lender page reads it and **falls back to a complete
  built-in fixture** when storage is empty or invalid, so `lender.html` is demoable on its own.
- Malformed JSON, a wrong shape and a future version all reset to the clean fixture. A parse error
  never blanks the page.
- Both pages listen for `storage`, so with two tabs open a borrower message reaches the board and a
  lender reply reaches the WhatsApp thread within a second.
- If storage is refused — private mode, quota — the surface keeps working in memory and announces
  once, exactly once, that it is view-only.

This is the part the Spanish `DISENO.md` §6 lists as the prototype's limit: *"the two pages do not
share live state; Javiera's upload during the lender demo is scripted, it does not arrive from the
other tab."* Here it does arrive. That gap is closed.

What is still a limit: the state is per-browser-session and per-machine, there is no server, and the
developer's reply is generated locally rather than arriving from a mailbox. In production this is
one case record and one event channel with both views subscribed. Nothing in either page assumes it
originated the change it is rendering, so that substitution is a change of transport, not of design.

## 7. What would have to be real

Beyond the Spanish demo's list, and specific to this build:

- **A real event channel.** Storage plus the `storage` event is a convincing stand-in for two tabs
  on one machine and nothing more.
- **A deterministic policy engine.** `24.7% ≤ 30%` is real arithmetic; *who may sign up to how much*
  is written down by hand. Authority limits should be computed from rules, not typed into `copy.js`.
- **An immutable audit trail.** The trail is complete and ordered, but it lives in `sessionStorage`
  and anyone can edit it. If a decision is going to be defended a year later, the log has to be
  append-only and signed.
- **Actual document parsing.** The comparison on document 9 is the most persuasive thing on the
  screen and it is written down, not read. This is the single largest gap between the demo and the
  product.
- **Real mail, in and out.** The query to the developer and its reply are the only step in the flow
  with no simulated existence outside the browser at all.
- **The Chilean dependencies.** Daily UF, CMF debt report, Civil Registry, Real Estate Registrar,
  SII, MINVU, the FOGAES quota, and advanced electronic signature for the deed.

> Prototype demo. Figures, rates, documents and decisions are illustrative and do not constitute a
> credit offer.
