# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: GujaratTitans/TestCases/onboarding_testcases.spec.ts >> GT Onboarding Module - Excel Data Driven >> GT-TC-193 Validate login button click redirection
- Location: WEB/GujaratTitans/TestCases/onboarding_testcases.spec.ts:124:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('xpath=(//input[@id=\'firstName\'])[1]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('xpath=(//input[@id=\'firstName\'])[1]')
    - waiting for" https://stg-gujarat-titans.sportz.io/profile" navigation to finish...
    - navigated to "https://stg-gujarat-titans.sportz.io/profile"
    2 × locator resolved to <input type="text" id="firstName" name="First Name" v-model="firstName" required="required" class="form-control" autocomplete="given-name" :disabled="!isFirstNameEditable" placeholder="Enter your first name" v-validate="'required|disallow_hyperlink'"/>
      - unexpected value "hidden"

```

# Test source

```ts
  26  |             }
  27  |         } catch (error) {
  28  |             throw new Error(`CRITICAL: Failed to load Excel data: ${error}`);
  29  |         }
  30  |         // 2. Initialize browser context and page
  31  |         context = await browser.newContext();
  32  |         page = await context.newPage();
  33  |         utilityResources = new commonResources(page);
  34  |         // 3. Add Cookies
  35  |         await context.addCookies([{ 
  36  |             name: 'allowCookie', 
  37  |             value: '1', 
  38  |             domain: 'stg-gujarat-titans.sportz.io', 
  39  |             path: '/' 
  40  |         }]);
  41  |         // 4. Navigate - Ensure you await this fully
  42  |         const targetUrl = webConfig.web_data[0].staging_GT_application_URL;
  43  |         if (!targetUrl) throw new Error("Target URL is undefined in webConfig");
  44  |         await utilityResources.openBrowserAndNavigateToURL(targetUrl);
  45  |         await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
  46  |     });
  47  |     test.afterAll(async () => 
  48  |     {
  49  |         await page.close();
  50  |         await context.close();
  51  |     });
  52  |     test.beforeEach(async ({request}) => {
  53  |         const apiUrl = webConfig.web_data[0].staging_redis_clear_api;
  54  |         // Perform the GET request
  55  |         const response = await request.get(apiUrl);
  56  |         // 1. Verify the status code (e.g., 200 OK)
  57  |         expect(response.ok()).toBeTruthy();
  58  |         expect(response.status()).toBe(200);
  59  |     });
  60  | 
  61  |     test('GT-TC-184 Validate Field Entering 10 Digits Valid Mobile Number', { tag: ['@GT-TC-184'] }, async () => {
  62  |         const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
  63  |         await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, userData.mob_number);
  64  |         await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
  65  |         await page.locator(commonLocators.GTWebsiteLocators.enter_otp).getAttribute('type').then(value => {
  66  |             expect(value).toBe('text');
  67  |         });
  68  |     });
  69  |     
  70  |     test('GT-TC-185 Validate field entering 11 digits of mobile number', { tag: ['@GT-TC-185'] }, async () => {
  71  |         await utilityResources.navigateToLogin(commonLocators.GTWebsiteLocators);
  72  |         await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, '98765432101'); // Using the ID value as a user in the list
  73  |         const inputValue = await page.locator(commonLocators.GTWebsiteLocators.mobile_number).inputValue();
  74  |         expect(inputValue).toBe('9876543210');
  75  |     });
  76  | 
  77  |     test('GT-TC-186 Validate field entering 9 digits of mobile number', { tag: ['@GT-TC-186'] }, async () => {
  78  |         await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, '987654321'); // Using the ID value as a user in the list
  79  |         expect(await page.locator(commonLocators.GTWebsiteLocators.invalid_mob_no_message).isVisible()).toBe(true);
  80  |     });
  81  | 
  82  |     test('GT-TC-187 Validate clicking on send otp with empty mobile no field', { tag: ['@GT-TC-187'] }, async () => {
  83  |         const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
  84  |         await page.locator(commonLocators.GTWebsiteLocators.mobile_number).clear(); // Using the ID value as a user in the list
  85  |         await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
  86  |         await page.locator(commonLocators.GTWebsiteLocators.field_is_required).isVisible().then(isVisible => {
  87  |             expect(isVisible).toBe(true);
  88  |         });
  89  |     });
  90  | 
  91  |     test('GT-TC-188 Validate send otp button functionality', { tag: ['@GT-TC-188'] }, async () => {
  92  |         const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
  93  |         await utilityResources.enterMobileNumber(commonLocators.GTWebsiteLocators, userData.mob_number);
  94  |         await page.locator(commonLocators.GTWebsiteLocators.send_otp).click();
  95  |         await page.locator(commonLocators.GTWebsiteLocators.time_remaining).isVisible();
  96  |     });
  97  | 
  98  |     test('GT-TC-190 Validate Resend OTP functionality', { tag: ['@GT-TC-190'] }, async () => {
  99  |         test.setTimeout(21000000); // Set timeout to 700 seconds for this test
  100 |         await utilityResources.resendOTPFunctionality(commonLocators.GTWebsiteLocators);
  101 |     });
  102 | 
  103 |     test('GT-TC-192 Validate if the user not clicked the checkbox for Terms and conditions', { tag: ['@GT-TC-192'] }, async () => {
  104 |         await page.locator(commonLocators.GTWebsiteLocators.acknowledge).isVisible();
  105 |         await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
  106 |         await expect(page.locator(commonLocators.GTWebsiteLocators.field_is_required)).toHaveCount(2);
  107 |     });
  108 | 
  109 |     test('GT-TC-191 Validate after clicking on Terms and condition link', { tag: ['@GT-TC-191'] }, async () => {
  110 |         await page.locator(commonLocators.GTWebsiteLocators.acknowledge).isVisible();
  111 |         await page.locator(commonLocators.GTWebsiteLocators.acknowledge).click();
  112 |         await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
  113 |         await expect(page.locator(commonLocators.GTWebsiteLocators.field_is_required)).toHaveCount(1);
  114 |         await page.locator(commonLocators.GTWebsiteLocators.desclaimer).click();
  115 |     });
  116 | 
  117 |     test('GT-TC-189 Validate with Valid OTP Input', { tag: ['@GT-TC-189'] }, async () => {
  118 |         await page.reload();
  119 |         const userData = testData.find((row: any) => row.id == id_num); // Using the ID value as a user in the list
  120 |         await utilityResources.loginToCMSAndDeleteMobileUser(context, userData.mob_number, 2);
  121 |         await utilityResources.enterMobileAndVerifyOTP(commonLocators.GTWebsiteLocators, userData.mob_number);
  122 |     });
  123 | 
  124 |     test('GT-TC-193 Validate login button click redirection', { tag: ['@GT-TC-193'] }, async () => {
  125 |         await page.locator(commonLocators.GTWebsiteLocators.login_form_button).click();
> 126 |         await expect(page.locator(commonLocators.GTWebsiteLocators.first_name)).toBeVisible();
      |                                                                                 ^ Error: expect(locator).toBeVisible() failed
  127 |     });
  128 | });
```