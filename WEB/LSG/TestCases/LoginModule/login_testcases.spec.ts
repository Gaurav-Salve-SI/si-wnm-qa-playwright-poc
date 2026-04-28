import { test, expect, Page } from '@playwright/test';
import { LoginLocators } from '../../PageObjects/LoginModule/login_locators';
import { getExcelData } from '../../Resources/LoginModule/login_resources';
import path from 'path';

// Force serial mode
test.describe.configure({ mode: 'serial' });

test.describe('LSG Login Module - Excel Data Driven', () => {
  let testData: any[] = [];
  let page: Page; 
  let context: any;
  const excelFilePath = path.resolve(__dirname, '../../TestData/EmailDataList.xlsx');

  test.beforeAll(async ({ browser }) => {
    try {
      testData = getExcelData(excelFilePath);
    } catch (error) {
      console.error("FAILED TO LOAD EXCEL DATA:", error);
    }

    // Initialize shared context and page
    context = await browser.newContext();
    await context.addCookies([{ name: 'allowCookie', value: '1', domain: 'stg-sg.sportz.io', path: '/' }]);
    page = await context.newPage();
    
    await page.goto('https://stg-sg.sportz.io', { timeout: 60000 });
    await page.locator(LoginLocators.loginEntryBtn).click();
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // P1: Validation with Empty Email (Pass password from Excel, but leave email empty)
  test('P1: Validation with Empty Email', async () => {
    const userData = testData.find((row: any) => row.id == '2'); // Using the first user in the list

    await page.locator(LoginLocators.emailInput).fill(''); // Explicitly empty
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
  });

  // P2: Validation with Empty Password (Pass email from Excel, leave password empty)
  test('P2: Validation with Empty Password', async () => {
    const userData = testData.find((row: any) => row.id == '2');

    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).fill(''); // Explicitly empty
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // P3: Validation with both empty (No data needed from Excel, but logic remains consistent)
  test('P3: Validation with both EMail and Password empty', async () => {
    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.submitBtn).click();
    
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // P4: Validation with invalid credentials to check error handling 
  test('P4: Validation with invalid credentials', async () => {
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

  // P5: Using data for Adam (ID 2 in your Excel)
  test('P5: Valid Email Login', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == '2');

    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    await page.locator(LoginLocators.submitBtn).click();
    
    await expect(page.locator(LoginLocators.userProfileCard)).toBeVisible({ timeout: 30000 });
  });

});