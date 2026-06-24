import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import { jsPDF } from "jspdf";
import type { Block } from "./templates";

export async function exportDocx(title: string, blocks: Block[], filename: string) {
  const children = blocks.flatMap<Paragraph>((b) => {
    if (b.type === "spacer") return [new Paragraph({ children: [new TextRun(" ")] })];
    if (b.type === "h1")
      return [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: b.text, bold: true })] })];
    if (b.type === "h2")
      return [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: b.text, bold: true })] })];
    if (b.type === "li")
      return [new Paragraph({ bullet: { level: 0 }, children: [new TextRun(b.text)] })];
    return b.text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] }));
  });

  const doc = new Document({
    creator: "Home Loan Doc Vault",
    title,
    sections: [{ properties: {}, children: [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title, bold: true })] }), ...children] }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

export function exportPdf(title: string, blocks: Block[], filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 24;

  for (const b of blocks) {
    if (b.type === "spacer") {
      y += 12;
      continue;
    }
    if (b.type === "h1") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
    } else if (b.type === "h2") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }
    const prefix = b.type === "li" ? "•  " : "";
    const lines = doc.splitTextToSize(prefix + b.text, maxWidth);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 4;
  }

  doc.save(`${filename}.pdf`);
}