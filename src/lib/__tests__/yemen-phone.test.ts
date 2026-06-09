import {
  isValidYemeniPhone,
  getProviderFromPhone,
  formatYemeniPhone,
  cleanYemeniPhone,
  getLocalNumber,
  isValidPartialYemeniPhone,
  getPhoneValidationMessage,
  getProviderInfoFromPhone,
  yemenProviders,
} from '@/lib/yemen-phone';

describe('isValidYemeniPhone', () => {
  it('should return false for empty string', () => {
    expect(isValidYemeniPhone('')).toBe(false);
  });

  it('should validate +967 format (Yemen Mobile)', () => {
    expect(isValidYemeniPhone('+967770123456')).toBe(true);
  });

  it('should validate 967 format without plus', () => {
    expect(isValidYemeniPhone('967770123456')).toBe(true);
  });

  it('should validate local 9-digit format starting with 7', () => {
    expect(isValidYemeniPhone('770123456')).toBe(true);
  });

  it('should validate 0-prefix format', () => {
    expect(isValidYemeniPhone('0770123456')).toBe(true);
  });

  it('should reject numbers not starting with 7', () => {
    expect(isValidYemeniPhone('+967612345678')).toBe(false);
  });

  it('should reject numbers with wrong length', () => {
    expect(isValidYemeniPhone('+96777012345')).toBe(false); // too short
    expect(isValidYemeniPhone('+9677701234567')).toBe(false); // too long
  });

  it('should accept numbers with spaces and dashes', () => {
    expect(isValidYemeniPhone('+967 770 123 456')).toBe(true);
    expect(isValidYemeniPhone('770-123-456')).toBe(true);
  });

  it('should validate YO prefix (774)', () => {
    expect(isValidYemeniPhone('+967774123456')).toBe(true);
  });

  it('should validate WA prefix (779)', () => {
    expect(isValidYemeniPhone('+967779123456')).toBe(true);
  });

  it('should reject invalid prefixes not starting with 77', () => {
    expect(isValidYemeniPhone('+967781123456')).toBe(false);
  });
});

describe('getProviderFromPhone', () => {
  it('should return empty string for empty input', () => {
    expect(getProviderFromPhone('')).toBe('');
  });

  it('should detect Yemen Mobile for 770 prefix', () => {
    expect(getProviderFromPhone('+967770123456')).toBe('yemen-mobile');
  });

  it('should detect Yemen Mobile for 771 prefix', () => {
    expect(getProviderFromPhone('+967771123456')).toBe('yemen-mobile');
  });

  it('should detect Yemen Mobile for 772 prefix', () => {
    expect(getProviderFromPhone('+967772123456')).toBe('yemen-mobile');
  });

  it('should detect Yemen Mobile for 773 prefix', () => {
    expect(getProviderFromPhone('+967773123456')).toBe('yemen-mobile');
  });

  it('should detect YO for 774 prefix', () => {
    expect(getProviderFromPhone('+967774123456')).toBe('yo');
  });

  it('should detect YO for 775 prefix', () => {
    expect(getProviderFromPhone('+967775123456')).toBe('yo');
  });

  it('should detect YO for 776 prefix', () => {
    expect(getProviderFromPhone('+967776123456')).toBe('yo');
  });

  it('should detect Yemen Mobile for 777 prefix', () => {
    expect(getProviderFromPhone('+967777123456')).toBe('yemen-mobile');
  });

  it('should detect Yemen Mobile for 778 prefix', () => {
    expect(getProviderFromPhone('+967778123456')).toBe('yemen-mobile');
  });

  it('should detect Y for 779 prefix', () => {
    expect(getProviderFromPhone('+967779123456')).toBe('y');
  });

  it('should work with local format', () => {
    expect(getProviderFromPhone('779123456')).toBe('y');
  });

  it('should work with 0-prefix format', () => {
    expect(getProviderFromPhone('0770123456')).toBe('yemen-mobile');
  });
});

describe('formatYemeniPhone', () => {
  it('should return empty string for empty input', () => {
    expect(formatYemeniPhone('')).toBe('');
  });

  it('should format +967 format to +967 XXX XXX XXX', () => {
    expect(formatYemeniPhone('+967770123456')).toBe('+967 770 123 456');
  });

  it('should format local 9-digit format', () => {
    expect(formatYemeniPhone('770123456')).toBe('+967 770 123 456');
  });

  it('should format 0-prefix format', () => {
    expect(formatYemeniPhone('0770123456')).toBe('+967 770 123 456');
  });

  it('should return original input for invalid numbers', () => {
    expect(formatYemeniPhone('123')).toBe('123');
  });

  it('should format 967 format without plus', () => {
    expect(formatYemeniPhone('967770123456')).toBe('+967 770 123 456');
  });
});

