export type PolicyBook = 'motor' | 'non-motor';

const labelStart =
  /^(debit|policy|insured|customer|name of|address|postal|location|situation|sum|vehicle|registration|reg\.?\s*no|premium|basic|net|risk|renewal|inception|expiry|period|insurer|insurance|underwriter|telephone|phone|mobile|product|class of|srcc|rcc|terrorism|sales|broker|agent|status|date|from|to)\b/i;

function tidy(value: string) {
  return value.replace(/\s+/g, ' ').replace(/^[:\-–]+/, '').trim();
}

function linesOf(text: string) {
  return text
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

function looksLikeLabel(line: string) {
  return labelStart.test(line);
}

function matchesLabel(line: string, label: RegExp) {
  return new RegExp(`^${label.source}(?:\\b|\\s|[:\\-–]|$)`, 'i').test(line);
}

function isoDate(value: string) {
  const match = value.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})|(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!match) return '';
  let year: string;
  let month: string;
  let day: string;
  if (match[1]) {
    year = match[1];
    month = match[2];
    day = match[3];
  } else {
    day = match[4];
    month = match[5];
    year = match[6].length === 2 ? `${Number(match[6]) > 50 ? '19' : '20'}${match[6]}` : match[6];
    if (Number(day) <= 12 && Number(month) > 12) {
      const swap = day;
      day = month;
      month = swap;
    }
  }
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function moneyOf(value: string) {
  const cleaned = value.replace(/rs\.?|lkr|%/gi, ' ');
  const matches = [...cleaned.matchAll(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/g)];
  const usable = matches.filter((match) => {
    if (match[2] || match[1].includes(',')) return true;
    const amount = Number(match[1]);
    return !(match[1].length === 4 && amount >= 1900 && amount <= 2100);
  });
  const chosen = usable.at(-1);
  if (!chosen) return '';
  const whole = chosen[1].replace(/,/g, '');
  if (whole.length > 12) return '';
  if (chosen[2]) return `${whole}.${chosen[2].padEnd(2, '0').slice(0, 2)}`;
  return whole;
}

function dateValue(lines: string[], labels: RegExp[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((item) => matchesLabel(line, item));
    if (!label) continue;
    const inline = tidy(line.replace(new RegExp(`^${label.source}\\s*[:\\-–]?\\s*`, 'i'), ''));
    const next = lines[index + 1] ?? '';
    const raw = inline || (looksLikeLabel(next) ? '' : next);
    const iso = isoDate(raw);
    if (iso) return iso;
  }
  return '';
}

function textValue(lines: string[], labels: RegExp[], max = 160) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((item) => matchesLabel(line, item));
    if (!label) continue;
    const inline = tidy(line.replace(new RegExp(`^${label.source}\\s*[:\\-–]?\\s*`, 'i'), ''));
    const next = lines[index + 1] ?? '';
    const value = inline || (looksLikeLabel(next) ? '' : next);
    if (value) return tidy(value).slice(0, max);
  }
  return '';
}

function blockValue(lines: string[], labels: RegExp[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((item) => matchesLabel(line, item));
    if (!label) continue;
    const inline = tidy(line.replace(new RegExp(`^${label.source}\\s*[:\\-–]?\\s*`, 'i'), ''));
    const parts = inline ? [inline] : [];
    for (let cursor = index + 1; cursor < lines.length && parts.length < 3; cursor += 1) {
      if (looksLikeLabel(lines[cursor])) break;
      parts.push(lines[cursor]);
    }
    const value = tidy(parts.join(', '));
    if (value) return value.slice(0, 400);
  }
  return '';
}

