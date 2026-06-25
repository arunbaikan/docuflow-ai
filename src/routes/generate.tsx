import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { applicantStore, draftStore, newId, ventureStore } from "@/lib/storage";
import { TEMPLATES, type Applicant, type TemplateId } from "@/lib/types";
import { buildDocument } from "@/lib/templates";
import { exportDocx, exportPdf } from "@/lib/export";
import { buildTemplateData, exportFromTemplate } from "@/lib/docxtemplate";
import { ArrowLeft, ArrowRight, Building2, Check, FileDown, FileText, Plus, Sparkles } from "lucide-react";

const searchSchema = z.object({
  tpl: z.string().optional(),
  v: z.string().optional(),
});

export const Route = createFileRoute("/generate")({
  validateSearch: searchSchema,
  component: GeneratePage,
});

const STEPS = ["Template & Venture", "Property & Loan", "Applicant", "Review & Generate"] as const;

function GeneratePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateId[]>(
    search.tpl ? [search.tpl as TemplateId] : [],
  );
  const [draft, setDraft] = useState(() => {
    const d = draftStore.get();
    if (search.v) d.ventureId = search.v;
    return d;
  });
  const setAndPersist = (next: typeof draft) => { setDraft(next); draftStore.set(next); };

  const ventures = useMemo(() => ventureStore.list(), [step]);
  const applicants = useMemo(() => applicantStore.list(), [step]);
  const venture = draft.ventureId ? ventures.find((v) => v.id === draft.ventureId) : undefined;
  const applicant = draft.applicantId ? applicants.find((a) => a.id === draft.applicantId) : undefined;

  const canNext = () => {
    if (step === 0) return !!venture && selectedTemplates.length > 0;
    if (step === 1) return !!draft.property.flatNo;
    if (step === 2) return !!applicant;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="font-semibold text-foreground">Generate Documents</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Stepper step={step} />

        <div className="mt-6">
          {step === 0 && (
            <Step1
              ventures={ventures}
              ventureId={draft.ventureId}
              onVenture={(id) => setAndPersist({ ...draft, ventureId: id })}
              selected={selectedTemplates}
              onToggle={(id) =>
                setSelectedTemplates((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
              }
              onCreateNew={() => navigate({ to: "/ventures" })}
            />
          )}

          {step === 1 && (
            <Step2 draft={draft} onChange={setAndPersist} />
          )}

          {step === 2 && (
            <Step3
              applicants={applicants}
              applicantId={draft.applicantId}
              onSelect={(id) => setAndPersist({ ...draft, applicantId: id })}
              onCreate={(a) => { applicantStore.save(a); setAndPersist({ ...draft, applicantId: a.id }); }}
            />
          )}

          {step === 3 && venture && applicant && (
            <Step4
              venture={venture}
              applicant={applicant}
              property={draft.property}
              templates={selectedTemplates}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => { draftStore.reset(); setDraft(draftStore.get()); setStep(0); setSelectedTemplates([]); }}>
              Start over
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={
              "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold " +
              (i < step
                ? "border-primary bg-primary text-primary-foreground"
                : i === step
                ? "border-primary text-primary"
                : "border-border text-muted-foreground")
            }
          >
            {i < step ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={i === step ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span>
          {i < STEPS.length - 1 && <span className="mx-2 h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function Step1({
  ventures, ventureId, onVenture, selected, onToggle, onCreateNew,
}: {
  ventures: ReturnType<typeof ventureStore.list>;
  ventureId?: string;
  onVenture: (id: string) => void;
  selected: TemplateId[];
  onToggle: (id: TemplateId) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base"><Building2 className="mr-2 inline h-4 w-4" />Select Venture</CardTitle>
          <CardDescription>Auto-fills builder, landlords, contractors, survey & land details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ventures.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No ventures yet.
              <Button variant="link" onClick={onCreateNew}>Create one →</Button>
            </div>
          ) : (
            <Select value={ventureId} onValueChange={onVenture}>
              <SelectTrigger><SelectValue placeholder="Choose a venture…" /></SelectTrigger>
              <SelectContent>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.ventureName || v.projectName} — {v.builderName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={onCreateNew} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Create new Venture
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base"><Sparkles className="mr-2 inline h-4 w-4" />Pick Templates</CardTitle>
          <CardDescription>Generate one or many in this session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {TEMPLATES.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 hover:bg-accent/30">
              <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => onToggle(t.id)} />
              <div>
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Step2({ draft, onChange }: { draft: ReturnType<typeof draftStore.get>; onChange: (d: typeof draft) => void }) {
  const p = draft.property;
  const setP = (patch: Partial<typeof p>) => onChange({ ...draft, property: { ...p, ...patch } });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Property & Loan Specifics</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <F label="Flat No."><Input value={p.flatNo} onChange={(e) => setP({ flatNo: e.target.value })} placeholder="117" /></F>
        <F label="Floor"><Input value={p.floor} onChange={(e) => setP({ floor: e.target.value })} placeholder="First" /></F>
        <F label="Plinth Area (Sq.Ft)"><Input value={p.plinthArea} onChange={(e) => setP({ plinthArea: e.target.value })} placeholder="1600" /></F>
        <F label="Car Parking (Sq.Ft)"><Input value={p.carParkingArea} onChange={(e) => setP({ carParkingArea: e.target.value })} placeholder="80" /></F>
        <F label="Undivided Share (Sq.Yd)"><Input value={p.undividedShare} onChange={(e) => setP({ undividedShare: e.target.value })} placeholder="62.57" /></F>
        <F label="Agreement Date"><Input type="date" value={p.agreementDate} onChange={(e) => setP({ agreementDate: e.target.value })} /></F>
        <F label="Document Date"><Input type="date" value={p.documentDate} onChange={(e) => setP({ documentDate: e.target.value })} /></F>
        <F label="Place"><Input value={p.place} onChange={(e) => setP({ place: e.target.value })} /></F>

        <F label="Sale Consideration (Rs.)"><Input value={p.saleConsideration} onChange={(e) => setP({ saleConsideration: e.target.value })} placeholder="47,00,000" /></F>
        <F label="In Words"><Input value={p.saleConsiderationWords} onChange={(e) => setP({ saleConsiderationWords: e.target.value })} placeholder="Rupees Forty Seven Lakhs Only" /></F>
        <F label="Amount Paid (Rs.)"><Input value={p.amountPaid} onChange={(e) => setP({ amountPaid: e.target.value })} /></F>
        <F label="In Words"><Input value={p.amountPaidWords} onChange={(e) => setP({ amountPaidWords: e.target.value })} /></F>
        <F label="Balance Amount (Rs.)"><Input value={p.balanceAmount} onChange={(e) => setP({ balanceAmount: e.target.value })} /></F>
        <F label="In Words"><Input value={p.balanceAmountWords} onChange={(e) => setP({ balanceAmountWords: e.target.value })} /></F>
        <F label="Loan Amount (Rs.)"><Input value={p.loanAmount} onChange={(e) => setP({ loanAmount: e.target.value })} /></F>
        <F label="Bank"><Input value={p.bankName} onChange={(e) => setP({ bankName: e.target.value })} /></F>

        <div className="sm:col-span-2">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">Flat Boundaries</Label>
          <div className="grid gap-3 sm:grid-cols-4">
            {(["north", "south", "east", "west"] as const).map((d) => (
              <Input key={d} value={p.flatBoundaries[d]} placeholder={d.toUpperCase()} onChange={(e) => setP({ flatBoundaries: { ...p.flatBoundaries, [d]: e.target.value } })} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function emptyApplicant(): Applicant {
  return { id: newId(), fullName: "", relation: "", age: "", occupation: "", pan: "", aadhaar: "", address: "", createdAt: Date.now() };
}

function Step3({
  applicants, applicantId, onSelect, onCreate,
}: {
  applicants: Applicant[];
  applicantId?: string;
  onSelect: (id: string) => void;
  onCreate: (a: Applicant) => void;
}) {
  const [mode, setMode] = useState<"select" | "new">(applicants.length > 0 && applicantId ? "select" : "new");
  const [a, setA] = useState<Applicant>(emptyApplicant());
  const upd = (patch: Partial<Applicant>) => setA({ ...a, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Applicant Details</CardTitle>
        <CardDescription>Pick a saved applicant or add a new one — they are auto-saved for future docs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "select" ? "default" : "outline"} size="sm" onClick={() => setMode("select")} disabled={applicants.length === 0}>
            Select Existing
          </Button>
          <Button variant={mode === "new" ? "default" : "outline"} size="sm" onClick={() => setMode("new")}>
            <Plus className="mr-1 h-4 w-4" /> New Applicant
          </Button>
        </div>

        {mode === "select" ? (
          <Select value={applicantId} onValueChange={onSelect}>
            <SelectTrigger><SelectValue placeholder="Choose applicant…" /></SelectTrigger>
            <SelectContent>
              {applicants.map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.fullName} — {x.pan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Full Name"><Input value={a.fullName} onChange={(e) => upd({ fullName: e.target.value })} /></F>
              <F label="Relation (S/o, W/o, D/o + name)"><Input value={a.relation} onChange={(e) => upd({ relation: e.target.value })} /></F>
              <F label="Age"><Input value={a.age} onChange={(e) => upd({ age: e.target.value })} /></F>
              <F label="Occupation"><Input value={a.occupation} onChange={(e) => upd({ occupation: e.target.value })} /></F>
              <F label="PAN"><Input value={a.pan} onChange={(e) => upd({ pan: e.target.value })} /></F>
              <F label="Aadhaar"><Input value={a.aadhaar} onChange={(e) => upd({ aadhaar: e.target.value })} /></F>
              <F label="Address" full><Textarea value={a.address} onChange={(e) => upd({ address: e.target.value })} /></F>
            </div>
            <Button onClick={() => { if (a.fullName) onCreate(a); }} disabled={!a.fullName}>Save & Use Applicant</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Step4({
  venture, applicant, property, templates,
}: {
  venture: NonNullable<ReturnType<typeof ventureStore.get>>;
  applicant: Applicant;
  property: ReturnType<typeof draftStore.get>["property"];
  templates: TemplateId[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <Box label="Venture" value={`${venture.ventureName || venture.projectName}\n${venture.builderName}`} />
          <Box label="Property" value={`Flat ${property.flatNo}, ${property.floor} Floor\n${property.plinthArea} Sq.Ft`} />
          <Box label="Applicant" value={`${applicant.fullName}\n${applicant.pan}`} />
          <Box label="Sale Consideration" value={`Rs. ${property.saleConsideration || "—"}`} />
          <Box label="Loan" value={`Rs. ${property.loanAmount || "—"} · ${property.bankName}`} />
          <Box label="Documents" value={`${templates.length} selected`} />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No templates selected. Go back to step 1.</p>
        )}
        {templates.map((id) => {
          const t = TEMPLATES.find((x) => x.id === id)!;
          const doc = buildDocument(id, { venture, applicant, p: property });
          const fname = `${t.name.replace(/[^A-Za-z0-9]+/g, "_")}_${property.flatNo || "draft"}`;
          const tplData = buildTemplateData(venture, applicant, property);
          return (
            <Card key={id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base"><FileText className="mr-2 inline h-4 w-4" />{t.name}</CardTitle>
                  <CardDescription>
                    {id === "dsd"
                      ? "Prose fallback (original is legacy .doc — re-save as .docx to enable template render)"
                      : "Renders from your original .docx template — formatting preserved"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => exportPdf(doc.title, doc.blocks, fname)}>
                    <FileDown className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        if (id === "dsd") {
                          exportDocx(doc.title, doc.blocks, fname);
                        } else {
                          await exportFromTemplate(id, tplData, fname);
                        }
                      } catch (err) {
                        console.error("Template render failed, falling back to prose:", err);
                        exportDocx(doc.title, doc.blocks, fname);
                      }
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" /> DOCX
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-line text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}