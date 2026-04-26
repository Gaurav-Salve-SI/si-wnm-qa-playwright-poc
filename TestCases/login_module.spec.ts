import { test, expect } from '@playwright/test';
import { time } from 'node:console';

test.describe('LSG Login Module - Positive & Negative Flows', () => 
{
  
  test.beforeEach(async ({ page , context }) => 
  {

    await context.addCookies
    ([
      {
        name: 'allowCookie',   // 👈 update this
        value: '1',
        domain: 'stg-sg.sportz.io',
        path: '/',
        httpOnly: false,
        secure: false,
      }
    ]);

    await page.goto('https://stg-sg.sportz.io', {
    waitUntil: 'networkidle'
    });

    const cookieAccept = page.locator('#cookie-policy-btn');

    if (await cookieAccept.isVisible().catch(() => false)) {
      await expect(cookieAccept).toBeEnabled()
      await cookieAccept.click();
    }

    const loginBtn = page.locator('div.login-wrap > button');
    await loginBtn.waitFor({ state: 'visible' });

    await loginBtn.click();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  /** * POSITIVE TEST CASES */

  test('P1: Valid Email Login', async ({ page }) => {
    // Locator based on name attribute found in HTML
    await page.locator('input#loginEmail').fill('adam.si.qa.01@gmail.com');
    await page.locator('input#loginPassword').fill('Sportz@2022');
    
    // The button text in HTML is "LOGIN"
    await page.locator('button.btn-site.btn-login').click();
    
    // Successful login usually shows the user profile or logout button
    await expect(page.locator('div.user-card-info')).toBeVisible({ timeout: 30000 }); // Wait up to 5 seconds for the user info to appear
  });

  test('P2: Password Visibility Toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill('Secret123');
    
    // Based on common SI patterns, the toggle is often an '.icon-eye' or similar inside the password wrapper
    const toggle = page.locator('.si-show-password'); 
    await toggle.click();
    
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  /** * NEGATIVE TEST CASES */

  test('N1: Invalid Email Format', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-email-format');
    await page.keyboard.press('Tab');
    
    // HTML uses <span> with class "errordiv" for validation messages
    const error = page.locator('.errordiv');
    await expect(error).toBeVisible();
  });

  test('N2: Unregistered User Login', async ({ page }) => {
    await page.locator('input[name="email"]').fill('notregistered@test.com');
    await page.locator('input[name="password"]').fill('AnyPass123!');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Global errors usually appear in a specific message div
    await expect(page.locator('.global-msg-div')).toBeVisible();
  });

  test('N3: Incorrect Password', async ({ page }) => {
    await page.locator('input[name="email"]').fill('adam.si.qa.01@gmail.com');
    await page.locator('input[name="password"]').fill('WrongPassword123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.locator('.global-msg-div')).toContainText(/invalid|incorrect/i);
  });

  test('N4: Empty Fields Validation', async ({ page }) => {
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Check if the required attribute or the error div is triggered
    const error = page.locator('.errordiv').first();
    await expect(error).toBeVisible();
  });

  test('N5: SQL Injection Prevention', async ({ page }) => {
    await page.locator('input[name="email"]').fill("' OR 1=1 --");
    await page.locator('input[name="password"]').fill('anything');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Check that we didn't bypass authentication
    await expect(page.locator('.si-user-name')).not.toBeVisible();
  });

  test('N6: Brute Force Protection', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('input[name="email"]').fill('adam.si.qa.01@gmail.com');
      await page.locator('input[name="password"]').fill(`WrongPass${i}`);
      await page.getByRole('button', { name: 'LOGIN' }).click();
      await page.waitForTimeout(500); // Small delay to let the UI update
    }
    // Verify blocking message or captcha presence
    await expect(page.locator('text=/too many|captcha/i')).toBeVisible();
  });

  test('N7: InValid Mobile Login', async ({ page }) => {
    // Using the specific selector you provided which matches the HTML span structure
    await page.locator('input[name="email"]').fill('9876543210');
    await page.locator('input[name="password"]').fill('Sportz@2022');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.locator('span.errordiv')).toBeVisible();
  });

});