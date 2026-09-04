/* Weston English portal — the credit arithmetic.
 *
 * This file owns every derived number in the demo. Both surfaces call it and
 * neither holds a figure of its own. That is the whole point: DISENO.md §2 of
 * the Spanish demo names duplicated arithmetic as the one defect that lets the
 * two pages disagree, so there is one copy of RATE_GUARANTEED and one payment
 * formula, here.
 *
 * The constants and the compounding come from the Spanish demo that already
 * works — solicitante.html (UF, VALOR_UF, PIE_PCT, PLAZO, RATE_FOG, RATE_STD,
 * LTV_FOG, LTV_STD, SEG_UF, RENTA) and ejecutivo.html (MAX_CARGA, STRESS,
 * CUPO_UF) — so the English portal computes the same case.
 *
 * DOM-free and dependency-free. Formatters take their locale from
 * WestonCopy.NUMBER_LOCALE when the copy layer is loaded and fall back to
 * en-US when it is not, so this module is testable on its own.
 */
"use strict";

(function () {
  /* ============================================================= constants */

  var UF_VALUE = 40844.79; /* Banco Central de Chile */
  var UF_DATE = "2026-08-05";

  var PROPERTY_UF = 3500;
  var DOWN_PCT = 0.1;
  var TERM_YEARS = 30;

  var RATE_GUARANTEED = 0.034; /* with FOGAES: includes the 60 bp subsidy */
  var RATE_STANDARD = 0.04;

  var LTV_GUARANTEED = 0.9;
  var LTV_STANDARD = 0.8;

  /* Life and fire cover, added to principal and interest to make the payment
     the borrower actually pays. SEG_UF in both Spanish pages. */
  var INSURANCE_UF = 0.62;

  var INCOME_CLP = 2400000;
  var DTI_CAP = 0.3;
  var STRESS_BP = 200;

  var OFFICER_AUTHORITY_UF = 4000; /* CUPO_UF — Carolina's delegated authority */
  var PROGRAMME_CAP_UF = 4000; /* FOGAES: new homes up to UF 4,000 */

  var DEFAULT_NUMBER_LOCALE = "en-US";

  /* ============================================================== helpers */

  function fallback(value, whenMissing) {
    return value === undefined || value === null ? whenMissing : value;
  }

  /* Read at call time, not at load time: the copy layer may load after this
     one, and a locale switch must be picked up without a reload. */
  function numberLocale(locale) {
    var copy = globalThis.WestonCopy;
    if (!copy) return DEFAULT_NUMBER_LOCALE;
    var key = locale || (copy.locale ? copy.locale() : copy.DEFAULT_LOCALE);
    var table = copy.NUMBER_LOCALE || {};
    return table[key] || table[copy.DEFAULT_LOCALE] || DEFAULT_NUMBER_LOCALE;
  }

  /* ========================================================== arithmetic */

  /* The loan amount at a given loan-to-value. */
  function loanFor(propertyUF, ltv) {
    return fallback(propertyUF, PROPERTY_UF) * fallback(ltv, LTV_GUARANTEED);
  }

  function downPaymentUF(propertyUF, downPct) {
    return fallback(propertyUF, PROPERTY_UF) * fallback(downPct, DOWN_PCT);
  }

  /* Level payment on a UF-denominated annuity, with the monthly-equivalent
     compounding of the Spanish demo's pmt(): i = (1+annual)^(1/12) - 1, not
     annual/12. Principal and interest only — see monthlyPaymentUF. */
  function payment(principalUF, annualRate, years) {
    var principal = fallback(principalUF, loanFor());
    var rate = fallback(annualRate, RATE_GUARANTEED);
    var term = fallback(years, TERM_YEARS);
    var i = Math.pow(1 + rate, 1 / 12) - 1;
    var n = term * 12;
    return (principal * i) / (1 - Math.pow(1 + i, -n));
  }

  /* What the borrower is quoted: principal, interest, and the cover. */
  function monthlyPaymentUF(principalUF, annualRate, years, insuranceUF) {
    return (
      payment(principalUF, annualRate, years) + fallback(insuranceUF, INSURANCE_UF)
    );
  }

  function monthlyCLP(uf, ufValue) {
    return fallback(uf, 0) * fallback(ufValue, UF_VALUE);
  }

  /* Payment to income, with the cap stated rather than applied. */
  function dti(paymentCLP, incomeCLP, cap) {
    var pay = fallback(paymentCLP, monthlyCLP(monthlyPaymentUF()));
    var income = fallback(incomeCLP, INCOME_CLP);
    var limit = fallback(cap, DTI_CAP);
    var ratio = income > 0 ? pay / income : 0;
    return {
      paymentCLP: pay,
      incomeCLP: income,
      ratio: ratio,
      cap: limit,
      overCap: ratio > limit,
      headroomCLP: income * limit - pay
    };
  }

  /* The same case re-priced STRESS_BP higher. The principal does not move: a
     rate shock changes what the loan costs, not what it buys. */
  function stressedDti(input) {
    var options = input || {};
    var stressBp = fallback(options.stressBp, STRESS_BP);
    var baseRate = fallback(options.annualRate, RATE_GUARANTEED);
    var stressedRate = baseRate + stressBp / 10000;
    var paymentUF = monthlyPaymentUF(
      fallback(options.principalUF, loanFor(options.propertyUF, options.ltv)),
      stressedRate,
      options.years,
      options.insuranceUF
    );
    var paymentCLP = monthlyCLP(paymentUF, options.ufValue);
    var result = dti(paymentCLP, options.incomeCLP, options.cap);
    result.stressBp = stressBp;
    result.baseRate = baseRate;
    result.stressedRate = stressedRate;
    result.paymentUF = paymentUF;
    return result;
  }

  /* The slice of the loan above the standard financing limit — the part the
     state guarantee covers. It makes the loan financeable at 90%; it does not
     make it cheaper. */
  function guaranteedTrancheUF(propertyUF, guaranteedLtv, standardLtv) {
    return (
      loanFor(propertyUF, guaranteedLtv) -
      loanFor(propertyUF, fallback(standardLtv, LTV_STANDARD))
    );
  }

  function guaranteedTrancheShare(propertyUF, guaranteedLtv, standardLtv) {
    var loan = loanFor(propertyUF, guaranteedLtv);
    if (!loan) return 0;
    return guaranteedTrancheUF(propertyUF, guaranteedLtv, standardLtv) / loan;
  }

  /* The three programme rules that are arithmetic. The rest of the policy list
     — tenure, contribution gaps, the appraisal, the officer's authority — is
     written down in copy, not computed here (spec §11). */
  function fogaesEligible(input) {
    var options = input || {};
    var propertyUF = fallback(options.propertyUF, PROPERTY_UF);
    var ltv = fallback(options.ltv, LTV_GUARANTEED);
    var incomeCLP = fallback(options.incomeCLP, INCOME_CLP);
    var cap = fallback(options.cap, DTI_CAP);
    var loanUF = loanFor(propertyUF, ltv);
    var load = dti(
      monthlyCLP(
        monthlyPaymentUF(loanUF, options.annualRate, options.years, options.insuranceUF),
        options.ufValue
      ),
      incomeCLP,
      cap
    );

    var checks = [
      {
        id: "property-cap",
        ok: propertyUF <= PROGRAMME_CAP_UF,
        value: propertyUF,
        limit: PROGRAMME_CAP_UF
      },
      {
        id: "financing",
        ok: ltv <= LTV_GUARANTEED,
        value: ltv,
        limit: LTV_GUARANTEED
      },
      {
        id: "payment-to-income",
        ok: !load.overCap,
        value: load.ratio,
        limit: cap
      }
    ];

    var reasons = checks
      .filter(function (check) {
        return !check.ok;
      })
      .map(function (check) {
        return check.id;
      });

    return { eligible: reasons.length === 0, checks: checks, reasons: reasons };
  }

  /* Every derived figure of the interactive case, in one object, so a page
     renders from it instead of recomputing. */
  function caseFigures(input) {
    var options = input || {};
    var propertyUF = fallback(options.propertyUF, PROPERTY_UF);
    var ltv = fallback(options.ltv, LTV_GUARANTEED);
    var annualRate = fallback(options.annualRate, RATE_GUARANTEED);
    var years = fallback(options.years, TERM_YEARS);
    var incomeCLP = fallback(options.incomeCLP, INCOME_CLP);
    var loanUF = loanFor(propertyUF, ltv);
    var paymentUF = monthlyPaymentUF(loanUF, annualRate, years, options.insuranceUF);
    var paymentCLP = monthlyCLP(paymentUF, options.ufValue);

    return {
      propertyUF: propertyUF,
      propertyCLP: monthlyCLP(propertyUF, options.ufValue),
      loanUF: loanUF,
      loanCLP: monthlyCLP(loanUF, options.ufValue),
      ltv: ltv,
      annualRate: annualRate,
      termYears: years,
      downPaymentUF: downPaymentUF(propertyUF, options.downPct),
      downPaymentCLP: monthlyCLP(
        downPaymentUF(propertyUF, options.downPct),
        options.ufValue
      ),
      insuranceUF: fallback(options.insuranceUF, INSURANCE_UF),
      paymentUF: paymentUF,
      paymentCLP: paymentCLP,
      incomeCLP: incomeCLP,
      dti: dti(paymentCLP, incomeCLP, options.cap),
      stressedDti: stressedDti(options),
      guaranteedTrancheUF: guaranteedTrancheUF(propertyUF, ltv, options.standardLtv),
      guaranteedTrancheShare: guaranteedTrancheShare(propertyUF, ltv, options.standardLtv),
      eligibility: fogaesEligible(options),
      ufValue: fallback(options.ufValue, UF_VALUE),
      ufDate: UF_DATE
    };
  }

  /* ============================================================ formatters */

  function formatUF(value, decimals, locale) {
    var places = fallback(decimals, 0);
    return (
      "UF " +
      Number(fallback(value, 0)).toLocaleString(numberLocale(locale), {
        minimumFractionDigits: places,
        maximumFractionDigits: places
      })
    );
  }

  /* Pesos are always whole: Chile does not use cents. */
  function formatCLP(value, locale) {
    return (
      "$" + Math.round(fallback(value, 0)).toLocaleString(numberLocale(locale))
    );
  }

  /* Takes a percentage, not a ratio: formatPct(24.676) is "24.7%". */
  function formatPct(value, decimals, locale) {
    var places = fallback(decimals, 1);
    return (
      Number(fallback(value, 0)).toLocaleString(numberLocale(locale), {
        minimumFractionDigits: places,
        maximumFractionDigits: places
      }) + "%"
    );
  }

  /* An ISO date in, an English date out. Parsed and rendered in UTC so the
     demo reads the same in every time zone. Anything unparseable is returned
     untouched rather than shown as "Invalid Date". */
  function formatDate(isoDate, locale) {
    if (!isoDate) return "";
    var parsed = new Date(isoDate);
    if (isNaN(parsed.getTime())) return String(isoDate);
    return new Intl.DateTimeFormat(numberLocale(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(parsed);
  }

  /* =================================================================== api */

  globalThis.WestonCredit = {
    UF_VALUE: UF_VALUE,
    UF_DATE: UF_DATE,
    PROPERTY_UF: PROPERTY_UF,
    DOWN_PCT: DOWN_PCT,
    TERM_YEARS: TERM_YEARS,
    RATE_GUARANTEED: RATE_GUARANTEED,
    RATE_STANDARD: RATE_STANDARD,
    LTV_GUARANTEED: LTV_GUARANTEED,
    LTV_STANDARD: LTV_STANDARD,
    INSURANCE_UF: INSURANCE_UF,
    INCOME_CLP: INCOME_CLP,
    DTI_CAP: DTI_CAP,
    STRESS_BP: STRESS_BP,
    OFFICER_AUTHORITY_UF: OFFICER_AUTHORITY_UF,
    PROGRAMME_CAP_UF: PROGRAMME_CAP_UF,

    payment: payment,
    monthlyPaymentUF: monthlyPaymentUF,
    loanFor: loanFor,
    downPaymentUF: downPaymentUF,
    monthlyCLP: monthlyCLP,
    dti: dti,
    stressedDti: stressedDti,
    guaranteedTrancheUF: guaranteedTrancheUF,
    guaranteedTrancheShare: guaranteedTrancheShare,
    fogaesEligible: fogaesEligible,
    caseFigures: caseFigures,

    numberLocale: numberLocale,
    formatUF: formatUF,
    formatCLP: formatCLP,
    formatPct: formatPct,
    formatDate: formatDate
  };
})();
