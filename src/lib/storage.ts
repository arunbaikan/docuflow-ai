import type { Applicant, DraftState, Venture } from "./types";

const V_KEY = "vault.ventures";
const A_KEY = "vault.applicants";
const D_KEY = "vault.draft";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k, JSON.stringify(v));
}

export const ventureStore = {
  list: () => read<Venture[]>(V_KEY, []),
  get: (id: string) => ventureStore.list().find((v) => v.id === id),
  save: (v: Venture) => {
    const all = ventureStore.list().filter((x) => x.id !== v.id);
    all.unshift(v);
    write(V_KEY, all);
  },
  remove: (id: string) => write(V_KEY, ventureStore.list().filter((v) => v.id !== id)),
};

export const applicantStore = {
  list: () => read<Applicant[]>(A_KEY, []),
  get: (id: string) => applicantStore.list().find((a) => a.id === id),
  save: (a: Applicant) => {
    const all = applicantStore.list().filter((x) => x.id !== a.id);
    all.unshift(a);
    write(A_KEY, all);
  },
  remove: (id: string) => write(A_KEY, applicantStore.list().filter((a) => a.id !== id)),
};

export const draftStore = {
  get: (): DraftState =>
    read<DraftState>(D_KEY, {
      property: {
        flatNo: "",
        floor: "",
        plinthArea: "",
        carParkingArea: "",
        undividedShare: "",
        flatBoundaries: { north: "", south: "", east: "", west: "" },
        saleConsideration: "",
        saleConsiderationWords: "",
        amountPaid: "",
        amountPaidWords: "",
        balanceAmount: "",
        balanceAmountWords: "",
        loanAmount: "",
        bankName: "ICICI Bank Limited",
        bankBranch: "Hyderabad",
        agreementDate: "",
        documentDate: new Date().toISOString().slice(0, 10),
        place: "Hyderabad",
      },
    }),
  set: (d: DraftState) => write(D_KEY, d),
  reset: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(D_KEY);
  },
};

export const newId = () => Math.random().toString(36).slice(2, 10);