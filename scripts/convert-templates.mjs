#!/usr/bin/env node
// Converts the original .docx templates in public/templates/originals/
// into placeholder versions in public/templates/<id>.docx that docxtemplater can render.
//
// We do per-template literal replacements on word/document.xml. Word sometimes splits
// runs in the middle of a string, so we first merge adjacent <w:t> elements within
// the same <w:r> and collapse simple <w:r></w:r><w:r></w:r> sequences that share the
// same <w:rPr>. This raises the hit rate but is not guaranteed — for any literal that
// did not match, open the produced .docx and add the {placeholder} manually.
//
// Usage: node scripts/convert-templates.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import PizZip from "pizzip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "public/templates/originals");
const OUT = resolve(ROOT, "public/templates");

/** Per-template config: source file + ordered list of [literal, placeholder] pairs. */
const TEMPLATES = {
  "builder-noc": {
    src: "0._Builder_NOC_format_ADITYA.docx",
    repl: [
      ["Y. ADITYA", "{applicant.fullName}"],
      ["YAMIJALA HANUMANTHA RAO", "{applicant.relation}"],
      ["MERLION ORCHIDS", "{venture.projectName}"],
      ["GK MERLION ORCHIDS", "{venture.projectName}"],
      ["407/A, 407/B, 419, 420 and 421", "{venture.surveyNos}"],
      ["BACHUPALLY", "{venture.village}"],
      ["GHMC Nizampet", "{venture.circle}"],
      ["Medchal-Malkajgiri", "{venture.district}"],
      ["Telangana State", "{venture.state}"],
      ["1600 Sq.Feet", "{p.plinthArea} Sq.Feet"],
      ["80 Sq.Yards", "{p.undividedShare} Sq.Yards"],
      ["flat no 117", "flat no {p.flatNo}"],
      ["flat/apartment no. 117", "flat/apartment no. {p.flatNo}"],
      ["1ST floor", "{p.floor} floor"],
      ["47,00,000", "{p.saleConsideration}"],
      ["Rupees Forty Seven Lakhs Only", "{p.saleConsiderationWords}"],
      ["9,40,000", "{p.amountPaid}"],
      ["Rupees Nine Lakhs Forty Thousand only", "{p.amountPaidWords}"],
      ["37,60,000", "{p.balanceAmount}"],
      ["Rupees Thirty Seven Lakhs Sixty Thousand only", "{p.balanceAmountWords}"],
      ["ICICI Bank Limited", "{p.bankName}"],
      ["/ /2026", "{p.documentDate}"],
      ["Hyderabad", "{p.place}"],
    ],
  },
  "noc-builder-2nd": {
    src: "1._NOC_from_builder_ADITYA.docx",
    repl: [
      ["22/06/2026", "{p.documentDate}"],
      ["23/06/2026", "{p.documentDate}"],
      ["ICICI Bank Ltd", "{p.bankName}"],
      ["MERLION ORCHIDS", "{venture.projectName}"],
      ["407/A, 407/B, 419, 420 and 421", "{venture.surveyNos}"],
      ["BACHUPALLY", "{venture.village}"],
      ["GHMC Nizampet", "{venture.circle}"],
      ["Medchal-Malkajgiri", "{venture.district}"],
      ["Telangana State", "{venture.state}"],
      ["1600 Sq.Feet", "{p.plinthArea} Sq.Feet"],
      ["80 Sq.Feet", "{p.carParkingArea} Sq.Feet"],
      ["62.57 Sq.Yards", "{p.undividedShare} Sq.Yards"],
      ["4634.68", "{venture.totalLandSqYards}"],
      ["No.117", "No.{p.flatNo}"],
      ["First Floor", "{p.floor} Floor"],
      ["MODUKURI VENKATARAMANAMMA", "{contractor1.fullName}"],
      ["PULLE SANKARA RAO", "{contractor1.relation}"],
      ["EMANI JOGULAMBA", "{contractor2.fullName}"],
      ["EMANI RAJESWARA RAO", "{contractor2.relation}"],
      ["RAGHUMUDRI SHANTHA KUMARI alias RAGHUMUDRI SANTHI HARI", "{landlord1.fullName}"],
      ["RAGHUMUDRI SHASHANK", "{landlord2.fullName}"],
      ["RAGHUMUDRI MEGHAMSH", "{landlord3.fullName}"],
      ["HYDERABAD", "{p.place}"],
    ],
  },
  "noc-customer": {
    src: "NOC_from_Customer_ADI.docx",
    repl: [
      ["22/06/2026", "{p.documentDate}"],
      ["ICICI Bank Ltd", "{p.bankName}"],
      ["MERLION ORCHIDS", "{venture.projectName}"],
      ["407/A, 407/B, 419, 420 and 421", "{venture.surveyNos}"],
      ["BACHUPALLY", "{venture.village}"],
      ["GHMC Nizampet", "{venture.circle}"],
      ["Medchal-Malkajgiri", "{venture.district}"],
      ["Telangana State", "{venture.state}"],
      ["1600 Sq.Feet", "{p.plinthArea} Sq.Feet"],
      ["80 Sq.Feet", "{p.carParkingArea} Sq.Feet"],
      ["62.57 Sq.Yards", "{p.undividedShare} Sq.Yards"],
      ["4634.68", "{venture.totalLandSqYards}"],
      ["No.117", "No.{p.flatNo}"],
      ["First Floor", "{p.floor} Floor"],
      ["MODUKURI VENKATARAMANAMMA", "{contractor1.fullName}"],
      ["PULLE SANKARA RAO", "{contractor1.relation}"],
      ["EMANI JOGULAMBA", "{contractor2.fullName}"],
      ["EMANI RAJESWARA RAO", "{contractor2.relation}"],
      ["Y. ADITYA", "{applicant.fullName}"],
      ["YAMIJALA HANUMANTHA RAO", "{applicant.relation}"],
      ["HYDERABAD", "{p.place}"],
    ],
  },
  mou: {
    src: "MOU_Revised_ADITYA.docx",
    repl: [
      ["RAGHUMUDRI SHANTHA KUMARI alias RAGHUMUDRI SANTHI HARI", "{landlord1.fullName}"],
      ["RAGHUMUDRI SHASHANK", "{landlord2.fullName}"],
      ["RAGHUMUDRI MEGHAMSH", "{landlord3.fullName}"],
      ["BTCPR5766E", "{landlord1.pan}"],
      ["CGEPR0336J", "{landlord2.pan}"],
      ["CGEPR0334L", "{landlord3.pan}"],
      ["XXXX XXXX 5282", "{landlord1.aadhaar}"],
      ["XXXX XXXX 4371", "{landlord2.aadhaar}"],
      ["XXXX XXXX 3325", "{landlord3.aadhaar}"],
      ["Y. ADITYA", "{applicant.fullName}"],
      ["YAMIJALA HANUMANTHA RAO", "{applicant.relation}"],
      ["CARPA6846F", "{applicant.pan}"],
      ["XXXX XXXX 1076", "{applicant.aadhaar}"],
      ["JAYALAKSHMI DEEPIKA MODUKURI", "{contractor1.fullName}"],
      ["VENKATA SATYANARAYANA SHARMA MODUKURI", "{contractor1.relation}"],
      ["BDZPM8329R", "{contractor1.pan}"],
      ["7864 5497 7271", "{contractor1.aadhaar}"],
      ["CHENEPALLE CHANDU PRIYA", "{contractor2.fullName}"],
      ["CHENEPALLE GOVINDA REDDY", "{contractor2.relation}"],
      ["BFSPC0586B", "{contractor2.pan}"],
      ["5320 6800 1039", "{contractor2.aadhaar}"],
      ["MERLION ORCHIDS", "{venture.projectName}"],
      ["407/A, 407/B, 419, 420 and 421", "{venture.surveyNos}"],
      ["BACHUPALLY", "{venture.village}"],
      ["GHMC Nizampet", "{venture.circle}"],
      ["Medchal-Malkajgiri", "{venture.district}"],
      ["Telangana State", "{venture.state}"],
      ["1600 Sq.Feet", "{p.plinthArea} Sq.Feet"],
      ["80 Sq.Feet", "{p.carParkingArea} Sq.Feet"],
      ["62.57Sq.Yards", "{p.undividedShare} Sq.Yards"],
      ["62.57 Sq.Yards", "{p.undividedShare} Sq.Yards"],
      ["4634.68", "{venture.totalLandSqYards}"],
      ["No.117", "No.{p.flatNo}"],
      ["FirstFloor", "{p.floor} Floor"],
      ["First Floor", "{p.floor} Floor"],
      ["Hyderabad", "{p.place}"],
    ],
  },
  "wo-1": {
    src: "Work_Order_-1-117.docx",
    repl: workOrderRepl({ contractor: 1, total: "18,75,000", advance: "3,75,000", balance: "15,00,000" }),
  },
  "wo-2": {
    src: "WORK_ORDER-2_117.docx",
    repl: workOrderRepl({ contractor: 2, total: "18,75,000", advance: "3,75,000", balance: "15,00,000" }),
  },
  "wo-landlord": {
    src: "WORK_ORDER-117-land_lord_-Shashank.docx",
    repl: [
      ...workOrderRepl({ contractor: 0, total: "9,25,000", advance: "1,85,000", balance: "7,40,000" }),
      ["RAGHUMUDRI SHANTHA KUMARI alias RAGHUMUDRI SANTHI HARI", "{landlord1.fullName}"],
      ["RAGHUMUDRI SHASHANK", "{landlord2.fullName}"],
      ["RAGHUMUDRI MEGHAMSH", "{landlord3.fullName}"],
      ["BTCPR5766E", "{landlord1.pan}"],
      ["CGEPR0336J", "{landlord2.pan}"],
      ["CGEPR0334L", "{landlord3.pan}"],
      ["2547 4216 5282", "{landlord1.aadhaar}"],
      ["6866 3433 4371", "{landlord2.aadhaar}"],
      ["6769 1720 3325", "{landlord3.aadhaar}"],
    ],
  },
  dsd: {
    src: "DSD-_FLAT_NO.117_MERLON_ORCHIDS_1.doc",
    repl: [], // .doc — not converted; user should provide .docx
    skip: true,
    reason: ".doc (legacy Word) — please re-save as .docx in Word and place at public/templates/originals/DSD.docx, then add a replacement map.",
  },
};

