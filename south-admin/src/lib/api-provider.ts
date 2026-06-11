/**
 * API Provider Integration Module
 * 
 * Handles testing API connections, executing orders via external APIs,
 * and managing API provider configurations stored in Firebase RTDB.
 * 
 * Since the app uses output: "export" (static export for Capacitor),
 * all API calls are made directly from the client side.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ─────────────────────────────────────────────────────────────

export interface ApiProviderConfig {
  id: string;
  name: string;           // Arabic display name
  baseUrl: string;        // API Base URL
  apiKey: string;         // API Key
  apiSecret?: string;     // API Secret (if needed)
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  bodyTemplate?: string;  // JSON template with placeholders like {{customerId}}, {{packageId}}
  responseFormat: 'json' | 'xml';
  fieldMappings?: {
    statusField: string;       // e.g. "data.status" or "status"
    successValue: string;      // e.g. "success" or "200" or "1"
    balanceField?: string;     // e.g. "data.balance"
    messageField?: string;     // e.g. "data.message" or "message"
    transactionIdField?: string; // e.g. "data.transactionId"
    errorCodeField?: string;   // e.g. "data.errorCode"
  };
  isActive: boolean;
  createdAt: string;
  // Category info for service screen
  sectionName?: string;    // Name for the section in the services screen (Arabic)
  sectionId?: string;      // Unique ID for the section
  sectionIcon?: string;    // Icon key for the section
}

export interface ApiTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;       // in milliseconds
  rawResponse?: string;       // raw response body
  parsedResponse?: any;       // parsed JSON/XML
  availableFields: string[];  // field paths found in response
  error?: string;
  mappedValues?: {
    status?: string;
    balance?: string;
    message?: string;
    transactionId?: string;
  };
}

export interface ApiOrderResult {
  success: boolean;
  transactionId?: string;
  message?: string;
  balance?: string;
  rawResponse?: any;
  error?: string;
}

// ─── Helper: Get nested value from object by dot path ──────────────────

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

// ─── Helper: Extract all field paths from an object ────────────────────

function extractFieldPaths(obj: any, prefix: string = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...extractFieldPaths(value, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

// ─── Helper: Replace template placeholders ─────────────────────────────

function replaceTemplatePlaceholders(
  template: string,
  data: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }
  return result;
}

// ─── Test API Connection ───────────────────────────────────────────────

export async function testApiConnection(
  config: Omit<ApiProviderConfig, 'id' | 'isActive' | 'createdAt'>
): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };
    
    // Add API key to headers if present
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-API-Key'] = config.apiKey;
    }
    
    // Build request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    };
    
    // Add body for POST requests
    if (config.method === 'POST' && config.bodyTemplate) {
      // Use test values for placeholders
      const testBody = replaceTemplatePlaceholders(config.bodyTemplate, {
        customerId: 'test_user_123',
        packageId: 'test_pkg_001',
        amount: '100',
        currency: 'YER',
        phone: '967770001234',
        apiSecret: config.apiSecret || '',
        apiKey: config.apiKey || '',
      });
      requestOptions.body = testBody;
    }
    
    const response = await fetch(config.baseUrl, requestOptions);
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    
    // Parse response based on format
    let parsedResponse: any = null;
    let availableFields: string[] = [];
    
    if (config.responseFormat === 'json') {
      try {
        parsedResponse = JSON.parse(responseText);
        availableFields = extractFieldPaths(parsedResponse);
      } catch {
        // Try to parse as XML if JSON fails
        parsedResponse = { raw: responseText };
        availableFields = ['raw'];
      }
    } else {
      // XML - store raw, extract basic info
      parsedResponse = { raw: responseText, format: 'xml' };
      availableFields = ['raw', 'format'];
    }
    
    // Extract mapped values if field mappings are set
    const mappedValues: ApiTestResult['mappedValues'] = {};
    if (config.fieldMappings) {
      if (config.fieldMappings.statusField) {
        mappedValues.status = String(getNestedValue(parsedResponse, config.fieldMappings.statusField) ?? '');
      }
      if (config.fieldMappings.balanceField) {
        mappedValues.balance = String(getNestedValue(parsedResponse, config.fieldMappings.balanceField) ?? '');
      }
      if (config.fieldMappings.messageField) {
        mappedValues.message = String(getNestedValue(parsedResponse, config.fieldMappings.messageField) ?? '');
      }
      if (config.fieldMappings.transactionIdField) {
        mappedValues.transactionId = String(getNestedValue(parsedResponse, config.fieldMappings.transactionIdField) ?? '');
      }
    }
    
    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      rawResponse: responseText,
      parsedResponse,
      availableFields,
      mappedValues: Object.keys(mappedValues).length > 0 ? mappedValues : undefined,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message || 'Unknown error occurred',
      availableFields: [],
    };
  }
}

// ─── Execute Order via API ─────────────────────────────────────────────

export async function executeApiOrder(
  config: ApiProviderConfig,
  orderData: {
    customerId: string;
    packageId: string;
    amount: number;
    currency: string;
    phone?: string;
    playerName?: string;
  }
): Promise<ApiOrderResult> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };
    
    // Add API key
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-API-Key'] = config.apiKey;
    }
    
    // Build request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    };
    
    // Add body for POST requests
    if (config.method === 'POST' && config.bodyTemplate) {
      const body = replaceTemplatePlaceholders(config.bodyTemplate, {
        customerId: orderData.customerId,
        packageId: orderData.packageId,
        amount: orderData.amount,
        currency: orderData.currency,
        phone: orderData.phone || '',
        playerName: orderData.playerName || '',
        apiSecret: config.apiSecret || '',
        apiKey: config.apiKey || '',
      });
      requestOptions.body = body;
    } else if (config.method === 'GET') {
      // For GET, replace placeholders in URL
      const url = replaceTemplatePlaceholders(config.baseUrl, {
        customerId: orderData.customerId,
        packageId: orderData.packageId,
        amount: String(orderData.amount),
        currency: orderData.currency,
        phone: orderData.phone || '',
        playerName: orderData.playerName || '',
      });
      // Override the URL
      const response = await fetch(url, requestOptions);
      return await processApiResponse(response, config);
    }
    
    const response = await fetch(config.baseUrl, requestOptions);
    return await processApiResponse(response, config);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'API call failed',
    };
  }
}

// ─── Process API Response ──────────────────────────────────────────────

async function processApiResponse(
  response: Response,
  config: ApiProviderConfig
): Promise<ApiOrderResult> {
  const responseText = await response.text();
  
  let parsed: any = null;
  try {
    if (config.responseFormat === 'json') {
      parsed = JSON.parse(responseText);
    } else {
      parsed = { raw: responseText };
    }
  } catch {
    parsed = { raw: responseText };
  }
  
  // Check if the response indicates success based on field mappings
  const mappings = config.fieldMappings;
  if (mappings) {
    const statusValue = String(getNestedValue(parsed, mappings.statusField) ?? '');
    const isSuccess = statusValue === mappings.successValue ||
      statusValue.toLowerCase() === mappings.successValue.toLowerCase();
    
    const message = mappings.messageField
      ? String(getNestedValue(parsed, mappings.messageField) ?? '')
      : '';
    const transactionId = mappings.transactionIdField
      ? String(getNestedValue(parsed, mappings.transactionIdField) ?? '')
      : '';
    const balance = mappings.balanceField
      ? String(getNestedValue(parsed, mappings.balanceField) ?? '')
      : '';
    
    return {
      success: isSuccess,
      transactionId,
      message,
      balance,
      rawResponse: parsed,
    };
  }
  
  // No field mappings - treat HTTP success as success
  return {
    success: response.ok,
    message: response.ok ? 'Request succeeded' : `HTTP ${response.status}`,
    rawResponse: parsed,
  };
}

// ─── Generate unique ID ────────────────────────────────────────────────

export function generateApiProviderId(): string {
  return `api-provider-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
