// Utils/ExcelUtils.ts
import * as XLSX from 'xlsx';
import * as path from 'path';
import { Page} from '@playwright/test';
import { LoginLocators } from '../../PageObjects/LoginModule/login_locators';

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