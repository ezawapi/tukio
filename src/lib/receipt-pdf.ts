import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface ReceiptData {
  orderId: string;
  buyerName?: string | null;
  buyerEmail: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
  paymentStatus: string;
  paymentProvider: string;
  qrToken: string;
  createdAt: string;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  eventCity?: string | null;
  ticketTypeName?: string | null;
}

export const downloadReceiptPdf = (r: ReceiptData) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Tukio — Reçu de billetterie", 40, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(40, y, w - 40, y);
  y += 24;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 200, y, { maxWidth: w - 240 });
    y += 18;
  };

  line("N° de commande", r.orderId);
  line("Date d'achat", format(new Date(r.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr }));
  line("Statut paiement", r.paymentStatus);
  line("Moyen de paiement", r.paymentProvider);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Événement", 40, y); y += 16;
  doc.setFont("helvetica", "normal");
  doc.text(r.eventTitle, 40, y, { maxWidth: w - 80 }); y += 18;
  if (r.eventDate) { doc.text(`Date : ${format(new Date(r.eventDate), "d MMM yyyy 'à' HH:mm", { locale: fr })}`, 40, y); y += 16; }
  if (r.eventLocation || r.eventCity) { doc.text(`Lieu : ${[r.eventLocation, r.eventCity].filter(Boolean).join(", ")}`, 40, y, { maxWidth: w - 80 }); y += 16; }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Acheteur", 40, y); y += 16;
  doc.setFont("helvetica", "normal");
  if (r.buyerName) { doc.text(r.buyerName, 40, y); y += 16; }
  doc.text(r.buyerEmail, 40, y); y += 18;

  doc.setDrawColor(200);
  doc.line(40, y, w - 40, y); y += 18;

  if (r.ticketTypeName) line("Type de billet", r.ticketTypeName);
  line("Quantité", String(r.quantity));
  line("Prix unitaire", `${r.unitPrice} ${r.currency}`);
  doc.setFont("helvetica", "bold");
  doc.text("Total", 40, y);
  doc.text(`${r.total} ${r.currency}`, 200, y);
  y += 26;

  // QR code via image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(r.qrToken)}`;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Code de contrôle (à présenter à l'entrée) :", 40, y); y += 8;
  doc.text(r.qrToken, 40, y + 220, { maxWidth: w - 80 });

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try { doc.addImage(img, "PNG", 40, y, 180, 180); } catch {}
    doc.save(`recu-tukio-${r.orderId.slice(0, 8)}.pdf`);
  };
  img.onerror = () => doc.save(`recu-tukio-${r.orderId.slice(0, 8)}.pdf`);
  img.src = qrUrl;
};
