import type { Applicant, PropertyLoan, TemplateId, Venture } from "./types";

export type Ctx = { venture: Venture; applicant: Applicant; p: PropertyLoan };

const partyLine = (p: { fullName: string; relation: string; age: string; occupation: string; pan: string; aadhaar: string; address?: string }) =>
  `${p.fullName} ${p.relation}, aged about ${p.age || "—"} years, Occupation: ${p.occupation || "—"}. (PAN: ${p.pan || "—"}, AADHAAR NO: ${p.aadhaar || "—"})${p.address ? ", R/o. " + p.address : ""}`;

const propertyDesc = (v: Venture, p: PropertyLoan) =>
  `Semi-finished Flat bearing No.${p.flatNo}, in ${p.floor} Floor, in the building known as "${v.projectName}", with a plinth area of ${p.plinthArea} Sq.Feet (including Common area), and Car Parking area of ${p.carParkingArea} Sq.Feet, along with an undivided share of land admeasuring ${p.undividedShare} Sq.Yards (Out of total land of ${v.totalLandSqYards} Sq.Yards), Constructed on Open Land, in Survey Nos.${v.surveyNos}, Situated at ${v.village} Village & Mandal, Under ${v.circle} Circle, ${v.district} District, ${v.state}`;

export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "li"; text: string }
  | { type: "spacer" };

