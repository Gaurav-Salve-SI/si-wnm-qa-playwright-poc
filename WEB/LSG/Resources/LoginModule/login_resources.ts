// Utils/ExcelUtils.ts
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ImapFlow } from 'imapflow';
import { Page, BrowserContext, expect } from '@playwright/test';
import { LoginLocators } from '../../PageObjects/LoginModule/login_locators';

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

}