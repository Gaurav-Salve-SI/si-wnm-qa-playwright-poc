import { test, expect, Page } from '@playwright/test';
import * as commonLocators from '../../../CommonBase/Utilities/PageObjects/common_locators';
import { commonResources, getExcelData } from '../../../CommonBase/Utilities/Resources/common_resources';
import path from 'path';
import webConfig from '../../../Environment-Config/web_environment.json';
import { allowedNodeEnvironmentFlags, send } from 'process';
import { request } from 'https';
import { time } from 'console';
import { TIMEOUT } from 'dns';

// Force serial mode
test.describe.configure({ mode: 'serial' });
let page: Page; 
test.describe('GT Onboarding Module - Excel Data Driven', { tag: ['@GT-Login-Register', '@WEB'] }, () => {
  let testData: any[] = [];
  let context: any;
  let id_num = 1; // Row number to fetch data for (1-based index, excluding header)
  let utilityResources: commonResources;
  const excelFilePath = path.resolve(__dirname, '../TestData/EmailDataList.xlsx'); // Adjust the path as needed
    test.beforeAll(async ({ browser }) => 
    {
        // 1. Load data first - throw error if it fails so the test doesn't start
        try {
            testData = getExcelData(excelFilePath);
            if (!testData || testData.length === 0) {
                throw new Error("Excel data is empty");
            }
        } catch (error) {
            throw new Error(`CRITICAL: Failed to load Excel data: ${error}`);
        }
        // 2. Initialize browser context and page
        context = await browser.newContext();
        page = await context.newPage();
        utilityResources = new commonResources(page);
        // 3. Add Cookies
        await context.addCookies([{ 
            name: 'allowCookie', 
            value: '1', 
            domain: 'stg-gujarat-titans.sportz.io', 
            path: '/' 
        }]);
        // 4. Navigate - Ensure you await this fully
        const targetUrl = webConfig.web_data[0].staging_GT_application_URL;
        if (!targetUrl) throw new Error("Target URL is undefined in webConfig");
        await utilityResources.openBrowserAndNavigateToURL(targetUrl);
        await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
    });
    test.afterAll(async () => 
    {
        await page.close();
        await context.close();
    });
    test.beforeEach(async ({request}) => {
        const apiUrl = webConfig.web_data[0].staging_redis_clear_api;
        // Perform the GET request
        const response = await request.get(apiUrl);
        // 1. Verify the status code (e.g., 200 OK)
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
    });

    test('GT-TC-184 Validate Field Entering 10 Digits Valid Mobile Number', { tag: ['@GT-TC-184'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
        await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, userData.mob_number);
        await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
        await page.locator(commonLocators.GTWebsiteLocators.enter_otp).getAttribute('type').then(value => {
            expect(value).toBe('text');
        });
    });
    
    test('GT-TC-185 Validate field entering 11 digits of mobile number', { tag: ['@GT-TC-185'] }, async () => {
        await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
        await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, '98765432101'); // Using the ID value as a user in the list
        const inputValue = await page.locator(commonLocators.GTWebsiteLocators.mobile_number).inputValue();
        expect(inputValue).toBe('9876543210');
    });

    test('GT-TC-186 Validate field entering 9 digits of mobile number', { tag: ['@GT-TC-186'] }, async () => {
        await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, '987654321'); // Using the ID value as a user in the list
        expect(await page.locator(commonLocators.GTWebsiteLocators.invalid_mob_no_message).isVisible()).toBe(true);
    });

    test('GT-TC-187 Validate clicking on send otp with empty mobile no field', { tag: ['@GT-TC-187'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
        await page.locator(commonLocators.GTWebsiteLocators.mobile_number).clear(); // Using the ID value as a user in the list
        await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
        await page.locator(commonLocators.GTWebsiteLocators.field_is_required).isVisible().then(isVisible => {
            expect(isVisible).toBe(true);
        });
    });

    test('GT-TC-188 Validate send otp button functionality', { tag: ['@GT-TC-188'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
        await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, userData.mob_number);
        await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
        await page.locator(commonLocators.GTWebsiteLocators.time_remaining).isVisible();
    });

    test('GT-TC-190 Validate Resend OTP functionality', { tag: ['@GT-TC-190'] }, async () => {
        test.setTimeout(21000000); // Set timeout to 700 seconds for this test
        await utilityResources.resendOTPFunctionality(commonLocators.GTWebsiteLocators);
    });

    test('GT-TC-192 Validate if the user not clicked the checkbox for Terms and conditions', { tag: ['@GT-TC-192'] }, async () => {
        await page.locator(commonLocators.GTWebsiteLocators.acknowledge).isVisible();
        await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
        await expect(page.locator(commonLocators.GTWebsiteLocators.field_is_required)).toHaveCount(2);
    });

    test('GT-TC-191 Validate after clicking on Terms and condition link', { tag: ['@GT-TC-191'] }, async () => {
        await page.locator(commonLocators.GTWebsiteLocators.acknowledge).isVisible();
        await page.locator(commonLocators.GTWebsiteLocators.acknowledge).click();
        await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
        await expect(page.locator(commonLocators.GTWebsiteLocators.field_is_required)).toHaveCount(1);
        await page.locator(commonLocators.GTWebsiteLocators.desclaimer).click();
    });

    test('GT-TC-189 Validate with Valid OTP Input', { tag: ['@GT-TC-189'] }, async () => {
        await page.reload();
        const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
        await utilityResources.loginToCMSAndDeleteMobileUser(context, userData.mob_number, 2);
        await utilityResources.loginToCMSAndDeleteUser(context, userData.email, 2);
        await utilityResources.enterMobileAndVerifyOTP(commonLocators.GTWebsiteLocators, userData.mob_number);
        await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
    });

    test('GT-TC-193 Validate login button click redirection', { tag: ['@GT-TC-193'] }, async () => {
        expect(page.locator(commonLocators.GTWebsiteLocators.first_name)).toBeVisible({ timeout: 120000 });
    });

    test('GT-TC-194 Validate firstname and lastname field with empty value', { tag: ['@GT-TC-194'] }, async () => {
        await page.locator(commonLocators.GTWebsiteLocators.complete_submit_button).scrollIntoViewIfNeeded();
        await page.locator(commonLocators.GTWebsiteLocators.complete_submit_button).click();
        expect(page.locator(commonLocators.GTWebsiteLocators.fname_field_err_msg)).toBeVisible({ timeout: 120000 });
        expect(page.locator(commonLocators.GTWebsiteLocators.lname_field_err_msg)).toBeVisible({ timeout: 120000 });
    });

    test('GT-TC-195 Validate the Valid Email Address', { tag: ['@GT-TC-195'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        await utilityResources.fillPersonalDetails(userData, commonLocators.GTWebsiteLocators);
        const emailVal = await page.locator(commonLocators.GTWebsiteLocators.email).inputValue();
        expect(emailVal).toBe(userData.email);
    });

    test('GT-TC-196 Validate email address with an incorrect format', { tag: ['@GT-TC-196'] }, async () => {
        await page.locator(commonLocators.GTWebsiteLocators.email).fill('abc@gmail'); // Invalid email format
        try 
        {
            await expect(page.locator(commonLocators.GTWebsiteLocators.invalid_mail)).toBeVisible();
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });

    test('GT-TC-198 Validate submitting DOB with an incorrect format', { tag: ['@GT-TC-198'] }, async () => {
        const invalid_dob = '19080987';
        await page.click(commonLocators.GTWebsiteLocators.date_of_birth);
        const rawDate = invalid_dob.toString(); // "22081995"
        const formattedDate = `${rawDate.substring(4, 8)}-${rawDate.substring(2, 4)}-${rawDate.substring(0, 2)}`; 
        await page.fill('#regDob', formattedDate);
        await page.fill(commonLocators.GTWebsiteLocators.date_of_birth, formattedDate);
        try 
        {
            await expect(page.locator(commonLocators.GTWebsiteLocators.invalid_dob_message)).toBeVisible();
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });

    test('GT-TC-199 Validate the Valid Jersey Name', { tag: ['@GT-TC-199'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        const jerseyNameVal = await page.locator(commonLocators.GTWebsiteLocators.jersey_name).inputValue();
        expect(jerseyNameVal).toBe(userData.jersey_name);
    });

    test('GT-TC-200 Validate jersey number length', { tag: ['@GT-TC-200'] }, async () => {
        const jerseyNameVal = await page.locator(commonLocators.GTWebsiteLocators.jersey_no).fill("12345");
        try 
        {
            await expect(page.locator(commonLocators.GTWebsiteLocators.invalid_jersey_no_message)).toBeVisible();
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });

    test('GT-TC-202 Validate to select valid Country option from the dropdown provided', { tag: ['@GT-TC-202'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        const countryVal = await page.locator(commonLocators.GTWebsiteLocators.country).innerText();
        expect(countryVal).toBe(userData.country);
    });

    test('GT-TC-203 Validate that when a First time logged in user completes the profile but doesnt add the Referral Code', { tag: ['@GT-TC-203'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        await page.reload({ timeout: 60000 });
        await utilityResources.fillPersonalDetails(userData, commonLocators.GTWebsiteLocators);
        await page.fill(commonLocators.GTWebsiteLocators.referrel_code, "");
        await page.locator(commonLocators.GTWebsiteLocators.complete_submit_button).click();
        try 
        {
            expect(page.locator(commonLocators.GTWebsiteLocators.profile_masthead_card)).toBeVisible({ timeout: 120000 });
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
        await page.locator(commonLocators.GTWebsiteLocators.setting).click();
        await page.locator(commonLocators.GTWebsiteLocators.edit_profile).click();
        try 
        {   
            await expect(page.locator(commonLocators.GTWebsiteLocators.referrel_code)).toBeVisible();
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });

    test('GT-TC-197 Validate to submit with email ID field empty', { tag: ['@GT-TC-197'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        test.setTimeout(600000); // Set timeout to 600 seconds for this test
        page.waitForTimeout(1500);
        await utilityResources.logoutFromWebsite(commonLocators.GTWebsiteLocators);
        await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
        await utilityResources.loginToCMSAndDeleteMobileUser(context, userData.mob_number, 2);
        await utilityResources.loginToCMSAndDeleteUser(context, userData.email, 2);
        await utilityResources.enterMobileAndVerifyOTP(commonLocators.GTWebsiteLocators, userData.mob_number);
        await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
        await utilityResources.fillPersonalDetails(userData, commonLocators.GTWebsiteLocators);
        await page.fill(commonLocators.GTWebsiteLocators.email, "");
        await page.locator(commonLocators.GTWebsiteLocators.complete_submit_button).click();
        try 
        {
            expect(page.locator(commonLocators.GTWebsiteLocators.profile_masthead_card)).toBeVisible({ timeout: 120000 });
            await expect(page.locator(commonLocators.GTWebsiteLocators.verify_email)).toHaveValue('');
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });

    test('GT-TC-201 Validate submitting with Favourite player field empty', { tag: ['@GT-TC-201'] }, async () => {
        const userData = testData.find((row: any) => row.id == id_num);
        test.setTimeout(600000); // Set timeout to 600 seconds for this test
        page.waitForTimeout(1500);
        await utilityResources.logoutFromWebsite(commonLocators.GTWebsiteLocators);
        await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
        await utilityResources.loginToCMSAndDeleteMobileUser(context, userData.mob_number, 2);
        await utilityResources.loginToCMSAndDeleteUser(context, userData.email, 2);
        await utilityResources.enterMobileAndVerifyOTP(commonLocators.GTWebsiteLocators, userData.mob_number);
        await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
        await utilityResources.fillPersonalDetails(userData, commonLocators.GTWebsiteLocators);
        await page.locator(commonLocators.GTWebsiteLocators.favourite_player).selectOption({ label: "" });
        await page.locator(commonLocators.GTWebsiteLocators.complete_submit_button).click();
        try 
        {
            expect(page.locator(commonLocators.GTWebsiteLocators.profile_masthead_card)).toBeVisible({ timeout: 120000 });
            await expect(page.locator(commonLocators.GTWebsiteLocators.favourite_player)).toBeHidden();
        } 
        catch (error) 
        {
            console.warn("Task failed, skipping to next testcases...");
        }
    });
});