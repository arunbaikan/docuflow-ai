import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ventureStore, newId } from "@/lib/storage";
import type { Party, Venture } from "@/lib/types";
import { Building2, Plus, Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/ventures")({
  component: VenturesPage,
});

const emptyParty = (): Party => ({ fullName: "", relation: "", age: "", occupation: "", pan: "", aadhaar: "", address: "" });

const emptyVenture = (): Venture => ({
  id: newId(),
  ventureName: "",
  builderName: "",
  builderContact: "",
  builderAddress: "",
  builderBank: "",
  projectName: "",
  surveyNos: "",
  village: "",
  mandal: "",
  circle: "",
  district: "",
  state: "Telangana",
  totalLandSqYards: "",
  landlords: [emptyParty()],
  contractors: [emptyParty()],
  landBoundaries: { north: "", south: "", east: "", west: "" },
  createdAt: Date.now(),
});

function VenturesPage() {
  const router = useRouter();
  const [ventures, setVentures] = useState<Venture[]>(() => ventureStore.list());
  const [editing, setEditing] = useState<Venture | null>(null);

  const refresh = () => setVentures(ventureStore.list());

  if (editing) {
    return (
      <VentureForm
        venture={editing}
        onCancel={() => setEditing(null)}
        onSave={(v) => {
          ventureStore.save(v);
          setEditing(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-semibold text-foreground">Venture Profiles</h1>
          <Button size="sm" onClick={() => setEditing(emptyVenture())}>
            <Plus className="mr-2 h-4 w-4" /> New Venture
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {ventures.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No ventures yet. Create one to auto-fill 40% of every document.</p>
              <Button onClick={() => setEditing(emptyVenture())}>
                <Plus className="mr-2 h-4 w-4" /> Create your first Venture
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ventures.map((v) => (
              <Card key={v.id}>
                <CardHeader>
                  <CardTitle className="text-base">{v.ventureName || v.projectName || "Untitled"}</CardTitle>
                  <CardDescription>{v.builderName} · {v.village}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(v)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/generate", search: { v: v.id } })}>Use →</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive"
                    onClick={() => { ventureStore.remove(v.id); refresh(); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function VentureForm({ venture, onSave, onCancel }: { venture: Venture; onSave: (v: Venture) => void; onCancel: () => void }) {
  const [v, setV] = useState<Venture>(venture);
  const set = <K extends keyof Venture>(k: K, val: Venture[K]) => setV({ ...v, [k]: val });

  const updateParty = (list: "landlords" | "contractors", idx: number, patch: Partial<Party>) => {
    const arr = [...v[list]];
    arr[idx] = { ...arr[idx], ...patch };
    set(list, arr);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </button>
          <h1 className="font-semibold text-foreground">Venture Profile</h1>
          <Button size="sm" onClick={() => onSave(v)}>Save Venture</Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Section title="Identity">
          <Field label="Venture Name (internal)"><Input value={v.ventureName} onChange={(e) => set("ventureName", e.target.value)} placeholder="e.g. Merlion Orchids" /></Field>
          <Field label="Project / Building Name"><Input value={v.projectName} onChange={(e) => set("projectName", e.target.value)} placeholder="MERLION ORCHIDS" /></Field>
          <Field label="Builder / Firm Name"><Input value={v.builderName} onChange={(e) => set("builderName", e.target.value)} /></Field>
          <Field label="Builder Contact"><Input value={v.builderContact} onChange={(e) => set("builderContact", e.target.value)} /></Field>
          <Field label="Builder Registered Address" full><Textarea value={v.builderAddress} onChange={(e) => set("builderAddress", e.target.value)} /></Field>
          <Field label="Builder Bank / ESCROW Account" full><Textarea value={v.builderBank} onChange={(e) => set("builderBank", e.target.value)} /></Field>
        </Section>

        <Section title="Land & Title">
          <Field label="Survey Nos."><Input value={v.surveyNos} onChange={(e) => set("surveyNos", e.target.value)} placeholder="407/A, 407/B, 419, 420, 421" /></Field>
          <Field label="Total Land (Sq.Yards)"><Input value={v.totalLandSqYards} onChange={(e) => set("totalLandSqYards", e.target.value)} placeholder="4634.68" /></Field>
          <Field label="Village"><Input value={v.village} onChange={(e) => set("village", e.target.value)} placeholder="BACHUPALLY" /></Field>
          <Field label="Mandal"><Input value={v.mandal} onChange={(e) => set("mandal", e.target.value)} /></Field>
          <Field label="GHMC Circle"><Input value={v.circle} onChange={(e) => set("circle", e.target.value)} placeholder="Nizampet" /></Field>
          <Field label="District"><Input value={v.district} onChange={(e) => set("district", e.target.value)} placeholder="Medchal-Malkajgiri" /></Field>
          <Field label="State"><Input value={v.state} onChange={(e) => set("state", e.target.value)} /></Field>
        </Section>

        <Section title="Land Boundaries">
          {(["north", "south", "east", "west"] as const).map((d) => (
            <Field key={d} label={d.toUpperCase()}>
              <Input value={v.landBoundaries[d]} onChange={(e) => set("landBoundaries", { ...v.landBoundaries, [d]: e.target.value })} />
            </Field>
          ))}
        </Section>

        <PartyList title="Landlords" list={v.landlords} onChange={(arr) => set("landlords", arr)} updateParty={(i, p) => updateParty("landlords", i, p)} />
        <PartyList title="2nd Party Contractors" list={v.contractors} onChange={(arr) => set("contractors", arr)} updateParty={(i, p) => updateParty("contractors", i, p)} />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PartyList({
  title, list, onChange, updateParty,
}: {
  title: string;
  list: Party[];
  onChange: (l: Party[]) => void;
  updateParty: (idx: number, patch: Partial<Party>) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => onChange([...list, emptyParty()])}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {list.map((p, i) => (
          <div key={i} className="rounded-md border border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
              {list.length > 1 && (
                <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name"><Input value={p.fullName} onChange={(e) => updateParty(i, { fullName: e.target.value })} /></Field>
              <Field label="Relation (S/o, W/o, D/o + name)"><Input value={p.relation} onChange={(e) => updateParty(i, { relation: e.target.value })} /></Field>
              <Field label="Age"><Input value={p.age} onChange={(e) => updateParty(i, { age: e.target.value })} /></Field>
              <Field label="Occupation"><Input value={p.occupation} onChange={(e) => updateParty(i, { occupation: e.target.value })} /></Field>
              <Field label="PAN"><Input value={p.pan} onChange={(e) => updateParty(i, { pan: e.target.value })} /></Field>
              <Field label="Aadhaar"><Input value={p.aadhaar} onChange={(e) => updateParty(i, { aadhaar: e.target.value })} /></Field>
              <Field label="Address" full><Textarea value={p.address} onChange={(e) => updateParty(i, { address: e.target.value })} /></Field>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}