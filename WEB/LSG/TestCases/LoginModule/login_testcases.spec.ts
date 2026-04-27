import { test, expect } from '@playwright/test';
import { LoginLocators } from '../../PageObjects/LoginModule/login_locators';
import { getExcelData } from '../../Resources/LoginModule/login_resources';
import path from 'path';
import { time } from 'console';

test.describe('LSG Login Module - Excel Data Driven', () => {
  
  // Define variables here
  let testData: any[] = [];
  
  // Note: Based on your sidebar, the file is "EmailDataList.xlsx - Sheet1.csv"
  // If you renamed it to EmailData.xlsx, ensure this string is exact.
  const excelFilePath = path.resolve(__dirname, '../../TestData/EmailDataList.xlsx');

  test.beforeAll(() => {
    try {
      testData = getExcelData(excelFilePath);
    } catch (error) {
      console.error("FAILED TO LOAD EXCEL DATA. Tests will fail. Error:", error);
    }
  });

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([{ name: 'allowCookie', value: '1', domain: 'stg-sg.sportz.io', path: '/' }]);
    await page.goto('https://stg-sg.sportz.io', { timeout: 60000 });
    await page.locator(LoginLocators.loginEntryBtn).click();

  });

  // P1: Using data for Adam (ID 2 in your Excel)
  test('P1: Valid Email Login', async ({ page }) => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == '2');

    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    await page.locator(LoginLocators.submitBtn).click();
    
    await expect(page.locator(LoginLocators.userProfileCard)).toBeVisible({ timeout: 30000 });
  });

  // P2: Validation with Empty Email (Pass password from Excel, but leave email empty)
  test('P2: Validation with Empty Email', async ({ page }) => {
    const userData = testData.find((row: any) => row.id == '2'); // Using the first user in the list

    await page.locator(LoginLocators.emailInput).fill(''); // Explicitly empty
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
  });

  // P3: Validation with Empty Password (Pass email from Excel, leave password empty)
  test('P3: Validation with Empty Password', async ({ page }) => {
    const userData = testData.find((row: any) => row.id == '2');

    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).fill(''); // Explicitly empty
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // P4: Validation with both empty (No data needed from Excel, but logic remains consistent)
  test('P4: Validation with both EMail and Password empty', async ({ page }) => {
    await page.locator(LoginLocators.submitBtn).click();
    
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // P5: Validation with invalid credentials to check error handling 
  test('P5: Validation with invalid credentials', async ({ page }) => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == '2');

    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).fill('WrongPassword123'); // Intentionally wrong password
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.invalidCredentialsError)).toBeVisible({ timeout: 30000 });

    await page.reload({ timeout: 60000 }); // Wait for the page to reload after failed login

    await page.locator(LoginLocators.emailInput).fill('email@MediaList.com');
    await page.locator(LoginLocators.passwordInput).fill(userData.password); // Intentionally wrong password
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.invalidCredentialsError)).toBeVisible({ timeout: 30000 });
  });
});