import { Platform } from "react-native";

export function parseCsvText(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseRow = (row) => {
    const values = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());
    return values;
  };

  const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim());
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] !== undefined ? cols[idx].replace(/^["']|["']$/g, "").trim() : "";
    });
    results.push(rowObj);
  }
  return results;
}

export function pickWebCsvFile() {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return reject(new Error("File upload dialog is only available directly in web browsers. Please paste your CSV text below."));
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.txt";
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    };
    input.click();
  });
}

export const MENU_CSV_SAMPLE = `Item Name,Category,Barcode,Selling Price,Purchase Price,Stock,Unit
Chicken Burger,Burgers,BURGER01,149,80,50,PCS
Veggie Pizza,Pizzas,PIZZA01,249,120,30,PCS
Cold Coffee Frappe,Beverages,BEV01,89,35,100,PCS
Crispy Fries,Snacks,FRIES01,79,30,80,PCS`;

export const PARTY_CSV_SAMPLE = `Customer Name,Phone,Type,Is Regular,Visits,Total Spent,Udhar Balance
Rahul Sharma,9876543210,customer,YES,8,3450,0
Amit Patel,9123456780,customer,NO,2,650,200
Priya Verma,9988776655,customer,YES,12,5800,0
Royal Bakery,9811223344,supplier,NO,4,12000,1500`;
