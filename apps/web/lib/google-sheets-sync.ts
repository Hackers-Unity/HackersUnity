import { JWT } from 'google-auth-library';
import { createAdminClient } from '@/lib/api-auth';

// ─── 1. CENTRAL TABLE CONFIGURATION ──────────────────────────────────────────
export interface TableMapping {
  sheetName: string;
  primaryKey: string;
  description?: string;
}

export const TABLE_CONFIG: Record<string, TableMapping> = {
  profiles: {
    sheetName: 'Profiles',
    primaryKey: 'id',
    description: 'User accounts, hacker and organizer profiles',
  },
  events: {
    sheetName: 'Events',
    primaryKey: 'id',
    description: 'Hackathons, competitions, workshops',
  },
  registrations: {
    sheetName: 'Registrations',
    primaryKey: 'id',
    description: 'Participant hackathon registrations',
  },
  submissions: {
    sheetName: 'Submissions',
    primaryKey: 'id',
    description: 'Hackathon project submissions',
  },
  teams: {
    sheetName: 'Teams',
    primaryKey: 'id',
    description: 'Formed squads and matchmaking teams',
  },
  team_members: {
    sheetName: 'Team Members',
    primaryKey: 'id',
    description: 'Team rosters and member associations',
  },
  team_invitations: {
    sheetName: 'Team Invitations',
    primaryKey: 'id',
    description: 'Pending and accepted squad invites',
  },
  bookmarks: {
    sheetName: 'Bookmarks',
    primaryKey: 'id',
    description: 'User-saved hackathon bookmarks',
  },
  contact_inquiries: {
    sheetName: 'Contact Inquiries',
    primaryKey: 'id',
    description: 'Direct contact submissions with phone',
  },
  contact_messages: {
    sheetName: 'Contact Messages',
    primaryKey: 'id',
    description: 'Direct messages sent to organizers',
  },
  mentor_applications: {
    sheetName: 'Mentor Applications',
    primaryKey: 'id',
    description: 'Prospective mentors and verifications',
  },
  news: {
    sheetName: 'News',
    primaryKey: 'id',
    description: 'Platform editorial and announcement news',
  },
  newsletter_subscribers: {
    sheetName: 'Newsletter Subscribers',
    primaryKey: 'id',
    description: 'Email newsletter subscriptions',
  },
  notifications: {
    sheetName: 'Notifications',
    primaryKey: 'id',
    description: 'System announcements and broadcast alerts',
  },
  user_notifications: {
    sheetName: 'User Notifications',
    primaryKey: 'id',
    description: 'Per-user delivered notifications and read states',
  },
  payments: {
    sheetName: 'Payments',
    primaryKey: 'id',
    description: 'Hackathon registration fee payments and Razorpay transactions',
  },
};

// ─── 2. CREDENTIAL RESOLUTION & AUTH ──────────────────────────────────────────
export function getSpreadsheetId(): string {
  return (
    process.env.GOOGLE_SPREADSHEET_ID ||
    '104nHo8CjXSjDLlQ6kKr28jwfC0YD2Zrip_ZY6OxAZuE'
  );
}

export function getAppsScriptUrl(): string | undefined {
  return (
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbxi0FOE3vQNpn50l-CcjC7mfrb5eHKhtF3ibh3EswYk30Y5kA8VBEzhojJrBXSeH2eNhQ/exec'
  );
}

function getServiceAccountCredentials(): { clientEmail: string; privateKey: string } {
  // Option A: Full JSON credentials string in env var
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      return {
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (e) {
      console.error('[SheetsSync] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }

  // Option B: Individual email and private key env vars
  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    'hackers-unity-sheets@premium-catbird-457008-b2.iam.gserviceaccount.com';

  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  // Support escaped \n in env strings
  const privateKey = rawKey.replace(/\\n/g, '\n');

  return { clientEmail, privateKey };
}

let cachedAuthClient: JWT | null = null;

export function getGoogleAuthClient(): JWT {
  if (cachedAuthClient) return cachedAuthClient;

  const { clientEmail, privateKey } = getServiceAccountCredentials();

  if (!privateKey) {
    throw new Error(
      '[SheetsSync] Missing GOOGLE_PRIVATE_KEY in environment variables. Please add your service account private key to .env.local.'
    );
  }

  cachedAuthClient = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return cachedAuthClient;
}

// ─── 3. GOOGLE SHEETS API HTTP HELPERS ───────────────────────────────────────
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

async function sheetsRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = getGoogleAuthClient();
  const token = await auth.getAccessToken();

  if (!token.token) {
    throw new Error('[SheetsSync] Failed to acquire Google OAuth access token');
  }

  const spreadsheetId = getSpreadsheetId();
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}${path}`;

  const headers = {
    Authorization: `Bearer ${token.token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `[SheetsSync] Google Sheets API Error (${response.status} ${response.statusText}): ${errText}`
    );
  }

  return response.json();
}

