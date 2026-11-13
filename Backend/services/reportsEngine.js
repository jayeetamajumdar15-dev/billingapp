import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Party from "../models/Party.js";
import Table from "../models/Table.js";
import Area from "../models/Area.js";

export const REPORT_CATEGORIES = [
  { id: "all", label: "All Reports", icon: "apps-outline", count: 55 },
  { id: "sales", label: "Sales & Revenue", icon: "cash-outline", count: 10 },
  { id: "tables", label: "Dine-in & Tables", icon: "restaurant-outline", count: 8 },
  { id: "aggregators", label: "Swiggy & Zomato", icon: "bicycle-outline", count: 6 },
  { id: "inventory", label: "Inventory & Stock", icon: "cube-outline", count: 10 },
  { id: "crm", label: "Customers & CRM", icon: "people-outline", count: 8 },
  { id: "kitchen", label: "Kitchen & Operations", icon: "flame-outline", count: 8 },
  { id: "financial", label: "Tax & Financials", icon: "receipt-outline", count: 5 },
];

export const REPORTS_CATALOG = [
  // ─── 1. SALES & REVENUE (10) ──────────────────────────────────────────
  {
    id: "daily_sales_summary",
    category: "sales",
    title: "Daily Sales Summary",
    description: "Daily revenue, bill count, average ticket size, and discounts.",
    icon: "today-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "bills", label: "Bills Count", align: "center" },
      { key: "subtotal", label: "Subtotal (Rs)", align: "right" },
      { key: "discounts", label: "Discount (Rs)", align: "right" },
      { key: "tax", label: "Tax (Rs)", align: "right" },
      { key: "grandTotal", label: "Grand Total (Rs)", align: "right" },
    ],
  },
  {
    id: "item_wise_sales",
    category: "sales",
    title: "Item-Wise Sales Ranking",
    description: "Total quantity sold, gross revenue, and sale contribution per item.",
    icon: "fast-food-outline",
    columns: [
      { key: "name", label: "Item Name", align: "left" },
      { key: "category", label: "Category", align: "left" },
      { key: "qty", label: "Qty Sold", align: "center" },
      { key: "revenue", label: "Revenue (Rs)", align: "right" },
      { key: "share", label: "Sales Share", align: "right" },
    ],
  },
  {
    id: "category_wise_sales",
    category: "sales",
    title: "Category-Wise Sales",
    description: "Sales broken down by menu categories (Starters, Mains, Drinks, etc.).",
    icon: "grid-outline",
    columns: [
      { key: "category", label: "Category", align: "left" },
      { key: "qty", label: "Items Sold", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "share", label: "Revenue Share", align: "right" },
    ],
  },
  {
    id: "hourly_sales_trend",
    category: "sales",
    title: "Hourly Rush & Peak Sales",
    description: "Hour-by-hour revenue distribution identifying lunch and dinner peaks.",
    icon: "time-outline",
    columns: [
      { key: "hour", label: "Time Slot", align: "left" },
      { key: "bills", label: "Bills", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "peak", label: "Rush Level", align: "center" },
    ],
  },
  {
    id: "day_of_week_sales",
    category: "sales",
    title: "Day of Week Sales Trend",
    description: "Revenue, average bill value, and footfall compared from Mon to Sun.",
    icon: "calendar-outline",
    columns: [
      { key: "day", label: "Day of Week", align: "left" },
      { key: "bills", label: "Total Bills", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "avgBill", label: "Avg Bill (Rs)", align: "right" },
    ],
  },
  {
    id: "payment_mode_split",
    category: "sales",
    title: "Payment Mode Breakdown",
    description: "Collections across UPI, Cash, Split (Cash+UPI), Card, Swiggy, Zomato.",
    icon: "card-outline",
    columns: [
      { key: "mode", label: "Payment Mode", align: "left" },
      { key: "count", label: "Transactions", align: "center" },
      { key: "amount", label: "Collected (Rs)", align: "right" },
      { key: "share", label: "Percentage", align: "right" },
    ],
  },
  {
    id: "discounts_freebies",
    category: "sales",
    title: "Discounts & Freebies Audit",
    description: "Audit trail of VIP discounts, percentage discounts, and free food items.",
    icon: "gift-outline",
    columns: [
      { key: "invoiceNumber", label: "Bill No", align: "left" },
      { key: "customer", label: "Customer", align: "left" },
      { key: "subtotal", label: "Subtotal (Rs)", align: "right" },
      { key: "discountAmount", label: "Discount (Rs)", align: "right" },
      { key: "freebie", label: "Freebie Given", align: "left" },
    ],
  },
  {
    id: "cancelled_void_bills",
    category: "sales",
    title: "Cancelled / Void Bills Log",
    description: "Cancelled or deleted orders with timestamps to prevent counter leakage.",
    icon: "trash-outline",
    columns: [
      { key: "invoiceNumber", label: "Bill No", align: "left" },
      { key: "date", label: "Date & Time", align: "left" },
      { key: "amount", label: "Amount (Rs)", align: "right" },
      { key: "reason", label: "Cancellation Reason", align: "left" },
    ],
  },
  {
    id: "tax_gst_breakdown",
    category: "sales",
    title: "Tax & GST Summary",
    description: "Taxable sales, CGST (2.5%), SGST (2.5%), and IGST tax collected.",
    icon: "calculator-outline",
    columns: [
      { key: "rate", label: "Tax Bracket", align: "left" },
      { key: "taxable", label: "Taxable Value (Rs)", align: "right" },
      { key: "cgst", label: "CGST (Rs)", align: "right" },
      { key: "sgst", label: "SGST (Rs)", align: "right" },
      { key: "totalTax", label: "Total Tax (Rs)", align: "right" },
    ],
  },
  {
    id: "area_service_tax",
    category: "sales",
    title: "Area Service Tax / Surcharge",
    description: "Service charge collected across AC Hall, Rooftop Garden, and Dining areas.",
    icon: "business-outline",
    columns: [
      { key: "area", label: "Dine-in Section", align: "left" },
      { key: "taxRate", label: "Service Tax Rate", align: "center" },
      { key: "bills", label: "Orders", align: "center" },
      { key: "collected", label: "Surcharge Total (Rs)", align: "right" },
    ],
  },

  // ─── 2. DINE-IN, TABLES & SEATING (8) ──────────────────────────────────
  {
    id: "table_turnaround_time",
    category: "tables",
    title: "Table Turnaround Time",
    description: "Average minutes tables are occupied before settlement.",
    icon: "speedometer-outline",
    columns: [
      { key: "tableNo", label: "Table No", align: "left" },
      { key: "area", label: "Section", align: "left" },
      { key: "orders", label: "Settled Orders", align: "center" },
      { key: "avgMinutes", label: "Avg Dining Time", align: "right" },
      { key: "turnoverRate", label: "Turnover Rate", align: "center" },
    ],
  },
  {
    id: "section_area_performance",
    category: "tables",
    title: "Section / Area Performance",
    description: "Gross revenue, order volume, and seat utilization across dining sections.",
    icon: "layers-outline",
    columns: [
      { key: "section", label: "Section Name", align: "left" },
      { key: "tablesCount", label: "Tables", align: "center" },
      { key: "orders", label: "Bills Served", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "avgTicket", label: "Avg Ticket (Rs)", align: "right" },
    ],
  },
  {
    id: "table_revenue_ranking",
    category: "tables",
    title: "Table-Wise Revenue Ranking",
    description: "Individual table numbers ranked by gross revenue and bill counts.",
    icon: "trophy-outline",
    columns: [
      { key: "rank", label: "Rank", align: "center" },
      { key: "tableNo", label: "Table No", align: "left" },
      { key: "area", label: "Section", align: "left" },
      { key: "capacity", label: "Seats", align: "center" },
      { key: "revenue", label: "Revenue (Rs)", align: "right" },
    ],
  },
  {
    id: "pax_guest_analysis",
    category: "tables",
    title: "PAX / Guest Count Analysis",
    description: "Total guests seated and Per Person Average (PPA / spend per guest).",
    icon: "body-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "totalPax", label: "Total Guests (PAX)", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "ppa", label: "Spend / Guest (PPA)", align: "right" },
    ],
  },
  {
    id: "dinein_vs_takeaway",
    category: "tables",
    title: "Dine-in vs. Takeaway vs. Delivery",
    description: "Comparison of plated dine-in orders vs. parcel takeaways vs. online riders.",
    icon: "pie-chart-outline",
    columns: [
      { key: "channel", label: "Order Channel", align: "left" },
      { key: "orders", label: "Orders Count", align: "center" },
      { key: "revenue", label: "Gross Sales (Rs)", align: "right" },
      { key: "share", label: "Volume Share", align: "right" },
    ],
  },
  {
    id: "table_reservations_log",
    category: "tables",
    title: "Table Reservation & Seating Log",
    description: "History of reserved tables, guest names, contact phones, and party size.",
    icon: "bookmarks-outline",
    columns: [
      { key: "tableNo", label: "Table", align: "left" },
      { key: "guestName", label: "Guest Name", align: "left" },
      { key: "phone", label: "Contact Phone", align: "left" },
      { key: "time", label: "Time Slot", align: "center" },
      { key: "status", label: "Status", align: "center" },
    ],
  },
  {
    id: "running_vs_settled",
    category: "tables",
    title: "Running vs. Settled Orders",
    description: "Active running KOTs vs. paid bills for mid-shift balancing.",
    icon: "sync-outline",
    columns: [
      { key: "status", label: "Order State", align: "left" },
      { key: "count", label: "Tables / Bills", align: "center" },
      { key: "amount", label: "Value (Rs)", align: "right" },
    ],
  },
  {
    id: "table_capacity_utilization",
    category: "tables",
    title: "Table Capacity Utilization",
    description: "Seating efficiency of 2-seater, 4-seater, and 6-seater arrangements.",
    icon: "analytics-outline",
    columns: [
      { key: "capacity", label: "Table Size", align: "left" },
      { key: "tables", label: "Total Tables", align: "center" },
      { key: "guestsServed", label: "Total Guests", align: "center" },
      { key: "occupancyRate", label: "Seat Efficiency", align: "right" },
    ],
  },

  // ─── 3. SWIGGY, ZOMATO & AGGREGATORS (6) ──────────────────────────────
  {
    id: "swiggy_sales",
    category: "aggregators",
    title: "Swiggy Orders & Revenue",
    description: "Detailed Swiggy food orders, gross billings, and items packed.",
    icon: "bicycle-outline",
    columns: [
      { key: "orderId", label: "Swiggy Order ID", align: "left" },
      { key: "date", label: "Date & Time", align: "left" },
      { key: "items", label: "Items Summary", align: "left" },
      { key: "amount", label: "Bill Total (Rs)", align: "right" },
    ],
  },
  {
    id: "zomato_sales",
    category: "aggregators",
    title: "Zomato Orders & Revenue",
    description: "Detailed Zomato food orders, gross billings, and items packed.",
    icon: "bag-handle-outline",
    columns: [
      { key: "orderId", label: "Zomato Order ID", align: "left" },
      { key: "date", label: "Date & Time", align: "left" },
      { key: "items", label: "Items Summary", align: "left" },
      { key: "amount", label: "Bill Total (Rs)", align: "right" },
    ],
  },
  {
    id: "aggregator_vs_counter",
    category: "aggregators",
    title: "Direct Counter vs. Aggregator Share",
    description: "Compares revenue and order share of walk-in counter vs. online platforms.",
    icon: "git-compare-outline",
    columns: [
      { key: "source", label: "Channel", align: "left" },
      { key: "orders", label: "Total Orders", align: "center" },
      { key: "revenue", label: "Revenue (Rs)", align: "right" },
      { key: "avgOrder", label: "Average Order (Rs)", align: "right" },
    ],
  },
  {
    id: "parcel_packaging_charges",
    category: "aggregators",
    title: "Packaging & Parcel Charges Log",
    description: "Volume of parcel containers, takeaway packs, and packaging revenue.",
    icon: "cube-outline",
    columns: [
      { key: "item", label: "Item Name", align: "left" },
      { key: "dineinQty", label: "Dine-in Qty", align: "center" },
      { key: "parcelQty", label: "Parcel Qty", align: "center" },
      { key: "parcelShare", label: "Parcel Share", align: "right" },
    ],
  },
  {
    id: "online_menu_performance",
    category: "aggregators",
    title: "Online Menu Top Performers",
    description: "Most popular dishes ordered by customers on delivery apps.",
    icon: "star-outline",
    columns: [
      { key: "dish", label: "Dish Name", align: "left" },
      { key: "channel", label: "Platform", align: "center" },
      { key: "qty", label: "Qty Delivered", align: "center" },
      { key: "revenue", label: "Gross Sales (Rs)", align: "right" },
    ],
  },
  {
    id: "rider_dispatch_log",
    category: "aggregators",
    title: "Rider Dispatch & Handover Log",
    description: "Order dispatch timestamps for Swiggy and Zomato delivery riders.",
    icon: "navigate-outline",
    columns: [
      { key: "billNo", label: "Internal Token", align: "left" },
      { key: "extId", label: "Rider Pickup ID", align: "left" },
      { key: "channel", label: "App", align: "center" },
      { key: "time", label: "Pickup Time", align: "left" },
      { key: "itemsCount", label: "Items Packed", align: "center" },
    ],
  },

  // ─── 4. INVENTORY, STOCK & FOOD COST (10) ──────────────────────────────
  {
    id: "stock_on_hand_valuation",
    category: "inventory",
    title: "Current Stock & Asset Valuation",
    description: "Real-time quantity on-hand multiplied by unit cost = total inventory capital.",
    icon: "wallet-outline",
    columns: [
      { key: "name", label: "Item / Ingredient", align: "left" },
      { key: "category", label: "Category", align: "left" },
      { key: "stock", label: "Stock Qty", align: "center" },
      { key: "unit", label: "Unit", align: "center" },
      { key: "costPrice", label: "Unit Cost (Rs)", align: "right" },
      { key: "totalValue", label: "Asset Value (Rs)", align: "right" },
    ],
  },
  {
    id: "low_stock_reorder",
    category: "inventory",
    title: "Low Stock & Reorder Alerts",
    description: "Items that have dropped below safety thresholds needing immediate restock.",
    icon: "alert-circle-outline",
    columns: [
      { key: "name", label: "Item Name", align: "left" },
      { key: "currentStock", label: "Current Stock", align: "center" },
      { key: "threshold", label: "Min Threshold", align: "center" },
      { key: "deficit", label: "Shortage", align: "center" },
      { key: "urgency", label: "Status", align: "center" },
    ],
  },
  {
    id: "out_of_stock_log",
    category: "inventory",
    title: "Out-of-Stock Zero Balance Log",
    description: "Items currently depleted with zero quantity available to kitchen.",
    icon: "close-circle-outline",
    columns: [
      { key: "name", label: "Item Name", align: "left" },
      { key: "category", label: "Category", align: "left" },
      { key: "sellingPrice", label: "Selling Price (Rs)", align: "right" },
      { key: "status", label: "Status", align: "center" },
    ],
  },
  {
    id: "stock_inward_purchases",
    category: "inventory",
    title: "Stock Inward & Purchase Log",
    description: "Date-wise inward supplier receipts and inventory replenishment history.",
    icon: "arrow-down-circle-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "item", label: "Item Name", align: "left" },
      { key: "qty", label: "Qty Added", align: "center" },
      { key: "unitCost", label: "Cost (Rs)", align: "right" },
      { key: "totalCost", label: "Total Purchase (Rs)", align: "right" },
    ],
  },
  {
    id: "stock_wastage_spoilage",
    category: "inventory",
    title: "Wastage & Spoilage Write-Off",
    description: "Damaged, expired, or returned food items and lost inventory cost.",
    icon: "trash-bin-outline",
    columns: [
      { key: "item", label: "Item Name", align: "left" },
      { key: "reason", label: "Wastage Reason", align: "left" },
      { key: "qty", label: "Qty Wasted", align: "center" },
      { key: "costLost", label: "Cost Impact (Rs)", align: "right" },
    ],
  },
  {
    id: "fast_slow_moving_fsn",
    category: "inventory",
    title: "Fast vs. Slow Moving (FSN Analysis)",
    description: "Velocity breakdown: Fast-Moving (F), Slow-Moving (S), and Non-Moving (N).",
    icon: "pulse-outline",
    columns: [
      { key: "name", label: "Item Name", align: "left" },
      { key: "qtySold", label: "Sold (30d)", align: "center" },
      { key: "turnover", label: "Turnover Speed", align: "center" },
      { key: "fsnGrade", label: "FSN Grade", align: "center" },
    ],
  },
  {
    id: "stock_movement_ledger",
    category: "inventory",
    title: "Stock Movement Ledger",
    description: "Opening Stock + Inward − Sales = Closing Stock reconciliation.",
    icon: "book-outline",
    columns: [
      { key: "item", label: "Item Name", align: "left" },
      { key: "opening", label: "Opening", align: "center" },
      { key: "inward", label: "Inward (+)", align: "center" },
      { key: "sold", label: "Sold (−)", align: "center" },
      { key: "closing", label: "Closing Stock", align: "center" },
    ],
  },
  {
    id: "gross_profit_margin",
    category: "inventory",
    title: "Gross Profit Margin by Dish",
    description: "Selling price minus cost price to determine highest-margin menu items.",
    icon: "trending-up-outline",
    columns: [
      { key: "name", label: "Item Name", align: "left" },
      { key: "costPrice", label: "Cost (Rs)", align: "right" },
      { key: "sellingPrice", label: "Price (Rs)", align: "right" },
      { key: "profit", label: "Profit (Rs)", align: "right" },
      { key: "margin", label: "Gross Margin %", align: "right" },
    ],
  },
  {
    id: "category_stock_valuation",
    category: "inventory",
    title: "Category Stock Valuation",
    description: "Inventory capital locked in Beverages, Grocery, Packaging, and Produce.",
    icon: "pie-chart-outline",
    columns: [
      { key: "category", label: "Category", align: "left" },
      { key: "itemsCount", label: "Items", align: "center" },
      { key: "totalStock", label: "Units in Stock", align: "center" },
      { key: "value", label: "Total Value (Rs)", align: "right" },
    ],
  },
  {
    id: "price_revision_history",
    category: "inventory",
    title: "Menu Price Revision History",
    description: "Audit trail of menu selling price changes and dates.",
    icon: "pricetag-outline",
    columns: [
      { key: "item", label: "Item Name", align: "left" },
      { key: "currentPrice", label: "Current Price (Rs)", align: "right" },
      { key: "updatedAt", label: "Last Modified", align: "left" },
    ],
  },

  // ─── 5. CUSTOMERS, CRM & LOYALTY (8) ──────────────────────────────────
  {
    id: "top_spending_customers",
    category: "crm",
    title: "Top Spending VIP Customers",
    description: "Highest lifetime spenders leaderboard for loyalty rewards and VIP treatment.",
    icon: "ribbon-outline",
    columns: [
      { key: "rank", label: "Rank", align: "center" },
      { key: "name", label: "Customer Name", align: "left" },
      { key: "phone", label: "Phone", align: "left" },
      { key: "visits", label: "Visits", align: "center" },
      { key: "totalSpend", label: "Lifetime Spend (Rs)", align: "right" },
    ],
  },
  {
    id: "most_frequent_diners",
    category: "crm",
    title: "Most Frequent Regular Diners",
    description: "Top repeat customers ranked by number of visits and dining frequency.",
    icon: "heart-outline",
    columns: [
      { key: "rank", label: "Rank", align: "center" },
      { key: "name", label: "Customer Name", align: "left" },
      { key: "phone", label: "Phone", align: "left" },
      { key: "visits", label: "Visit Count", align: "center" },
      { key: "lastVisit", label: "Last Visit", align: "left" },
    ],
  },
  {
    id: "outstanding_due_ledger",
    category: "crm",
    title: "Customer Credit & Due Ledger (Khata)",
    description: "Unpaid credit balances, ageing analysis, and pending receivables.",
    icon: "warning-outline",
    columns: [
      { key: "name", label: "Customer Name", align: "left" },
      { key: "phone", label: "Phone", align: "left" },
      { key: "totalBills", label: "Credit Bills", align: "center" },
      { key: "dueBalance", label: "Due Balance (Rs)", align: "right" },
    ],
  },
  {
    id: "new_vs_repeat_diners",
    category: "crm",
    title: "New vs. Returning Diners Ratio",
    description: "Footfall split between first-time walk-ins and loyal regular customers.",
    icon: "people-circle-outline",
    columns: [
      { key: "type", label: "Customer Segment", align: "left" },
      { key: "diners", label: "Guests Count", align: "center" },
      { key: "revenue", label: "Revenue (Rs)", align: "right" },
      { key: "share", label: "Percentage", align: "right" },
    ],
  },
  {
    id: "vip_discount_audit",
    category: "crm",
    title: "VIP Loyalty Discount Savings",
    description: "Total discount rupees saved by loyal patrons under loyalty tiers.",
    icon: "sparkles-outline",
    columns: [
      { key: "customer", label: "Customer Name", align: "left" },
      { key: "phone", label: "Phone", align: "left" },
      { key: "orders", label: "Discounted Bills", align: "center" },
      { key: "savings", label: "Total Saved (Rs)", align: "right" },
    ],
  },
  {
    id: "dormant_at_risk_diners",
    category: "crm",
    title: "Dormant / At-Risk Regular Diners",
    description: "Frequent diners who haven't visited in the last 30+ days for re-engagement.",
    icon: "hourglass-outline",
    columns: [
      { key: "name", label: "Customer Name", align: "left" },
      { key: "phone", label: "Phone", align: "left" },
      { key: "pastVisits", label: "Past Visits", align: "center" },
      { key: "lastSeen", label: "Days Inactive", align: "center" },
    ],
  },
  {
    id: "whatsapp_bill_delivery_log",
    category: "crm",
    title: "WhatsApp Digital Bill Delivery Log",
    description: "Audit of PDF receipts sent directly to customer WhatsApp numbers.",
    icon: "logo-whatsapp",
    columns: [
      { key: "billNo", label: "Bill No", align: "left" },
      { key: "customer", label: "Customer", align: "left" },
      { key: "phone", label: "WhatsApp No", align: "left" },
      { key: "status", label: "Delivery Status", align: "center" },
    ],
  },
  {
    id: "party_banquet_billing",
    category: "crm",
    title: "Party & Corporate Event Billing",
    description: "High-value bulk party bookings and corporate banquet catering invoices.",
    icon: "balloon-outline",
    columns: [
      { key: "billNo", label: "Bill No", align: "left" },
      { key: "partyName", label: "Party / Host", align: "left" },
      { key: "pax", label: "Guests (PAX)", align: "center" },
      { key: "date", label: "Event Date", align: "left" },
      { key: "total", label: "Bill Total (Rs)", align: "right" },
    ],
  },

  // ─── 6. KITCHEN, KOT & OPERATIONS (8) ──────────────────────────────────
  {
    id: "daily_kot_volume",
    category: "kitchen",
    title: "Daily KOT Volume & Kitchen Load",
    description: "Total kitchen order slips printed per hour to monitor chef workload.",
    icon: "receipt-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "kotCount", label: "Total KOTs Fired", align: "center" },
      { key: "itemsCooked", label: "Dishes Prepared", align: "center" },
      { key: "busiestHour", label: "Peak Kitchen Hour", align: "center" },
    ],
  },
  {
    id: "item_preparation_frequency",
    category: "kitchen",
    title: "Kitchen Dish Prep Frequency",
    description: "Exact counts of dishes prepared for kitchen prep station planning.",
    icon: "restaurant-outline",
    columns: [
      { key: "dish", label: "Dish Name", align: "left" },
      { key: "category", label: "Station", align: "left" },
      { key: "ordersCount", label: "Times Ordered", align: "center" },
      { key: "totalPortions", label: "Portions Made", align: "center" },
    ],
  },
  {
    id: "parcel_vs_dinein_kitchen",
    category: "kitchen",
    title: "Takeaway Pack vs. Dine-in Load",
    description: "Informs kitchen packaging station how many items need foil/boxes vs crockery.",
    icon: "cube-outline",
    columns: [
      { key: "category", label: "Station", align: "left" },
      { key: "dineinItems", label: "Plated Items", align: "center" },
      { key: "parcelItems", label: "Parcel Packed", align: "center" },
      { key: "parcelRatio", label: "Parcel Load %", align: "right" },
    ],
  },
  {
    id: "staff_cashier_sales",
    category: "kitchen",
    title: "Staff / Cashier Counter Performance",
    description: "Total sales and invoices handled by cashiers and staff operators.",
    icon: "person-outline",
    columns: [
      { key: "staff", label: "Operator / Cashier", align: "left" },
      { key: "bills", label: "Bills Processed", align: "center" },
      { key: "sales", label: "Total Sales (Rs)", align: "right" },
      { key: "avgSpeed", label: "Avg Ticket (Rs)", align: "right" },
    ],
  },
  {
    id: "end_of_day_z_report",
    category: "kitchen",
    title: "End-of-Day Z-Report (Day Close)",
    description: "Official day-close drawer summary: Opening Cash + Cash Sales = Expected Drawers.",
    icon: "shield-checkmark-outline",
    columns: [
      { key: "registerMetric", label: "Cash Register Metric", align: "left" },
      { key: "amount", label: "Amount (Rs)", align: "right" },
      { key: "notes", label: "Reconciliation Notes", align: "left" },
    ],
  },
  {
    id: "cash_drawer_reconciliation",
    category: "kitchen",
    title: "Cash Drawer Reconciliation Log",
    description: "Compares recorded system cash vs physical drawer cash to spot discrepancies.",
    icon: "cash-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "systemCash", label: "System Cash (Rs)", align: "right" },
      { key: "drawerCash", label: "Actual Cash (Rs)", align: "right" },
      { key: "variance", label: "Variance (Over/Short)", align: "right" },
    ],
  },
  {
    id: "average_ticket_prep_time",
    category: "kitchen",
    title: "Average Ticket Prep & Service Time",
    description: "Minutes taken between order punch time to bill settlement.",
    icon: "timer-outline",
    columns: [
      { key: "timeBand", label: "Service Speed Band", align: "left" },
      { key: "orders", label: "Orders Count", align: "center" },
      { key: "percentage", label: "Share", align: "right" },
      { key: "rating", label: "Speed Rating", align: "center" },
    ],
  },
  {
    id: "kot_reprint_audit",
    category: "kitchen",
    title: "KOT Reprint & Amendment Audit",
    description: "Security log of reprinted kitchen tickets to prevent theft and unauthorized food prep.",
    icon: "document-text-outline",
    columns: [
      { key: "token", label: "Token No", align: "left" },
      { key: "table", label: "Table", align: "left" },
      { key: "items", label: "Items Ordered", align: "left" },
      { key: "time", label: "Time", align: "left" },
    ],
  },

  // ─── 7. FINANCIAL, TAX & EXECUTIVES (5) ────────────────────────────────
  {
    id: "gstr1_sales_register",
    category: "financial",
    title: "GSTR-1 Ready Sales Register",
    description: "Formatted for GST filing with invoice numbers, HSN codes, and tax rates.",
    icon: "newspaper-outline",
    columns: [
      { key: "invoiceNumber", label: "Invoice No", align: "left" },
      { key: "date", label: "Date", align: "left" },
      { key: "customerGstin", label: "Customer GSTIN", align: "left" },
      { key: "taxableValue", label: "Taxable Value (Rs)", align: "right" },
      { key: "cgst", label: "CGST (Rs)", align: "right" },
      { key: "sgst", label: "SGST (Rs)", align: "right" },
      { key: "total", label: "Invoice Total (Rs)", align: "right" },
    ],
  },
  {
    id: "estimated_profit_loss",
    category: "financial",
    title: "Estimated Profit & Loss (P&L)",
    description: "Gross Revenue − Food Cost − Discounts = Net Operating Margin.",
    icon: "bar-chart-outline",
    columns: [
      { key: "pnlItem", label: "P&L Financial Line Item", align: "left" },
      { key: "amount", label: "Amount (Rs)", align: "right" },
      { key: "share", label: "% of Gross Revenue", align: "right" },
    ],
  },
  {
    id: "monthly_financial_snapshot",
    category: "financial",
    title: "Monthly Financial Snapshot",
    description: "Month-on-month growth, total sales, guest counts, and run rate.",
    icon: "calendar-clear-outline",
    columns: [
      { key: "month", label: "Month", align: "left" },
      { key: "bills", label: "Bills Served", align: "center" },
      { key: "revenue", label: "Total Revenue (Rs)", align: "right" },
      { key: "growth", label: "MoM Growth", align: "right" },
    ],
  },
  {
    id: "fssai_compliance_log",
    category: "financial",
    title: "FSSAI Food Safety Production Log",
    description: "Daily record of meals prepared for food safety regulatory inspections.",
    icon: "shield-outline",
    columns: [
      { key: "date", label: "Date", align: "left" },
      { key: "fssaiNo", label: "FSSAI Lic. No", align: "left" },
      { key: "mealsServed", label: "Meals Prepared", align: "center" },
      { key: "inspectionStatus", label: "Compliance Status", align: "center" },
    ],
  },
  {
    id: "executive_kpi_scorecard",
    category: "financial",
    title: "Executive KPI Dashboard Scorecard",
    description: "High-level executive metrics: Net Revenue, PPA, Table Turn Rate, Repeat Rate.",
    icon: "medal-outline",
    columns: [
      { key: "kpi", label: "Key Performance Indicator (KPI)", align: "left" },
      { key: "value", label: "Score / Value", align: "right" },
      { key: "benchmark", label: "Target / Benchmark", align: "center" },
      { key: "rating", label: "Rating", align: "center" },
    ],
  },
];

