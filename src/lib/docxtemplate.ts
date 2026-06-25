import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fileSaver from "file-saver";
import type { Applicant, PropertyLoan, TemplateId, Venture } from "./types";

const { saveAs } = fileSaver;

const TEMPLATE_FILE: Record<TemplateId, string> = {
  "builder-noc": "/templates/builder-noc.docx",
  "noc-builder-2nd": "/templates/noc-builder-2nd.docx",
  "noc-customer": "/templates/noc-customer.docx",
  mou: "/templates/mou.docx",
  "wo-1": "/templates/wo-1.docx",
  "wo-2": "/templates/wo-2.docx",
  "wo-landlord": "/templates/wo-landlord.docx",
  dsd: "/templates/dsd.docx",
};

function pad(s: string | undefined) {
  return (s ?? "").toString();
}

/** Build the flat data bag injected into the .docx template.
 *  Keep keys aligned with the {placeholders} produced by scripts/convert-templates.mjs. */
export function buildTemplateData(
  venture: Venture,
  applicant: Applicant,
  p: PropertyLoan,
) {
  const landlord = (i: number) => {
    const l = venture.landlords[i];
    return l
      ? {
          fullName: pad(l.fullName),
          relation: pad(l.relation),
          age: pad(l.age),
          occupation: pad(l.occupation),
          pan: pad(l.pan),
          aadhaar: pad(l.aadhaar),
          address: pad(l.address),
        }
      : { fullName: "", relation: "", age: "", occupation: "", pan: "", aadhaar: "", address: "" };
  };
  const contractor = (i: number) => {
    const c = venture.contractors[i];
    return c
      ? {
          fullName: pad(c.fullName),
          relation: pad(c.relation),
          age: pad(c.age),
          occupation: pad(c.occupation),
          pan: pad(c.pan),
          aadhaar: pad(c.aadhaar),
          address: pad(c.address),
        }
      : { fullName: "", relation: "", age: "", occupation: "", pan: "", aadhaar: "", address: "" };
  };

  return {
    venture: {
      projectName: pad(venture.projectName),
      builderName: pad(venture.builderName),
      surveyNos: pad(venture.surveyNos),
      village: pad(venture.village),
      mandal: pad(venture.mandal),
      circle: pad(venture.circle),
      district: pad(venture.district),
      state: pad(venture.state),
      totalLandSqYards: pad(venture.totalLandSqYards),
    },
    applicant: {
      fullName: pad(applicant.fullName),
      relation: pad(applicant.relation),
      age: pad(applicant.age),
      occupation: pad(applicant.occupation),
      pan: pad(applicant.pan),
      aadhaar: pad(applicant.aadhaar),
      address: pad(applicant.address),
    },
    p: {
      flatNo: pad(p.flatNo),
      floor: pad(p.floor),
      plinthArea: pad(p.plinthArea),
      carParkingArea: pad(p.carParkingArea),
      undividedShare: pad(p.undividedShare),
      saleConsideration: pad(p.saleConsideration),
      saleConsiderationWords: pad(p.saleConsiderationWords),
      amountPaid: pad(p.amountPaid),
      amountPaidWords: pad(p.amountPaidWords),
      balanceAmount: pad(p.balanceAmount),
      balanceAmountWords: pad(p.balanceAmountWords),
      loanAmount: pad(p.loanAmount),
      bankName: pad(p.bankName),
      bankBranch: pad(p.bankBranch),
      agreementDate: pad(p.agreementDate),
      documentDate: pad(p.documentDate),
      place: pad(p.place),
      flatBoundaries: {
        north: pad(p.flatBoundaries.north),
        south: pad(p.flatBoundaries.south),
        east: pad(p.flatBoundaries.east),
        west: pad(p.flatBoundaries.west),
      },
    },
    landlord1: landlord(0),
    landlord2: landlord(1),
    landlord3: landlord(2),
    contractor1: contractor(0),
    contractor2: contractor(1),
    // also expose as arrays in case the template uses {#landlords}…{/landlords}
    landlords: venture.landlords.map((_, i) => landlord(i)),
    contractors: venture.contractors.map((_, i) => contractor(i)),
    landBoundaries: venture.landBoundaries,
  };
}

export async function renderTemplate(
  id: TemplateId,
  data: ReturnType<typeof buildTemplateData>,
): Promise<Blob> {
  const url = TEMPLATE_FILE[id];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Template not found at ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });
  doc.render(data);
  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}

export async function exportFromTemplate(
  id: TemplateId,
  data: ReturnType<typeof buildTemplateData>,
  filename: string,
) {
  const blob = await renderTemplate(id, data);
  saveAs(blob, `${filename}.docx`);
}

/** Convert a rendered .docx blob into a PDF blob by sending to a server endpoint.
 *  Not implemented client-side — true DOCX→PDF parity needs LibreOffice or a service. */
export async function renderTemplatePdf(): Promise<never> {
  throw new Error(
    "PDF export from .docx template requires a server-side renderer. Use the DOCX output, or fall back to the prose-based PDF.",
  );
}