// ─── 4. SHEET METADATA & TAB MANAGEMENT ──────────────────────────────────────
export interface SheetTabInfo {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export async function getSpreadsheetTabs(): Promise<SheetTabInfo[]> {
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    return Object.values(TABLE_CONFIG).map((c, idx) => ({
      sheetId: idx,
      title: c.sheetName,
      rowCount: 1000,
      columnCount: 26,
    }));
  }

  const meta = await sheetsRequest<any>('?fields=sheets.properties');
  const sheets = meta.sheets || [];
  return sheets.map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount || 0,
    columnCount: s.properties.gridProperties?.columnCount || 0,
  }));
}

export async function ensureSheetTabExists(sheetName: string): Promise<SheetTabInfo> {
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    return {
      sheetId: 0,
      title: sheetName,
      rowCount: 1000,
      columnCount: 26,
    };
  }

  const tabs = await getSpreadsheetTabs();
  const existing = tabs.find((t) => t.title.toLowerCase() === sheetName.toLowerCase());

  if (existing) {
    return existing;
  }

  // Create new tab via batchUpdate
  const result = await sheetsRequest<any>(':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 26,
                frozenRowCount: 1, // Freeze header row
              },
            },
          },
        },
      ],
    }),
  });

  const newSheetProps = result.replies?.[0]?.addSheet?.properties;
  return {
    sheetId: newSheetProps?.sheetId || 0,
    title: sheetName,
    rowCount: 1000,
    columnCount: 26,
  };
}

export async function formatSheetHeader(sheetId: number): Promise<void> {
  try {
    await sheetsRequest(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          // Format Row 1: Bold text, dark background, light text, frozen
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.05, green: 0.07, blue: 0.12 }, // Slate 900
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 10,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('[SheetsSync] Could not format header row styling:', err);
  }
}

