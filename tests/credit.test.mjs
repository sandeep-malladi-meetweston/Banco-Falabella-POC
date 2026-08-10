import test from "node:test";
import assert from "node:assert/strict";
import { loadScriptApi, readPage } from "./page-test-helpers.mjs";

/* The module must stand up on its own, with no copy layer present: its
   formatters fall back to en-US. Loaded twice on purpose — once bare, once with
   copy.js in the same context — so both halves of that contract are tested. */
const bare = loadScriptApi("assets/falabella-credit.js", "FalabellaCredit");
const credit = bare.api;

const withCopy = loadScriptApi("assets/falabella-credit.js", "FalabellaCredit", [
  "assets/copy.js"
]);

/* The Spanish demo is the working implementation these numbers come from. It is
   read, never modified: the constants and pmt() below are the originals. */
const solicitante = readPage("../solicitante.html");
const ejecutivo = readPage("../ejecutivo.html");

function spanishConstant(source, name) {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*(-?[0-9.]+)`));
  assert.ok(match, `${name} not found in the Spanish demo`);
  return Number(match[1]);
}

/* solicitante.html's own pmt(), lifted verbatim rather than re-typed. */
const spanishPmt = (() => {
  const match = solicitante.match(/function pmt\(p, annual, yrs\)\{[^\n]*\}/);
  assert.ok(match, "pmt() not found in solicitante.html");
  return new Function(`${match[0]}; return pmt;`)();
})();

const LOAN_UF = 3150;
const PAYMENT_UF = 14.4992;

/* ------------------------------------------------------------- constants */

test("the constants are the Spanish demo's constants, not retyped ones", () => {
  assert.equal(credit.UF_VALUE, spanishConstant(solicitante, "UF"));
  assert.equal(credit.PROPERTY_UF, spanishConstant(solicitante, "VALOR_UF"));
  assert.equal(credit.DOWN_PCT, spanishConstant(solicitante, "PIE_PCT") / 100);
  assert.equal(credit.TERM_YEARS, spanishConstant(solicitante, "PLAZO"));
  assert.equal(credit.RATE_GUARANTEED, spanishConstant(solicitante, "RATE_FOG"));
  assert.equal(credit.RATE_STANDARD, spanishConstant(solicitante, "RATE_STD"));
  assert.equal(credit.LTV_GUARANTEED, spanishConstant(solicitante, "LTV_FOG"));
  assert.equal(credit.LTV_STANDARD, spanishConstant(solicitante, "LTV_STD"));
  assert.equal(credit.INSURANCE_UF, spanishConstant(solicitante, "SEG_UF"));
  assert.equal(credit.INCOME_CLP, spanishConstant(solicitante, "RENTA"));
  assert.equal(credit.DTI_CAP, spanishConstant(ejecutivo, "MAX_CARGA"));
  assert.equal(credit.STRESS_BP, spanishConstant(ejecutivo, "STRESS") * 10000);
  assert.equal(credit.OFFICER_AUTHORITY_UF, spanishConstant(ejecutivo, "CUPO_UF"));
});

test("the constants match spec §3.1 exactly", () => {
  assert.equal(credit.UF_VALUE, 40844.79);
  assert.equal(credit.UF_DATE, "2026-08-05");
  assert.equal(credit.PROPERTY_UF, 3500);
  assert.equal(credit.DOWN_PCT, 0.1);
  assert.equal(credit.TERM_YEARS, 30);
  assert.equal(credit.RATE_GUARANTEED, 0.034);
  assert.equal(credit.RATE_STANDARD, 0.04);
  assert.equal(credit.LTV_GUARANTEED, 0.9);
  assert.equal(credit.LTV_STANDARD, 0.8);
  assert.equal(credit.INCOME_CLP, 2400000);
  assert.equal(credit.DTI_CAP, 0.3);
  assert.equal(credit.STRESS_BP, 200);
  assert.equal(credit.OFFICER_AUTHORITY_UF, 4000);
  assert.equal(credit.PROGRAMME_CAP_UF, 4000);
});

/* ------------------------------------------------------- loan and payment */

test("loanFor and downPaymentUF give UF 3,150 and UF 350", () => {
  assert.equal(credit.loanFor(credit.PROPERTY_UF, credit.LTV_GUARANTEED), LOAN_UF);
  assert.equal(credit.loanFor(), LOAN_UF);
  assert.equal(credit.downPaymentUF(credit.PROPERTY_UF, credit.DOWN_PCT), 350);
  assert.equal(credit.downPaymentUF(), 350);
  /* The down payment and the unfinanced 10% are the same slice of the price. */
  assert.equal(
    credit.downPaymentUF(),
    credit.PROPERTY_UF - credit.loanFor(credit.PROPERTY_UF, credit.LTV_GUARANTEED)
  );
});

test("payment() uses the monthly-equivalent compounding of solicitante.html's pmt()", () => {
  const cases = [
    [LOAN_UF, 0.034, 30],
    [2800, 0.04, 30],
    [1, 0.034, 30],
    [1000, 0.054, 15]
  ];
  for (const [principal, rate, years] of cases) {
    assert.equal(
      credit.payment(principal, rate, years),
      spanishPmt(principal, rate, years),
      `payment(${principal}, ${rate}, ${years}) diverges from pmt()`
    );
  }
  /* i = (1+annual)^(1/12) - 1, not annual/12: the two differ here, so this
     pins the compounding rather than merely the shape of the formula. */
  const naive = (() => {
    const i = 0.034 / 12;
    const n = 360;
    return (LOAN_UF * i) / (1 - Math.pow(1 + i, -n));
  })();
  assert.notEqual(credit.payment(LOAN_UF, 0.034, 30).toFixed(4), naive.toFixed(4));
});

test("the monthly payment is UF 14.50 and CLP 592,218 to the peso", () => {
  const paymentUF = credit.monthlyPaymentUF();
  assert.ok(
    Math.abs(paymentUF - PAYMENT_UF) < 0.0001,
    `expected UF ${PAYMENT_UF}, got ${paymentUF}`
  );
  assert.equal(paymentUF.toFixed(2), "14.50");
  /* Principal and interest plus the life and fire cover, as the demo prices it. */
  assert.equal(
    paymentUF,
    credit.payment(LOAN_UF, credit.RATE_GUARANTEED, credit.TERM_YEARS) + credit.INSURANCE_UF
  );
  const paymentCLP = credit.monthlyCLP(paymentUF);
  assert.ok(
    Math.abs(paymentCLP - 592218) <= 1,
    `expected CLP 592,218 ±1, got ${paymentCLP}`
  );
  assert.equal(Math.round(paymentCLP), 592218);
  assert.equal(credit.monthlyCLP(1), credit.UF_VALUE);
});

/* -------------------------------------------------------------------- dti */

test("dti is 24.7% of income and under the cap", () => {
  const result = credit.dti(credit.monthlyCLP(credit.monthlyPaymentUF()));
  assert.equal(result.ratio.toFixed(3), "0.247");
  assert.equal(credit.formatPct(result.ratio * 100), "24.7%");
  assert.equal(result.cap, 0.3);
  assert.equal(result.overCap, false);
  assert.equal(result.incomeCLP, credit.INCOME_CLP);
  /* Headroom is what is left under the cap, in pesos. */
  assert.equal(
    Math.round(result.headroomCLP),
    Math.round(credit.INCOME_CLP * 0.3 - credit.monthlyCLP(credit.monthlyPaymentUF()))
  );
  assert.ok(result.headroomCLP > 0);
});

test("dti flags a payment over the cap", () => {
  const result = credit.dti(1000000, 2400000);
  assert.equal(result.overCap, true);
  assert.ok(result.headroomCLP < 0);
});

test("stressed dti is 30.7% and over the cap", () => {
  const result = credit.stressedDti();
  assert.equal(result.stressBp, 200);
  assert.equal(result.stressedRate.toFixed(4), "0.0540");
  assert.equal(result.ratio.toFixed(3), "0.307");
  assert.equal(credit.formatPct(result.ratio * 100), "30.7%");
  assert.equal(result.overCap, true);
  /* The exception the UI must state rather than hide. */
  assert.ok(result.ratio > result.cap);
  /* Stressing raises the payment; it does not change the principal. */
  assert.ok(result.paymentUF > credit.monthlyPaymentUF());
  assert.equal(
    result.paymentUF,
    credit.payment(LOAN_UF, credit.RATE_GUARANTEED + 0.02, credit.TERM_YEARS) +
      credit.INSURANCE_UF
  );
  assert.equal(result.paymentCLP, credit.monthlyCLP(result.paymentUF));
});

/* ------------------------------------------------------- guaranteed tranche */

test("the guaranteed tranche is UF 350, 11.1% of the loan", () => {
  assert.equal(credit.guaranteedTrancheUF(), 350);
  assert.equal(
    credit.guaranteedTrancheUF(credit.PROPERTY_UF, credit.LTV_GUARANTEED, credit.LTV_STANDARD),
    350
  );
  /* It is the slice above the standard 80% limit, not the down payment. */
  assert.equal(
    credit.guaranteedTrancheUF(),
    credit.loanFor(credit.PROPERTY_UF, credit.LTV_GUARANTEED) -
      credit.loanFor(credit.PROPERTY_UF, credit.LTV_STANDARD)
  );
  const share = credit.guaranteedTrancheShare();
  assert.equal(share.toFixed(4), "0.1111");
  assert.equal(credit.formatPct(share * 100), "11.1%");
  assert.equal(share, credit.guaranteedTrancheUF() / credit.loanFor());
});

/* --------------------------------------------------------- fogaes eligible */

test("fogaesEligible accepts this case", () => {
  const result = credit.fogaesEligible();
  assert.equal(result.eligible, true);
  /* Spread first: values cross out of the vm realm, so their Array prototype
     is not this realm's and a strict deep-equal would fail on that alone. */
  assert.deepEqual([...result.reasons], []);
  assert.deepEqual(
    [...result.checks].map(check => check.id).sort(),
    ["financing", "payment-to-income", "property-cap"]
  );
  assert.ok(result.checks.every(check => check.ok === true));
});

test("fogaesEligible rejects a UF 5,000 property on the programme cap", () => {
  const result = credit.fogaesEligible({ propertyUF: 5000 });
  assert.equal(result.eligible, false);
  assert.ok(
    result.reasons.includes("property-cap"),
    `expected property-cap among ${JSON.stringify(result.reasons)}`
  );
  const cap = result.checks.find(check => check.id === "property-cap");
  assert.equal(cap.ok, false);
  assert.equal(cap.limit, credit.PROGRAMME_CAP_UF);
  assert.equal(cap.value, 5000);
});

test("fogaesEligible rejects financing above 90% and income that cannot carry it", () => {
  assert.equal(credit.fogaesEligible({ ltv: 0.95 }).eligible, false);
  assert.ok(credit.fogaesEligible({ ltv: 0.95 }).reasons.includes("financing"));
  assert.equal(credit.fogaesEligible({ incomeCLP: 1200000 }).eligible, false);
  assert.ok(
    credit.fogaesEligible({ incomeCLP: 1200000 }).reasons.includes("payment-to-income")
  );
});

/* --------------------------------------------------------------- formatters */

test("formatters emit English grouping, never the Spanish form", () => {
  assert.equal(credit.formatUF(LOAN_UF), "UF 3,150");
  assert.notEqual(credit.formatUF(LOAN_UF), "UF 3.150");
  assert.equal(credit.formatUF(PAYMENT_UF, 2), "UF 14.50");
  assert.equal(credit.formatUF(350), "UF 350");
  assert.equal(credit.formatCLP(592218.02), "$592,218");
  assert.notEqual(credit.formatCLP(592218.02), "$592.218");
  assert.equal(credit.formatCLP(credit.UF_VALUE), "$40,845");
  assert.equal(credit.formatPct(24.676), "24.7%");
  assert.equal(credit.formatPct(3.4), "3.4%");
  assert.equal(credit.formatPct(11.111, 2), "11.11%");
});

test("formatDate renders an ISO date in English, stable across time zones", () => {
  assert.equal(credit.formatDate(credit.UF_DATE), "Aug 5, 2026");
  assert.equal(credit.formatDate("2026-09-18"), "Sep 18, 2026");
  assert.equal(credit.formatDate("2026-01-01"), "Jan 1, 2026");
  /* Never leaks "Invalid Date" into the page. */
  assert.equal(credit.formatDate(""), "");
  assert.equal(credit.formatDate("not-a-date"), "not-a-date");
});

test("formatters read their locale from FalabellaCopy but do not require it", () => {
  /* Bare context: no copy layer at all, and the numbers still group in en-US. */
  assert.equal(bare.context.FalabellaCopy, undefined);
  assert.equal(credit.formatUF(LOAN_UF), "UF 3,150");

  /* With the copy layer present the locale is read from it, at call time. */
  assert.equal(withCopy.context.FalabellaCopy.NUMBER_LOCALE.en, "en-US");
  assert.equal(withCopy.api.formatUF(LOAN_UF), "UF 3,150");
  withCopy.context.FalabellaCopy.NUMBER_LOCALE.en = "de-DE";
  assert.equal(withCopy.api.formatUF(LOAN_UF), "UF 3.150");
  withCopy.context.FalabellaCopy.NUMBER_LOCALE.en = "en-US";
  assert.equal(withCopy.api.formatUF(LOAN_UF), "UF 3,150");
});

/* -------------------------------------------------------------- case bundle */

test("caseFigures gives both pages one derived set to read from", () => {
  const figures = credit.caseFigures();
  assert.equal(figures.loanUF, LOAN_UF);
  assert.equal(figures.downPaymentUF, 350);
  assert.equal(figures.paymentUF.toFixed(2), "14.50");
  assert.equal(Math.round(figures.paymentCLP), 592218);
  assert.equal(figures.dti.ratio.toFixed(3), "0.247");
  assert.equal(figures.stressedDti.ratio.toFixed(3), "0.307");
  assert.equal(figures.stressedDti.overCap, true);
  assert.equal(figures.guaranteedTrancheUF, 350);
  assert.equal(figures.guaranteedTrancheShare.toFixed(4), "0.1111");
  assert.equal(figures.eligibility.eligible, true);
});

test("the module is a strict-mode script on globalThis, DOM-free", () => {
  assert.match(bare.source, /^"use strict";/m);
  assert.match(bare.source, /globalThis\.FalabellaCredit\s*=/);
  assert.equal(/\bdocument\b/.test(bare.source), false);
  assert.equal(/Date\.now\(|Math\.random\(/.test(bare.source), false);
});
