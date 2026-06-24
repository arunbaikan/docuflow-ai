export type Venture = {
  id: string;
  ventureName: string;
  builderName: string;
  builderContact: string;
  builderAddress: string;
  builderBank: string;
  projectName: string;
  surveyNos: string;
  village: string;
  mandal: string;
  circle: string;
  district: string;
  state: string;
  totalLandSqYards: string;
  landlords: Party[];
  contractors: Party[];
  landBoundaries: { north: string; south: string; east: string; west: string };
  createdAt: number;
};

export type Party = {
  fullName: string;
  relation: string; // S/o, W/o, D/o + name
  age: string;
  occupation: string;
  pan: string;
  aadhaar: string;
  address: string;
};

export type Applicant = {
  id: string;
  fullName: string;
  relation: string;
  age: string;
  occupation: string;
  pan: string;
  aadhaar: string;
  address: string;
  coApplicant?: Omit<Applicant, "id" | "coApplicant">;
  createdAt: number;
};

export type PropertyLoan = {
  flatNo: string;
  floor: string;
  plinthArea: string;
  carParkingArea: string;
  undividedShare: string;
  flatBoundaries: { north: string; south: string; east: string; west: string };
  saleConsideration: string;
  saleConsiderationWords: string;
  amountPaid: string;
  amountPaidWords: string;
  balanceAmount: string;
  balanceAmountWords: string;
  loanAmount: string;
  bankName: string;
  bankBranch: string;
  agreementDate: string;
  documentDate: string;
  place: string;
};

export type DraftState = {
  ventureId?: string;
  applicantId?: string;
  property: PropertyLoan;
};

export const TEMPLATES = [
  { id: "builder-noc", name: "Builder NOC (to Bank)", desc: "Builder issues NOC to ICICI for mortgage" },
  { id: "noc-builder-2nd", name: "NOC from Builder (2nd Party Contractor)", desc: "Builder NOC for additional works" },
  { id: "noc-customer", name: "NOC from Customer", desc: "Customer NOC for 2nd party contractor works" },
  { id: "mou", name: "MOU (Tripartite)", desc: "Memorandum of Understanding between landlord, customer & contractor" },
  { id: "wo-1", name: "Work Order – 1", desc: "Work order from applicant to contractor" },
  { id: "wo-2", name: "Work Order – 2", desc: "Second work order" },
  { id: "wo-landlord", name: "Work Order – Landlord", desc: "Work order to landlord party" },
  { id: "dsd", name: "Demand & Sale Deed (DSD)", desc: "Sale deed for the flat" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];