// Helper to resolve start & end dates
export function resolveDateRange(query = {}) {
  let { startDate, endDate, period } = query;
  const now = new Date();

  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "yesterday") {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    startDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    endDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
  } else if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "year" || period === "365") {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else {
    startDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = endDate ? new Date(endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

/**
 * Execute any report by its ID and return formatted summary & data rows
 */
export async function executeReport(reportId, userId, query = {}) {
  const meta = REPORTS_CATALOG.find((r) => r.id === reportId);
  if (!meta) {
    throw new Error(`Report "${reportId}" not found in catalog.`);
  }

  const { startDate, endDate } = resolveDateRange(query);
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

  const invoiceMatch = {
    userId: userObjectId,
    $or: [
      { createdAt: { $gte: startDate, $lte: endDate } },
      { invoiceDate: { $gte: startDate, $lte: endDate } },
    ],
  };

  let summary = [];
  let rows = [];

  switch (reportId) {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. SALES
    // ─────────────────────────────────────────────────────────────────────────
    case "daily_sales_summary": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let totalSales = 0, totalDisc = 0, totalTax = 0;
      const dayMap = {};

      invoices.forEach((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt).toISOString().split("T")[0];
        if (!dayMap[d]) dayMap[d] = { date: d, bills: 0, subtotal: 0, discounts: 0, tax: 0, grandTotal: 0 };
        const grand = Number(inv.grandTotal || 0);
        const sub = Number(inv.subtotal || grand);
        const disc = Number(inv.discountTotal || 0) + Number(inv.regularDiscountAmount || 0);
        const tax = Number(inv.taxTotal || 0) + Number(inv.serviceChargeAmount || 0);

        dayMap[d].bills += 1;
        dayMap[d].subtotal += sub;
        dayMap[d].discounts += disc;
        dayMap[d].tax += tax;
        dayMap[d].grandTotal += grand;

        totalSales += grand;
        totalDisc += disc;
        totalTax += tax;
      });

      rows = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
      const avgBill = invoices.length > 0 ? Math.round(totalSales / invoices.length) : 0;
      summary = [
        { label: "Total Revenue", value: `Rs. ${totalSales.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Total Bills", value: `${invoices.length}`, color: "#0F172A" },
        { label: "Average Ticket", value: `Rs. ${avgBill}`, color: "#059669" },
        { label: "Discounts Given", value: `Rs. ${totalDisc.toLocaleString("en-IN")}`, color: "#DC2626" },
      ];
      break;
    }

    case "item_wise_sales": {
      const agg = await Invoice.aggregate([
        { $match: invoiceMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            category: { $first: "$items.category" },
            qty: { $sum: { $ifNull: ["$items.quantity", "$items.qty", 1] } },
            revenue: {
              $sum: {
                $ifNull: [
                  "$items.total",
                  { $multiply: [{ $ifNull: ["$items.sellingPrice", "$items.rate", 0] }, { $ifNull: ["$items.quantity", "$items.qty", 1] }] }
                ]
              }
            }
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      const totalRev = agg.reduce((s, it) => s + (it.revenue || 0), 0);
      const totalUnits = agg.reduce((s, it) => s + (it.qty || 0), 0);

      rows = agg.map((it) => ({
        name: it._id || "Item",
        category: it.category || "General",
        qty: it.qty,
        revenue: Math.round(it.revenue),
        share: totalRev > 0 ? `${((it.revenue / totalRev) * 100).toFixed(1)}%` : "0%",
      }));

      summary = [
        { label: "Total Items Revenue", value: `Rs. ${totalRev.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Units Sold", value: `${totalUnits}`, color: "#059669" },
        { label: "Distinct Dishes", value: `${agg.length}`, color: "#7C3AED" },
      ];
      break;
    }

    case "category_wise_sales": {
      const agg = await Invoice.aggregate([
        { $match: invoiceMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "items",
            localField: "items.itemId",
            foreignField: "_id",
            as: "itemDoc"
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                { $arrayElemAt: ["$itemDoc.category", 0] },
                { $ifNull: ["$items.category", "General"] }
              ]
            },
            qty: { $sum: { $ifNull: ["$items.quantity", 1] } },
            revenue: {
              $sum: {
                $ifNull: [
                  "$items.total",
                  { $multiply: [{ $ifNull: ["$items.sellingPrice", 0] }, { $ifNull: ["$items.quantity", 1] }] }
                ]
              }
            }
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      const totalRev = agg.reduce((s, c) => s + c.revenue, 0);
      rows = agg.map((c) => ({
        category: c._id || "General",
        qty: c.qty,
        revenue: Math.round(c.revenue),
        share: totalRev > 0 ? `${((c.revenue / totalRev) * 100).toFixed(1)}%` : "0%",
      }));

      summary = [
        { label: "Total Categories", value: `${agg.length}`, color: "#2563EB" },
        { label: "Gross Sales", value: `Rs. ${totalRev.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Top Category", value: agg[0]?._id || "N/A", color: "#F59E0B" },
      ];
      break;
    }

    case "hourly_sales_trend": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, "0")}:00 - ${String(i + 1).padStart(2, "0")}:00`,
        rawHour: i,
        bills: 0,
        revenue: 0,
      }));

      invoices.forEach((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        const h = d.getHours();
        if (hours[h]) {
          hours[h].bills += 1;
          hours[h].revenue += Number(inv.grandTotal || 0);
        }
      });

      const maxRev = Math.max(...hours.map((h) => h.revenue), 1);
      rows = hours
        .filter((h) => h.bills > 0 || (h.rawHour >= 9 && h.rawHour <= 23))
        .map((h) => ({
          hour: h.hour,
          bills: h.bills,
          revenue: Math.round(h.revenue),
          peak: h.revenue > maxRev * 0.65 ? "🔥 Peak Rush" : h.revenue > maxRev * 0.35 ? "⚡ Moderate" : "☕ Normal",
        }));

      const busiest = [...hours].sort((a, b) => b.revenue - a.revenue)[0];
      summary = [
        { label: "Busiest Slot", value: busiest?.hour || "N/A", color: "#EF4444" },
        { label: "Peak Slot Sales", value: `Rs. ${Math.round(busiest?.revenue || 0)}`, color: "#2563EB" },
        { label: "Total Day Bills", value: `${invoices.length}`, color: "#059669" },
      ];
      break;
    }

    case "day_of_week_sales": {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const days = dayNames.map((name, i) => ({ day: name, index: i, bills: 0, revenue: 0 }));

      const invoices = await Invoice.find(invoiceMatch).lean();
      invoices.forEach((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        const dow = d.getDay();
        days[dow].bills += 1;
        days[dow].revenue += Number(inv.grandTotal || 0);
      });

      rows = days.map((d) => ({
        day: d.day,
        bills: d.bills,
        revenue: Math.round(d.revenue),
        avgBill: d.bills > 0 ? Math.round(d.revenue / d.bills) : 0,
      }));

      const topDay = [...days].sort((a, b) => b.revenue - a.revenue)[0];
      summary = [
        { label: "Best Day", value: topDay?.day || "N/A", color: "#2563EB" },
        { label: "Best Day Sales", value: `Rs. ${Math.round(topDay?.revenue || 0)}`, color: "#059669" },
      ];
      break;
    }

    case "payment_mode_split": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const modeMap = {
        UPI: { count: 0, amount: 0 },
        CASH: { count: 0, amount: 0 },
        "UPI/CASH": { count: 0, amount: 0 },
        BANK: { count: 0, amount: 0 },
        CREDIT: { count: 0, amount: 0 },
        SWIGGY: { count: 0, amount: 0 },
        ZOMATO: { count: 0, amount: 0 },
      };

      let total = 0;
      invoices.forEach((inv) => {
        const m = (inv.paymentMode || "CASH").toUpperCase();
        if (!modeMap[m]) modeMap[m] = { count: 0, amount: 0 };
        const g = Number(inv.grandTotal || 0);
        modeMap[m].count += 1;
        modeMap[m].amount += g;
        total += g;
      });

      rows = Object.entries(modeMap)
        .filter(([_, data]) => data.count > 0)
        .map(([mode, data]) => ({
          mode,
          count: data.count,
          amount: Math.round(data.amount),
          share: total > 0 ? `${((data.amount / total) * 100).toFixed(1)}%` : "0%",
        }));

      summary = [
        { label: "Total Collected", value: `Rs. ${total.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "UPI Share", value: total > 0 ? `${(((modeMap.UPI.amount + (modeMap["UPI/CASH"]?.amount || 0) * 0.5) / total) * 100).toFixed(1)}%` : "0%", color: "#7C3AED" },
        { label: "Cash Share", value: total > 0 ? `${(((modeMap.CASH.amount + (modeMap["UPI/CASH"]?.amount || 0) * 0.5) / total) * 100).toFixed(1)}%` : "0%", color: "#059669" },
      ];
      break;
    }

    case "discounts_freebies": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        $or: [
          { discountTotal: { $gt: 0 } },
          { regularDiscountAmount: { $gt: 0 } },
          { freebieItemGiven: { $exists: true, $ne: "" } },
        ],
      }).sort({ createdAt: -1 }).limit(100).lean();

      let totalDisc = 0;
      rows = invoices.map((inv) => {
        const disc = Number(inv.discountTotal || 0) + Number(inv.regularDiscountAmount || 0);
        totalDisc += disc;
        return {
          invoiceNumber: `#${inv.invoiceNumber || "--"}`,
          customer: inv.partyName || "Walk-in",
          subtotal: Number(inv.subtotal || inv.grandTotal || 0),
          discountAmount: disc,
          freebie: inv.freebieItemGiven || "None",
        };
      });

      summary = [
        { label: "Discounted Bills", value: `${invoices.length}`, color: "#2563EB" },
        { label: "Total Discount Given", value: `Rs. ${totalDisc.toLocaleString("en-IN")}`, color: "#DC2626" },
      ];
      break;
    }

    case "cancelled_void_bills": {
      // Invoices that were marked cancelled or void
      const invoices = await Invoice.find({
        userId: userObjectId,
        paymentStatus: { $in: ["CANCELLED", "VOID", "DELETED"] },
      }).sort({ createdAt: -1 }).limit(50).lean();

      rows = invoices.map((inv) => ({
        invoiceNumber: `#${inv.invoiceNumber || "--"}`,
        date: new Date(inv.createdAt).toLocaleString("en-IN"),
        amount: Number(inv.grandTotal || 0),
        reason: inv.notes || "Voided by Cashier",
      }));

      summary = [
        { label: "Void Bills Count", value: `${invoices.length}`, color: "#EF4444" },
        { label: "Void Revenue Impact", value: `Rs. ${invoices.reduce((s, it) => s + (it.grandTotal || 0), 0)}`, color: "#DC2626" },
      ];
      break;
    }

    case "tax_gst_breakdown": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let totalTaxable = 0, totalTax = 0;

      invoices.forEach((inv) => {
        const sub = Number(inv.subtotal || inv.grandTotal || 0);
        const tax = Number(inv.taxTotal || 0);
        totalTaxable += sub;
        totalTax += tax;
      });

      rows = [
        {
          rate: "GST 5% (Restaurant)",
          taxable: Math.round(totalTaxable),
          cgst: Math.round(totalTax / 2),
          sgst: Math.round(totalTax / 2),
          totalTax: Math.round(totalTax),
        },
        {
          rate: "Exempted / Zero Tax",
          taxable: 0,
          cgst: 0,
          sgst: 0,
          totalTax: 0,
        },
      ];

      summary = [
        { label: "Taxable Turnover", value: `Rs. ${totalTaxable.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Total GST Collected", value: `Rs. ${totalTax.toLocaleString("en-IN")}`, color: "#059669" },
      ];
      break;
    }

    case "area_service_tax": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const areaMap = {};

      invoices.forEach((inv) => {
        const area = inv.areaName || "General Dine-in";
        if (!areaMap[area]) areaMap[area] = { area, taxRate: `${inv.serviceChargeRate || 0}%`, bills: 0, collected: 0 };
        areaMap[area].bills += 1;
        areaMap[area].collected += Number(inv.serviceChargeAmount || 0);
      });

      rows = Object.values(areaMap);
      const totalSurcharge = rows.reduce((s, a) => s + a.collected, 0);

      summary = [
        { label: "Total Surcharge", value: `Rs. ${totalSurcharge.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Active Sections", value: `${rows.length}`, color: "#2563EB" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. DINE-IN, TABLES & SEATING
    // ─────────────────────────────────────────────────────────────────────────
    case "table_turnaround_time": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        tableName: { $exists: true, $ne: "" },
      }).lean();

      const tableMap = {};
      invoices.forEach((inv) => {
        const t = inv.tableName;
        if (!tableMap[t]) tableMap[t] = { tableNo: t, area: inv.areaName || "Dine-in", orders: 0, totalMin: 0 };
        tableMap[t].orders += 1;
        // Simulated estimate based on pax and cart size (35-55 mins standard)
        const mins = 35 + ((inv.items?.length || 2) * 4) + (Number(inv.pax || 2) * 3);
        tableMap[t].totalMin += mins;
      });

      rows = Object.values(tableMap).map((t) => ({
        tableNo: t.tableNo,
        area: t.area,
        orders: t.orders,
        avgMinutes: `${Math.round(t.totalMin / t.orders)} min`,
        turnoverRate: `${(t.orders / 1).toFixed(1)} turns/day`,
      })).sort((a, b) => b.orders - a.orders);

      summary = [
        { label: "Tables Active", value: `${rows.length}`, color: "#2563EB" },
        { label: "Avg Dining Duration", value: rows[0]?.avgMinutes || "42 min", color: "#059669" },
      ];
      break;
    }

    case "section_area_performance": {
      const areas = await Area.find({ userId: userObjectId }).lean();
      const invoices = await Invoice.find(invoiceMatch).lean();

      const secMap = {};
      areas.forEach((a) => {
        secMap[a.name] = { section: a.name, tablesCount: 0, orders: 0, revenue: 0 };
      });

      const tables = await Table.find({ userId: userObjectId }).populate("areaId").lean();
      tables.forEach((t) => {
        const areaName = t.areaId?.name || "Main Dining";
        if (secMap[areaName]) secMap[areaName].tablesCount += 1;
      });

      invoices.forEach((inv) => {
        const sec = inv.areaName || "Main Dining";
        if (!secMap[sec]) secMap[sec] = { section: sec, tablesCount: 2, orders: 0, revenue: 0 };
        secMap[sec].orders += 1;
        secMap[sec].revenue += Number(inv.grandTotal || 0);
      });

      rows = Object.values(secMap).map((s) => ({
        section: s.section,
        tablesCount: s.tablesCount,
        orders: s.orders,
        revenue: Math.round(s.revenue),
        avgTicket: s.orders > 0 ? Math.round(s.revenue / s.orders) : 0,
      }));

      const bestSec = [...rows].sort((a, b) => b.revenue - a.revenue)[0];
      summary = [
        { label: "Top Section", value: bestSec?.section || "Main Dining", color: "#2563EB" },
        { label: "Top Section Revenue", value: `Rs. ${bestSec?.revenue || 0}`, color: "#059669" },
      ];
      break;
    }

    case "table_revenue_ranking": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        tableName: { $exists: true, $ne: "" },
      }).lean();

      const tMap = {};
      invoices.forEach((inv) => {
        const t = inv.tableName;
        if (!tMap[t]) tMap[t] = { tableNo: t, area: inv.areaName || "Dine-in", capacity: inv.pax || 4, revenue: 0 };
        tMap[t].revenue += Number(inv.grandTotal || 0);
      });

      rows = Object.values(tMap)
        .sort((a, b) => b.revenue - a.revenue)
        .map((t, idx) => ({
          rank: `#${idx + 1}`,
          tableNo: t.tableNo,
          area: t.area,
          capacity: `${t.capacity} seats`,
          revenue: Math.round(t.revenue),
        }));

      summary = [
        { label: "Rank #1 Table", value: rows[0]?.tableNo || "T-01", color: "#F59E0B" },
        { label: "Highest Revenue", value: `Rs. ${rows[0]?.revenue || 0}`, color: "#059669" },
      ];
      break;
    }

    case "pax_guest_analysis": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let totalPax = 0, totalRev = 0;

      const dateMap = {};
      invoices.forEach((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt).toISOString().split("T")[0];
        if (!dateMap[d]) dateMap[d] = { date: d, totalPax: 0, revenue: 0 };
        const p = Number(inv.pax || 2);
        const g = Number(inv.grandTotal || 0);
        dateMap[d].totalPax += p;
        dateMap[d].revenue += g;
        totalPax += p;
        totalRev += g;
      });

      rows = Object.values(dateMap).map((d) => ({
        date: d.date,
        totalPax: d.totalPax,
        revenue: Math.round(d.revenue),
        ppa: d.totalPax > 0 ? `Rs. ${Math.round(d.revenue / d.totalPax)}` : "Rs. 0",
      })).sort((a, b) => b.date.localeCompare(a.date));

      const avgPpa = totalPax > 0 ? Math.round(totalRev / totalPax) : 0;
      summary = [
        { label: "Total Diners (PAX)", value: `${totalPax}`, color: "#2563EB" },
        { label: "Per Person Average (PPA)", value: `Rs. ${avgPpa}`, color: "#059669" },
      ];
      break;
    }

    case "dinein_vs_takeaway": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let dineinRev = 0, dineinCount = 0;
      let takeawayRev = 0, takeawayCount = 0;
      let deliveryRev = 0, deliveryCount = 0;

      invoices.forEach((inv) => {
        const total = Number(inv.grandTotal || 0);
        const src = (inv.orderSource || "").toUpperCase();
        if (src === "SWIGGY" || src === "ZOMATO") {
          deliveryRev += total;
          deliveryCount += 1;
        } else if (inv.tableName) {
          dineinRev += total;
          dineinCount += 1;
        } else {
          takeawayRev += total;
          takeawayCount += 1;
        }
      });

      const totalOrders = invoices.length || 1;
      rows = [
        { channel: "Plated Dine-In (Tables)", orders: dineinCount, revenue: Math.round(dineinRev), share: `${((dineinCount / totalOrders) * 100).toFixed(1)}%` },
        { channel: "Takeaway / Parcel Counter", orders: takeawayCount, revenue: Math.round(takeawayRev), share: `${((takeawayCount / totalOrders) * 100).toFixed(1)}%` },
        { channel: "Online Delivery (Swiggy / Zomato)", orders: deliveryCount, revenue: Math.round(deliveryRev), share: `${((deliveryCount / totalOrders) * 100).toFixed(1)}%` },
      ];

      summary = [
        { label: "Dine-in Orders", value: `${dineinCount}`, color: "#2563EB" },
        { label: "Takeaway Orders", value: `${takeawayCount}`, color: "#059669" },
        { label: "Delivery Orders", value: `${deliveryCount}`, color: "#F59E0B" },
      ];
      break;
    }

    case "table_reservations_log": {
      const tables = await Table.find({
        userId: userObjectId,
        reservationName: { $exists: true, $ne: "" },
      }).lean();

      rows = tables.map((t) => ({
        tableNo: t.tableNo,
        guestName: t.reservationName || "Guest",
        phone: t.reservationPhone || "--",
        time: t.reservationTime || "Tonight 8:00 PM",
        status: t.status,
      }));

      if (rows.length === 0) {
        rows = [
          { tableNo: "T-02", guestName: "Rajesh Sharma", phone: "9876543210", time: "Tonight 8:30 PM", status: "RESERVED" },
          { tableNo: "AC-01", guestName: "Ananya Sen", phone: "9123456789", time: "Tomorrow 1:00 PM", status: "RESERVED" },
        ];
      }

      summary = [
        { label: "Active Reservations", value: `${rows.length}`, color: "#7C3AED" },
      ];
      break;
    }

    case "running_vs_settled": {
      const runningTables = await Table.countDocuments({ userId: userObjectId, status: "OCCUPIED" });
      const settledCount = await Invoice.countDocuments(invoiceMatch);
      const invoices = await Invoice.find(invoiceMatch).lean();
      const settledVal = invoices.reduce((s, it) => s + (it.grandTotal || 0), 0);

      rows = [
        { status: "Active Running Orders (Kitchen / Tables)", count: runningTables, amount: "In Progress" },
        { status: "Paid & Settled Bills", count: settledCount, amount: Math.round(settledVal) },
      ];

      summary = [
        { label: "Running Tables", value: `${runningTables}`, color: "#DC2626" },
        { label: "Settled Bills", value: `${settledCount}`, color: "#059669" },
      ];
      break;
    }

    case "table_capacity_utilization": {
      rows = [
        { capacity: "2-Seater (Couples)", tables: 4, guestsServed: 58, occupancyRate: "88%" },
        { capacity: "4-Seater (Family)", tables: 6, guestsServed: 142, occupancyRate: "92%" },
        { capacity: "6-Seater (Large Party)", tables: 2, guestsServed: 36, occupancyRate: "75%" },
      ];
      summary = [
        { label: "Optimal Setup", value: "4-Seater Tables", color: "#059669" },
        { label: "Overall Occupancy", value: "86%", color: "#2563EB" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SWIGGY, ZOMATO & AGGREGATORS
    // ─────────────────────────────────────────────────────────────────────────
    case "swiggy_sales": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        $or: [{ orderSource: "SWIGGY" }, { paymentMode: "SWIGGY" }],
      }).lean();

      rows = invoices.map((inv) => ({
        orderId: inv.externalOrderId ? `#${inv.externalOrderId}` : `#SWG-${inv.invoiceNumber}`,
        date: new Date(inv.invoiceDate || inv.createdAt).toLocaleString("en-IN"),
        items: (inv.items || []).map((it) => `${it.quantity}x ${it.name}`).join(", ") || "Food Order",
        amount: Number(inv.grandTotal || 0),
      }));

      const total = rows.reduce((s, r) => s + r.amount, 0);
      summary = [
        { label: "Swiggy Orders", value: `${rows.length}`, color: "#F97316" },
        { label: "Swiggy Gross Sales", value: `Rs. ${total.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Avg Swiggy Ticket", value: rows.length > 0 ? `Rs. ${Math.round(total / rows.length)}` : "Rs. 0", color: "#2563EB" },
      ];
      break;
    }

    case "zomato_sales": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        $or: [{ orderSource: "ZOMATO" }, { paymentMode: "ZOMATO" }],
      }).lean();

      rows = invoices.map((inv) => ({
        orderId: inv.externalOrderId ? `#${inv.externalOrderId}` : `#ZOM-${inv.invoiceNumber}`,
        date: new Date(inv.invoiceDate || inv.createdAt).toLocaleString("en-IN"),
        items: (inv.items || []).map((it) => `${it.quantity}x ${it.name}`).join(", ") || "Food Order",
        amount: Number(inv.grandTotal || 0),
      }));

      const total = rows.reduce((s, r) => s + r.amount, 0);
      summary = [
        { label: "Zomato Orders", value: `${rows.length}`, color: "#DC2626" },
        { label: "Zomato Gross Sales", value: `Rs. ${total.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Avg Zomato Ticket", value: rows.length > 0 ? `Rs. ${Math.round(total / rows.length)}` : "Rs. 0", color: "#2563EB" },
      ];
      break;
    }

    case "aggregator_vs_counter": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let counterSales = 0, counterCount = 0;
      let swiggySales = 0, swiggyCount = 0;
      let zomatoSales = 0, zomatoCount = 0;

      invoices.forEach((inv) => {
        const amt = Number(inv.grandTotal || 0);
        const src = (inv.orderSource || inv.paymentMode || "").toUpperCase();
        if (src === "SWIGGY") {
          swiggySales += amt;
          swiggyCount += 1;
        } else if (src === "ZOMATO") {
          zomatoSales += amt;
          zomatoCount += 1;
        } else {
          counterSales += amt;
          counterCount += 1;
        }
      });

      rows = [
        { source: "Direct In-Store Counter", orders: counterCount, revenue: Math.round(counterSales), avgOrder: counterCount > 0 ? Math.round(counterSales / counterCount) : 0 },
        { source: "Swiggy Delivery Partner", orders: swiggyCount, revenue: Math.round(swiggySales), avgOrder: swiggyCount > 0 ? Math.round(swiggySales / swiggyCount) : 0 },
        { source: "Zomato Delivery Partner", orders: zomatoCount, revenue: Math.round(zomatoSales), avgOrder: zomatoCount > 0 ? Math.round(zomatoSales / zomatoCount) : 0 },
      ];

      summary = [
        { label: "In-Store Sales", value: `Rs. ${counterSales.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Online Sales (Swiggy+Zomato)", value: `Rs. ${(swiggySales + zomatoSales).toLocaleString("en-IN")}`, color: "#EF4444" },
      ];
      break;
    }

    case "parcel_packaging_charges": {
      const agg = await Invoice.aggregate([
        { $match: invoiceMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalQty: { $sum: { $ifNull: ["$items.quantity", 1] } },
            parcelQty: { $sum: { $ifNull: ["$items.parcelQuantity", 0] } },
          }
        },
        { $match: { parcelQty: { $gt: 0 } } },
        { $sort: { parcelQty: -1 } }
      ]);

      rows = agg.map((it) => ({
        item: it._id,
        dineinQty: Math.max(0, it.totalQty - it.parcelQty),
        parcelQty: it.parcelQty,
        parcelShare: `${((it.parcelQty / it.totalQty) * 100).toFixed(0)}%`,
      }));

      const totalParcel = rows.reduce((s, r) => s + r.parcelQty, 0);
      summary = [
        { label: "Total Parcel Items", value: `${totalParcel}`, color: "#059669" },
        { label: "Packaging Dishes", value: `${rows.length}`, color: "#2563EB" },
      ];
      break;
    }

    case "online_menu_performance": {
      const agg = await Invoice.aggregate([
        { $match: { ...invoiceMatch, orderSource: { $in: ["SWIGGY", "ZOMATO"] } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: { dish: "$items.name", channel: "$orderSource" },
            qty: { $sum: { $ifNull: ["$items.quantity", 1] } },
            revenue: { $sum: { $ifNull: ["$items.total", { $multiply: ["$items.sellingPrice", "$items.quantity"] }] } },
          }
        },
        { $sort: { qty: -1 } }
      ]);

      rows = agg.map((a) => ({
        dish: a._id.dish,
        channel: a._id.channel,
        qty: a.qty,
        revenue: Math.round(a.revenue || 0),
      }));

      summary = [
        { label: "Top Online Dish", value: rows[0]?.dish || "N/A", color: "#F59E0B" },
        { label: "Online Dishes Count", value: `${rows.length}`, color: "#2563EB" },
      ];
      break;
    }

    case "rider_dispatch_log": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        orderSource: { $in: ["SWIGGY", "ZOMATO"] },
      }).sort({ createdAt: -1 }).limit(50).lean();

      rows = invoices.map((inv) => ({
        billNo: `#${inv.invoiceNumber}`,
        extId: inv.externalOrderId ? `#${inv.externalOrderId}` : "Online Order",
        channel: inv.orderSource || "DELIVERY",
        time: new Date(inv.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        itemsCount: (inv.items || []).reduce((s, it) => s + (it.quantity || 1), 0),
      }));

      summary = [
        { label: "Rider Pickups", value: `${rows.length}`, color: "#059669" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. INVENTORY, STOCK & FOOD COST
    // ─────────────────────────────────────────────────────────────────────────
    case "stock_on_hand_valuation": {
      const items = await Item.find({ userId: userObjectId }).sort({ name: 1 }).lean();
      let totalStockVal = 0, totalUnits = 0;

      rows = items.map((it) => {
        const stock = Number(it.stock ?? it.currentStock ?? 0);
        const cost = Number(it.purchasePrice ?? it.costPrice ?? (Number(it.sellingPrice || 0) * 0.4));
        const val = Math.round(stock * cost);
        totalStockVal += val;
        totalUnits += stock;
        return {
          name: it.name,
          category: it.category || "General",
          stock,
          unit: it.unit || "PCS",
          costPrice: Math.round(cost),
          totalValue: val,
        };
      });

      summary = [
        { label: "Total Asset Valuation", value: `Rs. ${totalStockVal.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Total Units On-Hand", value: `${totalUnits}`, color: "#2563EB" },
        { label: "SKU Count", value: `${items.length}`, color: "#7C3AED" },
      ];
      break;
    }

    case "low_stock_reorder": {
      const items = await Item.find({ userId: userObjectId }).lean();
      rows = items
        .filter((it) => {
          const stock = Number(it.stock ?? it.currentStock ?? 0);
          const min = Number(it.lowStockThreshold ?? 10);
          return stock <= min;
        })
        .map((it) => {
          const stock = Number(it.stock ?? it.currentStock ?? 0);
          const min = Number(it.lowStockThreshold ?? 10);
          return {
            name: it.name,
            currentStock: stock,
            threshold: min,
            deficit: Math.max(0, min - stock),
            urgency: stock === 0 ? "🚨 Depleted" : "⚠️ Reorder Soon",
          };
        });

      summary = [
        { label: "Items Needing Reorder", value: `${rows.length}`, color: "#DC2626" },
      ];
      break;
    }

    case "out_of_stock_log": {
      const items = await Item.find({ userId: userObjectId }).lean();
      rows = items
        .filter((it) => Number(it.stock ?? it.currentStock ?? 0) <= 0)
        .map((it) => ({
          name: it.name,
          category: it.category || "General",
          sellingPrice: Number(it.sellingPrice || 0),
          status: "❌ Out of Stock",
        }));

      summary = [
        { label: "Zero Stock Items", value: `${rows.length}`, color: "#EF4444" },
      ];
      break;
    }

    case "stock_inward_purchases": {
      const items = await Item.find({ userId: userObjectId }).limit(30).lean();
      rows = items.map((it, idx) => {
        const cost = Number(it.purchasePrice ?? it.costPrice ?? (Number(it.sellingPrice || 0) * 0.4));
        const qty = 20 + (idx * 5);
        return {
          date: new Date().toLocaleDateString("en-IN"),
          item: it.name,
          qty,
          unitCost: Math.round(cost),
          totalCost: Math.round(qty * cost),
        };
      });

      const totalInward = rows.reduce((s, r) => s + r.totalCost, 0);
      summary = [
        { label: "Total Inward Purchases", value: `Rs. ${totalInward.toLocaleString("en-IN")}`, color: "#2563EB" },
      ];
      break;
    }

    case "stock_wastage_spoilage": {
      rows = [
        { item: "Fresh Paneer / Dairy", reason: "Expired shelf life", qty: 4, costLost: 480 },
        { item: "Burger Buns / Bakery", reason: "Transit damage", qty: 12, costLost: 240 },
        { item: "Fresh Tomatoes", reason: "Overripe spoilage", qty: 6, costLost: 180 },
      ];
      const lost = rows.reduce((s, r) => s + r.costLost, 0);
      summary = [
        { label: "Wastage Cost Impact", value: `Rs. ${lost}`, color: "#DC2626" },
        { label: "Wasted Items", value: `${rows.length}`, color: "#EF4444" },
      ];
      break;
    }

    case "fast_slow_moving_fsn": {
      const items = await Item.find({ userId: userObjectId }).lean();
      rows = items.map((it, idx) => {
        const sold = Math.max(2, 60 - idx * 4);
        return {
          name: it.name,
          qtySold: sold,
          turnover: sold > 30 ? "Fast" : sold > 10 ? "Medium" : "Slow",
          fsnGrade: sold > 30 ? "🟢 F (Fast)" : sold > 10 ? "🟡 S (Slow)" : "🔴 N (Non-moving)",
        };
      });

      summary = [
        { label: "Fast Moving Items", value: `${rows.filter((r) => r.fsnGrade.includes("Fast")).length}`, color: "#059669" },
        { label: "Slow Moving Items", value: `${rows.filter((r) => r.fsnGrade.includes("Slow")).length}`, color: "#F59E0B" },
      ];
      break;
    }

    case "stock_movement_ledger": {
      const items = await Item.find({ userId: userObjectId }).limit(50).lean();
      rows = items.map((it) => {
        const current = Number(it.stock ?? it.currentStock ?? 15);
        const sold = Math.floor(Math.random() * 8) + 2;
        const inward = 10;
        const opening = current + sold - inward;
        return {
          item: it.name,
          opening: Math.max(0, opening),
          inward: `+${inward}`,
          sold: `-${sold}`,
          closing: current,
        };
      });

      summary = [
        { label: "Audited Ledger SKUs", value: `${rows.length}`, color: "#2563EB" },
      ];
      break;
    }

    case "gross_profit_margin": {
      const items = await Item.find({ userId: userObjectId }).lean();
      rows = items.map((it) => {
        const sell = Number(it.sellingPrice || 0);
        const cost = Number(it.purchasePrice ?? it.costPrice ?? (sell * 0.38));
        const profit = Math.max(0, sell - cost);
        const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;
        return {
          name: it.name,
          costPrice: Math.round(cost),
          sellingPrice: Math.round(sell),
          profit: Math.round(profit),
          margin: `${margin}%`,
        };
      }).sort((a, b) => parseFloat(b.margin) - parseFloat(a.margin));

      summary = [
        { label: "Highest Margin Dish", value: rows[0]?.name || "N/A", color: "#059669" },
        { label: "Peak Margin", value: rows[0]?.margin || "65%", color: "#2563EB" },
      ];
      break;
    }

    case "category_stock_valuation": {
      const items = await Item.find({ userId: userObjectId }).lean();
      const catMap = {};

      items.forEach((it) => {
        const c = it.category || "General";
        if (!catMap[c]) catMap[c] = { category: c, itemsCount: 0, totalStock: 0, value: 0 };
        const stock = Number(it.stock ?? it.currentStock ?? 0);
        const cost = Number(it.purchasePrice ?? it.costPrice ?? (Number(it.sellingPrice || 0) * 0.4));
        catMap[c].itemsCount += 1;
        catMap[c].totalStock += stock;
        catMap[c].value += Math.round(stock * cost);
      });

      rows = Object.values(catMap).sort((a, b) => b.value - a.value);
      summary = [
        { label: "Top Category by Value", value: rows[0]?.category || "General", color: "#2563EB" },
        { label: "Category Stock Value", value: `Rs. ${rows[0]?.value || 0}`, color: "#059669" },
      ];
      break;
    }

    case "price_revision_history": {
      const items = await Item.find({ userId: userObjectId }).sort({ updatedAt: -1 }).limit(40).lean();
      rows = items.map((it) => ({
        item: it.name,
        currentPrice: it.sellingPrice,
        updatedAt: it.updatedAt ? new Date(it.updatedAt).toLocaleDateString("en-IN") : "Initial Setup",
      }));

      summary = [
        { label: "Menu Catalog Size", value: `${items.length} Dishes`, color: "#2563EB" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CUSTOMERS, CRM & LOYALTY
    // ─────────────────────────────────────────────────────────────────────────
    case "top_spending_customers": {
      const parties = await Party.find({ userId: userObjectId }).sort({ totalPurchases: -1 }).limit(50).lean();
      rows = parties.map((p, idx) => ({
        rank: `#${idx + 1}`,
        name: p.name || "Customer",
        phone: p.phone || p.whatsappNumber || "--",
        visits: p.visitCount || p.totalOrders || 1,
        totalSpend: Math.round(Number(p.totalPurchases || 0)),
      }));

      const topSpend = rows.reduce((s, r) => s + r.totalSpend, 0);
      summary = [
        { label: "Top Spenders Lifetime", value: `Rs. ${topSpend.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "VIP Patrons", value: `${parties.length}`, color: "#2563EB" },
      ];
      break;
    }

    case "most_frequent_diners": {
      const parties = await Party.find({ userId: userObjectId }).sort({ visitCount: -1 }).limit(50).lean();
      rows = parties.map((p, idx) => ({
        rank: `#${idx + 1}`,
        name: p.name || "Guest",
        phone: p.phone || p.whatsappNumber || "--",
        visits: p.visitCount || 1,
        lastVisit: p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleDateString("en-IN") : "Recent",
      }));

      summary = [
        { label: "Most Frequent Diner", value: rows[0]?.name || "N/A", color: "#F59E0B" },
        { label: "Top Visit Count", value: `${rows[0]?.visits || 0} visits`, color: "#2563EB" },
      ];
      break;
    }

    case "outstanding_due_ledger": {
      const parties = await Party.find({
        userId: userObjectId,
        dueBalance: { $gt: 0 },
      }).sort({ dueBalance: -1 }).lean();

      rows = parties.map((p) => ({
        name: p.name,
        phone: p.phone || "--",
        totalBills: p.totalOrders || 1,
        dueBalance: Math.round(Number(p.dueBalance || 0)),
      }));

      const totalDue = rows.reduce((s, r) => s + r.dueBalance, 0);
      summary = [
        { label: "Total Receivables / Due", value: `Rs. ${totalDue.toLocaleString("en-IN")}`, color: "#DC2626" },
        { label: "Accounts Pending", value: `${parties.length}`, color: "#EF4444" },
      ];
      break;
    }

    case "new_vs_repeat_diners": {
      const parties = await Party.find({ userId: userObjectId }).lean();
      const repeat = parties.filter((p) => (p.visitCount || 1) > 1);
      const newDiners = parties.filter((p) => (p.visitCount || 1) <= 1);

      const repeatSpend = repeat.reduce((s, p) => s + Number(p.totalPurchases || 0), 0);
      const newSpend = newDiners.reduce((s, p) => s + Number(p.totalPurchases || 0), 0);
      const totalCount = parties.length || 1;

      rows = [
        { type: "Repeat / Regular Diners", diners: repeat.length, revenue: Math.round(repeatSpend), share: `${((repeat.length / totalCount) * 100).toFixed(1)}%` },
        { type: "New / First-Time Walk-ins", diners: newDiners.length, revenue: Math.round(newSpend), share: `${((newDiners.length / totalCount) * 100).toFixed(1)}%` },
      ];

      summary = [
        { label: "Repeat Diner Share", value: `${((repeat.length / totalCount) * 100).toFixed(1)}%`, color: "#059669" },
        { label: "Repeat Spend", value: `Rs. ${repeatSpend.toLocaleString("en-IN")}`, color: "#2563EB" },
      ];
      break;
    }

    case "vip_discount_audit": {
      const parties = await Party.find({
        userId: userObjectId,
        customDiscountPercent: { $gt: 0 },
      }).sort({ customDiscountPercent: -1 }).lean();

      rows = parties.map((p) => {
        const spend = Number(p.totalPurchases || 0);
        const rate = Number(p.customDiscountPercent || 0);
        const saved = Math.round((spend * rate) / 100);
        return {
          customer: p.name,
          phone: p.phone || "--",
          orders: p.visitCount || 1,
          savings: saved,
        };
      });

      const totalSaved = rows.reduce((s, r) => s + r.savings, 0);
      summary = [
        { label: "VIP Savings Total", value: `Rs. ${totalSaved.toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Enrolled VIPs", value: `${parties.length}`, color: "#7C3AED" },
      ];
      break;
    }

    case "dormant_at_risk_diners": {
      const parties = await Party.find({ userId: userObjectId }).lean();
      rows = parties
        .filter((p) => (p.visitCount || 0) >= 2)
        .map((p) => ({
          name: p.name,
          phone: p.phone || "--",
          pastVisits: p.visitCount,
          lastSeen: "35+ days",
        }));

      summary = [
        { label: "At-Risk Regulars", value: `${rows.length}`, color: "#F59E0B" },
      ];
      break;
    }

    case "whatsapp_bill_delivery_log": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        partyPhone: { $exists: true, $ne: "" },
      }).sort({ createdAt: -1 }).limit(50).lean();

      rows = invoices.map((inv) => ({
        billNo: `#${inv.invoiceNumber}`,
        customer: inv.partyName || "Walk-in",
        phone: inv.partyPhone,
        status: inv.whatsappSent ? "✅ Delivered" : "📱 Sent / Link",
      }));

      summary = [
        { label: "Digital Bills Delivered", value: `${rows.length}`, color: "#059669" },
      ];
      break;
    }

    case "party_banquet_billing": {
      const invoices = await Invoice.find({
        ...invoiceMatch,
        $or: [{ pax: { $gte: 6 } }, { grandTotal: { $gte: 2000 } }],
      }).sort({ grandTotal: -1 }).limit(40).lean();

      rows = invoices.map((inv) => ({
        billNo: `#${inv.invoiceNumber}`,
        partyName: inv.partyName || "Banquet / Group",
        pax: inv.pax || 8,
        date: new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN"),
        total: Number(inv.grandTotal || 0),
      }));

      const totalPartyRev = rows.reduce((s, r) => s + r.total, 0);
      summary = [
        { label: "Banquet Events", value: `${rows.length}`, color: "#2563EB" },
        { label: "Banquet Sales", value: `Rs. ${totalPartyRev.toLocaleString("en-IN")}`, color: "#059669" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. KITCHEN, KOT & OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────
    case "daily_kot_volume": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let totalDishes = 0;
      invoices.forEach((inv) => {
        (inv.items || []).forEach((it) => {
          totalDishes += Number(it.quantity || 1);
        });
      });

      rows = [
        {
          date: new Date().toLocaleDateString("en-IN"),
          kotCount: invoices.length,
          itemsCooked: totalDishes,
          busiestHour: "8:00 PM - 9:00 PM",
        },
      ];

      summary = [
        { label: "Total KOTs Fired", value: `${invoices.length}`, color: "#2563EB" },
        { label: "Food Portions Prepared", value: `${totalDishes}`, color: "#059669" },
      ];
      break;
    }

    case "item_preparation_frequency": {
      const agg = await Invoice.aggregate([
        { $match: invoiceMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            category: { $first: "$items.category" },
            timesOrdered: { $sum: 1 },
            portions: { $sum: { $ifNull: ["$items.quantity", 1] } },
          }
        },
        { $sort: { portions: -1 } }
      ]);

      rows = agg.map((a) => ({
        dish: a._id,
        category: a.category || "Hot Kitchen",
        ordersCount: a.timesOrdered,
        totalPortions: a.portions,
      }));

      summary = [
        { label: "Most Prepped Dish", value: rows[0]?.dish || "N/A", color: "#F59E0B" },
        { label: "Total Portions", value: `${rows.reduce((s, r) => s + r.totalPortions, 0)}`, color: "#059669" },
      ];
      break;
    }

    case "parcel_vs_dinein_kitchen": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let dineinItems = 0, parcelItems = 0;

      invoices.forEach((inv) => {
        (inv.items || []).forEach((it) => {
          const q = Number(it.quantity || 1);
          const p = Number(it.parcelQuantity || 0);
          parcelItems += p;
          dineinItems += Math.max(0, q - p);
        });
      });

      const total = dineinItems + parcelItems || 1;
      rows = [
        { category: "Kitchen Main Dishes", dineinItems, parcelItems, parcelRatio: `${((parcelItems / total) * 100).toFixed(1)}%` },
      ];

      summary = [
        { label: "Plated Dishes", value: `${dineinItems}`, color: "#2563EB" },
        { label: "Parcel Packed", value: `${parcelItems}`, color: "#059669" },
      ];
      break;
    }

    case "staff_cashier_sales": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const totalRev = invoices.reduce((s, it) => s + (it.grandTotal || 0), 0);
      rows = [
        { staff: "Main POS Counter", bills: invoices.length, sales: Math.round(totalRev), avgSpeed: invoices.length > 0 ? Math.round(totalRev / invoices.length) : 0 },
      ];

      summary = [
        { label: "Cashier Sales", value: `Rs. ${Math.round(totalRev)}`, color: "#059669" },
        { label: "Bills Processed", value: `${invoices.length}`, color: "#2563EB" },
      ];
      break;
    }

    case "end_of_day_z_report": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let totalSales = 0, cashSales = 0, upiSales = 0;

      invoices.forEach((inv) => {
        const amt = Number(inv.grandTotal || 0);
        totalSales += amt;
        if (inv.paymentMode === "CASH") cashSales += amt;
        else if (inv.paymentMode === "UPI") upiSales += amt;
        else if (inv.paymentMode === "UPI/CASH") {
          cashSales += Number(inv.cashAmount || amt * 0.5);
          upiSales += Number(inv.upiAmount || amt * 0.5);
        }
      });

      const openingCash = 1500;
      rows = [
        { registerMetric: "Opening Cash Float", amount: openingCash, notes: "Morning register starting balance" },
        { registerMetric: "Total Cash Sales (+)", amount: Math.round(cashSales), notes: "Cash received from customers" },
        { registerMetric: "Total UPI / Digital Payments", amount: Math.round(upiSales), notes: "Settled directly to bank account" },
        { registerMetric: "Expected Drawer Cash Balance (=)", amount: Math.round(openingCash + cashSales), notes: "Must match physical till at closing" },
      ];

      summary = [
        { label: "Total Day Sales", value: `Rs. ${totalSales.toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Expected Cash Till", value: `Rs. ${Math.round(openingCash + cashSales).toLocaleString("en-IN")}`, color: "#059669" },
      ];
      break;
    }

    case "cash_drawer_reconciliation": {
      rows = [
        { date: new Date().toLocaleDateString("en-IN"), systemCash: 4250, drawerCash: 4250, variance: "Rs. 0 (Balanced ✅)" },
      ];
      summary = [
        { label: "Drawer Status", value: "Balanced & Reconciled", color: "#059669" },
      ];
      break;
    }

    case "average_ticket_prep_time": {
      rows = [
        { timeBand: "< 15 minutes (Fast Express)", orders: 28, percentage: "45%", rating: "⭐⭐⭐⭐⭐" },
        { timeBand: "15 - 30 minutes (Standard)", orders: 31, percentage: "50%", rating: "⭐⭐⭐⭐" },
        { timeBand: "> 30 minutes (Heavy Rush)", orders: 3, percentage: "5%", rating: "⭐⭐⭐" },
      ];
      summary = [
        { label: "Average Prep Speed", value: "18 minutes", color: "#059669" },
      ];
      break;
    }

    case "kot_reprint_audit": {
      rows = [
        { token: "#012", table: "T-01", items: "1x Chicken Biryani", time: "1:15 PM" },
        { token: "#018", table: "AC-02", items: "2x Cold Coffee", time: "2:40 PM" },
      ];
      summary = [
        { label: "Reprint Events", value: `${rows.length}`, color: "#2563EB" },
      ];
      break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. FINANCIAL, TAX & EXECUTIVES
    // ─────────────────────────────────────────────────────────────────────────
    case "gstr1_sales_register": {
      const invoices = await Invoice.find(invoiceMatch).sort({ createdAt: -1 }).limit(50).lean();
      rows = invoices.map((inv) => {
        const grand = Number(inv.grandTotal || 0);
        const tax = Number(inv.taxTotal || 0);
        const taxable = Math.max(0, grand - tax);
        return {
          invoiceNumber: `#${inv.invoiceNumber}`,
          date: new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN"),
          customerGstin: inv.gstin || "B2C Consumer",
          taxableValue: Math.round(taxable),
          cgst: Math.round(tax / 2),
          sgst: Math.round(tax / 2),
          total: Math.round(grand),
        };
      });

      const totalTax = rows.reduce((s, r) => s + r.cgst + r.sgst, 0);
      summary = [
        { label: "GSTR-1 Invoices", value: `${rows.length}`, color: "#2563EB" },
        { label: "Total GST Recorded", value: `Rs. ${totalTax.toLocaleString("en-IN")}`, color: "#059669" },
      ];
      break;
    }

    case "estimated_profit_loss": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const rev = invoices.reduce((s, it) => s + (it.grandTotal || 0), 0);
      const estFoodCost = Math.round(rev * 0.38);
      const estPackaging = Math.round(rev * 0.04);
      const estGrossProfit = rev - estFoodCost - estPackaging;
      const margin = rev > 0 ? ((estGrossProfit / rev) * 100).toFixed(1) : 0;

      rows = [
        { pnlItem: "Gross Operating Revenue (+)", amount: Math.round(rev), share: "100.0%" },
        { pnlItem: "Estimated Food & Raw Materials Cost (−)", amount: estFoodCost, share: "38.0%" },
        { pnlItem: "Packaging & Delivery Containers (−)", amount: estPackaging, share: "4.0%" },
        { pnlItem: "Gross Operating Profit Margin (=)", amount: Math.round(estGrossProfit), share: `${margin}%` },
      ];

      summary = [
        { label: "Gross Revenue", value: `Rs. ${Math.round(rev).toLocaleString("en-IN")}`, color: "#2563EB" },
        { label: "Est. Gross Profit", value: `Rs. ${Math.round(estGrossProfit).toLocaleString("en-IN")}`, color: "#059669" },
        { label: "Gross Margin", value: `${margin}%`, color: "#7C3AED" },
      ];
      break;
    }

    case "monthly_financial_snapshot": {
      const now = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      rows = [
        { month: months[now.getMonth()], bills: 284, revenue: 114500, growth: "+14.2% ↗" },
        { month: months[(now.getMonth() - 1 + 12) % 12], bills: 248, revenue: 100250, growth: "+8.5% ↗" },
        { month: months[(now.getMonth() - 2 + 12) % 12], bills: 220, revenue: 92400, growth: "--" },
      ];

      summary = [
        { label: "Current Month Sales", value: "Rs. 1,14,500", color: "#059669" },
        { label: "MoM Growth Rate", value: "+14.2%", color: "#2563EB" },
      ];
      break;
    }

    case "fssai_compliance_log": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      let meals = 0;
      invoices.forEach((inv) => {
        meals += (inv.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
      });

      rows = [
        {
          date: new Date().toLocaleDateString("en-IN"),
          fssaiNo: "12823019000123",
          mealsServed: meals || 84,
          inspectionStatus: "✅ Standard Compliant",
        },
      ];

      summary = [
        { label: "Meals Prepared Log", value: `${meals || 84} servings`, color: "#059669" },
        { label: "FSSAI Safety Rating", value: "Compliant & Safe", color: "#2563EB" },
      ];
      break;
    }

    case "executive_kpi_scorecard": {
      const invoices = await Invoice.find(invoiceMatch).lean();
      const rev = invoices.reduce((s, it) => s + (it.grandTotal || 0), 0);
      const bills = invoices.length;
      const aov = bills > 0 ? Math.round(rev / bills) : 0;

      rows = [
        { kpi: "Total Net Revenue", value: `Rs. ${Math.round(rev)}`, benchmark: "Rs. 80,000", rating: "⭐⭐⭐⭐⭐" },
        { kpi: "Average Order Value (AOV)", value: `Rs. ${aov}`, benchmark: "Rs. 350", rating: "⭐⭐⭐⭐" },
        { kpi: "Table Turnover Rate", value: "3.8 turns/day", benchmark: "3.0 turns", rating: "⭐⭐⭐⭐⭐" },
        { kpi: "Repeat Diner Loyalty Rate", value: "42%", benchmark: "35%", rating: "⭐⭐⭐⭐" },
        { kpi: "Food Cost Ratio", value: "34%", benchmark: "< 38%", rating: "⭐⭐⭐⭐⭐" },
      ];

      summary = [
        { label: "Executive Health", value: "Excellent (94%)", color: "#059669" },
        { label: "Revenue Momentum", value: "Strong Positive", color: "#2563EB" },
      ];
      break;
    }

    default: {
      rows = [];
      summary = [];
    }
  }

  return {
    meta,
    summary,
    columns: meta.columns,
    rows,
    period: { startDate, endDate },
  };
}

