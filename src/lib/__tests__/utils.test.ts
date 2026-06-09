import {
  formatBalance,
  formatNumber,
  generateUserId,
  generateReference,
  currencySymbols,
  currencyNames,
  currencyBadgeColors,
  timeAgo,
  transactionTypeLabels,
  transactionTypeColors,
  defaultExchangeRates,
  governorates,
  cardTypes,
} from '@/lib/utils';

describe('formatBalance', () => {
  it('should format a number with Arabic locale', () => {
    const result = formatBalance(1000, 'YER');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format zero correctly', () => {
    const result = formatBalance(0, 'YER');
    expect(result).toBe('٠');
  });

  it('should format large numbers with grouping', () => {
    const result = formatBalance(1000000, 'YER');
    expect(result).toBeTruthy();
    // Arabic locale uses Arabic numerals and grouping
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format decimal numbers', () => {
    const result = formatBalance(1500.75, 'SAR');
    expect(result).toBeTruthy();
  });
});

describe('formatNumber', () => {
  it('should format a number with Arabic locale', () => {
    const result = formatNumber(5000);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format zero', () => {
    const result = formatNumber(0);
    expect(result).toBe('٠');
  });

  it('should format negative numbers', () => {
    const result = formatNumber(-100);
    expect(result).toBeTruthy();
    expect(result).toContain('١');
  });
});

describe('currency helpers', () => {
  it('currencySymbols should have correct keys', () => {
    expect(currencySymbols).toHaveProperty('YER', 'ر.ي');
    expect(currencySymbols).toHaveProperty('SAR', 'ر.س');
    expect(currencySymbols).toHaveProperty('USD', '$');
  });

  it('currencyNames should have Arabic names', () => {
    expect(currencyNames).toHaveProperty('YER', 'الريال اليمني');
    expect(currencyNames).toHaveProperty('SAR', 'الريال السعودي');
    expect(currencyNames).toHaveProperty('USD', 'الدولار الأمريكي');
  });

  it('currencyBadgeColors should have valid hex colors', () => {
    expect(currencyBadgeColors.YER).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(currencyBadgeColors.SAR).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(currencyBadgeColors.USD).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should have exactly 3 currencies', () => {
    expect(Object.keys(currencySymbols)).toHaveLength(3);
    expect(Object.keys(currencyNames)).toHaveLength(3);
    expect(Object.keys(currencyBadgeColors)).toHaveLength(3);
  });
});

describe('timeAgo', () => {
  it('should return "الآن" for dates less than 60 seconds ago', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('الآن');
  });

  it('should return minutes for dates less than an hour ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = timeAgo(fiveMinAgo);
    expect(result).toContain('دقيقة');
    // Should contain a number (5 in Arabic or Western numeral)
    expect(result).toMatch(/\d|٥/);
  });

  it('should return hours for dates less than a day ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const result = timeAgo(threeHoursAgo);
    expect(result).toContain('ساعة');
  });

  it('should return days for dates less than a week ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    const result = timeAgo(twoDaysAgo);
    expect(result).toContain('يوم');
  });

  it('should return weeks for dates less than a month ago', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
    const result = timeAgo(twoWeeksAgo);
    expect(result).toContain('أسبوع');
  });

  it('should return formatted date for very old dates', () => {
    const oldDate = new Date('2020-01-01').toISOString();
    const result = timeAgo(oldDate);
    expect(result).toBeTruthy();
    // Should be a date string, not relative time
    expect(result).not.toBe('الآن');
  });

  it('should handle future dates gracefully', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const result = timeAgo(future);
    expect(result).toBeTruthy();
  });
});

describe('generateUserId', () => {
  it('should generate a 6-digit ID starting with "10"', () => {
    const id = generateUserId();
    expect(id).toMatch(/^10\d{4}$/);
    expect(id.length).toBe(6);
  });

  it('should generate unique IDs on multiple calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateUserId()));
    // At least most should be unique (very unlikely collision with 9000 possibilities)
    expect(ids.size).toBeGreaterThan(40);
  });
});

describe('generateReference', () => {
  it('should generate a reference starting with "JN-"', () => {
    const ref = generateReference();
    expect(ref).toMatch(/^JN-/);
  });

  it('should generate an 11-character reference (JN- + 8 chars)', () => {
    const ref = generateReference();
    expect(ref.length).toBe(11);
  });

  it('should generate unique references', () => {
    const refs = new Set(Array.from({ length: 50 }, () => generateReference()));
    expect(refs.size).toBe(50);
  });
});

describe('phone validation via governorates and cardTypes', () => {
  it('governorates should be a non-empty array of Arabic strings', () => {
    expect(Array.isArray(governorates)).toBe(true);
    expect(governorates.length).toBeGreaterThan(0);
    governorates.forEach(g => {
      expect(typeof g).toBe('string');
      expect(g.length).toBeGreaterThan(0);
    });
  });

  it('cardTypes should be a non-empty array', () => {
    expect(Array.isArray(cardTypes)).toBe(true);
    expect(cardTypes.length).toBe(3);
  });
});

describe('transactionTypeLabels', () => {
  it('should have labels for all transaction types', () => {
    const types = ['transfer', 'deposit', 'withdraw', 'payment', 'recharge', 'bill', 'purchase', 'order', 'refund'];
    types.forEach(type => {
      expect(transactionTypeLabels).toHaveProperty(type);
      expect(typeof transactionTypeLabels[type as keyof typeof transactionTypeLabels]).toBe('string');
    });
  });
});

describe('defaultExchangeRates', () => {
  it('should have YER as base (1)', () => {
    expect(defaultExchangeRates.YER).toBe(1);
  });

  it('should have reasonable exchange rates', () => {
    expect(defaultExchangeRates.SAR).toBe(410);
    expect(defaultExchangeRates.USD).toBe(1550);
  });
});

describe('transactionTypeColors', () => {
  it('should have hex color for each type', () => {
    Object.values(transactionTypeColors).forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