function period(lines: string[]) {
  const match = lines.join('\n').match(/(?:period|from)\b[^\n]{0,60}?(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\s*(?:to|-|–)\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  if (!match) return { from: '', to: '' };
  return { from: isoDate(match[1]), to: isoDate(match[2]) };
}

function vehicleOf(value: string) {
  const match = value.toUpperCase().match(/[A-Z]{1,3}(?:[\s-]+[A-Z]{1,3})?[\s-]*\d{3,4}/);
  if (!match) return tidy(value).toUpperCase().slice(0, 20);
  return match[0].replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim();
}

function phoneOf(value: string) {
  const match = value.match(/(?:\+94|0)(?:[\s-]?\d){9}/);
  if (!match) return '';
  return match[0].replace(/[\s-]/g, '');
}

function statusOf(lines: string[]) {
  const value = textValue(lines, [/status/, /policy\s*status/, /type\s*of\s*business/], 40).toLowerCase();
  if (/refund/.test(value)) return 'refund';
  if (/additional|endorsement/.test(value)) return 'additional';
  if (/renew/.test(value)) return 'ren';
  if (/\bnew\b/.test(value)) return 'new';
  return '';
}

function premiumClass(line: string) {
  if (/commission/i.test(line)) return '';
  const excluding = /excluding|ex\.?\s*rcc/i.test(line);
  if (!excluding && /total premium|premium including tax|gross premium|premium payable|amount payable|amount due/i.test(line)) return 'total';
  if (!excluding && /\brcc\b|\bsrcc\b|strike[,\s]+riot/i.test(line)) return 'rcc';
  if (!excluding && (/\bterrorism\b|\btc\b/i.test(line))) return 'tc';
  if (/basic premium|net premium|premium net|premium excluding|^premium\b/i.test(line)) return 'net';
  return '';
}

function premiums(lines: string[]) {
  const found = { net: '', rcc: '', tc: '', total: '' };
  for (const line of lines) {
    const kind = premiumClass(line);
    if (!kind || found[kind]) continue;
    const amount = moneyOf(line);
    if (amount) found[kind] = amount;
  }
  return found;
}

function commissionRates(lines: string[], book: PolicyBook) {
  const rates: Record<string, string> = {};
  for (const line of lines) {
    if (!/commission\s*rate/i.test(line)) continue;
    const match = line.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%/);
    if (!match) continue;
    if (/rcc|srcc/i.test(line)) rates.rccCommissionRate = match[1];
    else if (/\btc\b|terrorism/i.test(line)) rates.tcCommissionRate = match[1];
    else rates[book === 'motor' ? 'netCommissionRate' : 'exCommissionRate'] = match[1];
  }
  return rates;
}

function put(fields: Record<string, string>, key: string, value: string) {
  const clean = value.trim();
  if (clean) fields[key] = clean;
}

export function parseDebitNote(text: string, book: PolicyBook) {
  const lines = linesOf(text);
  const fields: Record<string, string> = {};
  const span = period(lines);
  const amounts = premiums(lines);
  const debitDate = dateValue(lines, [/debit\s*date/, /date\s*of\s*(?:issue|debit)/, /invoice\s*date/, /date/]);
  const riskDate = dateValue(lines, [/risk\s*date/, /inception(?:\s*date)?/, /commencement(?:\s*date)?/]) || span.from;
  const renewalDate = dateValue(lines, [/renewal\s*date/, /expiry(?:\s*date)?/]) || span.to;

  put(fields, book === 'motor' ? 'entryDate' : 'debitDate', debitDate);
  put(fields, 'riskDate', riskDate);
  put(fields, 'renewalDate', renewalDate);
  put(fields, 'debitNoteNo', textValue(lines, [/debit\s*note\s*(?:no\.?|number|#)/, /d\.?n\.?\s*(?:no\.?|number|#)/], 40));
  put(fields, 'customerName', textValue(lines, [/customer\s*name/, /name\s*of\s*(?:the\s*)?(?:insured|customer|proposer)/, /insured\s*name/, /proposer\s*name/, /insured(?!\s*address)\s*[:\-–]/, /customer\s*[:\-–]/, /proposer\s*[:\-–]/], 120));
  put(fields, 'postalAddress', blockValue(lines, [/postal\s*address/, /insured\s*address/, /customer\s*address/, /address/]));
  if (book === 'non-motor') {
    put(fields, 'locationAddress', blockValue(lines, [/location(?:\s*(?:address|of\s*risk))?/, /situation(?:\s*of\s*risk)?/, /risk\s*address/]));
    put(fields, 'product', textValue(lines, [/product/, /class\s*of\s*(?:insurance|business)/, /type\s*of\s*(?:cover|policy|insurance)/], 80));
  }
  put(fields, 'sumInsured', moneyOf(textValue(lines, [/sum\s*insured/, /total\s*sum\s*insured/], 40)));
  put(fields, 'policyNumber', textValue(lines, [/policy\s*(?:no\.?|number|#)/], 40));
  if (book === 'motor') put(fields, 'vehicleNumber', vehicleOf(textValue(lines, [/vehicle\s*(?:no\.?|number|#)?/, /registration\s*(?:no\.?|number)?/, /reg\.?\s*no/], 40)));
  put(fields, book === 'motor' ? 'premiumNet' : 'premiumExRccTc', amounts.net);
  put(fields, 'premiumRcc', amounts.rcc);
  put(fields, 'premiumTc', amounts.tc);
  put(fields, 'premiumIncludingTax', amounts.total);
  put(fields, 'insuranceCompany', textValue(lines, [/insurance\s*company/, /insurer/, /underwriter/], 120));
  put(fields, 'salesPerson', textValue(lines, [/sales\s*person/, /marketing\s*executive/], 80));
  put(fields, 'agentCode', textValue(lines, [/(?:broker|agent|agency)\s*code/], 40));
  if (book === 'motor') put(fields, 'telephone', phoneOf(textValue(lines, [/telephone(?:\s*(?:no\.?|number))?/, /phone(?:\s*(?:no\.?|number))?/, /mobile(?:\s*(?:no\.?|number))?/], 40)));
  put(fields, 'special', statusOf(lines));
  for (const [key, value] of Object.entries(commissionRates(lines, book))) put(fields, key, value);
  return fields;
}
