// Utils/ExcelUtils.ts
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser'; // Highly recommended for parsing email bodiesnpm install mailparser
import { Page, BrowserContext, expect } from '@playwright/test';
import { CMSLocators } from '../PageObjects/common_locators';

export function getExcelData(filePath: string, sheetName: string = 'Sheet1') 
{
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[sheetName];
        // Converts the Excel rows into an array of objects
        return XLSX.utils.sheet_to_json(sheet);
    } catch (error) {
        console.error(`Error reading Excel file: ${error}`);
        return [];
    }
}

interface EmailResult {
    body: string;
    receivedTime: string | null;
    sender: string | null;
}

export class commonResources 
{
    readonly page: Page;

    constructor(page: Page) 
    {
        this.page = page;
    }

    async openBrowserAndNavigateToURL(url: string): Promise<Page> {
        if (!this.page) {
            throw new Error('Page instance is not initialized in commonResources');
        }

        await this.page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });
        return this.page;
    }

    async navigateToLogin(locators: any): Promise<Page> 
    {
        if (!this.page) {
            throw new Error('Page instance is not initialized in commonResources');
        }
        // Access properties directly from the passed object
        await this.page.click(locators.login_button);
        return this.page;
    }

    async enterMobileNumber(locators: any, mobileNum: string): Promise<Page> 
    {
        if (!this.page) {
            throw new Error('Page instance is not initialized in commonResources');
        }
        // Ensure mobileNum is a valid string before filling
        if (typeof mobileNum === 'string' && mobileNum.trim()) {
            await this.page.locator(locators.mobile_number).clear();
            await this.page.fill(locators.mobile_number, mobileNum);
            return this.page;
        } else {
            throw new Error('Invalid mobile number: must be a non-empty string');
        }
    }

    async resendOTPFunctionality(locators: any): Promise<Page>
    {
        if (!this.page) {
            throw new Error('Page instance is not initialized in commonResources');
        }
                expect(this.page.locator(locators.resend_otp).isVisible({timeout: 700000})).toBeTruthy();
                await this.page.locator(locators.resend_otp).click();
                await this.page.locator(locators.time_remaining).isVisible();
                
        return this.page;
    }

    async enterMobileAndVerifyOTP(locators: any , mobileNum: string): Promise<Page>
    {
        if (!this.page) {
            throw new Error('Page instance is not initialized in commonResources');
        }
        await this.enterMobileNumber(locators, mobileNum);
        await this.page.locator(locators.send_otp).click();
        await this.page.locator(locators.acknowledge).click();
        await this.page.locator(locators.desclaimer).click();
        await this.page.locator(locators.send_otp).click();
        const staticOTP = await this.createStaticOTPForNumber(mobileNum);
        await this.page.locator(locators.enter_otp).fill(staticOTP);
        return this.page;
    }

    async createStaticOTPForNumber(mobileNum: string)
    {
        const lastSix: string = mobileNum.slice(-6);
        return lastSix;
    }
    
    /**
     * Deletes a user from the CMS using their email.
     * @param context - The browser context to handle multiple windows.
     * @param emailId - The email of the user to delete.
     * @param cmsId - The ID used to fetch credentials.
     * @param mobileNum - The mobile number used to fetch credentials.
     */
    async   loginToCMSAndDeleteUser(context: BrowserContext, emailId: string, cmsId: any) 
    {
        let deleteData: any[] = [];
        const excelFilePath = path.resolve(__dirname, '../../../CMSLoginCreds.xlsx');
        try 
        {
            deleteData = getExcelData(excelFilePath);
        } catch (error) 
        {
            console.error("FAILED TO LOAD EXCEL DATA:", error);
        }
        const deleteCreds = deleteData.find((row: any) => row.id == cmsId); // Using the cmsID value in the sheet to fetch credentials
        console.log(deleteCreds);
        const cmsPage = await context.newPage();
        await cmsPage.goto(deleteCreds.cms_url, { timeout: 120000, waitUntil: 'domcontentloaded' });


        // 3. Login Process
        await cmsPage.waitForSelector(CMSLocators.cmsClientId, { state: 'visible', timeout: 30000 });
        await cmsPage.fill(CMSLocators.cmsClientId, deleteCreds.cms_clientid);
        await cmsPage.fill(CMSLocators.cmsUsername, deleteCreds.cms_username);
        await cmsPage.fill(CMSLocators.cmsPassword, deleteCreds.cms_password);
        
        await cmsPage.click(CMSLocators.cmsLoginButton);

        // 4. Navigate to Delete Section
        await cmsPage.waitForSelector(CMSLocators.showcaseIcon, { state: 'visible', timeout: 60000 });
        await cmsPage.click(CMSLocators.showcaseIcon);

        await cmsPage.waitForSelector(CMSLocators.deleteDataBtn, { state: 'visible', timeout: 60000 });
        await cmsPage.click(CMSLocators.deleteDataBtn);

        // 5. Perform Deletion
        await cmsPage.waitForSelector(CMSLocators.emailIdInput);
        await cmsPage.fill(CMSLocators.emailIdInput, emailId);
        await cmsPage.click(CMSLocators.deleteUserBtn);

        // 6. Verification & Error Handling
        try 
        {
            // Attempt to find the success message
            await cmsPage.waitForSelector(CMSLocators.deletedMsg, { 
                state: 'visible', 
                timeout: 10000 
            });
            console.log('Mobile number deleted successfully');
        } catch (error) {
            // By simply logging and NOT throwing, the execution continues
            console.warn('User deletion message not found. The user might not exist or the UI failed. Proceeding anyway...');
        } finally {
            // This block runs regardless of whether the try succeeded or the catch was triggered
            // Explicitly focus back on your main registration tab
            if (this.page && !this.page.isClosed()) {
                await this.page.bringToFront();
            }
            if (cmsPage) {                          // Close the CMS tab to free up resources
                await cmsPage.close();
            }
            console.log('CMS Tab closed. Returning to main application execution.');
        }    
    }

    async   loginToCMSAndDeleteMobileUser(context: BrowserContext, mobileNum: any, cmsId: any) 
    {
        let deleteData: any[] = [];
        const excelFilePath = path.resolve(__dirname, '../../../CMSLoginCreds.xlsx');
        try 
        {
            deleteData = getExcelData(excelFilePath);
        } catch (error) 
        {
            console.error("FAILED TO LOAD EXCEL DATA:", error);
        }
        const deleteCreds = deleteData.find((row: any) => row.id == cmsId); // Using the cmsID value in the sheet to fetch credentials
        console.log(deleteCreds);
        const cmsPage = await context.newPage();
        await cmsPage.goto(deleteCreds.cms_url, { timeout: 120000, waitUntil: 'domcontentloaded' });


        // 3. Login Process
        await cmsPage.waitForSelector(CMSLocators.cmsClientId, { state: 'visible', timeout: 30000 });
        await cmsPage.fill(CMSLocators.cmsClientId, deleteCreds.cms_clientid);
        await cmsPage.fill(CMSLocators.cmsUsername, deleteCreds.cms_username);
        await cmsPage.fill(CMSLocators.cmsPassword, deleteCreds.cms_password);
        
        await cmsPage.click(CMSLocators.cmsLoginButton);

        // 4. Navigate to Delete Section
        await cmsPage.waitForSelector(CMSLocators.showcaseIcon, { state: 'visible', timeout: 60000 });
        await cmsPage.click(CMSLocators.showcaseIcon);

        await cmsPage.waitForSelector(CMSLocators.deleteDataBtn, { state: 'visible', timeout: 60000 });
        await cmsPage.click(CMSLocators.deleteDataBtn);

        // 5. Perform Deletion
        await cmsPage.waitForSelector(CMSLocators.mobile_num_input);
        await cmsPage.fill(CMSLocators.mobile_num_input, mobileNum);
        await cmsPage.click(CMSLocators.deleteUserBtn);

        // 6. Verification & Error Handling
        try 
        {
            // Attempt to find the success message
            await cmsPage.waitForSelector(CMSLocators.deletedMsg, { 
                state: 'visible', 
                timeout: 10000 
            });
            console.log('Mobile number deleted successfully');
        } catch (error) {
            // By simply logging and NOT throwing, the execution continues
            console.warn('User deletion message not found. The user might not exist or the UI failed. Proceeding anyway...');
        } finally {
            // This block runs regardless of whether the try succeeded or the catch was triggered
            // Explicitly focus back on your main registration tab
            if (this.page && !this.page.isClosed()) {
                await this.page.bringToFront();
            }
            if (cmsPage) {                          // Close the CMS tab to free up resources
                await cmsPage.close();
            }
            console.log('CMS Tab closed. Returning to main application execution.');
        }    
    }

    async  deleteAllEmailsInbox
    (
        host: string, 
        port: number, 
        emailAddress: string, 
        password: string
    ): Promise<void> 
    {
        const client = new ImapFlow({
            host: host,
            port: port,
            secure: true,
            auth: {
                user: emailAddress,
                pass: password
            },
            // Disable logging for a cleaner console, set to true for debugging
            logger: false 
        });

        try {
            // Connect and login
            await client.connect();

            // Select 'INBOX' and create an exclusive lock to perform operations
            let lock = await client.getMailboxLock('INBOX');
            
            try {
                // Search for all emails and move them to trash (or delete)
                // In IMAP, adding the \Deleted flag is often handled by 'messageDelete'
                await client.messageDelete('1:*'); 
                
                console.log("All emails marked for deletion.");
            } finally {
                // Always release the lock
                lock.release();
            }

        } catch (error) {
            console.error("Error deleting emails:", error);
        } finally {
            // Log out and close connection
            await client.logout();
            console.log("All emails deleted and logged out.");
        }
    }

    async  searchAndFetchEmail
    (
        host: string,
        port: number,
        emailAddress: string,
        password: string,
        subject: string,
        timeout: number = 60000,
        pollInterval: number = 5000
    ): Promise<EmailResult | null> { // UPDATED: Changed from void | null to EmailResult | null
    const client = new ImapFlow({
        host,
        port,
        secure: true,
        auth: { user: emailAddress, pass: password },
        logger: false
    });

        const startTime = Date.now();

        try {
            await client.connect();

            while (Date.now() - startTime < timeout) {
            let lock = await client.getMailboxLock('INBOX');
            try {
                console.log(`Polling for email... Time elapsed: ${Date.now() - startTime}ms`);
                
                // Use a variable to store the result of the search
                const searchResult = await client.search({ subject: subject });

                // Narrow the type: ensure searchResult is an array and not 'false'
                if (Array.isArray(searchResult) && searchResult.length > 0) {
                    const latestUid = searchResult[searchResult.length - 1];
                    console.log(`Fetching UID: ${latestUid}`);
                    
                    const message = await client.fetchOne(latestUid.toString(), { source: true });
                    
                    // message.source can be undefined, so we check it
                    if (message && message.source) {
                        console.log("Message source fetched successfully.");
                        
                        // CRITICAL: You must 'await' simpleParser
                        // We cast message.source as any or Buffer to satisfy simpleParser's 'Source' type
                        const parsed = await simpleParser(message.source as any);

                        return {
                            body: (parsed.text || parsed.html || '').replace(/<[^>]*>?/gm, ''),
                            receivedTime: parsed.date ? parsed.date.toISOString() : null,
                            sender: parsed.from?.text || null
                        };
                    }
                }
            } catch (err) {
                console.error("Search/Fetch iteration failed:", err);
            } finally {
                lock.release();
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

            return null; 
        } catch (error) {
            console.error("IMAP Error:", error);
            throw error;
        } finally {
            await client.logout();
        }
    }

    async  getOtpDetailsFromEmail(mailBody: string): Promise<string | null> 
    {
        if (!mailBody) return null;
        // Use the global flag 'g' to find all matches, then pick the first
        // This helps if there are hidden formatting tags inside the numbers
        const otpPattern = /\d{4,8}/g;
        const matches = mailBody.match(otpPattern);
        return matches ? matches[0] : null;
    }

    async  getUrlFromEmailDetails(mailBody: string, domain: string, expected: string): Promise<string> 
    {
        // Construct the regex pattern
        // pattern = https://{domain}.sportz.io...
        const pattern = new RegExp(
            `https://${domain}\\.sportz\\.io(?:/[^?]*)?\\?${expected}=[0-9a-fA-F\\-]+`,
            'g'
        );

        const matches = mailBody.match(pattern);

        // Ensure matches exist to avoid "undefined" errors
        if (!matches || matches.length === 0) {
            throw new Error(`No URLs found matching domain: ${domain} and param: ${expected}`);
        }

        // Return the first match (equivalent to Get From List ${matches} 0)
        return matches[0];
    }

    async resetPasswordUsingLink(
        context: BrowserContext, 
        url: string, 
        newPassword: string
    ): Promise<void> 
    {
        // 1. Start listening for the new tab BEFORE navigating
        const pagePromise = context.waitForEvent('page');
        
        // 2. Open the URL (This usually opens in a new tab based on your logic)
        // If the URL opens in the CURRENT tab, don't use waitForEvent('page')
        const newTab = await context.newPage(); 
        await newTab.goto(url);

        // 3. Handle Cookie Policy (Optional)
        await newTab.locator('button#cookie-policy-btn')
            .click({ timeout: 3000 })
            .catch(() => {});

        // 4. Input Passwords
        await newTab.locator('input#newPassword').fill(newPassword);
        await newTab.locator('input#confNewPassword').fill(newPassword);

       // 5. Click Submit
        // Using your specific CSS selector
        await newTab.locator('div.form-btn-group:nth-child(3) > div:nth-child(2) > button:nth-child(1)')
            .click();

        // 6. Optional: Wait for navigation or a success message instead of a hard sleep
        await newTab.locator('#regComplete > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > button:nth-child(1)').click();
        await newTab.waitForLoadState('load');
        // 7. Close the reset tab to "Switch Window MAIN"
        if (this.page && !this.page.isClosed()) {
                await this.page.bringToFront();
            }
            if (newTab) {                          // Close the CMS tab to free up resources
                await newTab.close();
            }
    }
}