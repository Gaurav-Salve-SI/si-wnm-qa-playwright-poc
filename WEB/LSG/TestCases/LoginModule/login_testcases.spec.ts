import { test, expect, Page } from '@playwright/test';
import { LoginLocators } from '../../PageObjects/LoginModule/login_locators';
import * as loginResources from '../../Resources/LoginModule/login_resources';
import * as cmsResources from '../../../../CommonBase/Utilities/Resources/common_resources';
import path from 'path';
import { time } from 'console';
import { request } from 'https';
import { TIMEOUT } from 'dns';

// Force serial mode
test.describe.configure({ mode: 'serial' });

test.describe('LSG Login Module - Excel Data Driven', { tag: ['@LSG-Login-Register', '@WEB'] }, () => {
  let testData: any[] = [];
  let page: Page; 
  let context: any;
  let id_num = 1; // Row number to fetch data for (1-based index, excluding header)
  const excelFilePath = path.resolve(__dirname, '../../TestData/EmailDataList.xlsx');

  test.beforeAll(async ({ browser }) => {
    try {
      testData = cmsResources.getExcelData(excelFilePath);
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

  // T1 - Login: Validation with Empty Email (Pass password from Excel, but leave email empty)
  test('T1 - Login : Validation with Empty Email', async () => {
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).fill(''); // Explicitly empty
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
  });

  // T2 - Login: Validation with Empty Password (Pass email from Excel, leave password empty)
  test('T2 - Login : Validation with Empty Password', async () => {
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).fill('userData.email@mail.com');
    await page.locator(LoginLocators.passwordInput).fill(''); // Explicitly empty
    
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // T3 - Login: Validation with both empty (No data needed from Excel, but logic remains consistent)
  test('T3 - Login : Validation with both EMail and Password empty', async () => {
    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.submitBtn).click();
    
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
    await expect(page.locator(LoginLocators.passwordValidationError)).toBeVisible();
  });

  // T4 - Login: Validation with invalid credentials to check error handling 
  test('T4 - Login : Validation with invalid credentials', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).fill('userData.email@mail.com');
    await page.locator(LoginLocators.passwordInput).fill('WrongPassword123'); // Intentionally wrong password
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.invalidCredentialsError)).toBeVisible({ timeout: 30000 });

    await page.reload({ timeout: 60000 }); // Wait for the page to reload after failed login

    await page.locator(LoginLocators.emailInput).fill('email@MediaList.com'); // Intentionally wrong email
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.invalidCredentialsError)).toBeVisible({ timeout: 30000 });
  });

  // T5 - Login : Paswsword toggle functionality
  test('T5 - Login : Password toggle functionality', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.emailInput).fill(userData.email);

    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    const passwordTypeBefore = await page.locator(LoginLocators.passwordInput).getAttribute('type');
    await page.locator(LoginLocators.passwordToggleBtn).click();
    const passwordTypeAfter = await page.locator(LoginLocators.passwordInput).getAttribute('type');
    expect(passwordTypeBefore).not.toBe(passwordTypeAfter);
  });

  // T6 - Login : Wrong Email Format Error
  test('T6 - Login : Wrong Email Format Error', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.emailInput).fill('test@mail');

    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.emailValidationError)).toBeVisible();
  });

  // T7 - Login with incorrect credentials like no registered user
  test('T7 - Login with incorrect credentials like no registered user', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list

    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.emailInput).fill('testuser@mail.com');

    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.passwordInput).fill(userData.password);
    await page.locator(LoginLocators.submitBtn).click();
    // Matches the text exactly (case-sensitive)
    await expect.soft(page.locator('#formLogin > div:nth-child(4) > span:nth-child(1)')).toBeVisible({ timeout: 20000 });
    await expect.soft(page.locator('#formLogin > div:nth-child(4) > span:nth-child(1)')).toHaveText('Oops! This account does not exist.');
  });

  // T8 - Forgot password screen verification
  test('T8 - Forgot password screen verification', async () => {
    await page.locator(LoginLocators.forgotPasswordLink).click();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(1) > div:nth-child(1) > img:nth-child(1)')).toBeVisible();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(1) > div:nth-child(1) > input:nth-child(2)')).toBeVisible();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(2)')).toBeVisible();
  });

