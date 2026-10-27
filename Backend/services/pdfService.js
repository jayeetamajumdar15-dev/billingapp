import PDFDocument from "pdfkit";

/**
 * Generate an aesthetically pleasing, modern, high-contrast PDF invoice Buffer.
 * Dynamically sizes to fit all items in a single sleek receipt without page clipping.
 * @param {Object} invoice
 * @param {Object} storeInfo
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdfBuffer(invoice, storeInfo = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const items = invoice.items || [];
      const itemCount = items.length;
      
      const logoSpace = storeInfo.logo ? 75 : 0;
      const baseHeight = 410 + logoSpace;
      const itemRowHeight = 22;
      const extraRows = (invoice.discountTotal > 0 ? 18 : 0) + 
                        (invoice.regularDiscountAmount > 0 ? 18 : 0) + 
                        (invoice.freebieItemGiven ? 18 : 0) + 
                        (invoice.taxTotal > 0 ? 18 : 0) + 
                        (invoice.paymentMode === "UPI/CASH" ? 22 : 0);
      const calculatedHeight = Math.max(540, baseHeight + (itemCount * itemRowHeight) + extraRows);

      const doc = new PDFDocument({
        size: [288, calculatedHeight], // 76mm standard receipt width
        autoFirstPage: true,
        margins: { top: 0, bottom: 12, left: 12, right: 12 },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const storeName = storeInfo.businessName || invoice.businessName || "THE A POP JAKO BITES";
      const storePhone = storeInfo.phone || storeInfo.whatsappNumber || "7003317615";
      const storeAddress = storeInfo.address || "";
      const storeEmail = storeInfo.email || "";
      const storeGstin = storeInfo.gstin || "";
      const storeLogo = storeInfo.logo || "";

      const pageWidth = 288;
      const contentWidth = 264;
      const leftX = 12;
      const rightX = leftX + contentWidth;

      // ─── TOP DECORATIVE ACCENT BAR ────────────────────────────────────
      doc.rect(0, 0, pageWidth, 5).fill("#2563EB");
      doc.y = 14;

      // ─── 1. LOGO (if available) ───────────────────────────────────────
      if (storeLogo) {
        try {
          const logoRes = await fetch(storeLogo);
          if (logoRes.ok) {
            const logoArrayBuf = await logoRes.arrayBuffer();
            const logoBuf = Buffer.from(logoArrayBuf);
            const logoSize = 60;
            const logoX = leftX + (contentWidth - logoSize) / 2;
            doc.image(logoBuf, logoX, doc.y, { width: logoSize, height: logoSize, align: "center" });
            doc.y += logoSize + 4;
          }
        } catch (logoErr) {
          console.warn("Logo embed notice:", logoErr.message);
        }
      }

      // ─── 2. STORE HEADER ──────────────────────────────────────────────
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#0F172A")
        .text(storeName.toUpperCase(), leftX, doc.y, { width: contentWidth, align: "center" });

      // Subtitle Pill
      const pillY = doc.y + 2;
      const pillW = 86;
      const pillX = leftX + (contentWidth - pillW) / 2;
      doc.roundedRect(pillX, pillY, pillW, 14, 7).fillAndStroke("#F1F5F9", "#CBD5E1");
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#2563EB")
        .text("TAX INVOICE", pillX, pillY + 3.5, { width: pillW, align: "center" });

      doc.y = pillY + 18;

      if (storeAddress) {
        doc.fontSize(7.5).font("Helvetica").fillColor("#475569")
          .text(storeAddress, leftX, doc.y, { width: contentWidth, align: "center" });
        doc.moveDown(0.15);
      }

      doc.fontSize(7.5).font("Helvetica").fillColor("#475569")
        .text(`Helpline: +${storePhone}`, leftX, doc.y, { width: contentWidth, align: "center" });

      if (storeEmail) {
        doc.fontSize(7).font("Helvetica").fillColor("#64748B")
          .text(`Email: ${storeEmail}`, leftX, doc.y + 1, { width: contentWidth, align: "center" });
      }

      if (storeGstin) {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#334155")
          .text(`GSTIN: ${storeGstin}`, leftX, doc.y + 1, { width: contentWidth, align: "center" });
      }

      doc.moveDown(0.4);

      // ─── TOKEN NUMBER BADGE ───────────────────────────────────────────
      const rawToken = invoice.invoiceNumber || "1";
      const tokenDisplay = rawToken.toString().replace(/[^0-9]/g, "") || rawToken;
      const tokenBoxY = doc.y;
      doc.roundedRect(leftX, tokenBoxY, contentWidth, 34, 6).fillAndStroke("#F8FAFC", "#E2E8F0");
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748B")
        .text("ORDER / TOKEN NUMBER", leftX, tokenBoxY + 4, { width: contentWidth, align: "center" });
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#0F172A")
        .text(`#${tokenDisplay}`, leftX, tokenBoxY + 14, { width: contentWidth, align: "center" });

      doc.y = tokenBoxY + 39;

      // ─── 3. BILL METADATA ────────────────────────────────────────────
      const dateStr = invoice.createdAt || invoice.invoiceDate
        ? new Date(invoice.createdAt || invoice.invoiceDate).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : new Date().toLocaleString("en-IN");

      const paymentMode = invoice.paymentMode || "CASH";
      const custName = invoice.partyName || "Walk-in Customer";
      const custPhone = invoice.partyPhone ? invoice.partyPhone : "";

      const metaY = doc.y;
      doc.rect(leftX, metaY, contentWidth, 32).fill("#F8FAFC");
      doc.fontSize(7.5).font("Helvetica").fillColor("#334155");

      // Left Column
      doc.font("Helvetica-Bold").text("Bill No:", leftX + 6, metaY + 4);
      doc.font("Helvetica").text(`#${invoice.invoiceNumber || "1"}`, leftX + 44, metaY + 4);

      doc.font("Helvetica-Bold").text("Date:", leftX + 6, metaY + 16);
      doc.font("Helvetica").text(dateStr, leftX + 44, metaY + 16);

      // Right Column
      doc.font("Helvetica-Bold").text("Customer:", leftX + 130, metaY + 4);
      doc.font("Helvetica").text(custName.slice(0, 16), leftX + 175, metaY + 4, { width: 80 });

      doc.font("Helvetica-Bold").text("Pay Mode:", leftX + 130, metaY + 16);
      doc.font("Helvetica-Bold").fillColor(paymentMode === "CREDIT" ? "#DC2626" : "#059669")
        .text(paymentMode, leftX + 175, metaY + 16);

      doc.y = metaY + 36;

      // ─── 4. ITEMS TABLE ──────────────────────────────────────────────
      const colItem = leftX + 6;
      const colQty = leftX + 132;
      const colRate = leftX + 172;
      const colTotal = leftX + 218;

      const tableHeadY = doc.y;
      doc.roundedRect(leftX, tableHeadY, contentWidth, 16, 4).fill("#0F172A");

      doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("ITEM", colItem, tableHeadY + 4, { width: 120 });
      doc.text("QTY", colQty, tableHeadY + 4, { width: 35, align: "center" });
      doc.text("RATE", colRate, tableHeadY + 4, { width: 40, align: "right" });
      doc.text("TOTAL", colTotal, tableHeadY + 4, { width: 40, align: "right" });

      doc.y = tableHeadY + 18;

      // Render Item Rows
      let rowIndex = 0;
      for (const it of items) {
        const itemY = doc.y;
        const name = it.name || "Item";
        const qty = it.quantity || 1;
        const rateVal = Number(it.sellingPrice ?? it.price ?? it.rate ?? 0);
        const totalVal = Number(it.total ?? (rateVal * qty));

        if (rowIndex % 2 === 1) {
          doc.rect(leftX, itemY - 1, contentWidth, 16).fill("#F8FAFC");
        }

        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#1E293B");
        doc.text(name, colItem, itemY + 2, { width: 124, height: 14, ellipsis: true });

        doc.font("Helvetica").fillColor("#475569");
        doc.text(`${qty}`, colQty, itemY + 2, { width: 35, align: "center" });
        doc.text(rateVal.toFixed(0), colRate, itemY + 2, { width: 40, align: "right" });

        doc.font("Helvetica-Bold").fillColor("#0F172A");
        doc.text(`Rs.${totalVal.toFixed(0)}`, colTotal, itemY + 2, { width: 40, align: "right" });

        doc.y = itemY + 16;
        rowIndex++;
      }

      doc.moveDown(0.2);
      doc.moveTo(leftX, doc.y).lineTo(rightX, doc.y).dash(3, { space: 2 }).strokeColor("#CBD5E1").lineWidth(0.5).stroke();
      doc.undash();
      doc.moveDown(0.3);

      // ─── 5. TOTALS BREAKDOWN ─────────────────────────────────────────
      const printSummaryLine = (label, val, isBold = false, color = "#334155") => {
        const currY = doc.y;
        doc.fontSize(7.5).font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(color);
        doc.text(label, leftX + 70, currY, { width: 110, align: "right" });
        doc.text(val, colTotal - 10, currY, { width: 50, align: "right" });
        doc.moveDown(0.2);
      };

      printSummaryLine("Subtotal:", `Rs. ${Number(invoice.subtotal || invoice.grandTotal || 0).toFixed(2)}`);

      if (invoice.discountTotal > 0) {
        printSummaryLine("Discount:", `-Rs. ${Number(invoice.discountTotal).toFixed(2)}`, false, "#059669");
      }

      if (invoice.regularDiscountAmount > 0) {
        printSummaryLine("Regular Perk:", `-Rs. ${Number(invoice.regularDiscountAmount).toFixed(2)}`, true, "#059669");
      }

      if (invoice.freebieItemGiven) {
        printSummaryLine("Free Gift:", `${invoice.freebieItemGiven}`, true, "#2563EB");
      }

      if (invoice.taxTotal > 0) {
        printSummaryLine("Taxes (GST):", `Rs. ${Number(invoice.taxTotal).toFixed(2)}`);
      }

      doc.moveDown(0.2);

      // ─── GRAND TOTAL CARD ────────────────────────────────────────────
      const grandY = doc.y;
      doc.roundedRect(leftX, grandY, contentWidth, 22, 5).fill("#0F172A");
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("GRAND TOTAL", leftX + 10, grandY + 6);
      doc.text(`Rs. ${Number(invoice.grandTotal || 0).toFixed(2)}`, colTotal - 25, grandY + 6, {
        width: 65,
        align: "right",
      });

      doc.y = grandY + 28;

      // Split Payment Details
      if (invoice.paymentMode === "UPI/CASH") {
        doc.fontSize(7).font("Helvetica-Bold").fillColor("#059669");
        doc.text(
          `Paid: Cash Rs.${invoice.cashAmount || 0}  +  UPI Rs.${invoice.upiAmount || 0}`,
          leftX,
          doc.y,
          { width: contentWidth, align: "center" }
        );
        doc.moveDown(0.3);
      }

      // Savings Callout Banner
      const totalSaved = (invoice.discountTotal || 0) + (invoice.regularDiscountAmount || 0);
      if (totalSaved > 0) {
        const saveY = doc.y;
        doc.roundedRect(leftX, saveY, contentWidth, 16, 4).fillAndStroke("#DCFCE7", "#86EFAC");
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#15803D")
          .text(`🎉 TOTAL SAVED: Rs. ${totalSaved.toFixed(0)} ON THIS BILL`, leftX, saveY + 4, {
            width: contentWidth,
            align: "center",
          });
        doc.y = saveY + 20;
      }

      // ─── 6. FOOTER ───────────────────────────────────────────────────
      doc.moveDown(0.2);
      doc.moveTo(leftX, doc.y).lineTo(rightX, doc.y).dash(3, { space: 2 }).strokeColor("#CBD5E1").lineWidth(0.5).stroke();
      doc.undash();
      doc.moveDown(0.3);

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#0F172A")
        .text("Thank you for dining with us! Visit again.", leftX, doc.y, { width: contentWidth, align: "center" });

      doc.fontSize(6.5).font("Helvetica").fillColor("#64748B")
        .text("Official Computer-Generated Tax Invoice", leftX, doc.y + 1, { width: contentWidth, align: "center" });

      doc.fontSize(6.5).font("Helvetica").fillColor("#64748B")
        .text(`Powered by Ezo Billing System  *  Helpline: ${storePhone}`, leftX, doc.y + 1, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