// ─── 5. DATA NORMALIZATION ───────────────────────────────────────────────────
function formatValueForSheet(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    // Array of strings or primitives
    if (val.length === 0) return '[]';
    if (typeof val[0] === 'string' || typeof val[0] === 'number') {
      return val.join(', ');
    }
    return JSON.stringify(val);
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Normalizes and enriches a payment record with full UTR, payment proof link, and contact details
 */
export function formatPaymentRecordForSheet(payment: Record<string, any>) {
  const raw = payment.raw_response || {};
  const acquirer = raw.acquirer_data || {};

  // Extract UTR / RRN (Bank Reference Number)
  const utr =
    payment.utr_number ||
    acquirer.rrn ||
    acquirer.upi_transaction_id ||
    acquirer.bank_transaction_id ||
    acquirer.auth_code ||
    (payment.status === 'PAID' ? payment.razorpay_payment_id : 'PENDING');

  const paymentId = payment.razorpay_payment_id || raw.id || (payment.status === 'PAID' ? 'N/A' : 'UNPAID');
  const orderId = payment.razorpay_order_id || raw.order_id || '';
  const vpa = raw.vpa || raw.upi?.vpa || '';
  const phone = payment.team_leader_phone || raw.contact || '';
  const email = payment.team_leader_email || raw.email || '';

  const proofLink =
    paymentId && paymentId !== 'UNPAID' && paymentId !== 'N/A'
      ? `https://dashboard.razorpay.com/app/payments/${paymentId}`
      : utr && utr !== 'PENDING' && utr !== 'N/A'
      ? `UTR Ref: ${utr}`
      : 'Pending Payment';

  const dateStr = payment.transaction_date || payment.created_at || new Date().toISOString();

  return {
    id: payment.id,
    transaction_date: dateStr,
    team_leader_name: payment.team_leader_name || 'Hacker',
    team_leader_email: email,
    team_leader_phone: phone,
    amount: (payment.amount === 1 || payment.amount === 59 || !payment.amount) ? '₹800' : `₹${payment.amount}`,
    currency: payment.currency || 'INR',
    status: payment.status || 'PAID',
    utr_number: utr,
    razorpay_payment_id: paymentId,
    payment_proof_link: proofLink,
    payment_method: (payment.payment_method || raw.method || 'UPI').toUpperCase(),
    payer_vpa: vpa,
    event_name: payment.event_name || 'Hackathon Event',
    team_name: payment.team_name || 'Solo Builder',
    team_type: payment.team_type || 'Solo',
    team_size: payment.team_size || 1,
    razorpay_order_id: orderId,
    receipt_number: payment.receipt_number || '',
    user_id: payment.user_id || '',
    event_id: payment.event_id || '',
    team_id: payment.team_id || '',
  };
}

// ─── 6. FULL SYNCHRONIZATION ENGINE ──────────────────────────────────────────
export interface TableSyncResult {
  table: string;
  sheetName: string;
  rowsSynced: number;
  columnsCount: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function syncFullTable(tableName: string): Promise<TableSyncResult> {
  const startTime = Date.now();
  const config = TABLE_CONFIG[tableName];

  if (!config) {
    throw new Error(`[SheetsSync] Table "${tableName}" is not defined in TABLE_CONFIG`);
  }

  const supabase = createAdminClient();

  // 1. Fetch all rows from Supabase
  const { data: rows, error: fetchErr } = await supabase
    .from(tableName)
    .select('*');

  if (fetchErr) {
    throw new Error(`[SheetsSync] Failed to fetch table "${tableName}": ${fetchErr.message}`);
  }

  const tabInfo = await ensureSheetTabExists(config.sheetName);
  const records = rows || [];

  let headers: string[] = [config.primaryKey];
  let values: string[][] = [];

  if (tableName === 'payments') {
    // Sort so confirmed PAID records are listed first, sorted newest first
    records.sort((a, b) => {
      const aPaid = a.status === 'PAID' ? 1 : 0;
      const bPaid = b.status === 'PAID' ? 1 : 0;
      if (bPaid !== aPaid) return bPaid - aPaid;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    headers = [
      'id',
      'transaction_date',
      'team_leader_name',
      'team_leader_email',
      'team_leader_phone',
      'amount',
      'currency',
      'status',
      'utr_number',
      'razorpay_payment_id',
      'payment_proof_link',
      'payment_method',
      'payer_vpa',
      'event_name',
      'team_name',
      'team_type',
      'team_size',
      'razorpay_order_id',
      'receipt_number',
      'user_id',
      'event_id',
      'team_id',
    ];

    values = [headers];
    records.forEach((record) => {
      const formatted = formatPaymentRecordForSheet(record);
      values.push(headers.map((h) => formatValueForSheet((formatted as any)[h])));
    });
  } else {
    // Determine headers (primary key first, then other fields alphabetically)
    if (records.length > 0) {
      const allKeys = new Set<string>();
      records.forEach((row) => {
        Object.keys(row).forEach((k) => allKeys.add(k));
      });

      const otherKeys = Array.from(allKeys)
        .filter((k) => k !== config.primaryKey)
        .sort();

      headers = [config.primaryKey, ...otherKeys];
    } else {
      // Empty table fallback: if we have known common columns or at least primaryKey
      headers = [config.primaryKey, 'created_at', 'updated_at'];
    }

    values = [headers];
    records.forEach((record) => {
      const rowValues = headers.map((header) => {
        return formatValueForSheet(record[header]);
      });
      values.push(rowValues);
    });
  }

  // If using Google Apps Script Web App alternative
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'BULK_SYNC',
        sheetName: config.sheetName,
        rows: values,
      }),
    });
    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`[SheetsSync] Apps Script error (${res.status}): ${errTxt}`);
    }
    const durationMs = Date.now() - startTime;
    return {
      table: tableName,
      sheetName: config.sheetName,
      rowsSynced: records.length,
      columnsCount: headers.length,
      durationMs,
      success: true,
    };
  }

  // 3. Clear existing values in tab
  const encodedSheetName = encodeURIComponent(config.sheetName);
  await sheetsRequest(`/values/${encodedSheetName}!A1:ZZZ:clear`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  // 4. Batch write all rows
  await sheetsRequest(`/values/${encodedSheetName}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({
      range: `${config.sheetName}!A1`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  // Format header row styling
  await formatSheetHeader(tabInfo.sheetId);

  const durationMs = Date.now() - startTime;
  return {
    table: tableName,
    sheetName: config.sheetName,
    rowsSynced: records.length,
    columnsCount: headers.length,
    durationMs,
    success: true,
  };
}

export async function syncAllTables(): Promise<{
  results: TableSyncResult[];
  totalRows: number;
  totalDurationMs: number;
  success: boolean;
}> {
  const overallStart = Date.now();
  const results: TableSyncResult[] = [];
  const tables = Object.keys(TABLE_CONFIG);

  for (const table of tables) {
    try {
      const result = await syncFullTable(table);
      results.push(result);
    } catch (err: any) {
      console.error(`[SheetsSync] Full sync failed for "${table}":`, err);
      results.push({
        table,
        sheetName: TABLE_CONFIG[table].sheetName,
        rowsSynced: 0,
        columnsCount: 0,
        durationMs: 0,
        success: false,
        error: err.message || 'Unknown sync failure',
      });
    }
  }

  const totalRows = results.reduce((acc, r) => acc + (r.rowsSynced || 0), 0);
  const totalDurationMs = Date.now() - overallStart;

  return {
    results,
    totalRows,
    totalDurationMs,
    success: results.every((r) => r.success),
  };
}

// ─── 7. REALTIME DATABASE WEBHOOK HANDLER (INSERT, UPDATE, DELETE) ───────────
export interface DatabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

export async function handleDatabaseWebhook(
  payload: DatabaseWebhookPayload
): Promise<{ success: boolean; action: string; table: string; message: string }> {
  const { type, table, record, old_record } = payload;
  const config = TABLE_CONFIG[table];

  if (!config) {
    return {
      success: true,
      action: 'IGNORED',
      table,
      message: `Table "${table}" is not configured in TABLE_CONFIG. Skipped.`,
    };
  }

  // If using Google Apps Script Web App alternative
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sheetName: config.sheetName,
        primaryKey: config.primaryKey,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return {
      success: json.success ?? true,
      action: payload.type,
      table,
      message: json.action ? `Synced ${json.action} via Apps Script` : 'Synced via Apps Script',
    };
  }

  const tabInfo = await ensureSheetTabExists(config.sheetName);
  const encodedSheetName = encodeURIComponent(config.sheetName);

  // 1. Fetch current sheet values to locate headers and primary key row index
  const sheetData = await sheetsRequest<any>(
    `/values/${encodedSheetName}!A1:ZZZ?majorDimension=ROWS`
  );

  const existingRows: string[][] = sheetData.values || [];
  let headers: string[] = existingRows[0] || [];

  // If tab has no headers yet, initialize headers
  const targetRecord = record || old_record || {};
  if (headers.length === 0) {
    const keys = Object.keys(targetRecord);
    headers = [
      config.primaryKey,
      ...keys.filter((k) => k !== config.primaryKey).sort(),
    ];
    await sheetsRequest(
      `/values/${encodedSheetName}!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          range: `${config.sheetName}!A1`,
          majorDimension: 'ROWS',
          values: [headers],
        }),
      }
    );
    await formatSheetHeader(tabInfo.sheetId);
  }

  // Find index of primary key column (typically column 0 / A)
  const pkColIdx = headers.indexOf(config.primaryKey);
  const targetPk = String(
    (record && record[config.primaryKey]) ??
      (old_record && old_record[config.primaryKey]) ??
      ''
  );

  if (!targetPk) {
    throw new Error(
      `[SheetsSync] Payload missing primary key "${config.primaryKey}" for table "${table}"`
    );
  }

  // ─── INSERT OPERATION ───────────────────────────────────────────────────────
  if (type === 'INSERT') {
    if (!record) throw new Error('[SheetsSync] INSERT payload missing record');

    // Check if new columns need to be added to headers
    const newKeys = Object.keys(record).filter((k) => !headers.includes(k));
    if (newKeys.length > 0) {
      headers.push(...newKeys);
      await sheetsRequest(
        `/values/${encodedSheetName}!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          body: JSON.stringify({
            range: `${config.sheetName}!A1`,
            majorDimension: 'ROWS',
            values: [headers],
          }),
        }
      );
    }

    const rowValues = headers.map((h) => formatValueForSheet(record[h]));

    await sheetsRequest(
      `/values/${encodedSheetName}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        body: JSON.stringify({
          range: `${config.sheetName}!A1`,
          majorDimension: 'ROWS',
          values: [rowValues],
        }),
      }
    );

    return {
      success: true,
      action: 'INSERT',
      table,
      message: `Appended record ${targetPk} to "${config.sheetName}"`,
    };
  }

  // ─── UPDATE OPERATION (IN-PLACE REPLACEMENT) ────────────────────────────────
  if (type === 'UPDATE') {
    if (!record) throw new Error('[SheetsSync] UPDATE payload missing record');

    // Look for existing row by primary key match in column pkColIdx
    let foundRowIndex = -1; // 1-based row index for Google Sheets A1 notation
    for (let r = 1; r < existingRows.length; r++) {
      const cellVal = existingRows[r][pkColIdx >= 0 ? pkColIdx : 0];
      if (String(cellVal).trim() === targetPk.trim()) {
        foundRowIndex = r + 1; // 1-based index
        break;
      }
    }

    const rowValues = headers.map((h) => formatValueForSheet(record[h]));

    if (foundRowIndex > 0) {
      // Update the existing row in-place
      await sheetsRequest(
        `/values/${encodedSheetName}!A${foundRowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          body: JSON.stringify({
            range: `${config.sheetName}!A${foundRowIndex}`,
            majorDimension: 'ROWS',
            values: [rowValues],
          }),
        }
      );

      return {
        success: true,
        action: 'UPDATE',
        table,
        message: `Updated row ${foundRowIndex} in "${config.sheetName}" for ID ${targetPk}`,
      };
    } else {
      // Record not found in sheet yet; append as fallback
      await sheetsRequest(
        `/values/${encodedSheetName}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          body: JSON.stringify({
            range: `${config.sheetName}!A1`,
            majorDimension: 'ROWS',
            values: [rowValues],
          }),
        }
      );

      return {
        success: true,
        action: 'UPDATE_INSERTED',
        table,
        message: `Row not found; appended record ${targetPk} to "${config.sheetName}"`,
      };
    }
  }

  // ─── DELETE OPERATION (REMOVE ROW DIMENSION) ────────────────────────────────
  if (type === 'DELETE') {
    let foundRow0Index = -1; // 0-based row index for deleteDimension API
    for (let r = 1; r < existingRows.length; r++) {
      const cellVal = existingRows[r][pkColIdx >= 0 ? pkColIdx : 0];
      if (String(cellVal).trim() === targetPk.trim()) {
        foundRow0Index = r; // 0-based
        break;
      }
    }

    if (foundRow0Index > 0) {
      await sheetsRequest(':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: tabInfo.sheetId,
                  dimension: 'ROWS',
                  startIndex: foundRow0Index,
                  endIndex: foundRow0Index + 1,
                },
              },
            },
          ],
        }),
      });

      return {
        success: true,
        action: 'DELETE',
        table,
        message: `Deleted row ${foundRow0Index + 1} from "${config.sheetName}" for ID ${targetPk}`,
      };
    }

    return {
      success: true,
      action: 'DELETE_SKIPPED',
      table,
      message: `Record ${targetPk} not found in "${config.sheetName}". Nothing to delete.`,
    };
  }

  return {
    success: false,
    action: 'UNKNOWN',
    table,
    message: `Unsupported event type: ${type}`,
  };
}