export function buildDocument(id: TemplateId, ctx: Ctx): { title: string; blocks: Block[] } {
  const { venture: v, applicant: a, p } = ctx;
  const flat = propertyDesc(v, p);
  switch (id) {
    case "builder-noc":
      return {
        title: "Builder NOC to ICICI Bank",
        blocks: [
          { type: "h1", text: "NOC from Builder (on Builder's letter-head)" },
          { type: "p", text: `Date: ${p.documentDate}` },
          { type: "p", text: `Place: ${p.place}` },
          { type: "p", text: `To,\n${p.bankName}\n${p.bankBranch}` },
          { type: "p", text: "Dear Sir," },
          { type: "p", text: `Re: Permission to mortgage Flat No. ${p.flatNo} on the ${p.floor} floor of "${v.projectName}", plinth area ${p.plinthArea} Sq.Feet, with undivided share of land ${p.undividedShare} Sq.Yards, Survey Nos. ${v.surveyNos}, ${v.village} Village & Mandal, ${v.district} District, ${v.state}.` },
          { type: "li", text: `We confirm that we have allotted/sold the above flat to ${a.fullName} ${a.relation} for a total consideration of Rs.${p.saleConsideration}/- (${p.saleConsiderationWords}) under an Agreement for Sale dated ${p.agreementDate}.` },
          { type: "li", text: "We confirm necessary permissions/approvals have been obtained and construction is per approved plans." },
          { type: "li", text: `${a.fullName} has paid Rs.${p.amountPaid}/- (${p.amountPaidWords}); balance Rs.${p.balanceAmount}/- (${p.balanceAmountWords}) remains payable.` },
          { type: "li", text: `We have no objection to ${a.fullName} mortgaging the said Flat to ${p.bankName} as security for the loan of Rs.${p.loanAmount}/-.` },
          { type: "spacer" },
          { type: "p", text: `For ${v.builderName}` },
          { type: "p", text: "Authorised Signatory" },
        ],
      };
    case "noc-builder-2nd":
    case "noc-customer": {
      const fromCustomer = id === "noc-customer";
      return {
        title: fromCustomer ? "NOC from Customer" : "NOC from Builder (2nd Party Contractor)",
        blocks: [
          { type: "p", text: `To,\nThe Manager\n${p.bankName}\n${p.bankBranch}` },
          { type: "p", text: `Date: ${p.documentDate}    Place: ${p.place}` },
          { type: "p", text: "Dear Sir/Madam," },
          { type: "h2", text: "Sub: No Objection for getting the additional works through 2nd party contractor – reg" },
          { type: "p", text: `${fromCustomer ? "I have been allocated" : "We have allocated"} the "${flat}", and going for additional works by entering a separate agreement with the 2nd Party Contractor(s):` },
          ...v.contractors.map<Block>((c) => ({ type: "li", text: partyLine(c) })),
          { type: "p", text: "We have no objection for getting the additional works done by the above 2nd Party contractor in the said property." },
          { type: "p", text: `We have no objection to release the balance amount in favour of the 2nd Party contractor${fromCustomer ? ` ${a.fullName} ${a.relation}` : ""}.` },
          { type: "spacer" },
          { type: "p", text: "Thanking you Sir." },
          { type: "p", text: "Yours faithfully," },
          { type: "p", text: fromCustomer ? a.fullName : v.builderName },
        ],
      };
    }
    case "mou":
      return {
        title: "Memorandum of Understanding",
        blocks: [
          { type: "h1", text: "MEMORANDUM OF UNDERSTANDING" },
          { type: "p", text: `This Memorandum of Understanding is made and executed on this ${p.documentDate} at ${p.place} by and between:` },
          { type: "h2", text: "FIRST PARTY (Landlords)" },
          ...v.landlords.map<Block>((l) => ({ type: "li", text: partyLine(l) })),
          { type: "h2", text: "SECOND PARTY (Customer)" },
          { type: "p", text: partyLine({ ...a, address: a.address }) },
          { type: "h2", text: "SECOND PARTY / CONTRACTORS" },
          ...v.contractors.map<Block>((c) => ({ type: "li", text: partyLine(c) })),
          { type: "p", text: `WHEREAS All that the "${flat}", and bounded as follows:` },
          { type: "h2", text: "BOUNDARIES FOR LAND" },
          { type: "p", text: `North: ${v.landBoundaries.north}\nSouth: ${v.landBoundaries.south}\nEast: ${v.landBoundaries.east}\nWest: ${v.landBoundaries.west}` },
          { type: "h2", text: "BOUNDARIES FOR FLAT" },
          { type: "p", text: `North: ${p.flatBoundaries.north}\nSouth: ${p.flatBoundaries.south}\nEast: ${p.flatBoundaries.east}\nWest: ${p.flatBoundaries.west}` },
          { type: "p", text: `Total sale consideration: Rs.${p.saleConsideration}/- (${p.saleConsiderationWords}). Loan availed: Rs.${p.loanAmount}/- from ${p.bankName}.` },
        ],
      };
    case "wo-1":
    case "wo-2":
    case "wo-landlord": {
      const isLandlord = id === "wo-landlord";
      return {
        title: id === "wo-1" ? "Work Order – 1" : id === "wo-2" ? "Work Order – 2" : "Work Order – Landlord",
        blocks: [
          { type: "h1", text: "WORK ORDER" },
          { type: "p", text: `1. Date of Order: ${p.documentDate}` },
          { type: "p", text: `2. Placed by (Applicant):` },
          { type: "p", text: partyLine({ ...a, address: a.address }) },
          { type: "p", text: `3. Placed on (${isLandlord ? "Landlord" : "Contractor"}):` },
          ...(isLandlord ? v.landlords : v.contractors).map<Block>((c) => ({ type: "li", text: partyLine(c) })),
          { type: "p", text: `Re: Additional / finishing works for ${flat}.` },
          { type: "p", text: `Order Value: Rs.${p.balanceAmount}/- (${p.balanceAmountWords}) — to be released from bank loan disbursement.` },
          { type: "spacer" },
          { type: "p", text: "Signature of Applicant:" },
          { type: "p", text: `Signature of ${isLandlord ? "Landlord" : "Contractor"}:` },
        ],
      };
    }
    case "dsd":
      return {
        title: "Demand & Sale Deed",
        blocks: [
          { type: "h1", text: "SALE DEED" },
          { type: "p", text: `This Sale Deed is executed on ${p.documentDate} at ${p.place}.` },
          { type: "h2", text: "VENDORS (Landlords)" },
          ...v.landlords.map<Block>((l) => ({ type: "li", text: partyLine(l) })),
          { type: "h2", text: "VENDEE (Purchaser)" },
          { type: "p", text: partyLine({ ...a, address: a.address }) },
          { type: "p", text: `Schedule of Property: ${flat}.` },
          { type: "p", text: `Sale Consideration: Rs.${p.saleConsideration}/- (${p.saleConsiderationWords}).` },
          { type: "p", text: `Amount paid: Rs.${p.amountPaid}/- (${p.amountPaidWords}); Balance through bank loan: Rs.${p.loanAmount}/-.` },
          { type: "h2", text: "Boundaries of Flat" },
          { type: "p", text: `North: ${p.flatBoundaries.north}\nSouth: ${p.flatBoundaries.south}\nEast: ${p.flatBoundaries.east}\nWest: ${p.flatBoundaries.west}` },
          { type: "spacer" },
          { type: "p", text: "IN WITNESS WHEREOF the parties have signed this deed on the date first mentioned above." },
          { type: "p", text: "VENDORS:" },
          { type: "p", text: "VENDEE:" },
        ],
      };
  }
}