import { parse } from "csv-parse/sync";

// Converts an array of flat objects into a CSV string. All rows must share
// the same shape (uses the first row's keys as the header).
export const toCSV = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

// Parses a CSV buffer/string into an array of row objects keyed by header.
// Uses a real CSV parser (not a hand-rolled split(",")) specifically because
// quoted fields containing commas, embedded quotes, or newlines are exactly
// the kind of edge case a naive parser silently mangles.
export const parseCSV = (input) =>
  parse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
