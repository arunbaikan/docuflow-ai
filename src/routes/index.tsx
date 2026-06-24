import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TEMPLATES } from "@/lib/types";
import { FileText, Building2, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocVault — Home Loan Document Automation" },
      { name: "description", content: "Generate Builder NOC, MOU, Work Orders and Sale Deeds from reusable Venture profiles." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            DocVault
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/ventures"><Button variant="ghost" size="sm"><Building2 className="mr-2 h-4 w-4" />Ventures</Button></Link>
            <Link to="/generate"><Button size="sm"><FileText className="mr-2 h-4 w-4" />Generate</Button></Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Home-loan documents,<br />drafted in minutes.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Reusable Venture profiles auto-populate up to 40% of every document. Pick a template,
            fill the rest in a guided 4-step flow, export to Word or PDF.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/generate"><Button size="lg"><FileText className="mr-2 h-4 w-4" />Start a new document</Button></Link>
            <Link to="/ventures"><Button size="lg" variant="outline"><Building2 className="mr-2 h-4 w-4" />Manage Ventures</Button></Link>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Supported templates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Card key={t.id} className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/generate" search={{ tpl: t.id }}>
                    <Button variant="secondary" size="sm" className="w-full">Use template</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Building2, title: "Venture Profiles", body: "Bundle Builder, Landlords, Contractors, Survey & Title details once. Reuse forever." },
            { icon: Users, title: "Applicant Library", body: "Save customer + co-applicant details and pick them on any future deed." },
            { icon: FileText, title: "Word + PDF Export", body: "Every template renders to .docx and .pdf, ready to print or sign." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border/60 bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