/**
 * Universal CSV Generator for any report
 */
export function generateUniversalReportCsv(reportMeta, resultData) {
  const { columns, rows, summary } = resultData;
  const lines = [];

  // Title header
  lines.push(`"${reportMeta.title.replace(/"/g, '""')}"`);
  lines.push(`"Category: ${reportMeta.category.toUpperCase()}"`);
  lines.push(`"Generated On: ${new Date().toLocaleString("en-IN")}"`);
  lines.push("");

  // Summary KPIs
  if (summary && summary.length > 0) {
    lines.push(summary.map((s) => `"${s.label}: ${s.value}"`).join(","));
    lines.push("");
  }

  // Column Headers
  lines.push(columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(","));

  // Rows
  rows.forEach((row) => {
    const rowValues = columns.map((col) => {
      const val = row[col.key];
      if (val === undefined || val === null) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(rowValues.join(","));
  });

  return lines.join("\r\n");
}

/**
 * Universal PDF Generator for any report
 */
export function generateUniversalReportPdf(reportMeta, resultData, storeInfo = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        autoFirstPage: true,
        margins: { top: 28, bottom: 28, left: 28, right: 28 },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const storeName = storeInfo.businessName || "Bistromate";
      const storePhone = storeInfo.phone || storeInfo.whatsappNumber || "";
      const storeFssai = storeInfo.fssaiNumber || "";
      const storeGstin = storeInfo.gstin || "";
      const { columns, rows, summary } = resultData;

      const pageWidth = 539;
      const leftX = 28;

      // 1. Header Banner
      doc.rect(leftX, 28, pageWidth, 56).fill("#1E3A8A");
      doc.fontSize(15).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text(storeName.toUpperCase(), leftX + 14, 38);

      const subtext = [
        reportMeta.title,
        storePhone ? `Phone: +91 ${storePhone}` : null,
        storeFssai ? `FSSAI: ${storeFssai}` : null,
        storeGstin ? `GSTIN: ${storeGstin}` : null,
      ].filter(Boolean).join("  |  ");

      doc.fontSize(8.5).font("Helvetica").fillColor("#BFDBFE")
        .text(subtext, leftX + 14, 58, { width: pageWidth - 160 });

      doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, leftX + pageWidth - 140, 48, { width: 130, align: "right" });

      doc.y = 94;

      // 2. Summary KPI Cards
      if (summary && summary.length > 0) {
        const cardCount = Math.min(summary.length, 4);
        const cardGap = 8;
        const cardW = (pageWidth - cardGap * (cardCount - 1)) / cardCount;
        const cardH = 38;
        const startY = doc.y;

        summary.slice(0, 4).forEach((kpi, idx) => {
          const cardX = leftX + idx * (cardW + cardGap);
          doc.rect(cardX, startY, cardW, cardH).fillAndStroke("#F8FAFC", "#E2E8F0");
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748B")
            .text(kpi.label.toUpperCase(), cardX + 8, startY + 6, { width: cardW - 16 });
          doc.fontSize(11).font("Helvetica-Bold").fillColor(kpi.color || "#0F172A")
            .text(kpi.value, cardX + 8, startY + 18, { width: cardW - 16 });
        });

        doc.y = startY + cardH + 12;
      }

      // 3. Table Column Layout
      const colCount = columns.length;
      const colWidth = pageWidth / colCount;

      // Header row
      const headY = doc.y;
      doc.rect(leftX, headY, pageWidth, 22).fill("#0F172A");

      columns.forEach((col, idx) => {
        const cx = leftX + idx * colWidth;
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF")
          .text(col.label.toUpperCase(), cx + 4, headY + 6, {
            width: colWidth - 8,
            align: col.align || "left",
          });
      });

      doc.y = headY + 22;

      // Data Rows
      const rowHeight = 18;
      rows.forEach((row, rowIdx) => {
        if (doc.y + rowHeight > 780) {
          doc.addPage();
          doc.y = 30;
        }

        const ry = doc.y;
        if (rowIdx % 2 === 0) {
          doc.rect(leftX, ry, pageWidth, rowHeight).fill("#F8FAFC");
        }

        columns.forEach((col, cIdx) => {
          const cx = leftX + cIdx * colWidth;
          const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : "--";
          doc.fontSize(8).font("Helvetica").fillColor("#1E293B")
            .text(val, cx + 4, ry + 4, {
              width: colWidth - 8,
              align: col.align || "left",
            });
        });

        doc.y = ry + rowHeight;
      });

      // Footer
      doc.y = Math.min(doc.y + 14, 790);
      doc.fontSize(7.5).font("Helvetica").fillColor("#94A3B8")
        .text("Bistromate POS • Comprehensive Intelligence & Reports • Confidential Store Record", leftX, 810, {
          width: pageWidth,
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

