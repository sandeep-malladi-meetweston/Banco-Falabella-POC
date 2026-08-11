/* Banco Falabella English portal — the copy layer.
 *
 * Every user-visible string on borrower.html and lender.html resolves through
 * FalabellaCopy.t(). No page markup or render function may hold English text.
 *
 * ADDING SPANISH: this file is the only place it happens. Append "es" to
 * LOCALES, add "es" to NUMBER_LOCALE ("es-CL"), and add a COPY.es object with
 * the same keys as COPY.en. Nothing in borrower.html or lender.html changes.
 * The "es" seam is deliberately absent rather than present-and-empty, so
 * hasLocale("es") is honestly false until the translation actually exists.
 */
"use strict";

(function () {
  var COPY = {
    en: {
      /* ============================================================ common */
      "common.brand-name": "Banco Falabella",
      "common.close": "Close",
      "common.cancel": "Cancel",
      "common.send": "Send",
      "common.expand": "Expand",
      "common.collapse": "Collapse",
      "common.back-to-board": "Back to board",
      "common.open": "Open",
      "common.confirm": "Confirm",
      "common.retry": "Try again",
      "common.loading": "Loading…",
      "common.saved": "Saved",
      "common.empty": "—",
      "common.none": "None",
      "common.yes": "Yes",
      "common.no": "No",
      "common.skip-link": "Skip to main content",
      "common.demo-badge": "Demo",
      "common.demo-data-note": "Personal details shown here are demo data.",
      "common.view-only":
        "Browser storage is unavailable, so this demo is running in memory only. Nothing will be saved.",
      "common.prototype-disclaimer":
        "Prototype demo. Figures, rates, documents and decisions are illustrative and do not constitute a credit offer.",
      "common.readonly-loan": "Read-only demo loan",
      "common.readonly-note":
        "This case is a read-only demo fixture, so its actions are disabled.",
      "common.uf-note": "UF amounts converted at {value}, published {date}.",

      /* ============================================================= stage */
      "stage.new-applications": "New applications",
      "stage.gathering-information": "Gathering information",
      "stage.underwriting": "Underwriting",
      "stage.approved": "Approved",
      "stage.waiting-to-close": "Waiting to close",
      "stage.closed": "Closed",
      "stage.disbursed": "Disbursed",

      /* =============================================================== doc */
      "doc.national-id.name": "National ID card (both sides)",
      "doc.national-id.purpose": "Verifies your identity with the civil registry.",
      "doc.payslips.name": "Last 3 payslips",
      "doc.payslips.purpose":
        "Used to compute your average net income and payment-to-income ratio.",
      "doc.employment-tenure.name": "Proof of employment tenure",
      "doc.employment-tenure.purpose":
        "Confirms a permanent contract and minimum tenure.",
      "doc.pension-contributions.name": "Last 12 months of pension contributions",
      "doc.pension-contributions.purpose": "Verifies continuous income with no gaps.",
      "doc.tax-folder.name": "Tax folder for credit purposes (SII)",
      "doc.tax-folder.purpose": "Income verification with the tax authority.",
      "doc.down-payment-proof.name": "Proof of down payment and assets",
      "doc.down-payment-proof.purpose":
        "Confirms the down payment funds are available.",
      "doc.purchase-promise.name": "Purchase promise agreement",
      "doc.purchase-promise.purpose":
        "Must be signed on or after 01-01-2025 to qualify for FOGAES.",
      "doc.first-home-affidavit.name": "First-home affidavit (signed)",
      "doc.first-home-affidavit.purpose":
        "We already checked the Debtors Registry online; only your signature is missing.",
      "doc.title-certificate.name": "Current title certificate",
      "doc.title-certificate.purpose": "Issued by the Real Estate Registrar.",

      /* =========================================================== verdict */
      "verdict.not-uploaded": "Not uploaded",
      "verdict.under-review": "Under review",
      "verdict.rejected": "Rejected",
      "verdict.accepted": "Accepted",
      "verdict.accepted-with-condition": "Accepted with condition",

      /* ============================================================ review */
      "review.borrower-message": "Borrower message",
      "review.new-upload": "New upload",
      "review.document-exception": "Document exception",
      "review.deed-deadline": "Closing deadline",

      /* ============================================================= audit */
      "audit.application-submitted": "Application submitted",
      "audit.document-checklist-started": "Document checklist started",
      "audit.borrower-message-sent": "Borrower message sent",
      "audit.lender-reply-sent": "Lender reply sent",
      "audit.assistant-message-sent": "Agent replied to the borrower",
      "audit.review-item-resolved": "Review item resolved",
      "audit.new-upload-received": "New upload received",
      "audit.document-uploaded": "Document uploaded",
      "audit.document-verdict-changed": "Document verdict changed",
      "audit.document-exception-created": "Document exception raised",
      "audit.deed-deadline-raised": "Closing deadline raised",
      "audit.condition-cleared": "Condition cleared",
      "audit.stage-changed": "Case stage changed",
      "audit.developer-query-sent": "Query sent to the developer",
      "audit.developer-reply-received": "Developer replied",
      "audit.borrower-reminder-sent": "Reminder sent to the borrower",
      /* What the agent did, as the trail records it. Every one of these is a
         thing that moved the file — a chase that went out, a registry that was
         pulled, a case that was routed — never "an agent was triggered". */
      "audit.agent-intake-reviewed": "Agent reviewed the application",
      "audit.agent-message-sent": "Agent messaged the borrower",
      "audit.agent-followup-sent": "Agent followed up with the borrower",
      "audit.agent-document-checked": "Agent ran the document checks",
      "audit.agent-registry-checked": "Agent checked the property registry",
      "audit.agent-policy-checked": "Agent checked the case against policy",
      "audit.agent-case-routed": "Agent routed the case to the mortgage desk",
      "audit.agent-case-scanned": "Agent scanned the case",
      "audit.agent-affordability-recalculated": "Agent recalculated affordability",
      "audit.agent-handoff-prepared": "Agent prepared the handoff",

      "audit.detail.intake-reviewed":
        "Checklist built from the product rules: nine documents, FOGAES guarantee, first-home declaration. No earlier file for this RUT.",
      "audit.detail.checklist-message":
        "“Hi Javiera — here is everything we need for the mortgage. Upload each one as you get it and I will check them as they land.”",
      "audit.detail.down-payment-checked":
        "Holder, balance and 90-day seasoning all matched the statement. 3 of 3 fields verified.",
      "audit.detail.followup-one":
        "Reminder 1 of 3. Tax folder and title certificate still outstanding at the end of the day.",
      "audit.detail.followup-two":
        "Reminder 2 of 3. Both documents arrived within the next two hours.",
      "audit.detail.tax-folder-checked":
        "RUT on page 1 came through unreadable. 1 of 4 fields could not be read, so the document went back.",
      "audit.detail.tax-folder-message":
        "“The RUT on page 1 of your tax folder came through unreadable — could you send that page again?”",
      "audit.detail.registry-checked":
        "Certificate pulled from the Conservador de Bienes Raíces. Folio 1,842 No.1,190 (2024): a mortgage in favour of another bank, not declared on the application.",
      "audit.detail.policy-checked":
        "An undeclared encumbrance is outside what the agent is allowed to settle. Case flagged for a person.",
      "audit.detail.case-routed":
        "Routed to the Santiago mortgage desk with the certificate, the registration details and the borrower’s thread attached.",
      "audit.detail.case-scanned":
        "At the time of the scan: 2 documents not accepted, 2 items open, 2 conditions not cleared.",
      "audit.detail.affordability":
        "Payment to income and the stressed ratio recomputed from the accepted payslips. Both inside policy.",
      "audit.detail.handoff-prepared":
        "Case summary, both exceptions and the two conditions of approval prepared for the duty officer.",

      "audit.loan-approved": "Loan approved with conditions",
      "audit.loan-approved-override": "Loan approved by manual override",
      "audit.loan-declined": "Application declined by the officer",
      "audit.approval-signed": "Approval signed",
      "audit.loan-disbursed": "Loan disbursed",
      "audit.case-closed": "Case closed and archived",
      "audit.case-reset": "Case reset to the opening state",

      /* ============================================================ lender */
      "lender.title": "Lender portal",
      "lender.page-title": "Banco Falabella · Lender portal",
      "lender.logo-alt": "Banco Falabella",
      "lender.logo-reset-aria": "Clear all filters and show every case",
      "lender.search-label": "Search case, borrower or address",
      "lender.search-placeholder": "Search case, borrower or address",
      /* Chilean mortgages are written in UF and paid in pesos. Which one is
         wanted depends on who is being answered, so both are one click apart. */
      "lender.language.aria-label": "Language",
      "lender.language.en": "EN",
      "lender.language.es": "ES",
      "lender.language.en-title": "Show this portal in English",
      "lender.language.es-title": "Ver este portal en español",
      "lender.status.language": "Language switched to English.",
      "lender.money.aria-label": "Show amounts in",
      "lender.money.uf": "UF",
      "lender.money.uf-title": "Show amounts in UF",
      /* "CLP" rather than a bare "$": beside "UF" it reads as the other unit,
         where "$" read as a button that might do something to the money. */
      "lender.money.clp": "CLP",
      "lender.money.clp-title": "Show amounts in Chilean pesos",
      "lender.status.money-uf": "Amounts are now shown in UF.",
      "lender.status.money-clp": "Amounts are now shown in Chilean pesos.",

      "lender.switch-to-borrower": "Switch to borrower view",
      "lender.switch-to-borrower-aria":
        "Switch to the borrower view of this demo",

      "lender.nav.aria-label": "Portfolio views",
      "lender.nav.pipeline": "Pipeline",
      "lender.nav.needs-review": "Notifications",
      "lender.nav.signing-soon": "Signing soon",
      "lender.nav.disbursed": "Disbursed",
      "lender.nav.closed-archived": "Closed",

      "lender.metrics-aria-label": "Portfolio summary",
      "lender.metric.active-origination": "Active origination",
      "lender.metric.needs-review": "Notifications",
      "lender.metric.signing-soon": "Signing soon",

      "lender.toolbar.stage": "Stage",
      "lender.toolbar.all-stages": "All stages",
      "lender.toolbar.reason": "Review reason",
      "lender.toolbar.all-reasons": "All reasons",
      "lender.toolbar.sort": "Sort",
      "lender.toolbar.sort-deed-date": "Closing date",
      "lender.toolbar.sort-newest": "Newest application",
      "lender.toolbar.sort-amount": "Requested amount",
      "lender.toolbar.no-match": "No cases match this search.",
      "lender.toolbar.clear-search": "Clear search",

      "lender.page.eyebrow": "Portfolio overview",
      "lender.page.matching": "{count} matching cases",
      "lender.board.aria-label": "Case board by stage",
      "lender.board.empty-column": "No matching cases",

      "lender.card.open-aria": "Open case {case}, {borrower}",
      "lender.card.needs-review": "Notifications",
      "lender.card.review-chip": "{notifications} · {reason}",
      "lender.card.deed-date": "Closing {date}",
      "lender.card.live-case": "Live",
      "lender.card.pending-title": "Title pending",
      "lender.card.pending-inspection": "Inspection pending",
      "lender.card.pending-both": "Title + inspection pending",
      "lender.card.pending-aria": "Flagged: {what}.",

      "lender.substatus.documents-progress": "{received} of {total} documents",
      "lender.substatus.submitted-today": "Submitted today",
      "lender.substatus.application-received": "Application received",
      "lender.substatus.new-upload": "New upload",
      "lender.substatus.appraisal-below-request": "Appraisal below request",
      "lender.substatus.credit-review": "In underwriting",
      "lender.substatus.deed-in-days": "Closing in {days} days",
      "lender.substatus.clear-to-sign": "Clear to sign",
      "lender.substatus.awaiting-closing": "Signed · awaiting closing",
      "lender.substatus.disbursed-on": "Disbursed {date}",
      "lender.substatus.performing": "Performing",
      "lender.substatus.paid-off-on": "Paid off {date}",

      "lender.tabs.aria-label": "Case record",
      "lender.tab.overview": "Overview",
      "lender.tab.application": "Application",
      "lender.tab.documents": "Documents",
      "lender.tab.risk": "Risk",
      "lender.tab.conversation": "Conversation",
      "lender.tab.audit": "Audit trail",

      /* The bell: what this case is waiting on, and where to go to settle it */
      "lender.notifications.title": "Case notifications",
      "lender.notifications.open": "Case notifications, {count} open",
      "lender.notifications.empty": "Open a case to see what it is waiting on.",
      "lender.notifications.clear": "Nothing on this case needs you.",
      "lender.notifications.review-cta": "Open the document",
      /* The generic body promises nothing about overriding: whether that control
         is offered depends on the case, so the separate hint line makes that
         promise, and only where it can be kept. */
      "lender.notifications.exception":
        "A check on this document did not match. Open it to see the comparison.",
      "lender.notifications.new-upload":
        "A new file arrived and is waiting for a verdict.",
      "lender.notifications.borrower-message": "{borrower} wrote about this document.",
      "lender.notifications.deed-deadline": "The closing date is near and the case is not signed.",
      /* What is actually wrong, on the two documents this demo turns on. A line
         that says "a check failed" sends the officer looking; a line that names
         the folio and the field does not. */
      "lender.notifications.detail.title-certificate":
        "The certificate records a mortgage in favour of another bank at Folio 1,842 No.1,190 (2024). The application declared no encumbrances. Everything else on the certificate — owner, tax roll, validity — matched.",
      "lender.notifications.detail.tax-folder":
        "Page 1 arrived cropped and the taxpayer RUT could not be read (18.452.30_-4). The other three fields on the folder matched.",
      "lender.notifications.detail.purchase-promise":
        "The purchase promise was signed three weeks after the appraisal report. It should have followed right away. Everything else on the document — parties, price, property — matched the file.",

      /* The one alert, and the one panel it points at */
      "lender.needs.alert": "Notifications",
      "lender.needs.alert-aria": "{notifications} on this case — go to them",
      /* One notification and two read differently enough to be worth two keys;
         the alternative was a badge saying "1 notification(s)". */
      "lender.needs.count-one": "1 notification",
      "lender.needs.count-many": "{count} notifications",
      "lender.needs.condition-label": "Condition {id}",
      "lender.needs.condition-clears-document": "Clears when {document} is accepted.",
      "lender.needs.open-document": "Open {document}",

      /* The analysis card beside the record */
      "lender.analysis.title": "What the file says",
      /* The subtitle counts what arrived, because that is the number every other
         line on the card is a fraction of. "8 of 9 settled" left the officer to
         work out for herself how many had even been sent. */
      "lender.analysis.subtitle": "Checked automatically · {uploaded} of {total} documents uploaded",
      "lender.analysis.correct-heading": "In good order",
      "lender.analysis.wrong-heading": "Needs review",
      "lender.analysis.checks-failed": "{count} field check(s) did not match",
      "lender.analysis.open-item": "{reason} · {document}",
      "lender.analysis.open-item-aria": "Open {document} to settle {reason}",
      "lender.analysis.none-wrong": "Nothing outstanding on this case.",
      "lender.analysis.none-holding": "Nothing has cleared on this case yet.",
      /* Every document line is a fraction of the same nine, so the two halves of
         the card add up on sight instead of by subtraction. */
      "lender.analysis.documents-accepted": "{count} of {total} documents accepted",
      "lender.analysis.documents-review": "{count} of {total} documents waiting on review",
      "lender.analysis.documents-missing": "{count} document(s) not uploaded yet",
      "lender.analysis.checks-passed": "{count} of {total} field checks matched",
      "lender.analysis.affordability-ok": "Payment-to-income {ratio}, under the {cap} cap",
      "lender.analysis.affordability-over": "Payment-to-income {ratio}, over the {cap} cap",
      /* No stressed-rate line: the card states what is true of the file, and a
         rate rise that has not happened is a scenario. It lives on the Risk tab. */
      "lender.analysis.guarantee": "FOGAES guarantee confirmed on {amount}",
      "lender.analysis.gate-open": "Both conditions cleared · ready to approve",
      "lender.analysis.gate-blocked": "{count} condition(s) still to clear",

      "lender.workspace.eyebrow": "Case {case}",
      "lender.workspace.borrower-line": "{borrower}",
      "lender.workspace.close-aria": "Close case details",
      "lender.workspace.expand-aria": "Expand case details to full screen",
      "lender.workspace.drive-aria": "Open case {case} files in Google Drive, in a new tab",
      "lender.workspace.chip-guarantee": "FOGAES guarantee",
      "lender.workspace.chip-needs-review": "Notifications · {count}",

      /* Overview tab */
      "lender.overview.needs-review-heading": "Notifications",
      "lender.overview.open-count": "{count} open",
      /* The heading beside it already carries the count; this says how to read
         the list instead of saying the number a second time. */
      "lender.overview.queue-position": "{position} of {total}",
      "lender.overview.all-clear": "Nothing needs you on this case",
      "lender.overview.snapshot-heading": "Case snapshot",
      "lender.overview.snapshot-requested": "Requested",
      "lender.overview.snapshot-deed-date": "Closing date",
      "lender.overview.snapshot-documents": "Documents",
      "lender.overview.snapshot-documents-value": "{received} of {total}",
      "lender.overview.snapshot-dti": "Payment to income",
      "lender.overview.application-card": "Application",
      "lender.overview.documents-card": "Document status",
      "lender.overview.activity-heading": "Recent activity",
      "lender.overview.view-audit": "View the full audit trail",
      "lender.overview.no-activity": "No activity recorded yet.",

      "lender.review.reply-label": "Reply about this item",
      "lender.review.reply-placeholder": "Reply to {borrower}…",
      "lender.review.reply-in-chat": "Reply in the conversation",
      "lender.review.mark-resolved": "Mark resolved",
      "lender.review.send-reply": "Send reply & resolve",
      /* The queue's decision. Each option names the act and its object, not the
         state it leaves behind: an officer picks "Send the document back",
         never "Rejected". The verdict is what the file records afterwards; the
         verb is what she is choosing to do. */
      "lender.review.decision-label": "Decision",
      "lender.review.decision.reply": "Reply and resolve",
      "lender.review.decision.accepted": "Accept the document",
      "lender.review.decision.accepted-with-condition": "Accept with a condition",
      "lender.review.decision.send-back": "Send the document back",
      "lender.review.decision.resolve": "Resolve without replying",
      "lender.review.apply": "Apply",
      "lender.review.decision-refused":
        "That decision needs a document behind it. Reply or resolve this item instead.",
      "lender.review.resolved-announcement": "Review item resolved: {reason}.",
      "lender.review.reply-announcement":
        "Reply sent to {borrower}. Review item resolved.",
      "lender.review.blank-reply": "Type a reply before sending it.",

      /* Application tab */
      "lender.application.property-heading": "The property",
      "lender.application.loan-heading": "The loan request",
      "lender.application.borrower-heading": "The borrower",
      "lender.application.address": "Address",
      "lender.application.property-type": "Property type",
      "lender.application.property-condition": "Condition",
      "lender.application.property-value": "Property value",
      "lender.application.project": "Project",
      "lender.application.tax-roll": "Tax roll",
      "lender.application.loan-amount": "Requested amount",
      "lender.application.down-payment": "Down payment",
      "lender.application.term": "Term",
      "lender.application.rate": "Rate",
      "lender.application.financing": "Financing",
      "lender.application.guarantee": "State guarantee",
      "lender.application.name": "Full name",
      "lender.application.rut": "RUT (national ID)",
      "lender.application.date-of-birth": "Date of birth",
      "lender.application.income": "Verified monthly net income",
      "lender.application.phone": "Phone (WhatsApp)",
      "lender.application.email": "Email",
      "lender.application.submitted": "Application submitted",

      /* Documents tab */
      "lender.documents.heading": "Document records",
      "lender.documents.no-file": "No file received yet",
      "lender.documents.channel-label": "Source",
      "lender.documents.channel-whatsapp": "Received over WhatsApp",
      "lender.documents.channel-portal": "Uploaded from the borrower portal",
      "lender.documents.page-heading": "The page as received",
      "lender.documents.checks-heading": "Review checks",
      /* The officer overruling the assistant, on one document. */
      "lender.documents.override-heading": "Officer decision",
      "lender.documents.override-label": "Verdict",
      "lender.documents.override-condition-label": "Condition",
      "lender.documents.override-condition-placeholder":
        "Required when accepting with a condition",
      "lender.documents.override-apply": "Apply decision",
      "lender.documents.request-label": "Send it back to the borrower",
      "lender.documents.request-placeholder":
        "Say what is wrong with it and what you need instead…",
      "lender.documents.request-again": "Request this document again",
      "lender.documents.conversation-heading": "Conversation",
      "lender.documents.no-messages": "No messages on this document.",

      /* The record shows the evidence; the Notifications panel is where every
         gesture that changes the case lives. This is the way there. */
      "lender.documents.handoff-action": "Answer this in Notifications",
      "lender.documents.handoff-condition":
        "This document still carries a condition on the approval.",
      "lender.documents.handoff-action-condition": "See the condition in Notifications",
      "lender.documents.handoff-settled": "Settled. Nothing is outstanding on this document.",
      "lender.documents.handoff-none": "Nothing is outstanding on this document.",

      /* ------------------------------------------------ writing to the borrower
         The words that refuse a send that cannot go, wherever it was sent from
         — the review item it answers, the message box on the overview, or the
         conversation tab's own composer. */
      "lender.conversation.sent": "Message sent to Javiera.",
      "lender.conversation.blank": "Type a message before sending.",
      "lender.conversation.readonly": "This case is a read-only sample and cannot be messaged.",
      /* Bridged whenever a decision on the live case changes a document's
         verdict, so her checklist and her thread agree with the desk's own
         record instead of freezing at whatever the last upload said. */
      "lender.conversation.verdict-notice": "{document} — {verdict}.",
      /* The conversation tab: her WhatsApp thread, read from the desk, in the
         one order she read it in. */
      "lender.conversation.heading": "Message thread",
      "lender.conversation.subtitle": "The same thread she sees on her phone",
      "lender.conversation.aria-label": "Conversation with {borrower}",
      "lender.conversation.today": "TODAY",
      "lender.conversation.empty": "No messages yet.",
      "lender.conversation.placeholder": "Message {borrower}…",
      "lender.conversation.send": "Send",
      "lender.conversation.pending": "Awaiting your reply",
      "lender.conversation.pending-link": "{count} awaiting your reply",
      /* The handoff exchange, already on the case when it reaches the desk. */
      "lender.conversation.seed-routed":
        "Your title certificate shows a mortgage from another bank registered on the property. I have routed it to a mortgage specialist with the document and the registration details.",
      "lender.conversation.seed-reply": "OK, I will wait to hear. 🙏",
      /* The second live case's own handoff exchange, about its own exception. */
      "lender.conversation.seed-routed-377":
        "Your purchase promise was signed three weeks after the appraisal report. It should have followed right away, so I have routed it to underwriting to confirm the correct date before we continue.",
      "lender.conversation.seed-reply-377": "Understood, thank you for checking.",
      "lender.documents.history-heading": "Upload history",
      "lender.documents.no-history": "No uploads recorded.",
      "lender.documents.comparison-heading":
        "What was stated, against what was found in the document",
      "lender.documents.comparison-field": "Field",
      "lender.documents.comparison-stated": "Stated in the application",
      "lender.documents.comparison-found": "Found in the document",
      "lender.documents.folio": "Folio 1,842 No.1,190 (2024)",
      "lender.documents.encumbrance-stated": "No encumbrances declared",
      "lender.documents.encumbrance-found":
        "Mortgage in favour of another bank — Folio 1,842 No.1,190 (2024)",
      "lender.documents.encumbrance-note":
        "Confirm whether this mortgage is the developer’s construction loan and whether it is released in the same deed.",
      "lender.documents.owner-stated": "Inmobiliaria Aconcagua SpA",
      "lender.documents.owner-found": "INMOBILIARIA ACONCAGUA SpA",
      "lender.documents.tax-roll-value": "1234-56",
      "lender.documents.validity-stated": "Issued within the last 30 days",
      "lender.documents.validity-found": "Issued 3 days ago",

      "lender.check.status.verified": "Verified",
      "lender.check.status.mismatch": "Mismatch",
      "lender.check.status.missing": "Missing",
      "lender.check.status.waiting": "Waiting",
      "lender.check.status.note": "Note",

      "lender.check.national-id.full-name": "Full name",
      "lender.check.national-id.rut": "RUT",
      "lender.check.national-id.date-of-birth": "Date of birth",
      "lender.check.national-id.validity": "Document validity",
      "lender.check.payslips.stated-income": "Stated net income",
      "lender.check.payslips.periods": "Periods received",
      "lender.check.payslips.employer": "Employer",
      "lender.check.payslips.payment-to-income": "Resulting payment to income",
      "lender.check.employment-tenure.tenure": "Tenure",
      "lender.check.employment-tenure.contract-type": "Contract type",
      "lender.check.employment-tenure.employer": "Employer",
      "lender.check.pension-contributions.months": "Months contributed",
      "lender.check.pension-contributions.continuity": "Continuity",
      "lender.check.pension-contributions.file-source": "File source",
      "lender.check.tax-folder.taxpayer-rut": "Taxpayer RUT",
      "lender.check.tax-folder.purpose": "Folder purpose",
      "lender.check.tax-folder.periods": "Periods included",
      "lender.check.tax-folder.issue-date": "Issue date",
      "lender.check.down-payment-proof.amount-required": "Down payment required",
      "lender.check.down-payment-proof.ownership": "Account ownership",
      "lender.check.down-payment-proof.source-of-funds": "Source of funds",
      "lender.check.purchase-promise.signature-date": "Signature date",
      "lender.check.purchase-promise.price": "Purchase price",
      "lender.check.purchase-promise.buyer": "Buyer",
      "lender.check.purchase-promise.condition": "Property condition",
      "lender.check.first-home-affidavit.signature": "Declarant signature",
      "lender.check.first-home-affidavit.previous-subsidy":
        "Previous housing subsidy",
      "lender.check.first-home-affidavit.debtors-registry":
        "Child-Support Debtors Registry",
      "lender.check.title-certificate.encumbrances": "Encumbrances and mortgages",
      "lender.check.title-certificate.owner": "Registered owner",
      "lender.check.title-certificate.tax-roll": "Tax roll",
      "lender.check.title-certificate.validity": "Certificate validity",

      "lender.source.heading": "Checked at the source",
      "lender.source.intro":
        "The system checked these directly with the issuing bodies, so the borrower was never asked for the certificates.",
      "lender.source.new-home.label": "New home (first sale)",
      "lender.source.new-home.source": "Municipal completion 2026 · Aconcagua project",
      "lender.source.new-home.result": "First sale",
      "lender.source.valid-rut.label": "Individual with a valid RUT",
      "lender.source.valid-rut.source": "Civil Registry",
      "lender.source.valid-rut.result": "Valid",
      "lender.source.first-home.label": "First home · no property in her name",
      "lender.source.first-home.source": "Real Estate Registrar · tax authority (SII)",
      "lender.source.first-home.result": "0 properties",
      "lender.source.promise-date.label": "Purchase promise signed from 01-01-2025",
      "lender.source.promise-date.source": "Developer · confirmed against the document",
      "lender.source.promise-date.result": "12-03-2026",
      "lender.source.no-subsidy.label": "No previous housing subsidy",
      "lender.source.no-subsidy.source": "Housing Ministry (MINVU)",
      "lender.source.no-subsidy.result": "No records",
      "lender.source.not-debtor.label": "Not listed in the Child-Support Debtors Registry",
      "lender.source.not-debtor.source": "Civil Registry · Law 21,389",
      "lender.source.not-debtor.result": "Not listed",
      "lender.source.fogaes-quota.label": "FOGAES quota available",
      "lender.source.fogaes-quota.source": "FOGAES centralised system",
      "lender.source.fogaes-quota.result": "Reserved",

      /* Audit tab */
      "lender.audit.heading": "Complete audit trail",
      "lender.audit.empty": "No events recorded yet.",
      "lender.actor.borrower": "Borrower",
      "lender.actor.assistant": "Agent",
      "lender.actor.lender": "Lender",
      "lender.actor.system": "System",
      "lender.actor.third-party": "Third party",

      /* Actions */
      "lender.action.request-developer-confirmation":
        "Request confirmation from the developer",
      "lender.action.remind-borrower": "Remind the borrower about the document",
      "lender.action.escalate": "Escalate to manager",
      "lender.action.escalate-response":
        "This case is within your delegated authority of {authority}, so no escalation is needed.",
      "lender.action.approve": "Approve with conditions",
      "lender.action.approve-blocked":
        "Check notifications and fix them to approve the loan with conditions.",
      "lender.action.sign": "Sign approval",
      "lender.action.reset": "Reset case",
      "lender.action.decline": "Decline the application",
      "lender.action.override": "Check Notifications",

      /* Developer query */
      "lender.email.heading": "Query to the developer",
      "lender.email.to-label": "To",
      "lender.email.to": "contacto@inmobiliariaaconcagua.cl",
      "lender.email.subject-label": "Subject",
      "lender.email.subject":
        "Case {case} · Mortgage at Folio 1,842 No.1,190 (2024) · tax roll 1234-56",
      "lender.email.body":
        "Dear Inmobiliaria Aconcagua team,\n\nWe are assessing a mortgage application over the property at tax roll 1234-56 of the Aconcagua project in Maipú, case {case}.\n\nThe current title certificate records a mortgage in favour of another bank at Folio 1,842 No.1,190 of 2024, which was not declared in the application. Please confirm whether it corresponds to the construction loan and whether it will be released simultaneously in the same deed, and attach the draft release if so.\n\nKind regards,\n{officer} · {role} · Banco Falabella",
      "lender.email.send": "Send query",
      "lender.email.sent-announcement":
        "Query sent to the developer. Waiting for their reply.",
      "lender.email.reply-received":
        "Inmobiliaria Aconcagua confirmed the mortgage is the construction loan and attached the draft release. It is lifted in the same deed.",

      /* Borrower reminder */
      "lender.reminder.sent":
        "Reminder sent to the borrower about page 1 of the tax folder.",
      "lender.reminder.upload-received":
        "The borrower uploaded page 1 of the tax folder from her portal. The document is now accepted.",

      /* ------------------------------------------------------ the deal assistant
         A reader of this case, sitting under the analysis card. It answers from
         the case state and from nothing else — no model, no invention — which is
         why every answer below is a written sentence with the case's own numbers
         interpolated into it, and why the same question always gets the same
         reply. The subtitle says so on the surface, because an assistant that
         looks like it might be guessing is worse than none. */
      "lender.assistant.title": "Deal assistant",
      "lender.assistant.subtitle": "Answers from this case only",
      "lender.assistant.you": "You",
      "lender.assistant.placeholder": "Ask about this case…",
      "lender.assistant.send": "Ask",
      "lender.assistant.send-aria": "Ask the deal assistant about this case",
      "lender.assistant.blank": "Type a question before asking.",
      "lender.assistant.asked": "Asked the deal assistant. Its answer is in the rail.",

      /* Collapsed, the assistant is a mark in the corner of the drawer. The
         count is on the launcher rather than inside it, because the officer
         decides whether to open the panel before she can read anything in it. */
      "lender.assistant.open-aria": "Open the deal assistant",
      "lender.assistant.close-aria": "Collapse the deal assistant",

      /* The standing brief: what is in the way, right now. */
      /* No list of the items here. They are the queue directly above this
         sentence, each one named and answerable where it sits; naming them again
         made the rail say the same two things three times over. */
      "lender.assistant.brief-open":
        "{count} item(s) are open, and nothing can be approved until they are settled.",
      "lender.assistant.brief-conditions":
        "The documents are settled. {count} condition(s) still hold approval: {conditions}.",
      "lender.assistant.brief-ready":
        "Both gating conditions are cleared and all nine documents are in. This case can be approved.",
      "lender.assistant.brief-approved":
        "Approved with conditions. The approval is drafted and still needs your signature.",
      "lender.assistant.brief-signed": "Signed. Nothing on this case is waiting on you.",
      "lender.assistant.brief-quiet": "Nothing on this case is waiting on you.",

      /* Answers. Each is chosen by what the question is about and what the case
         says about it — never by which one was used last. */
      "lender.assistant.answer-title-open":
        "The title certificate records a mortgage in favour of another bank at Folio 1,842 No.1,190 (2024). The application declared no encumbrances. Owner, tax roll and validity all matched, so this is one field, not a bad document. It is usually the developer's construction loan: ask them to confirm it and to release it in the same deed.",
      "lender.assistant.answer-title-settled":
        "The title certificate is settled — {verdict}. The encumbrance at Folio 1,842 No.1,190 (2024) is covered by the release condition rather than by a second document.",
      "lender.assistant.answer-tax-open":
        "Page 1 of the tax folder arrived cropped and the taxpayer RUT could not be read (18.452.30_-4). The other three fields matched, so the folder is the right document — it needs page 1 again, in full.",
      "lender.assistant.answer-tax-settled":
        "The tax folder is settled — {verdict}. The RUT on page 1 reads correctly.",
      "lender.assistant.answer-approval-items":
        "Approval is held by {count} open review item(s): {items}. The conditions are checked after those close.",
      "lender.assistant.answer-approval-conditions":
        "{count} condition(s) are still open: {conditions}. Approval stays disabled until they clear.",
      "lender.assistant.answer-approval-ready":
        "Nothing is holding it. Both conditions are cleared, and {amount} is within your delegated authority of {authority}.",
      "lender.assistant.answer-affordability":
        "The payment is {payment} against verified net income of {income} — {ratio}, under the {cap} cap. If rates rise 2 points it reaches {stressed}, which is over the cap; that exception is stated in the file rather than hidden, and it is on the Risk tab with the scenario that produced it.",
      "lender.assistant.answer-guarantee":
        "FOGAES covers {amount}, {share} of the loan — the slice above the standard 80% financing limit. It is what makes the loan financeable at 90%; it does not make it cheaper. The rate subsidy is a separate benefit and is already in the {rate} rate.",
      "lender.assistant.answer-documents-open":
        "{accepted} of {total} documents are accepted. Still outstanding: {outstanding}.",
      "lender.assistant.answer-documents-complete":
        "All {total} documents are accepted.",
      "lender.assistant.answer-borrower":
        "{borrower} was last told that a mortgage specialist has the title certificate and that nothing is needed from her. Use the message box on the overview to write to her; it reaches the same WhatsApp thread she is reading.",
      "lender.assistant.answer-developer":
        "The query names the case, the folio and the tax roll, and asks Inmobiliaria Aconcagua to confirm whether the mortgage is their construction loan and whether it is released in the same deed. It is drafted for you to read before it goes.",
      "lender.assistant.answer-no-figures":
        "This case has no application behind it, so I have no arithmetic for it. I can still answer about its documents and its open items.",
      "lender.assistant.answer-unknown":
        "I only answer from what is on this case. Try the title certificate, the tax folder, what is holding approval, affordability, the state guarantee, the documents, or the borrower.",

      /* ---------------------------------------------------------- trigger agent
         The composer can start a named agent as well as ask a question. Each one
         below runs a transition the case already has, so triggering it moves the
         file and lands in the audit trail — none of them is a message saying an
         agent "has been triggered". The collecting agent says what it keeps
         doing after that first message: it holds the conversation, chases, and
         files what arrives. The one read-only agent says so in its own
         description. */
      "lender.assistant.trigger": "Trigger agent",
      "lender.assistant.trigger-aria": "Choose an agent to run on this case",
      "lender.assistant.trigger-menu-aria": "Agents available on this case",
      "lender.assistant.status-idle": "Ask a question, or trigger an agent.",
      "lender.assistant.status-ran": "{agent} ran on {case}.",
      "lender.assistant.status-readonly":
        "This case is read-only, so only the read-only agent can run on it.",
      "lender.assistant.you-trigger": "Trigger {agent}.",

      "lender.assistant.agent.follow-up": "Collect outstanding documents",
      "lender.assistant.agent.follow-up-note":
        "Opens the conversation, chases until they arrive, and files them on the case",
      "lender.assistant.agent.follow-up-ran":
        "I have opened the conversation with {borrower} on WhatsApp about the outstanding document, and I stay on it from here — I answer what she asks, chase her again if she goes quiet, and file the page against the document when it arrives. Every step lands on the audit trail. I come back to you when the document is in, or when something needs your decision.",
      "lender.assistant.agent.escalate": "Escalate to the manager",
      "lender.assistant.agent.escalate-note": "Checks the case against your delegated authority",
      "lender.assistant.agent.scan": "Check quality of the file",
      "lender.assistant.agent.scan-note": "Reads only — changes nothing",
      "lender.assistant.agent.scan-ran-clear":
        "Nothing is outstanding. All {total} documents are accepted and no review item is open.",
      "lender.assistant.agent.scan-ran":
        "Outstanding on this case: {findings}.",
      "lender.assistant.agent.reorder": "Re-order a service (inspection, title, appraisal)",
      "lender.assistant.agent.reorder-note":
        "Re-orders the inspection; the title and the appraisal are already governed elsewhere on this case",
      "lender.assistant.agent.reorder-ran":
        "I have re-ordered the inspection — it goes back to pending until the new one comes back, and that is on the audit trail. The title stays governed by the certificate already on file and the appraisal is ordered on approval by policy, so re-ordering touches neither; ask me about either if you want its own status.",
      "lender.assistant.scan-documents": "{count} document(s) not yet accepted ({names})",
      "lender.assistant.scan-items": "{count} open review item(s) ({items})",
      "lender.assistant.scan-conditions": "{count} condition(s) not cleared",
      "lender.assistant.scan-messages": "{count} message(s) from {borrower} on the file",

      /* The brief's second half: what to do, in order. */
      "lender.assistant.next-heading": "Next",
      "lender.assistant.next-resolve": "Settle {document} — {reason}.",
      "lender.assistant.next-settle": "Settle the {count} item(s) waiting above.",
      "lender.assistant.next-collect": "Collect {names}.",
      "lender.assistant.next-conditions": "Clear {count} remaining condition(s).",
      "lender.assistant.next-approve": "Approve with conditions, then sign.",
      "lender.assistant.next-sign": "Sign the approval.",
      "lender.assistant.next-none": "Nothing is waiting. Check the audit trail before closing.",

      /* Buttons the assistant offers with an answer. Each one is a control that
         already exists elsewhere on the case — it routes, it never acts alone. */
      "lender.assistant.action-open-document": "Open {document}",
      "lender.assistant.action-developer-query": "Draft the query to the developer",
      "lender.assistant.action-remind-borrower": "Remind the borrower",
      "lender.assistant.action-risk": "Open the risk tab",
      "lender.assistant.action-approve": "Approve with conditions",

      /* Conditions */
      "lender.condition.heading": "Conditions",
      "lender.condition.c1":
        "Simultaneous release of the mortgage at Folio 1,842 No.1,190 (2024) in the same deed.",
      "lender.condition.c2": "Complete tax folder with a legible RUT on page 1.",
      "lender.condition.cleared": "Cleared",
      "lender.condition.open": "Open",
      "lender.condition.cleared-on": "Cleared {date}",

      /* Signing sheet */
      "lender.signing.heading": "Approval signing sheet",
      "lender.signing.case": "Case",
      "lender.signing.borrower": "Borrower",
      "lender.signing.amount": "Approved amount",
      "lender.signing.officer": "Officer",
      "lender.signing.authority": "Delegated authority",
      "lender.signing.conditions": "Conditions carried into the deed",
      "lender.signing.confirm": "Sign approval",

      /* Decision record */
      "lender.decision.heading": "Decision record",
      "lender.decision.outcome": "Approved with conditions",
      "lender.decision.case": "Case {case}",
      "lender.decision.signed-by": "Signed by {officer}, {role}.",
      "lender.decision.authority": "Within a delegated authority of {authority}.",
      "lender.decision.timestamp": "Signed {timestamp}.",
      "lender.decision.conditions-heading": "Conditions of approval",
      "lender.decision.announcement":
        "Approval signed. Decision record issued for case {case}.",

      /* The officer's own decision on the case */
      "lender.decision.panel-heading": "Officer decision",
      "lender.decision.state-ready":
        "Both gating conditions are cleared. Case {case} can be approved.",
      "lender.decision.state-approved": "Case {case} is approved and awaiting signature.",
      "lender.decision.state-signed": "Case {case} is approved and signed.",
      "lender.decision.state-declined": "Case {case} was declined.",
      "lender.decision.reason-label": "Reason (recorded on the case)",
      "lender.decision.reason-placeholder": "Why this decision, in your own words",
      "lender.decision.reason-required": "A written reason is needed before this decision can be recorded.",
      "lender.decision.decline-heading": "Decline case {case}",
      "lender.decision.decline-intro":
        "Declining closes the case. The borrower keeps her portal and her documents; the reason below goes on the record.",
      "lender.decision.decline-confirm": "Record the decline",
      "lender.decision.override-heading": "Manual override on case {case}",
      "lender.decision.override-intro":
        "This approves the case with its conditions still open. It is recorded as an approval by override, under your delegated authority of {authority}.",
      "lender.decision.override-confirm": "Approve by override",
      "lender.decision.cancel": "Cancel",
      "lender.decision.declined-outcome": "Declined",
      "lender.decision.declined-by": "Declined by {officer}, {role}.",
      "lender.decision.declined-timestamp": "Declined {timestamp}.",
      "lender.decision.reason": "Reason: {reason}",
      "lender.decision.override-badge": "Approved by manual override",
      "lender.decision.override-note":
        "Approved outside the automated gate by {officer}, {role}, under a delegated authority of {authority}.",
      "lender.decision.declined-announcement":
        "Case {case} declined. The decision is on the record.",
      "lender.decision.override-announcement":
        "Case {case} approved by manual override. The decision is on the record.",
      "lender.decision.decided-already": "Case {case} already has a decision on it.",

      /* Officer identity */
      "lender.officer.name": "Carolina Reyes",
      "lender.officer.role": "Mortgage officer, Santiago desk",
      "lender.officer.authority": "UF 4,000 with FOGAES",
      "lender.team.name": "Banco Falabella mortgage team",

      /* Announcements */
      "lender.status.board-ready": "Portfolio board ready. {count} cases.",
      "lender.status.case-opened": "Opened case {case}.",
      "lender.status.case-closed": "Closed case details.",
      "lender.status.filtered": "{count} cases match the current filters.",
      "lender.status.take-case": "Case {case} is now assigned to you.",
      "lender.status.reset": "Case reset to the opening state.",
      "lender.status.needs-review-opened":
        "Notifications. {notifications} on this case.",
      "lender.status.needs-review-document":
        "Notifications, on {document}. The reply box is focused.",
      "lender.status.notification-followed":
        "Opened {document}. The checks and the conversation are in the record.",
      "lender.status.assistant-opened": "Deal assistant open.",
      "lender.status.assistant-closed": "Deal assistant collapsed.",
      "lender.status.override-applied": "{document} set to {verdict} by the officer.",
      "lender.status.override-unchanged": "That document already carries that verdict.",
      "lender.status.override-needs-condition":
        "Write the condition before accepting with one.",
      "lender.status.override-refused": "Nothing has arrived on this document yet.",
      "lender.status.request-needs-reason": "Say what is wrong before sending it back.",
      "lender.status.request-sent": "{document} sent back to the borrower with your note.",
      "lender.status.borrower-message":
        "The borrower has written from her portal. New messages: {count}.",

      /* ============================================================== risk */
      "risk.summary-heading": "Credit summary",
      "risk.summary-loan": "Loan requested",
      "risk.summary-property": "Property value",
      "risk.summary-down-payment": "Down payment",
      "risk.summary-term": "Term",
      "risk.summary-rate": "Rate",
      "risk.summary-payment": "Monthly payment",
      "risk.summary-income": "Verified monthly income",

      "risk.pti-heading": "Payment to income",
      "risk.pti-explainer":
        "The monthly payment of {payment} is {ratio} of verified monthly income of {income}. Bank policy caps payment to income at {cap}.",
      "risk.pti-value": "{ratio} of income",
      "risk.pti-cap": "Policy cap {cap}",
      "risk.pti-under-cap": "Within the policy cap",

      "risk.stress-heading": "If rates rise 2 points",
      "risk.stress-explainer":
        "Priced 2 percentage points higher, the payment rises to {payment} and payment to income reaches {ratio} — above the {cap} policy cap. The case is presented with that exception stated, not hidden.",
      "risk.stress-over-cap": "Over the {cap} cap",

      "risk.policy-heading": "Policy",
      "risk.policy.payment-to-income":
        "Payment to income at or below 30% of verified net income.",
      "risk.policy.financing":
        "Financing up to 90% of the property value with the FOGAES state guarantee; 80% without it.",
      "risk.policy.property-cap":
        "New homes up to UF 4,000, with a purchase promise signed on or after 01-01-2025.",
      "risk.policy.employment":
        "Permanent contract, at least 12 months of tenure, and no gaps in pension contributions.",
      "risk.policy.appraisal":
        "Appraisal not below the purchase price, ordered on approval and valid for 90 days.",
      "risk.policy.authority":
        "Within the mortgage officer’s delegated authority of {authority}.",

      "risk.tranche-heading": "Guaranteed tranche",
      "risk.tranche-explainer":
        "The state guarantee covers {amount}, {share} of the loan — the slice above the standard 80% financing limit. It is what makes the loan financeable at 90%; it does not make it cheaper.",
      "risk.tranche-standard-label": "Financed on standard terms",
      "risk.tranche-guaranteed-label": "Covered by the state guarantee",
      "risk.tranche-note":
        "The 0.60-point rate subsidy is a separate benefit of the programme and is already priced into the rate.",

      /* ========================================================== borrower */
      "borrower.title": "Borrower portal",
      "borrower.page-title": "Banco Falabella · Home loan application",
      "borrower.crumb": "Home Loan · Online application",
      "borrower.who": "Borrower",
      "borrower.switch-to-lender": "Switch to lender view",
      "borrower.switch-to-lender-aria": "Switch to the lender view of this demo",

      "borrower.phase.simulate": "Simulation",
      "borrower.phase.pre-approval": "Pre-approval",
      "borrower.phase.documents": "Documents over WhatsApp",

      "borrower.notifications.title": "Notifications",
      "borrower.notifications.open": "Notifications, {count} new",
      "borrower.notifications.empty": "Nothing needs your attention right now.",
      "borrower.notifications.preview-aria": "Preview {document}",

      "borrower.control.play": "Play",
      "borrower.control.pause": "Pause",
      "borrower.control.demo-data": "Use demo data",
      "borrower.control.demo-data-aria":
        "Fill the simulation with the demo applicant's details and play the story",
      "borrower.control.idle": "Ready — fill the form or use the demo data",
      "borrower.control.restart": "Restart",
      "borrower.control.speed": "Speed",
      "borrower.control.speed-1x": "1×",
      "borrower.control.speed-2x": "2×",
      "borrower.control.speed-4x": "4×",
      "borrower.control.language": "Language",
      "borrower.control.language-en": "English",
      "borrower.control.language-es": "Español",
      "borrower.control.money-uf": "UF",
      "borrower.control.money-clp": "CLP",
      "borrower.control.money": "Amounts",
      "borrower.control.money-uf-title": "Show amounts in UF",
      "borrower.control.money-clp-title": "Show amounts in Chilean pesos",
      "borrower.status.money-uf": "Amounts are now shown in UF.",
      "borrower.status.money-clp": "Amounts are now shown in Chilean pesos.",
      "borrower.status.language": "Language switched to English.",
      "borrower.control.playing": "Playing demo",
      "borrower.control.paused": "Demo paused",
      "borrower.control.finished": "Demo finished",

      /* Simulator */
      "borrower.sim.title": "Simulate your home loan",
      "borrower.sim.subtitle":
        "One single form. We check your FOGAES eligibility as you type.",
      "borrower.sim.section-property": "The property",
      "borrower.sim.section-details": "Your details",
      "borrower.sim.section-verification": "Automatic verification",
      "borrower.sim.section-loan": "Your loan",
      "borrower.sim.verify-intro":
        "We don’t ask whether you meet the requirements: we check them at source and compute your affordability from the income you stated.",
      "borrower.sim.affordability": "Affordability",
      "borrower.sim.property-type": "What type of property?",
      "borrower.sim.house": "House",
      "borrower.sim.apartment": "Apartment",
      "borrower.sim.condition": "New or used?",
      "borrower.sim.new": "New",
      "borrower.sim.used": "Used",
      "borrower.sim.property-value": "Property value",
      "borrower.sim.down-payment": "Down payment",
      "borrower.sim.full-name": "Full name",
      "borrower.sim.rut": "RUT (national ID)",
      "borrower.sim.date-of-birth": "Date of birth",
      "borrower.sim.income": "Monthly net income",
      "borrower.sim.phone": "Phone (WhatsApp)",
      "borrower.sim.email": "Email",
      "borrower.sim.term": "Term",
      "borrower.sim.years": "years",
      "borrower.sim.submit": "See my result",
      "borrower.sim.footnote": "Indicative simulation. Not a credit offer.",
      "borrower.sim.summary": "Your simulation summary",
      "borrower.sim.stated-income": "Stated net income",
      "borrower.sim.max-payment": "Maximum payment ({cap})",
      "borrower.sim.simulated-payment": "Simulated payment",
      "borrower.sim.headroom": "Monthly headroom",
      "borrower.sim.uf-note": "UF amounts converted with today’s UF: {value} ({date})",
      "borrower.sim.group-personal": "Personal details",
      "borrower.sim.group-property": "The property",
      "borrower.sim.group-loan": "The loan",
      "borrower.sim.field-name": "Name",
      "borrower.sim.field-value": "Value",
      "borrower.sim.field-amount": "Amount",
      "borrower.sim.field-insurance": "Insurance",
      "borrower.sim.insurance-value": "Life, fire",
      "borrower.sim.condition-new": "New (first sale)",

      /* FOGAES verification */
      "borrower.fogaes.title": "FOGAES State Guarantee",
      "borrower.fogaes.checking": "Checking",
      "borrower.fogaes.qualifies": "Qualifies",
      "borrower.fogaes.waiting": "Waiting",
      "borrower.fogaes.checking-item": "Checking…",
      "borrower.fogaes.not-checked": "Not checked yet",
      "borrower.fogaes.saving":
        "You qualify. Rate −0.60 points, worth about {monthly} a month on the same loan, and financing up to 90% instead of 80% — {downPayment} less to find up front, on a larger loan.",
      "borrower.check.new-home.label": "New home (first sale)",
      "borrower.check.new-home.source": "Municipal completion 2026 · Aconcagua project",
      "borrower.check.new-home.result": "First sale",
      "borrower.check.value-cap.label": "Value within the programme cap",
      "borrower.check.value-cap.source": "Simulation · cap UF 4,000",
      "borrower.check.value-cap.result": "{value}",
      "borrower.check.valid-rut.label": "Individual with a valid RUT",
      "borrower.check.valid-rut.source": "Civil Registry",
      "borrower.check.valid-rut.result": "Valid",
      "borrower.check.first-home.label": "First home · no property in your name",
      "borrower.check.first-home.source": "Real Estate Registrar · tax authority",
      "borrower.check.first-home.result": "0 properties",
      "borrower.check.promise-date.label": "Purchase promise signed from 01-01-2025",
      "borrower.check.promise-date.source": "Developer · confirmed against the document",
      "borrower.check.promise-date.result": "12-03-2026",
      "borrower.check.no-subsidy.label": "No previous housing subsidy",
      "borrower.check.no-subsidy.source": "Housing Ministry (MINVU)",
      "borrower.check.no-subsidy.result": "No records",
      "borrower.check.not-debtor.label":
        "Not listed in the Child-Support Debtors Registry",
      "borrower.check.not-debtor.source": "Civil Registry · Law 21,389",
      "borrower.check.not-debtor.result": "Not listed",
      "borrower.check.fogaes-quota.label": "FOGAES quota available",
      "borrower.check.fogaes-quota.source": "FOGAES centralised system",
      "borrower.check.fogaes-quota.result": "Reserved",
      "borrower.check.affordability.label": "Affordability against your income",
      "borrower.check.affordability.source": "Bank policy · maximum {cap} of income",
      "borrower.check.affordability.result": "{ratio} of income",

      /* Pre-approval result */
      "borrower.result.pre-approved": "Pre-approved with the FOGAES guarantee",
      "borrower.result.title": "Your estimated monthly payment",
      "borrower.result.with-fogaes": "With the programme",
      "borrower.result.without-fogaes": "Standard terms",
      "borrower.result.rate": "Rate",
      "borrower.result.financing": "Financing",
      "borrower.result.down-payment": "Down payment",
      /* The two columns are two different loans, so the difference between them
         is not a saving. It is a trade: less up front, more each month. Only the
         rate is a saving, and only against the same loan. */
      "borrower.result.loan": "Loan",
      "borrower.result.trade-heading": "Why the payment on the left is higher",
      /* The two rows of the trade are two moments, not two categories, so the
         column that names them is headed with the question they answer. */
      "borrower.result.trade-col-when": "When",
      "borrower.result.trade-col-difference": "Difference",
      "borrower.result.trade-up-front": "Down Payment",
      "borrower.result.trade-monthly": "Every month",
      "borrower.result.more-monthly": "More per month",
      "borrower.result.less-monthly": "Less per month",
      "borrower.result.more-monthly-value": "{amount} more",
      "borrower.result.less-monthly-value": "{amount} less",
      "borrower.result.less-down-payment-value": "{amount} less",
      "borrower.result.trade-total":
        "Across {years} years the higher payment adds up to {total}, in today’s money — against {down} you would have had to have saved before you could buy at all.",
      "borrower.result.rate-saving": "What the lower rate saves, every month",
      "borrower.result.rate-saving-note":
        "On the same loan of {loan}, at UF + {standard} instead of UF + {rate}.",
      "borrower.result.trade-off":
        "These are two different loans. The guarantee lets you borrow 90% of the value instead of 80%, so you need {down} less up front and owe {extra} more — which is why the monthly payment is higher, not lower.",
      "borrower.result.total-saving": "Total saving over {years} years",
      "borrower.result.less-down-payment": "Less needed up front",
      "borrower.result.more-down-payment": "More needed up front",
      "borrower.result.more-down-payment-value": "{amount} more",
      "borrower.result.apr": "Indicative APR",
      "borrower.result.apply": "Submit application",
      "borrower.result.simulate-again": "Simulate again",
      "borrower.result.note":
        "Includes life and fire insurance. The 60 bp rate subsidy and the FOGAES state guarantee apply to new homes up to UF 4,000 with a purchase promise signed on or after 01-01-2025, subject to the bank’s commercial and risk assessment.",
      "borrower.result.with-financing": "90% financing · down payment {amount}",
      "borrower.result.without-financing": "Max. 80% financing · down payment {amount}",
      "borrower.result.guarantee-explainer":
        "The state guarantee is what lets you borrow 90% of the value instead of 80%. It reduces the down payment.",

      /* Portal and checklist */
      "borrower.portal.title": "Borrower portal",
      "borrower.portal.application": "Application {case}",
      "borrower.portal.property": "New house · Aconcagua project, Maipú",
      "borrower.portal.status-documents": "Awaiting documents",
      "borrower.portal.status-review": "In credit review",
      "borrower.portal.status-human": "1 item in specialist review",
      "borrower.portal.status-open": "In review · {count} open items",
      "borrower.checklist.heading": "Your documents",
      "borrower.checklist.progress": "{received} of {total} documents verified",
      "borrower.checklist.dropzone": "Drag your documents here, or click to browse",
      "borrower.checklist.dropzone-hint":
        "PDF, JPG or PNG · you can also upload them one by one from the list",
      "borrower.checklist.open-aria": "Open the review of {document}",

      /* Document drawer */
      "borrower.drawer.eyebrow": "Document review",
      "borrower.drawer.tab-review": "Review",
      "borrower.drawer.tab-document": "Document",
      "borrower.drawer.tab-history": "History",
      "borrower.drawer.tab-assistant": "Loan assistant",
      "borrower.drawer.assistant-lead": "Messages about this document with your loan officer.",
      "borrower.drawer.assistant-placeholder": "Ask about this document…",
      "borrower.drawer.assistant-empty": "No messages yet on this document.",
      "borrower.drawer.stated": "Stated in your application",
      "borrower.drawer.found": "Found in the document",
      "borrower.drawer.scan-stamp": "Scanned document · page 1",

      /* ---------------------------------------------------- the scanned pages
         What each document looks like when she opens it: the issuing body's
         letterhead, the title, and the handful of fields that matter, in the
         document's own words rather than the bank's. The tax folder carries two
         readings of the same field because the first scan cropped it, and the
         title certificate's encumbrance line is the one that stops the case. */
      "borrower.scan.national-id.org": "Chilean Civil Registry",
      "borrower.scan.national-id.title": "National ID card",
      "borrower.scan.national-id.row-run": "RUN",
      "borrower.scan.national-id.value-run": "18.452.309-4",
      "borrower.scan.national-id.row-given-names": "Given names",
      "borrower.scan.national-id.value-given-names": "JAVIERA ANDREA",
      "borrower.scan.national-id.row-surnames": "Surnames",
      "borrower.scan.national-id.value-surnames": "SOTO MIRANDA",
      "borrower.scan.national-id.row-date-of-birth": "Date of birth",
      "borrower.scan.national-id.value-date-of-birth": "22-05-1990",
      "borrower.scan.national-id.row-expiry": "Expiry",
      "borrower.scan.national-id.value-expiry": "14-11-2029",

      "borrower.scan.payslips.org": "CONSTRUCTORA ANDES SpA",
      "borrower.scan.payslips.title": "Payslip — July 2026",
      "borrower.scan.payslips.row-employee": "Employee",
      "borrower.scan.payslips.value-employee": "JAVIERA SOTO MIRANDA",
      "borrower.scan.payslips.row-rut": "RUT",
      "borrower.scan.payslips.value-rut": "18.452.309-4",
      "borrower.scan.payslips.row-base-salary": "Base salary",
      "borrower.scan.payslips.value-base-salary": "$2,850,000",
      "borrower.scan.payslips.row-deductions": "Total deductions",
      "borrower.scan.payslips.value-deductions": "$450,000",
      "borrower.scan.payslips.row-net-pay": "Net pay",
      "borrower.scan.payslips.value-net-pay": "$2,400,000",

      "borrower.scan.employment-tenure.org": "CONSTRUCTORA ANDES SpA",
      "borrower.scan.employment-tenure.title": "Certificate of length of service",
      "borrower.scan.employment-tenure.row-employee": "Employee",
      "borrower.scan.employment-tenure.value-employee": "JAVIERA SOTO MIRANDA",
      "borrower.scan.employment-tenure.row-role": "Role",
      "borrower.scan.employment-tenure.value-role": "Senior analyst",
      "borrower.scan.employment-tenure.row-contract-start": "Contract start",
      "borrower.scan.employment-tenure.value-contract-start": "01-06-2022",
      "borrower.scan.employment-tenure.row-contract-type": "Contract type",
      "borrower.scan.employment-tenure.value-contract-type": "Permanent",

      "borrower.scan.pension-contributions.org": "AFP HABITAT",
      "borrower.scan.pension-contributions.title": "Pension contributions certificate",
      "borrower.scan.pension-contributions.row-member": "Member",
      "borrower.scan.pension-contributions.value-member": "JAVIERA SOTO MIRANDA",
      "borrower.scan.pension-contributions.row-rut": "RUT",
      "borrower.scan.pension-contributions.value-rut": "18.452.309-4",
      "borrower.scan.pension-contributions.row-periods": "Periods",
      "borrower.scan.pension-contributions.value-periods": "Aug 2025 / Jul 2026",
      "borrower.scan.pension-contributions.row-months": "Months contributed",
      "borrower.scan.pension-contributions.value-months": "12",

      "borrower.scan.tax-folder.org": "SERVICIO DE IMPUESTOS INTERNOS",
      "borrower.scan.tax-folder.title": "Tax folder for credit applications",
      "borrower.scan.tax-folder.row-taxpayer": "Taxpayer",
      "borrower.scan.tax-folder.value-taxpayer": "JAVIERA SOTO MIRANDA",
      "borrower.scan.tax-folder.row-rut": "RUT",
      "borrower.scan.tax-folder.value-rut": "18.452.309-4",
      "borrower.scan.tax-folder.value-rut-unreadable": "18.452.30_-4",
      "borrower.scan.tax-folder.row-periods": "Periods",
      "borrower.scan.tax-folder.value-periods": "12",
      "borrower.scan.tax-folder.row-issue-date": "Issue date",
      "borrower.scan.tax-folder.value-issue-date": "02-08-2026",
      "borrower.scan.tax-folder.row-purpose": "Purpose",
      "borrower.scan.tax-folder.value-purpose": "Credit purposes",

      "borrower.scan.down-payment-proof.org": "BANCO FALABELLA",
      "borrower.scan.down-payment-proof.title": "Savings account statement — July 2026",
      "borrower.scan.down-payment-proof.row-holder": "Account holder",
      "borrower.scan.down-payment-proof.value-holder": "JAVIERA SOTO MIRANDA",
      "borrower.scan.down-payment-proof.row-balance": "Available balance",
      "borrower.scan.down-payment-proof.value-balance": "$15,100,000",
      "borrower.scan.down-payment-proof.row-seasoning": "Funds seasoning",
      "borrower.scan.down-payment-proof.value-seasoning": "6 months",

      "borrower.scan.purchase-promise.org": "Santiago Notary · Register 4,219",
      "borrower.scan.purchase-promise.title": "Purchase promise agreement",
      "borrower.scan.purchase-promise.row-seller": "Seller",
      "borrower.scan.purchase-promise.value-seller": "INMOBILIARIA ACONCAGUA SpA",
      "borrower.scan.purchase-promise.row-buyer": "Buyer",
      "borrower.scan.purchase-promise.value-buyer": "JAVIERA SOTO MIRANDA",
      "borrower.scan.purchase-promise.row-price": "Price",
      "borrower.scan.purchase-promise.value-price": "UF 3,500",
      "borrower.scan.purchase-promise.row-signature-date": "Signature date",
      "borrower.scan.purchase-promise.value-signature-date": "12-03-2026",

      "borrower.scan.first-home-affidavit.org": "Sworn statement",
      "borrower.scan.first-home-affidavit.title": "First home and absence of subsidy",
      "borrower.scan.first-home-affidavit.row-declarant": "Declarant",
      "borrower.scan.first-home-affidavit.value-declarant": "JAVIERA SOTO MIRANDA",
      "borrower.scan.first-home-affidavit.row-rut": "RUT",
      "borrower.scan.first-home-affidavit.value-rut": "18.452.309-4",
      "borrower.scan.first-home-affidavit.row-subject": "Subject",
      "borrower.scan.first-home-affidavit.value-subject": "First home · no previous subsidy",
      "borrower.scan.first-home-affidavit.row-signature": "Signature",
      "borrower.scan.first-home-affidavit.value-signature": "Signed 05-08-2026",

      "borrower.scan.title-certificate.org": "Santiago Real Estate Registrar",
      "borrower.scan.title-certificate.title": "Current title certificate",
      "borrower.scan.title-certificate.row-owner": "Owner",
      "borrower.scan.title-certificate.value-owner": "INMOBILIARIA ACONCAGUA SpA",
      "borrower.scan.title-certificate.row-tax-roll": "Tax roll",
      "borrower.scan.title-certificate.value-tax-roll": "1234-56",
      "borrower.scan.title-certificate.row-registration": "Registration",
      "borrower.scan.title-certificate.value-registration": "Folio 5,120 No.3,410 (2026)",
      "borrower.scan.title-certificate.row-encumbrances": "Encumbrances",
      "borrower.scan.title-certificate.value-encumbrances":
        "Mortgage in favour of another bank — Folio 1,842 No.1,190 (2024)",
      "borrower.drawer.no-history": "Nothing uploaded for this document yet.",
      "borrower.banner.analysing.title": "Analysing the document…",
      "borrower.banner.analysing.body":
        "We’re extracting the fields and comparing them with your application.",
      "borrower.banner.accepted.title": "Document accepted",
      "borrower.banner.accepted.body":
        "Every field matches what you declared in your application.",
      "borrower.banner.rejected.title": "We found {count} discrepancies",
      "borrower.banner.rejected.body":
        "Upload the correct document to move this item forward.",
      "borrower.banner.incomplete.title": "1 field still needs confirming",
      "borrower.banner.incomplete.body":
        "Page 1 arrived cropped and the taxpayer RUT could not be read (18.452.30_-4). The other three fields on the folder matched.",
      "borrower.banner.review.title": "Being reviewed by a specialist",
      "borrower.banner.review.body":
        "A mortgage specialist is checking the encumbrance on the title. Nothing is needed from you.",
      "borrower.tag.verified": "Verified",
      "borrower.tag.mismatch": "Mismatch",
      "borrower.tag.missing": "Missing",
      "borrower.tag.note": "Note",

      /* Chat */
      "borrower.chat.assistant-name": "Banco Falabella mortgage assistant",
      "borrower.chat.online": "online · mortgage assistant",
      "borrower.chat.typing": "typing…",
      "borrower.chat.placeholder": "Type a message",
      "borrower.chat.today": "TODAY",
      "borrower.chat.send": "Send",
      "borrower.chat.you": "You",
      "borrower.chat.team-name": "Banco Falabella mortgage team",
      "borrower.chat.blank": "Type a message before sending it.",
      "borrower.chat.sent": "Message sent. A specialist will pick it up.",

      /* --------------------------------------------- the assistant keeps talking
         She writes, and the assistant answers a beat later on its own. Which
         answer she gets is decided by the state of the document she is asking
         about, never at random — the same question twice gets the same reply,
         and the demo is repeatable. None of these claim to have resolved
         anything: the assistant explains and hands off, it does not decide. */
      "borrower.assistant.reply-specialist":
        "A mortgage specialist has this one and is checking it with the registrar's document. Nothing is needed from you — I'll write here as soon as there's an answer. 🔍",
      "borrower.assistant.reply-rejected":
        "Page 1 in full is all we need, with the RUT legible on the right margin. Send it whenever suits you and I'll check it straight away. 📄",
      "borrower.assistant.reply-accepted":
        "That one is already accepted, so there's nothing more to do on it. I've passed your note to the team and they'll come back to you here. 👍",
      "borrower.assistant.reply-ack":
        "Thanks, Javiera — I've passed that to the mortgage team and it's on your file. They'll answer you here. 💬",
      "borrower.assistant.reply-escalated":
        "Your file is with a mortgage specialist and hasn't stopped moving. I've added your message to the case so they see it with everything else. 🙌",
      "borrower.chat.received":
        "The Banco Falabella mortgage team has replied. New messages: {count}.",
      "borrower.chat.fab": "Questions on WhatsApp",
      "borrower.notice.escalated-title": "This item is with a specialist",
      "borrower.notice.escalated-body":
        "We flagged the encumbrance on the title certificate and a mortgage specialist is reviewing it with the document. Nothing is expected from you.",

      /* Scripted narrative — the assistant thread */
      "borrower.msg.greeting":
        "Hi Javiera! 👋 I’m the Banco Falabella mortgage assistant. We received your application {case} for {property} with the FOGAES state guarantee.",
      "borrower.msg.guide":
        "I’ll guide you here until your file is complete. There are 9 documents; I’ll ask for them one at a time and explain what each is for. You can reply with a photo or a PDF — if something doesn’t match, I’ll tell you right away.",
      "borrower.msg.doc1-request":
        "*1 of 9 — National ID card (both sides)*\nWe use it to verify your identity with the civil registry before the assessment.",
      "borrower.msg.doc1-verified":
        "✅ *ID verified.* RUT 18.452.309-4 matches the application and the document is valid until 2029.",
      "borrower.msg.doc2-request":
        "*2 of 9 — Your last 3 payslips*\nWe use them to compute your average net income and the payment-to-income ratio.",
      "borrower.msg.here-you-go": "Here you go 👇",
      "borrower.msg.doc2-wrong-document":
        "⚠️ *This isn’t a payslip.* It’s your pension contributions certificate.\n\nWe do need it later (document 4), so I’ve saved it and marked it as received. 👍\n\nFor this step I need the payslips for *May, June and July 2026*: the document your employer issues showing gross pay, deductions and net pay.",
      "borrower.msg.sorry-here-they-are": "Ah, sorry. Here they are.",
      "borrower.msg.doc2-verified":
        "✅ *All 3 payslips received* (May, June and July 2026).\nAverage net income: *{income}*. Your estimated payment of {payment} is *{ratio}* of your income — within the bank’s policy (max. {cap}).",
      "borrower.msg.doc3-request":
        "*3 of 9 — Proof of employment tenure*\nConfirms more than 12 months on a permanent contract, an assessment requirement.",
      "borrower.msg.doc3-verified":
        "✅ *Tenure confirmed:* 4 years 2 months, permanent contract.",
      "borrower.msg.doc4-already-covered":
        "*4 of 9 — Last 12 months of pension contributions*\n✅ Already covered: it’s the certificate you sent me earlier. 12 continuous months, no gaps. One less to send. 🙂",
      "borrower.msg.doc5-request":
        "*5 of 9 — Tax folder for credit purposes*\nDownload it at sii.cl. Note: it must be the “for credit purposes” version, not the personal one.",
      "borrower.msg.doc5-incomplete":
        "⚠️ *Right document, but one field is missing.*\nOn page 1 your RUT is cut off: it reads *18.452.30_-4* and I can’t confirm the missing digit.\n\nCould you resend just page 1 in full? The rest is perfect: 12 periods, issued 02-08-2026, for credit purposes. ✔️",
      "borrower.msg.will-resend-later":
        "OK, I’ll download it from the tax site again and send it later.",
      "borrower.msg.doc5-left-open":
        "Perfect. I’ll leave the item open in your portal — you can upload page 1 there whenever you like, without coming back to this chat. Let’s carry on. 👍",
      "borrower.msg.doc6-request":
        "*6 of 9 — Proof of down payment*\nYour savings account statement confirms the {downPayment} down payment.",
      "borrower.msg.doc6-verified":
        "✅ *Funds confirmed:* $15,100,000 available, above the {downPayment} required.",
      "borrower.msg.doc7-request":
        "*7 of 9 — Purchase promise agreement* 🏛️ FOGAES\nThis is the key document for the benefit: for FOGAES the promise must be signed on or after 01-01-2025.",
      "borrower.msg.doc7-verified":
        "✅ *Promise signed on 12-03-2026* — meets the FOGAES requirement.\nPrice {property}, new home (first sale), Inmobiliaria Aconcagua. Your 60 bp rate subsidy is confirmed.",
      "borrower.msg.doc8-request":
        "*8 of 9 — First-home affidavit* 🏛️\nWe already checked the Child-Support Debtors Registry and your MINVU records online when you simulated, so you don’t need to request those certificates. Just sign the affidavit I pre-filled for you and send it back.",
      "borrower.msg.doc8-verified":
        "✅ *Affidavit received and signed.* It matches what we verified online: no previous housing subsidy and no entry in the Debtors Registry. FOGAES guarantee confirmed. 🏛️",
      "borrower.msg.doc9-request":
        "*9 of 9 — Current title certificate*\nIssued by the Real Estate Registrar. Last one. 🙌",
      "borrower.msg.doc9-exception":
        "Thanks, Javiera. I need to pause here. 🔍\n\n*Your title certificate shows a mortgage from another bank* registered on the property, which wasn’t in the application. A mortgage specialist reviews this. I’ve already passed it on with the document and the registration details (Folio 1,842 No.1,190, 2024).",
      "borrower.msg.doc9-no-hold":
        "It doesn’t stop your assessment: your file has already moved to credit review. We’ll come back to you with the answer, and there’s nothing for you to do on this item.",
      "borrower.msg.open-items":
        "You have *2 open items* in the portal:\n\n• *Tax folder* — page 1 with the full RUT is missing. You can upload it yourself from the portal.\n• *Title certificate* — a specialist is reviewing it, nothing for you to do.\n\nIn the portal you can open each document and see exactly what we flagged. 👀",

      /* Scripted narrative — the activity feed */
      "borrower.feed.doc1-accepted": "ID card verified · RUT matches",
      "borrower.feed.doc2-rejected":
        "Document rejected: pension certificate sent instead of payslips",
      "borrower.feed.doc2-accepted":
        "Payslips verified · average income {income} · payment to income {ratio}",
      "borrower.feed.doc3-accepted": "Employment tenure confirmed · 4 years 2 months",
      "borrower.feed.doc4-reassigned":
        "Pension contributions received and reassigned automatically (12 continuous months)",
      "borrower.feed.doc5-incomplete":
        "Tax folder incomplete: RUT unreadable on page 1",
      "borrower.feed.doc6-accepted": "Down payment confirmed · $15,100,000 available",
      "borrower.feed.doc7-accepted":
        "Promise verified · signed 12-03-2026 · FOGAES compliant",
      "borrower.feed.doc8-accepted":
        "FOGAES requirements confirmed · state guarantee active",
      "borrower.feed.doc9-escalated":
        "Sent to specialist review · third-party mortgage detected",

      /* Scripted narrative — the attachments she sends */
      "borrower.file.national-id": "national_id_both_sides.jpg",
      "borrower.file-meta.national-id": "JPG · 1.8 MB",
      "borrower.file.pension-certificate": "pension_contributions_certificate.pdf",
      "borrower.file-meta.pension-certificate": "PDF · 12 pages",
      "borrower.file.payslips": "payslips_may_jun_jul_2026.pdf",
      "borrower.file-meta.payslips": "PDF · 3 pages",
      "borrower.file.employment-tenure": "employment_tenure.pdf",
      "borrower.file-meta.employment-tenure": "PDF · 1 page",
      "borrower.file.tax-folder": "tax_folder_for_credit.pdf",
      "borrower.file-meta.tax-folder": "PDF · 14 pages",
      "borrower.file.savings-statement": "savings_statement_jul2026.pdf",
      "borrower.file-meta.savings-statement": "PDF · 4 pages",
      "borrower.file.purchase-promise": "purchase_promise_signed.pdf",
      "borrower.file-meta.purchase-promise": "PDF · 9 pages",
      "borrower.file.affidavit": "first_home_affidavit_signed.pdf",
      "borrower.file-meta.affidavit": "PDF · 2 pages",
      "borrower.file.title-certificate": "current_title_certificate.pdf",
      "borrower.file-meta.title-certificate": "PDF · 3 pages"
    },

    /* ============================================================== espanol
     *
     * Chilean Spanish, the same keys and the same {placeholders} as en, so the
     * pages interpolate the same computed values into either table. Domain
     * terms are the ancestor demo's own (DISENO.md, solicitante.html,
     * ejecutivo.html) rather than invented here: Carpeta Tributaria,
     * certificado de dominio vigente, Fojas, alzamiento, pie, dividendo,
     * rol de avaluo, cotizaciones.
     *
     * Numbers keep Chilean convention through NUMBER_LOCALE es-CL, so one call
     * prints "UF 3.150" here and "UF 3,150" in English.
     */
    es: {
      /* ============================================================ common */
      "common.brand-name": "Banco Falabella",
      "common.close": "Cerrar",
      "common.cancel": "Cancelar",
      "common.send": "Enviar",
      "common.expand": "Ampliar",
      "common.collapse": "Contraer",
      "common.back-to-board": "Volver al tablero",
      "common.open": "Abrir",
      "common.confirm": "Confirmar",
      "common.retry": "Reintentar",
      "common.loading": "Cargando…",
      "common.saved": "Guardado",
      "common.empty": "—",
      "common.none": "Ninguno",
      "common.yes": "Sí",
      "common.no": "No",
      "common.skip-link": "Ir al contenido principal",
      "common.demo-badge": "Demo",
      "common.demo-data-note": "Los datos personales que se muestran son de demostración.",
      "common.view-only":
        "El almacenamiento del navegador no está disponible, así que esta demo funciona solo en memoria. No se guardará nada.",
      "common.prototype-disclaimer":
        "Demo de prototipo. Cifras, tasas, documentos y decisiones son ilustrativos y no constituyen una oferta de crédito.",
      "common.readonly-loan": "Caso de demostración, solo lectura",
      "common.readonly-note":
        "Este caso es una ficha de demostración de solo lectura, así que sus acciones están desactivadas.",
      "common.uf-note": "Montos en UF convertidos a {value}, publicado el {date}.",

      /* ============================================================= stage */
      "stage.new-applications": "Solicitudes nuevas",
      "stage.gathering-information": "Reunión de antecedentes",
      "stage.underwriting": "Evaluación de riesgo",
      "stage.approved": "Aprobado",
      "stage.waiting-to-close": "Esperando cierre",
      "stage.closed": "Cerrado",
      "stage.disbursed": "Cursado",

      /* =============================================================== doc */
      "doc.national-id.name": "Cédula de Identidad (ambos lados)",
      "doc.national-id.purpose": "Verifica tu identidad con el Registro Civil.",
      "doc.payslips.name": "3 últimas liquidaciones de sueldo",
      "doc.payslips.purpose":
        "Sirven para calcular tu renta líquida promedio y la relación dividendo/renta.",
      "doc.employment-tenure.name": "Certificado de antigüedad laboral",
      "doc.employment-tenure.purpose": "Confirma contrato indefinido y antigüedad mínima.",
      "doc.pension-contributions.name": "Cotizaciones AFP últimos 12 meses",
      "doc.pension-contributions.purpose": "Verifica renta continua, sin lagunas.",
      "doc.tax-folder.name": "Carpeta Tributaria para fines crediticios (SII)",
      "doc.tax-folder.purpose": "Verificación de renta con el Servicio de Impuestos Internos.",
      "doc.down-payment-proof.name": "Acreditación del pie y patrimonio",
      "doc.down-payment-proof.purpose": "Confirma que los fondos del pie están disponibles.",
      "doc.purchase-promise.name": "Promesa de compraventa",
      "doc.purchase-promise.purpose":
        "Debe estar firmada el 01-01-2025 o después para calificar a FOGAES.",
      "doc.first-home-affidavit.name": "Declaración jurada de primera vivienda (firmada)",
      "doc.first-home-affidavit.purpose":
        "Ya consultamos en línea el Registro de Deudores; solo falta tu firma.",
      "doc.title-certificate.name": "Certificado de dominio vigente",
      "doc.title-certificate.purpose": "Emitido por el Conservador de Bienes Raíces.",

      /* =========================================================== verdict */
      "verdict.not-uploaded": "Sin subir",
      "verdict.under-review": "En revisión",
      "verdict.rejected": "Rechazado",
      "verdict.accepted": "Aceptado",
      "verdict.accepted-with-condition": "Aceptado con condición",

      /* ============================================================ review */
      "review.borrower-message": "Mensaje de la solicitante",
      "review.new-upload": "Nueva carga",
      "review.document-exception": "Excepción en documento",
      "review.deed-deadline": "Plazo de escritura",

      /* ============================================================= audit */
      "audit.application-submitted": "Solicitud enviada",
      "audit.document-checklist-started": "Checklist de documentos iniciado",
      "audit.borrower-message-sent": "Mensaje de la solicitante enviado",
      "audit.lender-reply-sent": "Respuesta del banco enviada",
      "audit.assistant-message-sent": "El agente respondió a la solicitante",
      "audit.review-item-resolved": "Ítem de revisión resuelto",
      "audit.new-upload-received": "Nueva carga recibida",
      "audit.document-uploaded": "Documento subido",
      "audit.document-verdict-changed": "Estado del documento modificado",
      "audit.document-exception-created": "Excepción de documento levantada",
      "audit.deed-deadline-raised": "Plazo de escritura levantado",
      "audit.condition-cleared": "Condición cumplida",
      "audit.stage-changed": "Etapa del caso modificada",
      "audit.developer-query-sent": "Consulta enviada a la inmobiliaria",
      "audit.developer-reply-received": "La inmobiliaria respondió",
      "audit.borrower-reminder-sent": "Recordatorio enviado a la solicitante",
      "audit.agent-intake-reviewed": "El agente revisó la solicitud",
      "audit.agent-message-sent": "El agente escribió a la solicitante",
      "audit.agent-followup-sent": "El agente hizo seguimiento con la solicitante",
      "audit.agent-document-checked": "El agente ejecutó las verificaciones del documento",
      "audit.agent-registry-checked": "El agente consultó el registro de la propiedad",
      "audit.agent-policy-checked": "El agente contrastó el caso con la política",
      "audit.agent-case-routed": "El agente derivó el caso a la mesa hipotecaria",
      "audit.agent-case-scanned": "El agente escaneó el caso",
      "audit.agent-affordability-recalculated": "El agente recalculó la capacidad de pago",
      "audit.agent-handoff-prepared": "El agente preparó la derivación",

      "audit.detail.intake-reviewed":
        "Checklist armado desde las reglas del producto: nueve documentos, garantía FOGAES, declaración de primera vivienda. Sin expediente previo para este RUT.",
      "audit.detail.checklist-message":
        "“Hola Javiera: esto es todo lo que necesitamos para el crédito. Sube cada documento cuando lo tengas y los voy revisando a medida que lleguen.”",
      "audit.detail.down-payment-checked":
        "Titular, saldo y antigüedad de 90 días coincidieron con la cartola. 3 de 3 campos verificados.",
      "audit.detail.followup-one":
        "Recordatorio 1 de 3. Carpeta tributaria y certificado de dominio aún pendientes al cierre del día.",
      "audit.detail.followup-two":
        "Recordatorio 2 de 3. Ambos documentos llegaron en las dos horas siguientes.",
      "audit.detail.tax-folder-checked":
        "El RUT de la página 1 llegó ilegible. 1 de 4 campos no se pudo leer, así que el documento se devolvió.",
      "audit.detail.tax-folder-message":
        "“El RUT de la página 1 de tu carpeta tributaria llegó ilegible, ¿puedes enviar esa página de nuevo?”",
      "audit.detail.registry-checked":
        "Certificado obtenido del Conservador de Bienes Raíces. Fojas 1.842 N°1.190 (2024): una hipoteca a favor de otro banco, no declarada en la solicitud.",
      "audit.detail.policy-checked":
        "Un gravamen no declarado excede lo que el agente puede resolver. Caso marcado para una persona.",
      "audit.detail.case-routed":
        "Derivado a la mesa hipotecaria de Santiago con el certificado, los datos de inscripción y la conversación de la solicitante.",
      "audit.detail.case-scanned":
        "Al momento del escaneo: 2 documentos sin aceptar, 2 ítems abiertos, 2 condiciones sin cumplir.",
      "audit.detail.affordability":
        "Carga financiera y ratio estresado recalculados desde las liquidaciones aceptadas. Ambos dentro de política.",
      "audit.detail.handoff-prepared":
        "Resumen del caso, las dos excepciones y las dos condiciones de aprobación preparados para la ejecutiva de turno.",

      "audit.loan-approved": "Crédito aprobado con condiciones",
      "audit.loan-approved-override": "Crédito aprobado por anulación manual",
      "audit.loan-declined": "Solicitud rechazada por la ejecutiva",
      "audit.approval-signed": "Aprobación firmada",
      "audit.loan-disbursed": "Crédito cursado",
      "audit.case-closed": "Caso cerrado y archivado",
      "audit.case-reset": "Caso reiniciado al estado inicial",

      /* ============================================================ lender */
      "lender.title": "Portal del ejecutivo",
      "lender.page-title": "Banco Falabella · Portal del ejecutivo",
      "lender.logo-alt": "Banco Falabella",
      "lender.logo-reset-aria": "Quitar todos los filtros y mostrar todos los casos",
      "lender.search-label": "Buscar caso, solicitante o dirección",
      "lender.search-placeholder": "Buscar caso, solicitante o dirección",
      "lender.language.aria-label": "Idioma",
      "lender.language.en": "EN",
      "lender.language.es": "ES",
      "lender.language.en-title": "Show this portal in English",
      "lender.language.es-title": "Ver este portal en español",
      "lender.status.language": "Idioma cambiado a español.",
      "lender.money.aria-label": "Mostrar montos en",
      "lender.money.uf": "UF",
      "lender.money.uf-title": "Mostrar los montos en UF",
      "lender.money.clp": "CLP",
      "lender.money.clp-title": "Mostrar los montos en pesos chilenos",
      "lender.status.money-uf": "Los montos ahora se muestran en UF.",
      "lender.status.money-clp": "Los montos ahora se muestran en pesos chilenos.",

      "lender.switch-to-borrower": "Ver como solicitante",
      "lender.switch-to-borrower-aria": "Cambiar a la vista de la solicitante en esta demo",

      "lender.nav.aria-label": "Vistas de la cartera",
      "lender.nav.pipeline": "Cartera",
      "lender.nav.needs-review": "Notificaciones",
      "lender.nav.signing-soon": "Firma próxima",
      "lender.nav.disbursed": "Cursados",
      "lender.nav.closed-archived": "Cerrados",

      "lender.metrics-aria-label": "Resumen de la cartera",
      "lender.metric.active-origination": "Originación activa",
      "lender.metric.needs-review": "Notificaciones",
      "lender.metric.signing-soon": "Firma próxima",

      "lender.toolbar.stage": "Etapa",
      "lender.toolbar.all-stages": "Todas las etapas",
      "lender.toolbar.reason": "Motivo de revisión",
      "lender.toolbar.all-reasons": "Todos los motivos",
      "lender.toolbar.sort": "Ordenar",
      "lender.toolbar.sort-deed-date": "Fecha de cierre",
      "lender.toolbar.sort-newest": "Solicitud más reciente",
      "lender.toolbar.sort-amount": "Monto solicitado",
      "lender.toolbar.no-match": "Ningún caso coincide con esta búsqueda.",
      "lender.toolbar.clear-search": "Limpiar búsqueda",

      "lender.page.eyebrow": "Vista general de la cartera",
      "lender.page.matching": "{count} casos coinciden",
      "lender.board.aria-label": "Tablero de casos por etapa",
      "lender.board.empty-column": "Sin casos que coincidan",

      "lender.card.open-aria": "Abrir el caso {case}, {borrower}",
      "lender.card.needs-review": "Notificaciones",
      "lender.card.review-chip": "{notifications} · {reason}",
      "lender.card.deed-date": "Cierre {date}",
      "lender.card.live-case": "En vivo",
      "lender.card.pending-title": "Título pendiente",
      "lender.card.pending-inspection": "Inspección pendiente",
      "lender.card.pending-both": "Título + inspección pendientes",
      "lender.card.pending-aria": "Marcado: {what}.",

      "lender.substatus.documents-progress": "{received} de {total} documentos",
      "lender.substatus.submitted-today": "Ingresada hoy",
      "lender.substatus.application-received": "Solicitud recibida",
      "lender.substatus.new-upload": "Nueva carga",
      "lender.substatus.appraisal-below-request": "Tasación bajo lo solicitado",
      "lender.substatus.credit-review": "En evaluación de riesgo",
      "lender.substatus.deed-in-days": "Escritura en {days} días",
      "lender.substatus.clear-to-sign": "Listo para firmar",
      "lender.substatus.awaiting-closing": "Escritura firmada · esperando cierre",
      "lender.substatus.disbursed-on": "Cursado el {date}",
      "lender.substatus.performing": "Al día",
      "lender.substatus.paid-off-on": "Pagado el {date}",

      "lender.tabs.aria-label": "Expediente del caso",
      "lender.tab.overview": "Resumen",
      "lender.tab.application": "Solicitud",
      "lender.tab.documents": "Documentos",
      "lender.tab.risk": "Riesgo",
      "lender.tab.conversation": "Conversación",
      "lender.tab.audit": "Trazabilidad",

      "lender.notifications.title": "Avisos del caso",
      "lender.notifications.open": "Avisos del caso, {count} abiertos",
      "lender.notifications.empty": "Abre un caso para ver qué está esperando.",
      "lender.notifications.clear": "Nada en este caso te necesita.",
      "lender.notifications.review-cta": "Abrir el documento",
      "lender.notifications.exception":
        "Un chequeo de este documento no coincidió. Ábrelo para ver la comparación.",
      "lender.notifications.new-upload": "Llegó un archivo nuevo y espera un veredicto.",
      "lender.notifications.borrower-message": "{borrower} escribió sobre este documento.",
      "lender.notifications.deed-deadline":
        "La fecha de escritura está cerca y el caso no está firmado.",
      "lender.notifications.detail.title-certificate":
        "El certificado registra una hipoteca a favor de otro banco en Fojas 1.842 N°1.190 (2024). La solicitud declaró sin gravámenes. Todo lo demás del certificado — propietario, rol de avalúo, vigencia — coincidió.",
      "lender.notifications.detail.tax-folder":
        "La página 1 llegó cortada y no se pudo leer el RUT del contribuyente (18.452.30_-4). Los otros tres campos de la carpeta coincidieron.",
      "lender.notifications.detail.purchase-promise":
        "La promesa de compraventa se firmó tres semanas después del informe de tasación. Debería haberlo seguido de inmediato. El resto del documento — partes, precio, propiedad — coincidió con el expediente.",

      "lender.needs.alert": "Notificaciones",
      "lender.needs.alert-aria": "{notifications} en este caso — ir a ellas",
      "lender.needs.count-one": "1 notificación",
      "lender.needs.count-many": "{count} notificaciones",
      "lender.needs.condition-label": "Condición {id}",
      "lender.needs.condition-clears-document": "Se cumple cuando se acepta {document}.",
      "lender.needs.open-document": "Abrir {document}",

      "lender.analysis.title": "Lo que dice el expediente",
      "lender.analysis.subtitle":
        "Revisado automáticamente · {uploaded} de {total} documentos recibidos",
      "lender.analysis.correct-heading": "En orden",
      "lender.analysis.wrong-heading": "Requiere revisión",
      "lender.analysis.checks-failed": "{count} chequeo(s) de campo no coincidieron",
      "lender.analysis.open-item": "{reason} · {document}",
      "lender.analysis.open-item-aria": "Abrir {document} para resolver {reason}",
      "lender.analysis.none-wrong": "No queda nada pendiente en este caso.",
      "lender.analysis.none-holding": "Todavía no hay nada resuelto en este caso.",
      "lender.analysis.documents-accepted": "{count} de {total} documentos aceptados",
      "lender.analysis.documents-review": "{count} de {total} documentos en revisión",
      "lender.analysis.documents-missing": "{count} documento(s) aún sin recibir",
      "lender.analysis.checks-passed": "{count} de {total} chequeos de campo coincidieron",
      "lender.analysis.affordability-ok": "Dividendo/renta {ratio}, bajo el techo de {cap}",
      "lender.analysis.affordability-over": "Dividendo/renta {ratio}, sobre el techo de {cap}",
      "lender.analysis.guarantee": "Garantía FOGAES confirmada sobre {amount}",
      "lender.analysis.gate-open": "Ambas condiciones cumplidas · listo para aprobar",
      "lender.analysis.gate-blocked": "{count} condición(es) por cumplir",

      "lender.workspace.eyebrow": "Caso {case}",
      "lender.workspace.borrower-line": "{borrower}",
      "lender.workspace.close-aria": "Cerrar el detalle del caso",
      "lender.workspace.expand-aria": "Ampliar el detalle del caso a pantalla completa",
      "lender.workspace.drive-aria": "Abrir los archivos del caso {case} en Google Drive, en una pestaña nueva",
      "lender.workspace.chip-guarantee": "Garantía FOGAES",
      "lender.workspace.chip-needs-review": "Notificaciones · {count}",

      "lender.overview.needs-review-heading": "Notificaciones",
      "lender.overview.open-count": "{count} abiertos",
      "lender.overview.queue-position": "{position} de {total}",
      "lender.overview.all-clear": "Nada requiere tu atención en este caso",
      "lender.overview.snapshot-heading": "Ficha del caso",
      "lender.overview.snapshot-requested": "Solicitado",
      "lender.overview.snapshot-deed-date": "Fecha de cierre",
      "lender.overview.snapshot-documents": "Documentos",
      "lender.overview.snapshot-documents-value": "{received} de {total}",
      "lender.overview.snapshot-dti": "Dividendo/renta",
      "lender.overview.application-card": "Solicitud",
      "lender.overview.documents-card": "Estado de los documentos",
      "lender.overview.activity-heading": "Actividad reciente",
      "lender.overview.view-audit": "Ver la trazabilidad completa",
      "lender.overview.no-activity": "Todavía no hay actividad registrada.",

      "lender.review.reply-label": "Responder sobre este ítem",
      "lender.review.reply-placeholder": "Responder a {borrower}…",
      "lender.review.reply-in-chat": "Responder en la conversación",
      "lender.review.mark-resolved": "Marcar resuelto",
      "lender.review.send-reply": "Enviar respuesta y resolver",
      "lender.review.decision-label": "Decisión",
      "lender.review.decision.reply": "Responder y resolver",
      "lender.review.decision.accepted": "Aceptar el documento",
      "lender.review.decision.accepted-with-condition": "Aceptar con una condición",
      "lender.review.decision.send-back": "Devolver el documento",
      "lender.review.decision.resolve": "Resolver sin responder",
      "lender.review.apply": "Aplicar",
      "lender.review.decision-refused":
        "Esa decisión necesita un documento detrás. Responde o resuelve este ítem.",
      "lender.review.resolved-announcement": "Ítem de revisión resuelto: {reason}.",
      "lender.review.reply-announcement":
        "Respuesta enviada a {borrower}. Ítem de revisión resuelto.",
      "lender.review.blank-reply": "Escribe una respuesta antes de enviarla.",

      "lender.application.property-heading": "La propiedad",
      "lender.application.loan-heading": "La solicitud de crédito",
      "lender.application.borrower-heading": "La solicitante",
      "lender.application.address": "Dirección",
      "lender.application.property-type": "Tipo de propiedad",
      "lender.application.property-condition": "Condición",
      "lender.application.property-value": "Valor de la propiedad",
      "lender.application.project": "Proyecto",
      "lender.application.tax-roll": "Rol de avalúo",
      "lender.application.loan-amount": "Monto solicitado",
      "lender.application.down-payment": "Pie",
      "lender.application.term": "Plazo",
      "lender.application.rate": "Tasa",
      "lender.application.financing": "Financiamiento",
      "lender.application.guarantee": "Garantía estatal",
      "lender.application.name": "Nombre completo",
      "lender.application.rut": "RUT",
      "lender.application.date-of-birth": "Fecha de nacimiento",
      "lender.application.income": "Renta líquida mensual verificada",
      "lender.application.phone": "Teléfono (WhatsApp)",
      "lender.application.email": "Correo electrónico",
      "lender.application.submitted": "Solicitud enviada",

      "lender.documents.heading": "Documentos del expediente",
      "lender.documents.no-file": "Todavía no se recibe archivo",
      "lender.documents.channel-label": "Vía",
      "lender.documents.channel-whatsapp": "Recibido por WhatsApp",
      "lender.documents.channel-portal": "Subido desde el portal de la solicitante",
      "lender.documents.page-heading": "La página tal como llegó",
      "lender.documents.checks-heading": "Chequeos de revisión",
      "lender.documents.override-heading": "Decisión del ejecutivo",
      "lender.documents.override-label": "Veredicto",
      "lender.documents.override-condition-label": "Condición",
      "lender.documents.override-condition-placeholder":
        "Obligatoria al aceptar con condición",
      "lender.documents.override-apply": "Aplicar decisión",
      "lender.documents.request-label": "Devolvérselo a la solicitante",
      "lender.documents.request-placeholder":
        "Di qué está mal y qué necesitas en su lugar…",
      "lender.documents.request-again": "Volver a pedir este documento",
      "lender.documents.conversation-heading": "Conversación",
      "lender.documents.no-messages": "Sin mensajes sobre este documento.",
      "lender.documents.handoff-action": "Responder en Notificaciones",
      "lender.documents.handoff-condition":
        "Este documento todavía tiene una condición sobre la aprobación.",
      "lender.documents.handoff-action-condition": "Ver la condición en Notificaciones",
      "lender.documents.handoff-settled": "Resuelto. No queda nada pendiente en este documento.",
      "lender.documents.handoff-none": "No queda nada pendiente en este documento.",

      "lender.conversation.sent": "Mensaje enviado a Javiera.",
      "lender.conversation.blank": "Escribe un mensaje antes de enviarlo.",
      "lender.conversation.readonly":
        "Este caso es una muestra de solo lectura y no admite mensajes.",
      "lender.conversation.verdict-notice": "{document} — {verdict}.",
      "lender.conversation.heading": "Hilo de mensajes",
      "lender.conversation.subtitle": "El mismo hilo que ella ve en su teléfono",
      "lender.conversation.aria-label": "Conversación con {borrower}",
      "lender.conversation.today": "HOY",
      "lender.conversation.empty": "Todavía no hay mensajes.",
      "lender.conversation.placeholder": "Escribe a {borrower}…",
      "lender.conversation.send": "Enviar",
      "lender.conversation.pending": "Esperando tu respuesta",
      "lender.conversation.pending-link": "{count} esperando tu respuesta",
      "lender.conversation.seed-routed":
        "Tu certificado de dominio vigente muestra una hipoteca de otro banco inscrita sobre la propiedad. La derivé a un especialista hipotecario con el documento y los datos de inscripción.",
      "lender.conversation.seed-reply": "Ok, quedo atenta. 🙏",
      "lender.conversation.seed-routed-377":
        "Tu promesa de compraventa se firmó tres semanas después del informe de tasación. Debería haberlo seguido de inmediato, así que la derivé a evaluación de riesgo para confirmar la fecha correcta antes de continuar.",
      "lender.conversation.seed-reply-377": "Entendido, gracias por revisarlo.",

      "lender.documents.history-heading": "Historial de carga",
      "lender.documents.no-history": "Sin cargas registradas.",
      "lender.documents.comparison-heading":
        "Lo declarado, frente a lo encontrado en el documento",
      "lender.documents.comparison-field": "Campo",
      "lender.documents.comparison-stated": "Declarado en la solicitud",
      "lender.documents.comparison-found": "Encontrado en el documento",
      "lender.documents.folio": "Fojas 1.842 N°1.190 (2024)",
      "lender.documents.encumbrance-stated": "Sin gravámenes declarados",
      "lender.documents.encumbrance-found":
        "Hipoteca a favor de otro banco — Fojas 1.842 N°1.190 (2024)",
      "lender.documents.encumbrance-note":
        "Confirmar si esta hipoteca corresponde al crédito constructor de la inmobiliaria y si se alza en la misma escritura.",
      "lender.documents.owner-stated": "Inmobiliaria Aconcagua SpA",
      "lender.documents.owner-found": "INMOBILIARIA ACONCAGUA SpA",
      "lender.documents.tax-roll-value": "1234-56",
      "lender.documents.validity-stated": "Emitido dentro de los últimos 30 días",
      "lender.documents.validity-found": "Emitido hace 3 días",

      "lender.check.status.verified": "Verificado",
      "lender.check.status.mismatch": "No coincide",
      "lender.check.status.missing": "Falta dato",
      "lender.check.status.waiting": "En espera",
      "lender.check.status.note": "Nota",

      "lender.check.national-id.full-name": "Nombre completo",
      "lender.check.national-id.rut": "RUT",
      "lender.check.national-id.date-of-birth": "Fecha de nacimiento",
      "lender.check.national-id.validity": "Vigencia del documento",
      "lender.check.payslips.stated-income": "Renta líquida declarada",
      "lender.check.payslips.periods": "Períodos recibidos",
      "lender.check.payslips.employer": "Empleador",
      "lender.check.payslips.payment-to-income": "Dividendo/renta resultante",
      "lender.check.employment-tenure.tenure": "Antigüedad",
      "lender.check.employment-tenure.contract-type": "Tipo de contrato",
      "lender.check.employment-tenure.employer": "Empleador",
      "lender.check.pension-contributions.months": "Meses cotizados",
      "lender.check.pension-contributions.continuity": "Continuidad",
      "lender.check.pension-contributions.file-source": "Origen del archivo",
      "lender.check.tax-folder.taxpayer-rut": "RUT del contribuyente",
      "lender.check.tax-folder.purpose": "Finalidad de la carpeta",
      "lender.check.tax-folder.periods": "Períodos incluidos",
      "lender.check.tax-folder.issue-date": "Fecha de emisión",
      "lender.check.down-payment-proof.amount-required": "Pie requerido",
      "lender.check.down-payment-proof.ownership": "Titularidad de la cuenta",
      "lender.check.down-payment-proof.source-of-funds": "Origen de los fondos",
      "lender.check.purchase-promise.signature-date": "Fecha de firma",
      "lender.check.purchase-promise.price": "Precio de compraventa",
      "lender.check.purchase-promise.buyer": "Compradora",
      "lender.check.purchase-promise.condition": "Condición de la propiedad",
      "lender.check.first-home-affidavit.signature": "Firma de la declarante",
      "lender.check.first-home-affidavit.previous-subsidy": "Subsidio habitacional previo",
      "lender.check.first-home-affidavit.debtors-registry":
        "Registro de Deudores de Pensiones de Alimentos",
      "lender.check.title-certificate.encumbrances": "Gravámenes e hipotecas",
      "lender.check.title-certificate.owner": "Propietario inscrito",
      "lender.check.title-certificate.tax-roll": "Rol de avalúo",
      "lender.check.title-certificate.validity": "Vigencia del certificado",

      "lender.source.heading": "Verificado en la fuente",
      "lender.source.intro":
        "El sistema consultó estos datos directamente con los organismos emisores, así que nunca se le pidieron los certificados a la solicitante.",
      "lender.source.new-home.label": "Vivienda nueva (primera venta)",
      "lender.source.new-home.source": "Recepción municipal 2026 · proyecto Aconcagua",
      "lender.source.new-home.result": "Primera venta",
      "lender.source.valid-rut.label": "Persona natural con RUT vigente",
      "lender.source.valid-rut.source": "Registro Civil",
      "lender.source.valid-rut.result": "Vigente",
      "lender.source.first-home.label": "Primera vivienda · sin inmuebles a su nombre",
      "lender.source.first-home.source": "Conservador de Bienes Raíces · SII",
      "lender.source.first-home.result": "0 propiedades",
      "lender.source.promise-date.label": "Promesa de compraventa firmada desde el 01-01-2025",
      "lender.source.promise-date.source": "Inmobiliaria · confirmado contra el documento",
      "lender.source.promise-date.result": "12-03-2026",
      "lender.source.no-subsidy.label": "Sin subsidio habitacional previo",
      "lender.source.no-subsidy.source": "Ministerio de Vivienda (MINVU)",
      "lender.source.no-subsidy.result": "Sin registros",
      "lender.source.not-debtor.label":
        "No figura en el Registro de Deudores de Pensiones de Alimentos",
      "lender.source.not-debtor.source": "Registro Civil · Ley 21.389",
      "lender.source.not-debtor.result": "No inscrita",
      "lender.source.fogaes-quota.label": "Cupo FOGAES disponible",
      "lender.source.fogaes-quota.source": "Sistema centralizado FOGAES",
      "lender.source.fogaes-quota.result": "Reservado",

      "lender.audit.heading": "Trazabilidad completa",
      "lender.audit.empty": "Todavía no hay eventos registrados.",
      "lender.actor.borrower": "Solicitante",
      "lender.actor.assistant": "Agente",
      "lender.actor.lender": "Banco",
      "lender.actor.system": "Sistema",
      "lender.actor.third-party": "Tercero",

      "lender.action.request-developer-confirmation": "Solicitar confirmación a la inmobiliaria",
      "lender.action.remind-borrower": "Recordarle el documento a la solicitante",
      "lender.action.escalate": "Derivar al gerente",
      "lender.action.escalate-response":
        "Este caso está dentro de tu atribución delegada de {authority}, así que no hace falta derivarlo.",
      "lender.action.approve": "Aprobar con condiciones",
      "lender.action.approve-blocked":
        "La aprobación sigue desactivada hasta que se cumplan las dos condiciones habilitantes.",
      "lender.action.sign": "Firmar la aprobación",
      "lender.action.reset": "Reiniciar caso",
      "lender.action.decline": "Rechazar la solicitud",
      "lender.action.override": "Anulación manual…",

      "lender.email.heading": "Consulta a la inmobiliaria",
      "lender.email.to-label": "Para",
      "lender.email.to": "contacto@inmobiliariaaconcagua.cl",
      "lender.email.subject-label": "Materia",
      "lender.email.subject":
        "Caso {case} · Hipoteca en Fojas 1.842 N°1.190 (2024) · rol de avalúo 1234-56",
      "lender.email.body":
        "Estimado equipo de Inmobiliaria Aconcagua:\n\nEstamos evaluando una solicitud de crédito hipotecario sobre la propiedad del rol de avalúo 1234-56 del proyecto Aconcagua en Maipú, caso {case}.\n\nEl certificado de dominio vigente registra una hipoteca a favor de otro banco en Fojas 1.842 N°1.190 del año 2024, que no fue declarada en la solicitud. Les agradecemos confirmar si corresponde al crédito constructor y si se alzará simultáneamente en la misma escritura, adjuntando el borrador de alzamiento en tal caso.\n\nSaludos cordiales,\n{officer} · {role} · Banco Falabella",
      "lender.email.send": "Enviar consulta",
      "lender.email.sent-announcement":
        "Consulta enviada a la inmobiliaria. A la espera de su respuesta.",
      "lender.email.reply-received":
        "Inmobiliaria Aconcagua confirmó que la hipoteca es del crédito constructor y adjuntó el borrador de alzamiento. Se alza en la misma escritura.",
      "lender.reminder.sent":
        "Recordatorio enviado a la solicitante por la página 1 de la Carpeta Tributaria.",
      "lender.reminder.upload-received":
        "La solicitante subió la página 1 de la Carpeta Tributaria desde su portal. El documento queda aceptado.",

      "lender.assistant.title": "Asistente del caso",
      "lender.assistant.subtitle": "Responde solo con este caso",
      "lender.assistant.you": "Tú",
      "lender.assistant.placeholder": "Pregunta sobre este caso…",
      "lender.assistant.send": "Preguntar",
      "lender.assistant.send-aria": "Preguntar al asistente del caso sobre este expediente",
      "lender.assistant.blank": "Escribe una pregunta antes de enviarla.",
      "lender.assistant.asked": "Pregunta enviada al asistente. Su respuesta está en la columna.",
      "lender.assistant.open-aria": "Abrir el asistente del caso",
      "lender.assistant.close-aria": "Contraer el asistente del caso",
      "lender.assistant.brief-open":
        "Hay {count} ítem(s) abiertos y no se puede aprobar nada hasta resolverlos.",
      "lender.assistant.brief-conditions":
        "Los documentos están resueltos. Quedan {count} condición(es) que frenan la aprobación: {conditions}.",
      "lender.assistant.brief-ready":
        "Las dos condiciones habilitantes están cumplidas y los nueve documentos están completos. Este caso se puede aprobar.",
      "lender.assistant.brief-approved":
        "Aprobado con condiciones. La aprobación está redactada y aún necesita tu firma.",
      "lender.assistant.brief-signed": "Firmado. Nada en este caso te está esperando.",
      "lender.assistant.brief-quiet": "Nada en este caso te está esperando.",

      "lender.assistant.answer-title-open":
        "El certificado de dominio registra una hipoteca a favor de otro banco en Fojas 1.842 N°1.190 (2024). La solicitud declaró sin gravámenes. Propietario, rol de avalúo y vigencia coincidieron, así que es un campo, no un documento malo. Suele ser el crédito constructor de la inmobiliaria: pídeles que lo confirmen y que se alce en la misma escritura.",
      "lender.assistant.answer-title-settled":
        "El certificado de dominio está resuelto — {verdict}. El gravamen en Fojas 1.842 N°1.190 (2024) queda cubierto por la condición de alzamiento y no por un segundo documento.",
      "lender.assistant.answer-tax-open":
        "La página 1 de la Carpeta Tributaria llegó cortada y no se pudo leer el RUT del contribuyente (18.452.30_-4). Los otros tres campos coincidieron, así que la carpeta es el documento correcto — falta la página 1 completa.",
      "lender.assistant.answer-tax-settled":
        "La Carpeta Tributaria está resuelta — {verdict}. El RUT de la página 1 se lee correctamente.",
      "lender.assistant.answer-approval-items":
        "La aprobación está frenada por {count} ítem(s) de revisión abiertos: {items}. Las condiciones se revisan una vez que esos cierren.",
      "lender.assistant.answer-approval-conditions":
        "Quedan {count} condición(es) abiertas: {conditions}. La aprobación sigue desactivada hasta que se cumplan.",
      "lender.assistant.answer-approval-ready":
        "No hay nada frenándola. Las dos condiciones están cumplidas y {amount} está dentro de tu atribución delegada de {authority}.",
      "lender.assistant.answer-affordability":
        "El dividendo es {payment} contra una renta líquida verificada de {income} — {ratio}, bajo el techo de {cap}. Si las tasas suben 2 puntos llega a {stressed}, sobre el techo; esa excepción queda declarada en el expediente y no escondida, y está en la pestaña de Riesgo junto al escenario que la produce.",
      "lender.assistant.answer-guarantee":
        "FOGAES cubre {amount}, {share} del crédito — el tramo por sobre el límite estándar de 80% de financiamiento. Es lo que hace financiable el crédito al 90%; no lo hace más barato. El subsidio de tasa es un beneficio aparte y ya está incorporado en la tasa {rate}.",
      "lender.assistant.answer-documents-open":
        "{accepted} de {total} documentos están aceptados. Aún pendientes: {outstanding}.",
      "lender.assistant.answer-documents-complete": "Los {total} documentos están aceptados.",
      "lender.assistant.answer-borrower":
        "A {borrower} se le dijo por última vez que un especialista hipotecario tiene el certificado de dominio y que no se necesita nada de ella. Usa el cuadro de mensaje del resumen para escribirle; llega al mismo hilo de WhatsApp que ella está leyendo.",
      "lender.assistant.answer-developer":
        "La consulta indica el caso, las fojas y el rol de avalúo, y le pide a Inmobiliaria Aconcagua confirmar si la hipoteca es su crédito constructor y si se alza en la misma escritura. Está redactada para que la leas antes de que salga.",
      "lender.assistant.answer-no-figures":
        "Este caso no tiene una solicitud detrás, así que no tengo aritmética para él. Igual puedo responder sobre sus documentos y sus ítems abiertos.",
      "lender.assistant.answer-unknown":
        "Solo respondo con lo que hay en este caso. Prueba con el certificado de dominio, la Carpeta Tributaria, qué frena la aprobación, la capacidad de pago, la garantía estatal, los documentos o la solicitante.",

      "lender.assistant.trigger": "Ejecutar agente",
      "lender.assistant.trigger-aria": "Elegir un agente para ejecutar en este caso",
      "lender.assistant.trigger-menu-aria": "Agentes disponibles en este caso",
      "lender.assistant.status-idle": "Haz una pregunta, o ejecuta un agente.",
      "lender.assistant.status-ran": "{agent} se ejecutó en {case}.",
      "lender.assistant.status-readonly":
        "Este caso es de solo lectura, así que solo puede ejecutarse el agente de solo lectura.",
      "lender.assistant.you-trigger": "Ejecutar {agent}.",

      "lender.assistant.agent.follow-up": "Reunir los documentos pendientes",
      "lender.assistant.agent.follow-up-note":
        "Abre la conversación, insiste hasta que lleguen y los adjunta al caso",
      "lender.assistant.agent.follow-up-ran":
        "Abrí la conversación con {borrower} por WhatsApp sobre el documento pendiente, y de aquí en adelante me hago cargo: respondo lo que pregunte, la vuelvo a contactar si no responde y adjunto la página al documento cuando llegue. Cada paso queda en la trazabilidad. Vuelvo a ti cuando el documento esté adentro, o cuando algo necesite tu decisión.",
      "lender.assistant.agent.escalate": "Derivar al gerente",
      "lender.assistant.agent.escalate-note": "Contrasta el caso con tu atribución delegada",
      "lender.assistant.agent.scan": "Revisar la calidad del expediente",
      "lender.assistant.agent.scan-note": "Solo lee — no cambia nada",
      "lender.assistant.agent.scan-ran-clear":
        "No queda nada pendiente. Los {total} documentos están aceptados y no hay ítems de revisión abiertos.",
      "lender.assistant.agent.scan-ran": "Pendiente en este caso: {findings}.",
      "lender.assistant.agent.reorder": "Reencargar un servicio (inspección, dominio, tasación)",
      "lender.assistant.agent.reorder-note":
        "Reencarga la inspección; el dominio y la tasación ya se gestionan en otra parte de este caso",
      "lender.assistant.agent.reorder-ran":
        "Reencargué la inspección — vuelve a quedar pendiente hasta que llegue la nueva, y eso queda en la trazabilidad. El dominio sigue gobernado por el certificado ya presentado y la tasación se encarga al aprobar, según política, así que reencargar no afecta a ninguno de los dos; pregúntame por cualquiera de ellos si quieres su propio estado.",
      "lender.assistant.scan-documents": "{count} documento(s) aún no aceptados ({names})",
      "lender.assistant.scan-items": "{count} ítem(s) de revisión abiertos ({items})",
      "lender.assistant.scan-conditions": "{count} condición(es) sin cumplir",
      "lender.assistant.scan-messages": "{count} mensaje(s) de {borrower} en el expediente",

      "lender.assistant.next-heading": "Qué sigue",
      "lender.assistant.next-resolve": "Resolver {document} — {reason}.",
      "lender.assistant.next-settle": "Resolver los {count} ítem(s) de arriba.",
      "lender.assistant.next-collect": "Reunir {names}.",
      "lender.assistant.next-conditions": "Cumplir {count} condición(es) restantes.",
      "lender.assistant.next-approve": "Aprobar con condiciones y luego firmar.",
      "lender.assistant.next-sign": "Firmar la aprobación.",
      "lender.assistant.next-none": "No hay nada esperando. Revisa la trazabilidad antes de cerrar.",

      "lender.assistant.action-open-document": "Abrir {document}",
      "lender.assistant.action-developer-query": "Redactar la consulta a la inmobiliaria",
      "lender.assistant.action-remind-borrower": "Recordarle a la solicitante",
      "lender.assistant.action-risk": "Abrir la pestaña de riesgo",
      "lender.assistant.action-approve": "Aprobar con condiciones",

      "lender.condition.heading": "Condiciones",
      "lender.condition.c1":
        "Alzamiento simultáneo de la hipoteca en Fojas 1.842 N°1.190 (2024) en la misma escritura.",
      "lender.condition.c2": "Carpeta Tributaria completa, con el RUT legible en la página 1.",
      "lender.condition.cleared": "Cumplida",
      "lender.condition.open": "Abierta",
      "lender.condition.cleared-on": "Cumplida el {date}",

      "lender.signing.heading": "Hoja de firma de la aprobación",
      "lender.signing.case": "Caso",
      "lender.signing.borrower": "Solicitante",
      "lender.signing.amount": "Monto aprobado",
      "lender.signing.officer": "Ejecutivo",
      "lender.signing.authority": "Atribución delegada",
      "lender.signing.conditions": "Condiciones que pasan a la escritura",
      "lender.signing.confirm": "Firmar la aprobación",

      "lender.decision.heading": "Acta de decisión",
      "lender.decision.outcome": "Aprobado con condiciones",
      "lender.decision.case": "Caso {case}",
      "lender.decision.signed-by": "Firmado por {officer}, {role}.",
      "lender.decision.authority": "Dentro de una atribución delegada de {authority}.",
      "lender.decision.timestamp": "Firmado el {timestamp}.",
      "lender.decision.conditions-heading": "Condiciones de la aprobación",
      "lender.decision.announcement":
        "Aprobación firmada. Acta de decisión emitida para el caso {case}.",

      "lender.decision.panel-heading": "Decisión de la ejecutiva",
      "lender.decision.state-ready":
        "Las dos condiciones habilitantes están cumplidas. El caso {case} se puede aprobar.",
      "lender.decision.state-approved": "El caso {case} está aprobado y espera firma.",
      "lender.decision.state-signed": "El caso {case} está aprobado y firmado.",
      "lender.decision.state-declined": "El caso {case} fue rechazado.",
      "lender.decision.reason-label": "Motivo (queda registrado en el caso)",
      "lender.decision.reason-placeholder": "Por qué esta decisión, en tus palabras",
      "lender.decision.reason-required":
        "Hace falta un motivo escrito para registrar esta decisión.",
      "lender.decision.decline-heading": "Rechazar el caso {case}",
      "lender.decision.decline-intro":
        "El rechazo cierra el caso. La solicitante conserva su portal y sus documentos; el motivo de abajo queda en el acta.",
      "lender.decision.decline-confirm": "Registrar el rechazo",
      "lender.decision.override-heading": "Anulación manual en el caso {case}",
      "lender.decision.override-intro":
        "Esto aprueba el caso con sus condiciones aún abiertas. Queda registrado como aprobación por anulación, bajo tu atribución delegada de {authority}.",
      "lender.decision.override-confirm": "Aprobar por anulación",
      "lender.decision.cancel": "Cancelar",
      "lender.decision.declined-outcome": "Rechazado",
      "lender.decision.declined-by": "Rechazado por {officer}, {role}.",
      "lender.decision.declined-timestamp": "Rechazado el {timestamp}.",
      "lender.decision.reason": "Motivo: {reason}",
      "lender.decision.override-badge": "Aprobado por anulación manual",
      "lender.decision.override-note":
        "Aprobado fuera del control automático por {officer}, {role}, bajo una atribución delegada de {authority}.",
      "lender.decision.declined-announcement":
        "Caso {case} rechazado. La decisión quedó en el acta.",
      "lender.decision.override-announcement":
        "Caso {case} aprobado por anulación manual. La decisión quedó en el acta.",
      "lender.decision.decided-already": "El caso {case} ya tiene una decisión.",

      "lender.officer.name": "Carolina Reyes",
      "lender.officer.role": "Ejecutiva hipotecaria, mesa Santiago",
      "lender.officer.authority": "UF 4.000 con FOGAES",
      "lender.team.name": "Equipo hipotecario Banco Falabella",

      "lender.status.board-ready": "Tablero de cartera listo. {count} casos.",
      "lender.status.case-opened": "Caso {case} abierto.",
      "lender.status.case-closed": "Detalle del caso cerrado.",
      "lender.status.filtered": "{count} casos coinciden con los filtros actuales.",
      "lender.status.take-case": "El caso {case} queda asignado a ti.",
      "lender.status.reset": "Caso reiniciado al estado inicial.",
      "lender.status.needs-review-opened":
        "Notificaciones. {notifications} en este caso.",
      "lender.status.needs-review-document":
        "Notificaciones, en {document}. El campo de respuesta está enfocado.",
      "lender.status.notification-followed":
        "{document} abierto. Las verificaciones y la conversación están en el expediente.",
      "lender.status.assistant-opened": "Asistente del caso abierto.",
      "lender.status.assistant-closed": "Asistente del caso contraído.",
      "lender.status.override-applied": "{document} quedó en {verdict} por decisión del ejecutivo.",
      "lender.status.override-unchanged": "Ese documento ya tiene ese veredicto.",
      "lender.status.override-needs-condition":
        "Escribe la condición antes de aceptar con una.",
      "lender.status.override-refused": "Todavía no llega nada de este documento.",
      "lender.status.request-needs-reason": "Di qué está mal antes de devolverlo.",
      "lender.status.request-sent": "{document} devuelto a la solicitante con tu nota.",
      "lender.status.borrower-message":
        "La solicitante escribió desde su portal. Mensajes nuevos: {count}.",

      /* ============================================================== risk */
      "risk.summary-heading": "Ficha crediticia",
      "risk.summary-loan": "Crédito solicitado",
      "risk.summary-property": "Valor de la propiedad",
      "risk.summary-down-payment": "Pie",
      "risk.summary-term": "Plazo",
      "risk.summary-rate": "Tasa",
      "risk.summary-payment": "Dividendo mensual",
      "risk.summary-income": "Renta mensual verificada",
      "risk.pti-heading": "Capacidad de pago",
      "risk.pti-explainer":
        "El dividendo mensual de {payment} es {ratio} de la renta líquida verificada de {income}. La política del banco pone techo a la relación dividendo/renta en {cap}.",
      "risk.pti-value": "{ratio} de la renta",
      "risk.pti-cap": "Techo de política {cap}",
      "risk.pti-under-cap": "Dentro del techo de política",
      "risk.stress-heading": "Si las tasas suben 2 puntos",
      "risk.stress-explainer":
        "Repactado 2 puntos porcentuales más arriba, el dividendo sube a {payment} y la relación dividendo/renta llega a {ratio} — por sobre el techo de política de {cap}. El caso se presenta con esa excepción declarada, no escondida.",
      "risk.stress-over-cap": "Sobre el techo de {cap}",
      "risk.policy-heading": "Política de crédito",
      "risk.policy.payment-to-income":
        "Relación dividendo/renta igual o menor al 30% de la renta líquida verificada.",
      "risk.policy.financing":
        "Financiamiento de hasta 90% del valor de la propiedad con la garantía estatal FOGAES; 80% sin ella.",
      "risk.policy.property-cap":
        "Viviendas nuevas de hasta UF 4.000, con promesa de compraventa firmada el 01-01-2025 o después.",
      "risk.policy.employment":
        "Contrato indefinido, al menos 12 meses de antigüedad y sin lagunas en las cotizaciones.",
      "risk.policy.appraisal":
        "Tasación no inferior al precio de compraventa, ordenada al aprobar y vigente por 90 días.",
      "risk.policy.authority":
        "Dentro de la atribución delegada del ejecutivo hipotecario de {authority}.",
      "risk.tranche-heading": "Tramo garantizado",
      "risk.tranche-explainer":
        "La garantía estatal cubre {amount}, {share} del crédito — el tramo por sobre el límite estándar de 80% de financiamiento. Es lo que hace financiable el crédito al 90%; no lo hace más barato.",
      "risk.tranche-standard-label": "Financiado en condiciones estándar",
      "risk.tranche-guaranteed-label": "Cubierto por la garantía estatal",
      "risk.tranche-note":
        "El subsidio de tasa de 0,60 puntos es un beneficio aparte del programa y ya está incorporado en la tasa.",
      /* ========================================================== borrower */
      "borrower.title": "Portal de la solicitante",
      "borrower.page-title": "Banco Falabella · Solicitud de crédito hipotecario",
      "borrower.crumb": "Crédito Hipotecario · Solicitud en línea",
      "borrower.who": "Solicitante",
      "borrower.switch-to-lender": "Ver como ejecutivo",
      "borrower.switch-to-lender-aria": "Cambiar a la vista del ejecutivo en esta demo",
      "borrower.phase.simulate": "Simulación",
      "borrower.phase.pre-approval": "Preaprobación",
      "borrower.phase.documents": "Documentos por WhatsApp",

      "borrower.notifications.title": "Avisos",
      "borrower.notifications.open": "Avisos, {count} nuevos",
      "borrower.notifications.empty": "Nada requiere tu atención ahora.",
      "borrower.notifications.preview-aria": "Ver vista previa de {document}",

      "borrower.control.play": "Reproducir",
      "borrower.control.pause": "Pausar",
      "borrower.control.demo-data": "Usar datos de demo",
      "borrower.control.demo-data-aria":
        "Completar la simulación con los datos de la solicitante de demostración y reproducir la historia",
      "borrower.control.idle": "Listo — completa el formulario o usa los datos de demo",
      "borrower.control.restart": "Reiniciar",
      "borrower.control.speed": "Velocidad",
      "borrower.control.speed-1x": "1×",
      "borrower.control.speed-2x": "2×",
      "borrower.control.speed-4x": "4×",
      "borrower.control.language": "Idioma",
      "borrower.control.language-en": "English",
      "borrower.control.language-es": "Español",
      "borrower.control.money-uf": "UF",
      "borrower.control.money-clp": "CLP",
      "borrower.control.money": "Montos",
      "borrower.control.money-uf-title": "Mostrar los montos en UF",
      "borrower.control.money-clp-title": "Mostrar los montos en pesos chilenos",
      "borrower.status.money-uf": "Los montos ahora se muestran en UF.",
      "borrower.status.money-clp": "Los montos ahora se muestran en pesos chilenos.",
      "borrower.status.language": "Idioma cambiado a español.",
      "borrower.control.playing": "Reproduciendo la demo",
      "borrower.control.paused": "Demo en pausa",
      "borrower.control.finished": "Demo terminada",

      "borrower.sim.title": "Simula tu crédito hipotecario",
      "borrower.sim.subtitle":
        "Un solo formulario. Revisamos tu elegibilidad FOGAES mientras escribes.",
      "borrower.sim.section-property": "La propiedad",
      "borrower.sim.section-details": "Tus datos",
      "borrower.sim.section-verification": "Verificación automática",
      "borrower.sim.section-loan": "Tu crédito",
      "borrower.sim.verify-intro":
        "No te preguntamos si cumples los requisitos: los verificamos en la fuente y calculamos tu capacidad de pago con la renta que declaraste.",
      "borrower.sim.affordability": "Capacidad de pago",
      "borrower.sim.property-type": "¿Qué tipo de propiedad?",
      "borrower.sim.house": "Casa",
      "borrower.sim.apartment": "Departamento",
      "borrower.sim.condition": "¿Nueva o usada?",
      "borrower.sim.new": "Nueva",
      "borrower.sim.used": "Usada",
      "borrower.sim.property-value": "Valor de la propiedad",
      "borrower.sim.down-payment": "Pie",
      "borrower.sim.full-name": "Nombre completo",
      "borrower.sim.rut": "RUT",
      "borrower.sim.date-of-birth": "Fecha de nacimiento",
      "borrower.sim.income": "Renta líquida mensual",
      "borrower.sim.phone": "Teléfono (WhatsApp)",
      "borrower.sim.email": "Correo electrónico",
      "borrower.sim.term": "Plazo",
      "borrower.sim.years": "años",
      "borrower.sim.submit": "Ver mi resultado",
      "borrower.sim.footnote": "Simulación referencial. No constituye una oferta de crédito.",
      "borrower.sim.summary": "Resumen de tu simulación",
      "borrower.sim.stated-income": "Renta líquida declarada",
      "borrower.sim.max-payment": "Dividendo máximo ({cap})",
      "borrower.sim.simulated-payment": "Dividendo simulado",
      "borrower.sim.headroom": "Holgura mensual",
      "borrower.sim.uf-note": "Montos en UF convertidos con la UF de hoy: {value} ({date})",
      "borrower.sim.group-personal": "Datos personales",
      "borrower.sim.group-property": "La propiedad",
      "borrower.sim.group-loan": "El crédito",
      "borrower.sim.field-name": "Campo",
      "borrower.sim.field-value": "Valor",
      "borrower.sim.field-amount": "Monto",
      "borrower.sim.field-insurance": "Seguros",
      "borrower.sim.insurance-value": "Desgravamen, incendio",
      "borrower.sim.condition-new": "Nueva (primera venta)",

      "borrower.fogaes.title": "Garantía Estatal FOGAES",
      "borrower.fogaes.checking": "Verificando",
      "borrower.fogaes.qualifies": "Calificas",
      "borrower.fogaes.waiting": "En espera",
      "borrower.fogaes.checking-item": "Verificando…",
      "borrower.fogaes.not-checked": "Aún sin verificar",
      "borrower.fogaes.saving":
        "Calificas. Tasa −0,60 puntos, que valen unos {monthly} al mes sobre el mismo crédito, y financiamiento de hasta 90% en vez de 80% — {downPayment} menos que reunir al principio, sobre un crédito mayor.",

      "borrower.check.new-home.label": "Vivienda nueva (primera venta)",
      "borrower.check.new-home.source": "Recepción municipal 2026 · proyecto Aconcagua",
      "borrower.check.new-home.result": "Primera venta",
      "borrower.check.value-cap.label": "Valor dentro del tope del programa",
      "borrower.check.value-cap.source": "Simulación · tope UF 4.000",
      "borrower.check.value-cap.result": "{value}",
      "borrower.check.valid-rut.label": "Persona natural con RUT vigente",
      "borrower.check.valid-rut.source": "Registro Civil",
      "borrower.check.valid-rut.result": "Vigente",
      "borrower.check.first-home.label": "Primera vivienda · sin inmuebles a tu nombre",
      "borrower.check.first-home.source": "Conservador de Bienes Raíces · SII",
      "borrower.check.first-home.result": "0 propiedades",
      "borrower.check.promise-date.label": "Promesa de compraventa firmada desde el 01-01-2025",
      "borrower.check.promise-date.source": "Inmobiliaria · confirmado contra el documento",
      "borrower.check.promise-date.result": "12-03-2026",
      "borrower.check.no-subsidy.label": "Sin subsidio habitacional previo",
      "borrower.check.no-subsidy.source": "Ministerio de Vivienda (MINVU)",
      "borrower.check.no-subsidy.result": "Sin registros",
      "borrower.check.not-debtor.label":
        "No figuras en el Registro de Deudores de Pensiones de Alimentos",
      "borrower.check.not-debtor.source": "Registro Civil · Ley 21.389",
      "borrower.check.not-debtor.result": "No inscrita",
      "borrower.check.fogaes-quota.label": "Cupo FOGAES disponible",
      "borrower.check.fogaes-quota.source": "Sistema centralizado FOGAES",
      "borrower.check.fogaes-quota.result": "Reservado",
      "borrower.check.affordability.label": "Capacidad de pago según tu renta",
      "borrower.check.affordability.source": "Política del banco · máximo {cap} de la renta",
      "borrower.check.affordability.result": "{ratio} de la renta",

      "borrower.result.pre-approved": "Preaprobada con la garantía FOGAES",
      "borrower.result.title": "Tu dividendo mensual estimado",
      "borrower.result.with-fogaes": "Con el programa",
      "borrower.result.without-fogaes": "Condiciones estándar",
      "borrower.result.rate": "Tasa",
      "borrower.result.financing": "Financiamiento",
      "borrower.result.down-payment": "Pie",
      "borrower.result.more-monthly": "Más al mes",
      "borrower.result.less-monthly": "Menos al mes",
      "borrower.result.rate-saving": "Lo que ahorra la tasa más baja",
      "borrower.result.rate-saving-note":
        "Sobre el mismo crédito de {loan}, a UF + {standard} en vez de UF + {rate}.",
      "borrower.result.trade-off":
        "Son dos créditos distintos. La garantía te permite financiar el 90% del valor en vez del 80%, así que necesitas {down} menos al principio y debes {extra} más — por eso el dividendo es mayor, no menor.",
      "borrower.result.total-saving": "Ahorro total en {years} años",
      "borrower.result.less-down-payment": "Menos que reunir al principio",
      "borrower.result.more-down-payment": "Más que reunir al principio",
      "borrower.result.more-down-payment-value": "{amount} más",
      "borrower.result.apr": "CAE referencial",
      "borrower.result.apply": "Enviar solicitud",
      "borrower.result.simulate-again": "Simular de nuevo",
      "borrower.result.note":
        "Incluye seguros de desgravamen e incendio. El subsidio de tasa de 0,60 puntos y la garantía estatal FOGAES aplican a viviendas nuevas de hasta UF 4.000 con promesa de compraventa firmada el 01-01-2025 o después, sujeto a la evaluación comercial y de riesgo del banco.",
      "borrower.result.with-financing": "Financiamiento 90% · pie {amount}",
      "borrower.result.without-financing": "Financiamiento máx. 80% · pie {amount}",
      "borrower.result.guarantee-explainer":
        "La garantía estatal es lo que te permite financiar el 90% del valor en vez del 80%. Reduce el pie que necesitas, no el monto que debes.",
      "borrower.result.loan": "Crédito",
      "borrower.result.trade-heading": "Por qué el dividendo de la izquierda es mayor",
      "borrower.result.trade-col-when": "Cuándo",
      "borrower.result.trade-col-difference": "Diferencia",
      "borrower.result.trade-up-front": "Que reunir el día de la compra",
      "borrower.result.trade-monthly": "Cada mes",
      "borrower.result.more-monthly-value": "{amount} más",
      "borrower.result.less-monthly-value": "{amount} menos",
      "borrower.result.less-down-payment-value": "{amount} menos",
      "borrower.result.trade-total":
        "En {years} años el dividendo más alto suma {total}, en dinero de hoy — frente a los {down} que habrías tenido que ahorrar antes de siquiera poder comprar.",

      "borrower.portal.title": "Portal de la solicitante",
      "borrower.portal.application": "Solicitud {case}",
      "borrower.portal.property": "Casa nueva · Proyecto Aconcagua, Maipú",
      "borrower.portal.status-documents": "Esperando documentos",
      "borrower.portal.status-review": "En evaluación crediticia",
      "borrower.portal.status-human": "1 ítem en revisión de especialista",
      "borrower.portal.status-open": "En evaluación · {count} ítems abiertos",

      "borrower.checklist.heading": "Tus documentos",
      "borrower.checklist.progress": "{received} de {total} documentos verificados",
      "borrower.checklist.dropzone": "Arrastra tus documentos aquí, o haz clic para buscarlos",
      "borrower.checklist.dropzone-hint":
        "PDF, JPG o PNG · también puedes subirlos uno a uno desde la lista",
      "borrower.checklist.open-aria": "Abrir la revisión de {document}",

      "borrower.drawer.eyebrow": "Revisión de documento",
      "borrower.drawer.tab-review": "Revisión",
      "borrower.drawer.tab-document": "Documento",
      "borrower.drawer.tab-history": "Historial",
      "borrower.drawer.tab-assistant": "Asistente del crédito",
      "borrower.drawer.assistant-lead": "Mensajes sobre este documento con tu ejecutivo.",
      "borrower.drawer.assistant-placeholder": "Preguntar sobre este documento…",
      "borrower.drawer.assistant-empty": "Aún no hay mensajes sobre este documento.",
      "borrower.drawer.stated": "Declarado en tu solicitud",
      "borrower.drawer.found": "Encontrado en el documento",
      "borrower.drawer.scan-stamp": "Documento escaneado · página 1",

      "borrower.scan.national-id.org": "Servicio de Registro Civil e Identificación",
      "borrower.scan.national-id.title": "Cédula de Identidad",
      "borrower.scan.national-id.row-run": "RUN",
      "borrower.scan.national-id.value-run": "18.452.309-4",
      "borrower.scan.national-id.row-given-names": "Nombres",
      "borrower.scan.national-id.value-given-names": "JAVIERA ANDREA",
      "borrower.scan.national-id.row-surnames": "Apellidos",
      "borrower.scan.national-id.value-surnames": "SOTO MIRANDA",
      "borrower.scan.national-id.row-date-of-birth": "Fecha de nacimiento",
      "borrower.scan.national-id.value-date-of-birth": "22-05-1990",
      "borrower.scan.national-id.row-expiry": "Vencimiento",
      "borrower.scan.national-id.value-expiry": "14-11-2029",

      "borrower.scan.payslips.org": "CONSTRUCTORA ANDES SpA",
      "borrower.scan.payslips.title": "Liquidación de remuneraciones — julio 2026",
      "borrower.scan.payslips.row-employee": "Trabajadora",
      "borrower.scan.payslips.value-employee": "JAVIERA SOTO MIRANDA",
      "borrower.scan.payslips.row-rut": "RUT",
      "borrower.scan.payslips.value-rut": "18.452.309-4",
      "borrower.scan.payslips.row-base-salary": "Sueldo base",
      "borrower.scan.payslips.value-base-salary": "$2.850.000",
      "borrower.scan.payslips.row-deductions": "Total descuentos",
      "borrower.scan.payslips.value-deductions": "$450.000",
      "borrower.scan.payslips.row-net-pay": "Líquido a pagar",
      "borrower.scan.payslips.value-net-pay": "$2.400.000",

      "borrower.scan.employment-tenure.org": "CONSTRUCTORA ANDES SpA",
      "borrower.scan.employment-tenure.title": "Certificado de antigüedad laboral",
      "borrower.scan.employment-tenure.row-employee": "Trabajadora",
      "borrower.scan.employment-tenure.value-employee": "JAVIERA SOTO MIRANDA",
      "borrower.scan.employment-tenure.row-role": "Cargo",
      "borrower.scan.employment-tenure.value-role": "Analista senior",
      "borrower.scan.employment-tenure.row-contract-start": "Inicio de contrato",
      "borrower.scan.employment-tenure.value-contract-start": "01-06-2022",
      "borrower.scan.employment-tenure.row-contract-type": "Tipo de contrato",
      "borrower.scan.employment-tenure.value-contract-type": "Indefinido",

      "borrower.scan.pension-contributions.org": "AFP HABITAT",
      "borrower.scan.pension-contributions.title": "Certificado de cotizaciones",
      "borrower.scan.pension-contributions.row-member": "Afiliada",
      "borrower.scan.pension-contributions.value-member": "JAVIERA SOTO MIRANDA",
      "borrower.scan.pension-contributions.row-rut": "RUT",
      "borrower.scan.pension-contributions.value-rut": "18.452.309-4",
      "borrower.scan.pension-contributions.row-periods": "Períodos",
      "borrower.scan.pension-contributions.value-periods": "ago 2025 / jul 2026",
      "borrower.scan.pension-contributions.row-months": "Meses cotizados",
      "borrower.scan.pension-contributions.value-months": "12",

      "borrower.scan.tax-folder.org": "SERVICIO DE IMPUESTOS INTERNOS",
      "borrower.scan.tax-folder.title": "Carpeta Tributaria para solicitar créditos",
      "borrower.scan.tax-folder.row-taxpayer": "Contribuyente",
      "borrower.scan.tax-folder.value-taxpayer": "JAVIERA SOTO MIRANDA",
      "borrower.scan.tax-folder.row-rut": "RUT",
      "borrower.scan.tax-folder.value-rut": "18.452.309-4",
      "borrower.scan.tax-folder.value-rut-unreadable": "18.452.30_-4",
      "borrower.scan.tax-folder.row-periods": "Períodos",
      "borrower.scan.tax-folder.value-periods": "12",
      "borrower.scan.tax-folder.row-issue-date": "Fecha de emisión",
      "borrower.scan.tax-folder.value-issue-date": "02-08-2026",
      "borrower.scan.tax-folder.row-purpose": "Finalidad",
      "borrower.scan.tax-folder.value-purpose": "Fines crediticios",

      "borrower.scan.down-payment-proof.org": "BANCO FALABELLA",
      "borrower.scan.down-payment-proof.title": "Cartola cuenta de ahorro — julio 2026",
      "borrower.scan.down-payment-proof.row-holder": "Titular",
      "borrower.scan.down-payment-proof.value-holder": "JAVIERA SOTO MIRANDA",
      "borrower.scan.down-payment-proof.row-balance": "Saldo disponible",
      "borrower.scan.down-payment-proof.value-balance": "$15.100.000",
      "borrower.scan.down-payment-proof.row-seasoning": "Antigüedad de los fondos",
      "borrower.scan.down-payment-proof.value-seasoning": "6 meses",

      "borrower.scan.purchase-promise.org": "Notaría Santiago · Repertorio 4.219",
      "borrower.scan.purchase-promise.title": "Promesa de compraventa",
      "borrower.scan.purchase-promise.row-seller": "Vendedora",
      "borrower.scan.purchase-promise.value-seller": "INMOBILIARIA ACONCAGUA SpA",
      "borrower.scan.purchase-promise.row-buyer": "Compradora",
      "borrower.scan.purchase-promise.value-buyer": "JAVIERA SOTO MIRANDA",
      "borrower.scan.purchase-promise.row-price": "Precio",
      "borrower.scan.purchase-promise.value-price": "UF 3.500",
      "borrower.scan.purchase-promise.row-signature-date": "Fecha de firma",
      "borrower.scan.purchase-promise.value-signature-date": "12-03-2026",

      "borrower.scan.first-home-affidavit.org": "Declaración jurada simple",
      "borrower.scan.first-home-affidavit.title": "Primera vivienda y ausencia de subsidio",
      "borrower.scan.first-home-affidavit.row-declarant": "Declarante",
      "borrower.scan.first-home-affidavit.value-declarant": "JAVIERA SOTO MIRANDA",
      "borrower.scan.first-home-affidavit.row-rut": "RUT",
      "borrower.scan.first-home-affidavit.value-rut": "18.452.309-4",
      "borrower.scan.first-home-affidavit.row-subject": "Materia",
      "borrower.scan.first-home-affidavit.value-subject": "Primera vivienda · sin subsidio previo",
      "borrower.scan.first-home-affidavit.row-signature": "Firma",
      "borrower.scan.first-home-affidavit.value-signature": "Firmada 05-08-2026",

      "borrower.scan.title-certificate.org": "Conservador de Bienes Raíces de Santiago",
      "borrower.scan.title-certificate.title": "Certificado de dominio vigente",
      "borrower.scan.title-certificate.row-owner": "Propietario",
      "borrower.scan.title-certificate.value-owner": "INMOBILIARIA ACONCAGUA SpA",
      "borrower.scan.title-certificate.row-tax-roll": "Rol de avalúo",
      "borrower.scan.title-certificate.value-tax-roll": "1234-56",
      "borrower.scan.title-certificate.row-registration": "Inscripción",
      "borrower.scan.title-certificate.value-registration": "Fojas 5.120 N°3.410 (2026)",
      "borrower.scan.title-certificate.row-encumbrances": "Gravámenes",
      "borrower.scan.title-certificate.value-encumbrances":
        "Hipoteca a favor de otro banco — Fojas 1.842 N°1.190 (2024)",

      "borrower.drawer.no-history": "Todavía no has subido nada para este documento.",

      "borrower.banner.analysing.title": "Analizando el documento…",
      "borrower.banner.analysing.body":
        "Estamos extrayendo los campos y comparándolos con tu solicitud.",
      "borrower.banner.accepted.title": "Documento aceptado",
      "borrower.banner.accepted.body":
        "Todos los campos coinciden con lo que declaraste en tu solicitud.",
      "borrower.banner.rejected.title": "Encontramos {count} discrepancias",
      "borrower.banner.rejected.body": "Sube el documento correcto para avanzar con este ítem.",
      "borrower.banner.incomplete.title": "Falta 1 dato por confirmar",
      "borrower.banner.incomplete.body":
        "La página 1 llegó cortada y no se pudo leer el RUT del contribuyente (18.452.30_-4). Los otros tres campos de la carpeta coincidieron.",
      "borrower.banner.review.title": "En revisión por un especialista",
      "borrower.banner.review.body":
        "Un especialista hipotecario está revisando el gravamen del certificado de dominio. No necesitamos nada de ti.",

      "borrower.tag.verified": "Verificado",
      "borrower.tag.mismatch": "No coincide",
      "borrower.tag.missing": "Falta dato",
      "borrower.tag.note": "Nota",

      "borrower.chat.assistant-name": "Asistente hipotecario Banco Falabella",
      "borrower.chat.online": "en línea · asistente hipotecario",
      "borrower.chat.typing": "escribiendo…",
      "borrower.chat.placeholder": "Escribe un mensaje",
      "borrower.chat.today": "HOY",
      "borrower.chat.send": "Enviar",
      "borrower.chat.you": "Tú",
      "borrower.chat.team-name": "Equipo hipotecario Banco Falabella",
      "borrower.chat.blank": "Escribe un mensaje antes de enviarlo.",
      "borrower.chat.sent": "Mensaje enviado. Un especialista lo tomará.",

      "borrower.assistant.reply-specialist":
        "Un especialista hipotecario tiene este documento y lo está revisando con el certificado del Conservador. No necesitamos nada de ti — te escribo por acá apenas haya respuesta. 🔍",
      "borrower.assistant.reply-rejected":
        "Solo necesitamos la página 1 completa, con el RUT legible en el margen derecho. Mándala cuando te acomode y la reviso al tiro. 📄",
      "borrower.assistant.reply-accepted":
        "Ese ya está aceptado, así que no queda nada por hacer ahí. Le pasé tu comentario al equipo y te responden por acá. 👍",
      "borrower.assistant.reply-ack":
        "Gracias, Javiera — se lo pasé al equipo hipotecario y quedó en tu expediente. Te responden por acá. 💬",
      "borrower.assistant.reply-escalated":
        "Tu expediente está con un especialista hipotecario y no ha dejado de avanzar. Agregué tu mensaje al caso para que lo vean junto con todo lo demás. 🙌",
      "borrower.chat.received":
        "El equipo hipotecario de Banco Falabella respondió. Mensajes nuevos: {count}.",
      "borrower.chat.fab": "Consultas por WhatsApp",

      "borrower.notice.escalated-title": "Este ítem está con un especialista",
      "borrower.notice.escalated-body":
        "Detectamos el gravamen en el certificado de dominio y un especialista hipotecario lo está revisando con el documento. No se espera nada de ti.",

      "borrower.msg.greeting":
        "¡Hola Javiera! 👋 Soy el asistente hipotecario de Banco Falabella. Recibimos tu solicitud {case} para {property} con la garantía estatal FOGAES.",
      "borrower.msg.guide":
        "Te voy a guiar por acá hasta completar tu expediente. Son 9 documentos; te los voy a pedir de a uno y te explico para qué sirve cada uno. Puedes responder con una foto o un PDF — si algo no calza, te aviso al tiro.",
      "borrower.msg.doc1-request":
        "*1 de 9 — Cédula de Identidad (ambos lados)*\nLa usamos para verificar tu identidad con el Registro Civil antes de la evaluación.",
      "borrower.msg.doc1-verified":
        "✅ *Cédula verificada.* El RUT 18.452.309-4 coincide con la solicitud y el documento está vigente hasta 2029.",
      "borrower.msg.doc2-request":
        "*2 de 9 — Tus 3 últimas liquidaciones de sueldo*\nLas usamos para calcular tu renta líquida promedio y la relación dividendo/renta.",
      "borrower.msg.here-you-go": "Aquí van 👇",
      "borrower.msg.doc2-wrong-document":
        "⚠️ *Esto no es una liquidación de sueldo.* Es tu certificado de cotizaciones AFP.\n\nIgual lo necesitamos más adelante (documento 4), así que lo guardé y lo marqué como recibido. 👍\n\nPara este paso necesito las liquidaciones de *mayo, junio y julio 2026*: el documento que emite tu empleador con el sueldo bruto, los descuentos y el líquido.",
      "borrower.msg.sorry-here-they-are": "Ah, perdón. Aquí están.",
      "borrower.msg.doc2-verified":
        "✅ *Las 3 liquidaciones recibidas* (mayo, junio y julio 2026).\nRenta líquida promedio: *{income}*. Tu dividendo estimado de {payment} es *{ratio}* de tu renta — dentro de la política del banco (máx. {cap}).",
      "borrower.msg.doc3-request":
        "*3 de 9 — Certificado de antigüedad laboral*\nConfirma más de 12 meses con contrato indefinido, un requisito de la evaluación.",
      "borrower.msg.doc3-verified":
        "✅ *Antigüedad confirmada:* 4 años 2 meses, contrato indefinido.",
      "borrower.msg.doc4-already-covered":
        "*4 de 9 — Cotizaciones AFP últimos 12 meses*\n✅ Ya está cubierto: es el certificado que me mandaste antes. 12 meses continuos, sin lagunas. Uno menos que enviar. 🙂",
      "borrower.msg.doc5-request":
        "*5 de 9 — Carpeta Tributaria para fines crediticios*\nLa descargas en sii.cl. Ojo: tiene que ser la versión “para solicitar créditos”, no la personal.",
      "borrower.msg.doc5-incomplete":
        "⚠️ *El documento es el correcto, pero falta un dato.*\nEn la página 1 tu RUT sale cortado: se lee *18.452.30_-4* y no puedo confirmar el dígito que falta.\n\n¿Me reenvías solo la página 1 completa? El resto está perfecto: 12 períodos, emitida el 02-08-2026, para fines crediticios. ✔️",
      "borrower.msg.will-resend-later":
        "Ya, la vuelvo a descargar del SII y te la mando más rato.",
      "borrower.msg.doc5-left-open":
        "Perfecto. Te dejo el ítem abierto en tu portal — puedes subir la página 1 ahí cuando quieras, sin volver a este chat. Sigamos. 👍",
      "borrower.msg.doc6-request":
        "*6 de 9 — Acreditación del pie*\nLa cartola de tu cuenta de ahorro confirma el pie de {downPayment}.",
      "borrower.msg.doc6-verified":
        "✅ *Fondos confirmados:* $15.100.000 disponibles, por sobre los {downPayment} requeridos.",
      "borrower.msg.doc7-request":
        "*7 de 9 — Promesa de compraventa* 🏛️ FOGAES\nEste es el documento clave para el beneficio: para FOGAES la promesa debe estar firmada el 01-01-2025 o después.",
      "borrower.msg.doc7-verified":
        "✅ *Promesa firmada el 12-03-2026* — cumple el requisito FOGAES.\nPrecio {property}, vivienda nueva (primera venta), Inmobiliaria Aconcagua. Tu subsidio de tasa de 0,60 puntos queda confirmado.",
      "borrower.msg.doc8-request":
        "*8 de 9 — Declaración jurada de primera vivienda* 🏛️\nCuando simulaste ya consultamos en línea el Registro de Deudores de Pensiones de Alimentos y tus registros en el MINVU, así que no necesitas pedir esos certificados. Solo firma la declaración que te dejé prellenada y devuélvemela.",
      "borrower.msg.doc8-verified":
        "✅ *Declaración recibida y firmada.* Coincide con lo que verificamos en línea: sin subsidio habitacional previo y sin inscripción en el Registro de Deudores. Garantía FOGAES confirmada. 🏛️",
      "borrower.msg.doc9-request":
        "*9 de 9 — Certificado de dominio vigente*\nEmitido por el Conservador de Bienes Raíces. El último. 🙌",
      "borrower.msg.doc9-exception":
        "Gracias, Javiera. Acá necesito detenerme. 🔍\n\n*Tu certificado de dominio muestra una hipoteca de otro banco* inscrita sobre la propiedad, que no venía en la solicitud. Esto lo revisa un especialista hipotecario. Ya se lo derivé con el documento y los datos de inscripción (Fojas 1.842 N°1.190, 2024).",
      "borrower.msg.doc9-no-hold":
        "No detiene tu evaluación: tu expediente ya pasó a evaluación crediticia. Volvemos con la respuesta y no hay nada que tengas que hacer en este ítem.",
      "borrower.msg.open-items":
        "Tienes *2 ítems abiertos* en el portal:\n\n• *Carpeta Tributaria* — falta la página 1 con el RUT completo. La puedes subir tú desde el portal.\n• *Certificado de dominio* — lo está revisando un especialista, no tienes que hacer nada.\n\nEn el portal puedes abrir cada documento y ver exactamente qué marcamos. 👀",

      "borrower.feed.doc1-accepted": "Cédula verificada · el RUT coincide",
      "borrower.feed.doc2-rejected":
        "Documento rechazado: llegó el certificado AFP en vez de las liquidaciones",
      "borrower.feed.doc2-accepted":
        "Liquidaciones verificadas · renta promedio {income} · dividendo/renta {ratio}",
      "borrower.feed.doc3-accepted": "Antigüedad laboral confirmada · 4 años 2 meses",
      "borrower.feed.doc4-reassigned":
        "Cotizaciones AFP recibidas y reasignadas automáticamente (12 meses continuos)",
      "borrower.feed.doc5-incomplete": "Carpeta Tributaria incompleta: RUT ilegible en la página 1",
      "borrower.feed.doc6-accepted": "Pie confirmado · $15.100.000 disponibles",
      "borrower.feed.doc7-accepted":
        "Promesa verificada · firmada el 12-03-2026 · cumple FOGAES",
      "borrower.feed.doc8-accepted":
        "Requisitos FOGAES confirmados · garantía estatal activa",
      "borrower.feed.doc9-escalated":
        "Derivado a revisión de especialista · hipoteca de tercero detectada",

      "borrower.file.national-id": "cedula_ambos_lados.jpg",
      "borrower.file-meta.national-id": "JPG · 1,8 MB",
      "borrower.file.pension-certificate": "certificado_cotizaciones_afp.pdf",
      "borrower.file-meta.pension-certificate": "PDF · 12 páginas",
      "borrower.file.payslips": "liquidaciones_may_jun_jul_2026.pdf",
      "borrower.file-meta.payslips": "PDF · 3 páginas",
      "borrower.file.employment-tenure": "antiguedad_laboral.pdf",
      "borrower.file-meta.employment-tenure": "PDF · 1 página",
      "borrower.file.tax-folder": "carpeta_tributaria_credito.pdf",
      "borrower.file-meta.tax-folder": "PDF · 14 páginas",
      "borrower.file.savings-statement": "cartola_ahorro_jul2026.pdf",
      "borrower.file-meta.savings-statement": "PDF · 4 páginas",
      "borrower.file.purchase-promise": "promesa_compraventa_firmada.pdf",
      "borrower.file-meta.purchase-promise": "PDF · 9 páginas",
      "borrower.file.affidavit": "declaracion_jurada_firmada.pdf",
      "borrower.file-meta.affidavit": "PDF · 2 páginas",
      "borrower.file.title-certificate": "certificado_dominio_vigente.pdf",
      "borrower.file-meta.title-certificate": "PDF · 3 páginas"
    }
  };

  var DEFAULT_LOCALE = "en";
  /* Every locale lives here: English, and the Spanish added alongside it. */
  var LOCALES = ["en", "es"];
  var NUMBER_LOCALE = { en: "en-US", es: "es-CL" };

  var PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

  function hasLocale(locale) {
    return LOCALES.indexOf(locale) !== -1;
  }

  /* ------------------------------------------------------- the active locale
   *
   * One switch for the whole demo. It lives here rather than on either page
   * because both pages and falabella-credit.js have to agree: a Spanish page
   * printing "UF 3,150" with an English thousands separator is worse than an
   * English page. numberLocale() reads it, so every formatUF / formatCLP /
   * formatDate call already in the pages follows the switch with no change at
   * the call site.
   */
  var activeLocale = DEFAULT_LOCALE;

  function locale() {
    return activeLocale;
  }

  /* An unregistered locale is refused rather than half-applied. */
  function setLocale(next) {
    if (hasLocale(next)) activeLocale = next;
    return activeLocale;
  }

  function tableFor(locale) {
    return COPY[hasLocale(locale) ? locale : DEFAULT_LOCALE];
  }

  function interpolate(template, params) {
    if (!params) return template;
    return template.replace(PLACEHOLDER, function (match, name) {
      /* An unsupplied placeholder stays visible: a translator sees the gap,
         and the page never renders the word "undefined". */
      if (!Object.prototype.hasOwnProperty.call(params, name)) return match;
      var value = params[name];
      return value === null || value === undefined ? match : String(value);
    });
  }

  /* An omitted locale means "whatever is switched on", not "English": that is
     what lets a page call t(key) everywhere and still change language. */
  function t(key, locale, params) {
    if (typeof key !== "string") return key === undefined || key === null ? "" : String(key);
    var table = tableFor(locale === undefined || locale === null ? activeLocale : locale);
    if (!table || !Object.prototype.hasOwnProperty.call(table, key)) return key;
    return interpolate(table[key], params);
  }

  function missingKeys(locale, keys) {
    var table = hasLocale(locale) ? COPY[locale] : null;
    var list = Array.isArray(keys) ? keys : [];
    if (!table) return list.slice();
    return list.filter(function (key) {
      return !Object.prototype.hasOwnProperty.call(table, key);
    });
  }

  globalThis.FalabellaCopy = {
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    LOCALES: LOCALES,
    NUMBER_LOCALE: NUMBER_LOCALE,
    COPY: COPY,
    t: t,
    hasLocale: hasLocale,
    locale: locale,
    setLocale: setLocale,
    missingKeys: missingKeys
  };
})();