function workOrderRepl({ contractor, total, advance, balance }) {
  const c = contractor === 0 ? null : `{contractor${contractor}.fullName}`;
  const r = contractor === 0 ? null : `{contractor${contractor}.relation}`;
  const base = [
    ["YAMIJALA. ADITYA", "{applicant.fullName}"],
    ["Y. ADITYA", "{applicant.fullName}"],
    ["YAMIJALA HANUMANTHA RAO", "{applicant.relation}"],
    ["CARPA6846F", "{applicant.pan}"],
    ["3462 2628 1076", "{applicant.aadhaar}"],
    ["MERLION ORCHIDS", "{venture.projectName}"],
    ["407/A, 407/B, 419, 420 and 421", "{venture.surveyNos}"],
    ["BACHUPALLY", "{venture.village}"],
    ["GHMC Nizampet", "{venture.circle}"],
    ["Medchal-Malkajgiri", "{venture.district}"],
    ["Telangana State", "{venture.state}"],
    ["1600 Sq.Feet", "{p.plinthArea} Sq.Feet"],
    ["80 Sq.Feet", "{p.carParkingArea} Sq.Feet"],
    ["62.57 Sq.Yards", "{p.undividedShare} Sq.Yards"],
    ["4634.68", "{venture.totalLandSqYards}"],
    ["No.117", "No.{p.flatNo}"],
    ["First Floor", "{p.floor} Floor"],
    [total, "{p.saleConsideration}"],
    [advance, "{p.amountPaid}"],
    [balance, "{p.balanceAmount}"],
  ];
  if (contractor === 1) {
    base.push(
      ["JAYALAKSHMI DEEPIKA MODUKURI", c],
      ["VENKATA SATYANARAYANA SHARMA MODUKURI", r],
      ["BDZPM8329R", "{contractor1.pan}"],
      ["7864 5497 7271", "{contractor1.aadhaar}"],
    );
  } else if (contractor === 2) {
    base.push(
      ["CHENEPALLE CHANDU PRIYA", c],
      ["CHENEPALLE GOVINDA REDDY", r],
      ["BFSPC0586B", "{contractor2.pan}"],
      ["5320 6800 1039", "{contractor2.aadhaar}"],
    );
  }
  return base;
}