describe('cleanYemeniPhone', () => {
  it('should return empty string for empty input', () => {
    expect(cleanYemeniPhone('')).toBe('');
  });

  it('should clean +967 format to +967XXXXXXXXX', () => {
    expect(cleanYemeniPhone('+967770123456')).toBe('+967770123456');
  });

  it('should clean local format to +967XXXXXXXXX', () => {
    expect(cleanYemeniPhone('770123456')).toBe('+967770123456');
  });

  it('should clean 0-prefix format', () => {
    expect(cleanYemeniPhone('0770123456')).toBe('+967770123456');
  });

  it('should strip spaces and dashes', () => {
    expect(cleanYemeniPhone('+967 770-123 456')).toBe('+967770123456');
  });
});

describe('getLocalNumber', () => {
  it('should extract local number from +967 format', () => {
    expect(getLocalNumber('+967770123456')).toBe('770123456');
  });

  it('should extract local number from 967 format', () => {
    expect(getLocalNumber('967770123456')).toBe('770123456');
  });

  it('should extract local number from 0-prefix', () => {
    expect(getLocalNumber('0770123456')).toBe('770123456');
  });

  it('should return as-is for local format', () => {
    expect(getLocalNumber('770123456')).toBe('770123456');
  });

  it('should return empty string for empty input', () => {
    expect(getLocalNumber('')).toBe('');
  });
});

describe('isValidPartialYemeniPhone', () => {
  it('should accept empty string', () => {
    expect(isValidPartialYemeniPhone('')).toBe(true);
  });

  it('should accept numbers starting with 7', () => {
    expect(isValidPartialYemeniPhone('7')).toBe(true);
    expect(isValidPartialYemeniPhone('77')).toBe(true);
    expect(isValidPartialYemeniPhone('770')).toBe(true);
  });

  it('should reject numbers not starting with 7', () => {
    expect(isValidPartialYemeniPhone('6')).toBe(false);
    expect(isValidPartialYemeniPhone('123')).toBe(false);
  });

  it('should reject numbers longer than 9 digits', () => {
    expect(isValidPartialYemeniPhone('7701234567')).toBe(false);
  });

  it('should accept exactly 9 digits starting with 7', () => {
    expect(isValidPartialYemeniPhone('770123456')).toBe(true);
  });
});

describe('yemenProviders', () => {
  it('should have 4 providers', () => {
    expect(yemenProviders).toHaveLength(4);
  });

  it('each provider should have required fields', () => {
    yemenProviders.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('nameEn');
      expect(p).toHaveProperty('color');
      expect(p).toHaveProperty('prefixes');
      expect(Array.isArray(p.prefixes)).toBe(true);
    });
  });
});

describe('getProviderInfoFromPhone', () => {
  it('should return provider object for Yemen Mobile number', () => {
    const provider = getProviderInfoFromPhone('+967770123456');
    expect(provider).not.toBeNull();
    expect(provider?.id).toBe('yemen-mobile');
  });

  it('should return provider object for YO number', () => {
    const provider = getProviderInfoFromPhone('+967774123456');
    expect(provider).not.toBeNull();
    expect(provider?.id).toBe('yo');
  });

  it('should return null for invalid phone', () => {
    expect(getProviderInfoFromPhone('')).toBeNull();
    expect(getProviderInfoFromPhone('12345')).toBeNull();
  });
});

describe('getPhoneValidationMessage', () => {
  it('should return empty string for empty input', () => {
    expect(getPhoneValidationMessage('')).toBe('');
  });

  it('should return error for non-7 start', () => {
    expect(getPhoneValidationMessage('612345678')).toContain('7');
  });

  it('should return success for valid Yemen Mobile number', () => {
    const msg = getPhoneValidationMessage('+967770123456');
    expect(msg).toContain('يمن موبايل');
    expect(msg).toContain('صحيح');
  });

  it('should indicate remaining digits for partial input', () => {
    const msg = getPhoneValidationMessage('770');
    expect(msg).toContain('أرقام أخرى');
  });
});