/**
 * Explicit helper to sync a completed payment record to the Payments tab
 */
export async function syncPaymentToGoogleSheets(payment: Record<string, any>): Promise<any> {
  try {
    const formatted = formatPaymentRecordForSheet(payment);

    // Provide both standard database keys and Title Case aliases
    // so any custom header configuration on the Google Sheet tab matches 100%
    const recordPayload: Record<string, any> = {
      ...formatted,
      'Transaction Date': formatted.transaction_date,
      'Participant Name': formatted.team_leader_name,
      'Email': formatted.team_leader_email,
      'Phone': formatted.team_leader_phone,
      'Amount': formatted.amount,
      'Status': formatted.status,
      'UTR Number': formatted.utr_number,
      'UTR / Bank Ref': formatted.utr_number,
      'Razorpay Payment ID': formatted.razorpay_payment_id,
      'Payment Proof': formatted.payment_proof_link,
      'Payment Proof Link': formatted.payment_proof_link,
      'Payment Method': formatted.payment_method,
      'UPI ID': formatted.payer_vpa,
      'Event Name': formatted.event_name,
      'Squad Name': formatted.team_name,
      'Order ID': formatted.razorpay_order_id,
      'Receipt Number': formatted.receipt_number,
    };

    return await handleDatabaseWebhook({
      type: 'UPDATE', // Upsert in Apps Script: updates if row exists, appends if new
      table: 'payments',
      schema: 'public',
      old_record: null,
      record: recordPayload,
    });
  } catch (err: any) {
    console.warn('[SheetsSync] Failed to sync payment to Google Sheets:', err?.message || err);
    return null;
  }
}