/** Merge adjacent <w:t> elements inside a single <w:r> (Word frequently splits
 *  identically-formatted text into multiple <w:t> nodes). Also normalize escaped
 *  apostrophes so literals can match. */
function normalizeXml(xml) {
  // Strip <w:proofErr .../> markers that split text runs
  xml = xml.replace(/<w:proofErr[^/]*\/>/g, "");
  // Collapse <w:t ...>A</w:t><w:t ...>B</w:t> inside the same <w:r>
  xml = xml.replace(
    /(<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?)<\/w:t>(<w:t[^>]*>)/g,
    (_m, head, openNext) => head + openNext.replace(/<w:t[^>]*>/, ""),
  );
  // Merge consecutive identical-formatted runs:
  // <w:r><w:rPr>X</w:rPr><w:t>A</w:t></w:r><w:r><w:rPr>X</w:rPr><w:t>B</w:t></w:r>
  let prev;
  do {
    prev = xml;
    xml = xml.replace(
      /<w:r>(<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t(\s[^>]*)?>([^<]*)<\/w:t><\/w:r><w:r>\1?<w:t(\s[^>]*)?>([^<]*)<\/w:t><\/w:r>/g,
      (_m, rpr = "", _a1, t1, _a2, t2) =>
        `<w:r>${rpr}<w:t xml:space="preserve">${t1}${t2}</w:t></w:r>`,
    );
  } while (xml !== prev);
  return xml;
}

function applyReplacements(xml, repl) {
  const hits = [];
  for (const [literal, placeholder] of repl) {
    if (!literal) continue;
    const before = xml;
    const escaped = literal
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const re = new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    xml = xml.replace(re, placeholder);
    // Also try the un-escaped form for plain text
    if (xml === before) {
      const re2 = new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      xml = xml.replace(re2, placeholder);
    }
    hits.push({ literal, placeholder, hit: xml !== before });
  }
  return { xml, hits };
}

function convertOne(id, cfg) {
  if (cfg.skip) {
    console.log(`SKIP  ${id}: ${cfg.reason}`);
    return;
  }
  const srcPath = resolve(SRC, cfg.src);
  if (!existsSync(srcPath)) {
    console.warn(`MISS  ${id}: source not found at ${srcPath}`);
    return;
  }
  const buf = readFileSync(srcPath);
  const zip = new PizZip(buf);
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    console.warn(`BAD   ${id}: word/document.xml missing`);
    return;
  }
  let xml = docFile.asText();
  xml = normalizeXml(xml);
  const { xml: replaced, hits } = applyReplacements(xml, cfg.repl);
  zip.file("word/document.xml", replaced);
  const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, `${id}.docx`), out);
  const missed = hits.filter((h) => !h.hit);
  console.log(
    `OK    ${id}: ${hits.length - missed.length}/${hits.length} replacements hit` +
      (missed.length
        ? `\n      missed: ${missed.map((m) => JSON.stringify(m.literal)).join(", ")}`
        : ""),
  );
}

for (const [id, cfg] of Object.entries(TEMPLATES)) {
  convertOne(id, cfg);
}
console.log("Done. Templates written to public/templates/<id>.docx");