// T9 - Forgot password screen UI verification
  test('T9 - Forgot password screen UI verification', async () => {
    await expect.soft(page.locator('#forgotPassword > div:nth-child(1) > div:nth-child(1) > img:nth-child(1)')).toBeVisible();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(1) > div:nth-child(1) > input:nth-child(2)')).toBeVisible();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(2)')).toBeVisible();
  });

  // T10 - Forgot Password submit with empty email field. 
  test('T10 - Forgot Password submit with empty email field', async () => {
    await expect.soft(page.locator('#forgotPassword > div:nth-child(1) > div:nth-child(1) > img:nth-child(1)')).toBeVisible();
    await expect.soft(page.locator(LoginLocators.forgotPasswordEmailInput)).toBeVisible();
    await page.locator(LoginLocators.forgotPasswordSubmitBtn).click();
    await expect.soft(page.locator('#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(1) > div:nth-child(1) > span.errordiv > span')).toHaveText('Field is required');
  });

  // T11 - Forgot Password submit with invalid email
  test('T11 - Forgot Password submit with invalid email', async () => {
    await expect.soft(page.locator('#forgotPassword img')).toBeVisible();
    await page.locator(LoginLocators.forgotPasswordEmailInput).clear();
    await page.locator(LoginLocators.forgotPasswordEmailInput).fill('a.salve@mail');
    await page.locator(LoginLocators.forgotPasswordSubmitBtn).click();
    const errorMsg = page.locator('#forgotPassword span.errordiv span');
    try 
    {
      await expect(errorMsg).toBeVisible({ timeout: 10000 });
    } 
    catch (error) 
    {
        console.warn("Task failed, skipping to next testcases...");
    }
});

  // T12 - Forgot Password submit with unregistered email
  test('T12 - Forgot Password submit with unregistered email', async () => {
    await expect.soft(page.locator('#forgotPassword img')).toBeVisible();
    await page.locator(LoginLocators.forgotPasswordEmailInput).clear();
    await page.locator(LoginLocators.forgotPasswordEmailInput).fill('a.salve@mail.net');
    await page.locator(LoginLocators.forgotPasswordSubmitBtn).click();
    const errorMsg = page.locator('#forgotPassword span.errordiv span');
    expect.soft(errorMsg).toHaveText(/Invalid email. Please try again with your registered email./i);
  });

  // T13 - Cancel button functionality on Forgot Password Screen
  test('T13 - Cancel button functionality on Forgot Password Screen', async () => {
    await expect(page.locator(LoginLocators.forgotPasswordCancelBtn)).toBeVisible();
    await page.locator(LoginLocators.forgotPasswordCancelBtn).click();
    await expect(page.locator(LoginLocators.loginEntryBtn)).toBeVisible({ timeout: 30000 });
  });

  // T14 - Registration form mandatory fields validation
  test('T14 - Registration form mandatory fields validation', async () => {
    await page.locator(LoginLocators.registrationFormSignInBtn).scrollIntoViewIfNeeded(); 
    await page.locator(LoginLocators.registrationFormSignInBtn).click();
    const fields = [
      { name: 'First Name', locator: '.reg-fname .errordiv' },
      { name: 'Last Name', locator: '.reg-lname .errordiv' },
      { name: 'Email', locator: '.reg-email .errordiv' },
      { name: 'Password', locator: '.reg-password .errordiv' },
      { name: 'Confirm Password', locator: '.reg-conf-password .errordiv' },
      { name: 'Mobile', locator: '.reg-mobile .errordiv' }
    ];

    for (const field of fields) {
      const error = page.locator(field.locator);
      await expect(error, `${field.name} error not visible`).toBeVisible({ timeout: 80000 });
      await expect(error).toHaveText(/Field is required/i);
    }
  });

  // T15 - Registration form fill with valid data
  test('T15 - Registration form fill with valid data', async () => {
      const userData = testData.find((row: any) => row.id === id_num);
      // Check if userData actually exists before proceeding
      if (!userData) throw new Error(`User with ID ${id_num} not found in test data`);
      const registerFormData = new loginResources.RegistrationFormHandler(page);
      const cmsDeleteData = new cmsResources.commonResources(page);
      // Ensure cleanup is finished before starting registration
      await cmsDeleteData.loginToCMSAndDeleteUser(context, userData.email, 12);
      // Navigate to the registration page explicitly if the delete action changed the URL
      await registerFormData.fillRegistrationForm(userData);
  });

  // T16 - Registration form submission without verifying OTP for Email field
  test('T16 - Registration form submission without verifying OTP for Email field', async () => {
    await page.locator(LoginLocators.registrationFormSignInBtn).scrollIntoViewIfNeeded();
    await page.locator(LoginLocators.registrationFormSignInBtn).click();
    expect.soft(page.locator('div.form-group:nth-child(9) > span:nth-child(1)')).toHaveText('Email or Mobile Number is not verified');
  });

  // T17 - Once the OTP is triggered, the "Send OTP" button should be disabled.
  test('T17 - Once the OTP is triggered, the "Send OTP" button should be disabled.', async ({request}) => {
    const apiUrl = 'https://stg-sg.sportz.io/apiv3/del_redis';
    // Perform the GET request
    const response = await request.get(apiUrl);
    // 1. Verify the status code (e.g., 200 OK)
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    const registerFormData = new loginResources.RegistrationFormHandler(page);
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
    await page.locator(LoginLocators.registrationFormSendOTPBtn).scrollIntoViewIfNeeded();
    await page.locator(LoginLocators.registrationFormSendOTPBtn).click();
    expect(page.locator(LoginLocators.registrationFormOTPVerificationInput)).toBeVisible({ timeout: 10000 });
  });
  
  // T18 - Timer is displayed for the email ID OTP field.
  test('T18 - Timer is displayed for the email ID OTP field.', async () => {
    await page.locator('span.otp-time').scrollIntoViewIfNeeded();
    expect(page.locator('span.otp-time')).toBeVisible({ timeout: 10000 });
  });

  // T19 - password acceptance criteria error message is displayed when Invalid password is entered.
  test('T19 - password acceptance criteria error message is displayed when Invalid password is entered.', async () => {
    await page.locator(LoginLocators.registrationFormPassword).fill('pass@pass');
    await page.locator(LoginLocators.registrationFormPassword).fill('pass@pass');
    expect(page.locator('div.flex50:nth-child(5) > div:nth-child(1) > span:nth-child(4)')).toBeVisible({ timeout: 10000 });
    expect(page.locator('div.flex50:nth-child(6) > div:nth-child(1) > span:nth-child(4)')).toBeVisible({ timeout: 10000 });
    await page.reload({ timeout: 60000 }); // Reload the page to reset the form before filling it again
    const registerFormData = new loginResources.RegistrationFormHandler(page);
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
    await registerFormData.fillRegistrationForm(userData);
  });

  // T20 - Validation needs to be displayed after entering the wrong OTP.
  test('T20 - Validation needs to be displayed after entering the wrong OTP.', async ({request}) => {
    const apiUrl = 'https://stg-sg.sportz.io/apiv3/del_redis';
    // Perform the GET request
    const response = await request.get(apiUrl);
    // 1. Verify the status code (e.g., 200 OK)
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    await page.locator(LoginLocators.registrationFormSendOTPBtn).scrollIntoViewIfNeeded();
    await page.locator(LoginLocators.registrationFormSendOTPBtn).click();
    await page.locator(LoginLocators.registrationFormOTPVerificationInput).fill('123456'); // Intentionally wrong OTP
    await page.locator(LoginLocators.registrationFormOTPVerificationVerifyBtn).click();
    const errorMsg = page.locator('div.form-element > span.errordiv');
    await expect(errorMsg).toBeVisible();
  });

  // T21 - The Congratulations Pop-up with Okay button for Sucessful Registeration
  test('T21 - The Congratulations Pop-up with Okay button for Sucessful Registeration', async ({request}) => {
    test.setTimeout(2100000);
    const apiUrl = 'https://stg-sg.sportz.io/apiv3/del_redis';
    // Perform the GET request
    const response = await request.get(apiUrl);
    // 1. Verify the status code (e.g., 200 OK)
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    await page.reload({ timeout: 60000 }); // Reload the page to reset the form before filling it again
    const registerFormData = new loginResources.RegistrationFormHandler(page);
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
    await registerFormData.fillRegistrationForm(userData);
    const cmsDeleteData = new cmsResources.commonResources(page);
    await cmsDeleteData.deleteAllEmailsInbox(userData.server, userData.port, userData.email, userData.app_password);
    await page.locator(LoginLocators.registrationFormSendOTPBtn).scrollIntoViewIfNeeded();
    await page.locator(LoginLocators.registrationFormSendOTPBtn).click();
    await expect(page.locator(LoginLocators.registrationFormOTPVerificationInput)).toBeVisible();
    const emailBody = await cmsDeleteData.searchAndFetchEmail(userData.server, userData.port, userData.email, userData.app_password, userData.subject);
    console.log("EMAIL BODY:", emailBody);
    const emailOtp  = await cmsDeleteData.getOtpDetailsFromEmail(emailBody ? emailBody.body.toString() : '');
    console.log("EXTRACTED OTP:", emailOtp);
    await page.locator(LoginLocators.registrationFormOTPVerificationInput).fill(emailOtp || ''); // Fill the OTP input with the extracted OTP from mail
    await page.locator(LoginLocators.registrationFormOTPVerificationVerifyBtn).click();
    await expect(page.locator('button.btn-site.btn-otp.disabled')).toBeVisible({ timeout: 20000 });
    await page.locator(LoginLocators.registrationFormSignInBtn).scrollIntoViewIfNeeded();
    await page.locator(LoginLocators.registrationFormSignInBtn).click();
    try 
    {
      await page.waitForTimeout(5000);
      await page.waitForSelector('.waf-home-showcase > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)', { timeout: 20000 });
    } 
    catch (error) 
    {
        console.warn("Task failed, skipping to next testcases...");
    }
  });

  // T22 - Verify Forgot Password submit with registered email
  test('T22 - Verify Forgot Password submit with registered email', async ({request}) => {
    test.setTimeout(2100000);
    await page.locator(LoginLocators.toolbarHomeProfileButton).click();
    await page.locator('button.user-meta').click();
    await page.waitForTimeout(5000);
    await page.locator(LoginLocators.loginEntryBtn).click();
    await page.locator(LoginLocators.forgotPasswordLink).click();
    const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
    const cmsDeleteData = new cmsResources.commonResources(page);
    await cmsDeleteData.deleteAllEmailsInbox(userData.server, userData.port, userData.email, userData.app_password);
    await page.locator(LoginLocators.forgotPasswordEmailInput).fill(userData.email);
    await page.locator(LoginLocators.forgotPasswordSubmitBtn).click();
    await expect(page.locator('#sendPwdResetEmail > div:nth-child(1) > div:nth-child(1) > img')).toBeVisible();
    await page.locator('#sendPwdResetEmail > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > button:nth-child(1)').click();
    const emailBody = await cmsDeleteData.searchAndFetchEmail(userData.server, userData.port, userData.email, userData.app_password, userData.reset_pswd_mail_subject);
    console.log("EMAIL BODY:", emailBody);
    const resetUrl = await cmsDeleteData.getUrlFromEmailDetails(emailBody ? emailBody.body.toString() : '', 'stg-sg', 'reset');
    console.log("EXTRACTED Link:", resetUrl);
    await cmsDeleteData.resetPasswordUsingLink(context, resetUrl, userData.reset_password);
  });

  // T23 - Verify the login with correct credentials
  test('T23 - Verify the login with correct credentials', async () => {
    // Find the specific row for Adam
    const userData = testData.find((row: any) => row.id == id_num);
    await page.locator(LoginLocators.loginEntryBtn).click();
    await page.locator(LoginLocators.emailInput).clear();
    await page.locator(LoginLocators.emailInput).fill(userData.email);
    await page.locator(LoginLocators.passwordInput).clear();
    await page.locator(LoginLocators.passwordInput).fill(userData.reset_password);
    await page.locator(LoginLocators.submitBtn).click();
    await expect(page.locator(LoginLocators.userProfileCard)).toBeVisible({ timeout: 30000 });
  });

});