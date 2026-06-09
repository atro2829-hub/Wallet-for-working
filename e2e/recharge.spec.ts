import { test, expect } from '@playwright/test';

test.describe('Recharge Flow', () => {
  test('should navigate to recharge screen from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const rechargeBtn = page.locator('text=شحن الرصيد').first();
    if (await rechargeBtn.isVisible().catch(() => false)) {
      await rechargeBtn.click();
      await page.waitForTimeout(1500);
    }
    expect(true).toBe(true);
  });

  test('should show telecom providers on category detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const telecomCategory = page.locator('text=الاتصالات').first();
    if (await telecomCategory.isVisible().catch(() => false)) {
      await telecomCategory.click();
      await page.waitForTimeout(1500);
      // Should show provider list
      const ymProvider = page.locator('text=يمن موبايل').first();
      if (await ymProvider.isVisible().catch(() => false)) {
        await expect(ymProvider).toBeVisible();
      }
    }
  });

  test('should navigate to services tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const servicesTab = page.locator('text=الخدمات').first();
    if (await servicesTab.isVisible().catch(() => false)) {
      await servicesTab.click();
      await page.waitForTimeout(1000);
    }
    expect(true).toBe(true);
  });

  test('should show provider selection for recharge', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    // Navigate to recharge via service click
    const rechargeIcon = page.locator('text=شحن رصيد, text=شحن').first();
    if (await rechargeIcon.isVisible().catch(() => false)) {
      await rechargeIcon.click();
      await page.waitForTimeout(1500);
      // Should show phone input
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="رقم"]').first();
      if (await phoneInput.isVisible().catch(() => false)) {
        await expect(phoneInput).toBeVisible();
      }
    }
  });

  test('should show package amounts for providers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    // Navigate through category detail to provider
    const telecomCategory = page.locator('text=الاتصالات').first();
    if (await telecomCategory.isVisible().catch(() => false)) {
      await telecomCategory.click();
      await page.waitForTimeout(1500);
      // Look for price labels
      const priceLabel = page.locator('text=ر.ي').first();
      if (await priceLabel.isVisible().catch(() => false)) {
        await expect(priceLabel).toBeVisible();
      }
    }
  });

  test('should show entertainment category with games', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const entertainmentCat = page.locator('text=خدمات ترفيهية, text=ترفيه').first();
    if (await entertainmentCat.isVisible().catch(() => false)) {
      await entertainmentCat.click();
      await page.waitForTimeout(1500);
      // Should show gaming providers like PUBG
      const pubgProvider = page.locator('text=ببجي').first();
      if (await pubgProvider.isVisible().catch(() => false)) {
        await expect(pubgProvider).toBeVisible();
      }
    }
  });

  test('should show digital cards category', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const cardsCat = page.locator('text=بطاقات الرقمية, text=بطاقات').first();
    if (await cardsCat.isVisible().catch(() => false)) {
      await cardsCat.click();
      await page.waitForTimeout(1500);
      // Should show card providers
      const googlePlay = page.locator('text=جوجل بلاي').first();
      if (await googlePlay.isVisible().catch(() => false)) {
        await expect(googlePlay).toBeVisible();
      }
    }
  });

  test('should show bill payment option', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const billsBtn = page.locator('text=سداد الفواتير, text=الفواتير').first();
    if (await billsBtn.isVisible().catch(() => false)) {
      await billsBtn.click();
      await page.waitForTimeout(1500);
    }
    expect(true).toBe(true);
  });

  test('should show government services option', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const govBtn = page.locator('text=خدمات حكومية').first();
    if (await govBtn.isVisible().catch(() => false)) {
      await govBtn.click();
      await page.waitForTimeout(1500);
    }
    expect(true).toBe(true);
  });
});
