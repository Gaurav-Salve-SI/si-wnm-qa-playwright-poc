export const LoginLocators = 
{
    cookieAcceptBtn: '#cookie-policy-btn',
    loginEntryBtn: 'div.login-wrap > button',
    emailInput: 'input#loginEmail',
    passwordInput: 'input#loginPassword',
    submitBtn: 'button.btn-site.btn-login',
    userProfileCard: 'div.user-card-info',
    emailValidationError: 'span.errordiv:nth-child(3)',
    passwordValidationError: 'div.login-password > div:nth-child(1) > span:nth-child(4)',
    invalidCredentialsError: '#formLogin > div:nth-child(4) > span:nth-child(1)',
    toolbarProfileButton: 'button.btn.btn-toggle-profile',
    toolbarLogoutButton: 'li.user-logout > button.user-meta',
    passwordToggleBtn: 'div.login-password > div:nth-child(1) > button:nth-child(3)',
    forgotPasswordLink: 'button.btn-forgot',
    forgotPasswordEmailInput: '#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(1) > div:nth-child(1) > input:nth-child(2)',
    forgotPasswordSubmitBtn: '#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)',
    forgotPasswordCancelBtn: '#forgotPassword > div:nth-child(2) > div:nth-child(1) > form:nth-child(3) > div:nth-child(2) > div:nth-child(1) > button',
    registrationFormSignInBtn: 'button.btn-site.btn-register',
    registrationFormSendOTPBtn: 'button.btn-site.btn-otp',
    registrationFormOTPVerificationInput: 'input#otpverification',
    registrationFormFirstName: '#firstName',
    registrationFormLastName: '#lastName',
    registrationFormEmail: '#registerEmail',
    registrationFormPassword: '#regPassword',
    registrationFormConfirmPassword: '#regConfirmPassword',
    registrationFormMobile: '#regMobile'
};

export const CMSLocators = {
    cmsClientId: '//input[@id="clientid"]',
    cmsUsername: '//input[@id="username"]',
    cmsPassword: '//input[@id="password"]',
    cmsLoginButton: '//input[@value="Login"]',
    showcaseIcon: '//li[@class="nav-showcase"]/a',
    deleteDataBtn: '//span[text()="Delete Data"]',
    emailIdInput: '//input[@id="data_email_id"]',
    deleteUserBtn: '//button[@name="userjson"]',
    deletedMsg: '//p[text()="Deleted Successfully"]'
};