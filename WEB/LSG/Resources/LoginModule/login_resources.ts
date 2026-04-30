// Utils/ExcelUtils.ts
import * as XLSX from 'xlsx';
import * as path from 'path';
import { Page, BrowserContext, expect } from '@playwright/test';
import { LoginLocators , CMSLocators } from '../../PageObjects/LoginModule/login_locators';

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

export class RegistrationFormHandler 
{
    readonly page: Page;
    /**
     * Deletes a user from the CMS using their email.
     * @param context - The browser context to handle multiple windows.
     * @param emailId - The email of the user to delete.
     * @param cmsId - The ID used to fetch credentials.
     */
    constructor(page: Page) 
    {
        this.page = page;
    }

    async fillRegistrationForm(user: any) 
    {
        if (!user) {
            throw new Error("The 'user' object passed to fillRegistrationForm is undefined.");
        }

        // Define the mapping to make the code cleaner
        const formData = [
            { locator: LoginLocators.registrationFormFirstName, value: user.firstname ?? user['First Name'] },
            { locator: LoginLocators.registrationFormLastName, value: user.lastname ?? user['Last Name'] },
            { locator: LoginLocators.registrationFormEmail, value: user.email ?? user['Email'] },
            { locator: LoginLocators.registrationFormMobile, value: user.mob_number ?? user['Mobile'] }
        ];

        // Loop through standard fields to clear and fill
        for (const field of formData) {
            const element = this.page.locator(field.locator);
            await element.clear(); // Explicitly clear the field
            await element.fill(String(field.value ?? ""));
        }

        // Handle Passwords separately due to .first() and confirmation logic
        const pass = String(user.password ?? user['Password'] ?? "");
        
        const passField = this.page.locator(LoginLocators.registrationFormPassword).first();
        await passField.clear();
        await passField.fill(pass);

        const confirmPassField = this.page.locator(LoginLocators.registrationFormConfirmPassword);
        await confirmPassField.clear();
        await confirmPassField.fill(pass);
    }

    async   loginToCMSAndDeleteUser(context: BrowserContext, emailId: string, cmsId: any) 
    {
        let deleteData: any[] = [];
        const excelFilePath = path.resolve(__dirname, '../../../../CMSLoginCreds.xlsx');
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
        await cmsPage.goto(deleteCreds.cms_url, { timeout: 60000 });


        // 3. Login Process
        await cmsPage.waitForSelector(CMSLocators.cmsClientId, { state: 'visible', timeout: 30000 });
        await cmsPage.fill(CMSLocators.cmsClientId, deleteCreds.cms_clientid);
        await cmsPage.fill(CMSLocators.cmsUsername, deleteCreds.cms_username);
        await cmsPage.fill(CMSLocators.cmsPassword, deleteCreds.cms_password);
        
        await cmsPage.click(CMSLocators.cmsLoginButton);

        // 4. Navigate to Delete Section
        await cmsPage.waitForSelector(CMSLocators.showcaseIcon, { state: 'visible', timeout: 30000 });
        await cmsPage.click(CMSLocators.showcaseIcon);

        await cmsPage.waitForSelector(CMSLocators.deleteDataBtn, { state: 'visible', timeout: 20000 });
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
            await this.page.bringToFront();
            if (cmsPage) {                          // Close the CMS tab to free up resources
                await cmsPage.close();
            }
            console.log('CMS Tab closed. Returning to main application execution.');
        }    
    }
}