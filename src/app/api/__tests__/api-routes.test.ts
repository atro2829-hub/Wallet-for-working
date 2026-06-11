/**
 * Integration tests for API routes
 * These tests use fetch against the running dev server
 */

const BASE_URL = 'http://localhost:3000';

// Helper to make API requests using Node's native fetch
async function apiRequest(path: string, options: { method?: string; body?: string } = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body,
  });
  const data = await response.json();
  return { status: response.status, data };
}

// Generate unique test data
function uniqueEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

describe('/api/auth/login', () => {
  it('should return 400 when email and password are missing', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return 404 for non-existent email', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent_test_99999@example.com',
        password: 'test123',
      }),
    });
    expect(status).toBe(404);
    expect(data.error).toContain('غير مسجل');
  });

  it('should return 401 for wrong password', async () => {
    // First register a user
    const testEmail = uniqueEmail();
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'correctpassword',
        name: 'Test User',
      }),
    });

    // Then try logging in with wrong password
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongpassword',
      }),
    });
    expect(status).toBe(401);
    expect(data.error).toContain('غير صحيحة');
  });

  it('should successfully login with correct credentials', async () => {
    // Register a user first
    const testEmail = uniqueEmail();
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123',
        name: 'Login Test User',
      }),
    });

    // Login with correct credentials
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123',
      }),
    });
    expect(status).toBe(200);
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe(testEmail);
    expect(data.message).toContain('نجاح');
  });
});

describe('/api/auth/register', () => {
  it('should return 400 when email is missing', async () => {
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        password: 'test123',
        name: 'Test',
      }),
    });
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return 400 when password is missing', async () => {
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail(),
        name: 'Test',
      }),
    });
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return 409 when email already exists', async () => {
    const testEmail = uniqueEmail();
    // Register first time
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'test123',
        name: 'First User',
      }),
    });

    // Try registering again with same email
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'test456',
        name: 'Second User',
      }),
    });
    expect(status).toBe(409);
    expect(data.error).toContain('مسجل مسبقاً');
  });

  it('should successfully register a new user', async () => {
    const testEmail = uniqueEmail();
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123',
        name: 'New Test User',
        phone: '+967770123456',
      }),
    });
    expect(status).toBe(200);
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.name).toBe('New Test User');
    expect(data.user.userId).toMatch(/^10\d{4}$/);
    expect(data.message).toContain('نجاح');
  });
});

describe('/api/transfer', () => {
  let senderId: string;
  let receiverUserId: string;
  const senderEmail = uniqueEmail();
  const receiverEmail = uniqueEmail();

  beforeAll(async () => {
    // Register sender
    const senderRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: senderEmail,
        password: 'test123',
        name: 'Sender User',
      }),
    });
    senderId = senderRes.data.user.id;

    // Register receiver
    const receiverRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: receiverEmail,
        password: 'test123',
        name: 'Receiver User',
      }),
    });
    receiverUserId = receiverRes.data.user.userId;
  });

  it('should return 400 when required fields are missing', async () => {
    const { status, data } = await apiRequest('/api/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: senderId,
        amount: 100,
        // missing currency
      }),
    });
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return 400 for insufficient balance', async () => {
    const { status, data } = await apiRequest('/api/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: senderId,
        toUserId: receiverUserId,
        amount: 999999,
        currency: 'YER',
      }),
    });
    expect(status).toBe(400);
    expect(data.error).toContain('رصيد غير كافي');
  });

  it('should return 400 for zero or negative amount', async () => {
    const { status, data } = await apiRequest('/api/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: senderId,
        toUserId: receiverUserId,
        amount: -50,
        currency: 'YER',
      }),
    });
    expect(status).toBe(400);
    expect(data.error).toContain('غير صالح');
  });
});

describe('/api/transactions', () => {
  it('should return 400 when userId is missing', async () => {
    const { status, data } = await apiRequest('/api/transactions');
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return transactions array for valid userId', async () => {
    // Register a user to get an ID
    const regRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail(),
        password: 'test123',
        name: 'Tx Test User',
      }),
    });
    const userId = regRes.data.user.id;

    const { status, data } = await apiRequest(`/api/transactions?userId=${userId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it('should return empty array for user with no transactions', async () => {
    const regRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail(),
        password: 'test123',
        name: 'No Tx User',
      }),
    });
    const userId = regRes.data.user.id;

    const { status, data } = await apiRequest(`/api/transactions?userId=${userId}`);
    expect(status).toBe(200);
    expect(data.transactions).toHaveLength(0);
  });
});
