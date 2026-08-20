const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const BaseTest = require('./base-test');
const LoginPage = require('../pages/login-page');
const DashboardPage = require('../pages/dashboard-page');
const SmsScannerPage = require('../pages/sms-page');
const CallAnalyzerPage = require('../pages/call-page');
const AwarenessPage = require('../pages/awareness-page');
const ProfilePage = require('../pages/profile-page');
const excelGenerator = require('../utilities/excel-generator');
const config = require('../config/config');

describe('SafeBank AI E2E Test Suite', function() {
  const baseTest = new BaseTest();
  let driver;

  before(async () => {
    await baseTest.setupSuite();
  });

  after(async () => {
    await baseTest.teardownSuite();
  });

  // Helper login action to reuse
  async function performLogin(driver, email, password) {
    const loginPage = new LoginPage(driver);
    await loginPage.visit(`${config.baseUrl}/login`);
    await loginPage.login(email, password);
    const dashboard = new DashboardPage(driver);
    await dashboard.findElement(dashboard.monthlyReportCard, 15000);
  }

  // ==========================================
  // MODULE 1 – AUTHENTICATION (TC001 - TC005)
  // ==========================================
  describe('Module 1: Authentication', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC001] Login with valid credentials', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/login`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Login page', 'SUCCESS');

      await loginPage.login('user@safebank.ai', 'Password123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted valid credentials', 'SUCCESS');

      const dashboard = new DashboardPage(driver);
      expect(await dashboard.getCurrentUrl()).to.include('/dashboard');
      expect(await dashboard.isDisplayed(dashboard.safetyScore)).to.be.true;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Successfully verified redirect to Dashboard', 'PASSED');
    });

    it('[TC002] Login with invalid credentials', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/login`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Login page', 'SUCCESS');

      await loginPage.login('wrong@safebank.ai', 'WrongPass123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted incorrect credentials', 'SUCCESS');

      expect(await loginPage.isDisplayed(loginPage.errorMsg)).to.be.true;
      const errorText = await loginPage.getText(loginPage.errorMsg);
      expect(errorText).to.include('Invalid email or password');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified login error message displays correctly', 'PASSED');
    });

    it('[TC003] Login with empty email', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/login`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Login page', 'SUCCESS');

      await loginPage.login('', 'Password123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted empty email with password', 'SUCCESS');

      const emailErrLocator = By.id('login-email-error');
      expect(await loginPage.isDisplayed(emailErrLocator)).to.be.true;
      const errorText = await loginPage.getText(emailErrLocator);
      expect(errorText).to.include('Email is required');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified empty email validation triggers', 'PASSED');
    });

    it('[TC004] Login with empty password', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/login`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Login page', 'SUCCESS');

      await loginPage.login('user@safebank.ai', '');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted valid email with empty password', 'SUCCESS');

      const passErrLocator = By.id('login-password-error');
      expect(await loginPage.isDisplayed(passErrLocator)).to.be.true;
      const errorText = await loginPage.getText(passErrLocator);
      expect(errorText).to.include('Password is required');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified empty password validation triggers', 'PASSED');
    });

    it('[TC005] Forgot password flow', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/login`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Login page', 'SUCCESS');

      await loginPage.triggerForgotPassword('user@safebank.ai');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Triggered forgot password with email', 'SUCCESS');

      expect(await loginPage.isDisplayed(loginPage.forgotPasswordStatus)).to.be.true;
      const statusText = await loginPage.getText(loginPage.forgotPasswordStatus);
      expect(statusText).to.include('Password reset instructions sent');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified forgot password success banner', 'PASSED');
    });
  });

  // ==========================================
  // MODULE 2 – USER REGISTRATION (TC006 - TC010)
  // ==========================================
  describe('Module 2: User Registration', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC006] Register with valid details', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/register`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Register page', 'SUCCESS');

      const randEmail = `new_${Math.floor(Math.random() * 100000)}@safebank.ai`;
      await loginPage.register('Alice Cooper', randEmail, 'Password123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, `Submitted registration for ${randEmail}`, 'SUCCESS');

      const dashboard = new DashboardPage(driver);
      expect(await dashboard.getCurrentUrl()).to.include('/dashboard');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Redirected to Dashboard after secure signup', 'PASSED');
    });

    it('[TC007] Register with existing email', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/register`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Register page', 'SUCCESS');

      await loginPage.register('Duplicate User', 'user@safebank.ai', 'Password123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted registration with existing email', 'SUCCESS');

      expect(await loginPage.isDisplayed(loginPage.regErrorMsg)).to.be.true;
      const errorText = await loginPage.getText(loginPage.regErrorMsg);
      expect(errorText).to.include('Email already exists');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified duplicate email registration error', 'PASSED');
    });

    it('[TC008] Register with invalid email', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/register`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Register page', 'SUCCESS');

      await loginPage.register('Alice Cooper', 'invalidemail', 'Password123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted registration with malformed email', 'SUCCESS');

      const emailErrLocator = By.id('register-email-error');
      expect(await loginPage.isDisplayed(emailErrLocator)).to.be.true;
      const errorText = await loginPage.getText(emailErrLocator);
      expect(errorText).to.include('Please enter a valid email address');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified invalid email pattern validation', 'PASSED');
    });

    it('[TC009] Register with weak password', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/register`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Register page', 'SUCCESS');

      await loginPage.register('Alice Cooper', 'alice@safebank.ai', '123');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted registration with password too short', 'SUCCESS');

      const passErrLocator = By.id('register-password-error');
      expect(await loginPage.isDisplayed(passErrLocator)).to.be.true;
      const errorText = await loginPage.getText(passErrLocator);
      expect(errorText).to.include('Password must be at least 6 characters');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified weak password warning trigger', 'PASSED');
    });

    it('[TC010] Register with missing mandatory fields', async function() {
      const loginPage = new LoginPage(driver);
      await loginPage.visit(`${config.baseUrl}/register`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Register page', 'SUCCESS');

      await loginPage.register('', '', '', false);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted empty registration fields', 'SUCCESS');

      expect(await loginPage.isDisplayed(By.id('register-name-error'))).to.be.true;
      expect(await loginPage.isDisplayed(By.id('register-email-error'))).to.be.true;
      expect(await loginPage.isDisplayed(By.id('register-password-error'))).to.be.true;
      expect(await loginPage.isDisplayed(By.id('register-agree-error'))).to.be.true;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified all mandatory fields validation displays', 'PASSED');
    });
  });

  // ==========================================
  // MODULE 3 – FRAUD ALERT DETECTION (TC011 - TC015)
  // ==========================================
  describe('Module 3: Fraud Alert Detection', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
      await performLogin(driver, 'user@safebank.ai', 'Password123');
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC011] Upload suspicious SMS content', async function() {
      await performLogin(driver, config.testUser.email, config.testUser.password);
      const smsPage = new SmsScannerPage(driver);
      await smsPage.visit(`${config.baseUrl}/sms-scanner`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to SMS Scanner page', 'SUCCESS');

      await smsPage.scanSms('URGENT: Your bank account is temporarily blocked. Please update KYC immediately.');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted suspicious KYC spam SMS content', 'SUCCESS');

      expect(await smsPage.isDisplayed(smsPage.smsScanResult)).to.be.true;
      expect(await smsPage.isDisplayed(smsPage.smsThreatScore)).to.be.true;
      const score = await smsPage.getText(smsPage.smsThreatScore);
      expect(score).to.include('92%');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified suspicious SMS generated high threat fraud score', 'PASSED');
    });

    it('[TC012] Upload phishing message', async function() {
      await performLogin(driver, config.testUser.email, config.testUser.password);
      const smsPage = new SmsScannerPage(driver);
      await smsPage.visit(`${config.baseUrl}/sms-scanner`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to SMS Scanner page', 'SUCCESS');

      await smsPage.scanSms('CONGRATULATIONS! You won 1 Crore Cash Prize. Pay 5000 processing tax now.');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted lottery phishing spam SMS content', 'SUCCESS');

      expect(await smsPage.isDisplayed(smsPage.smsScanResult)).to.be.true;
      const resultText = await smsPage.getText(smsPage.smsScanResult);
      expect(resultText.toLowerCase()).to.satisfy(txt => txt.includes('risky') || txt.includes('phishing'));
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified phishing alert warning output', 'PASSED');
    });

    it('[TC013] Upload safe banking message', async function() {
      await performLogin(driver, config.testUser.email, config.testUser.password);
      const smsPage = new SmsScannerPage(driver);
      await smsPage.visit(`${config.baseUrl}/sms-scanner`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to SMS Scanner page', 'SUCCESS');

      await smsPage.scanSms('Dear customer, your account statement is available for download.');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted clean SMS message', 'SUCCESS');

      expect(await smsPage.isDisplayed(smsPage.smsScanResult)).to.be.true;
      const resultText = await smsPage.getText(smsPage.smsScanResult);
      expect(resultText).to.include('SAFE');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified clean message classified as SAFE', 'PASSED');
    });

    it('[TC014] Analyze suspicious URL', async function() {
      const smsPage = new SmsScannerPage(driver);
      await smsPage.visit(`${config.baseUrl}/sms-scanner`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to SMS Scanner page', 'SUCCESS');

      await smsPage.scanUrl('http://safebank-scam-update.com');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted suspicious URL for analysis', 'SUCCESS');

      expect(await smsPage.isDisplayed(smsPage.urlScanResult)).to.be.true;
      const resultText = await smsPage.getText(smsPage.urlScanResult);
      expect(resultText).to.satisfy(txt => txt.includes('FLAGGED') || txt.includes('Phishing') || txt.includes('Connection blocked'));
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified URL threat analysis completes successfully', 'PASSED');
    });

    it('[TC015] Analyze known phishing URL', async function() {
      const smsPage = new SmsScannerPage(driver);
      await smsPage.visit(`${config.baseUrl}/sms-scanner`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to SMS Scanner page', 'SUCCESS');

      await smsPage.scanUrl('http://phish-secure.in');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted known phishing link URL', 'SUCCESS');

      expect(await smsPage.isDisplayed(smsPage.urlScanResult)).to.be.true;
      const resultText = await smsPage.getText(smsPage.urlScanResult);
      expect(resultText).to.include('FLAGGED MALICIOUS');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified malicious threat flag alert triggers', 'PASSED');
    });
  });

  // ==========================================
  // MODULE 4 – SAFE CALL ANALYSIS (TC016 - TC020)
  // ==========================================
  describe('Module 4: Safe Call Analysis', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
      await performLogin(driver, 'user@safebank.ai', 'Password123');
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC016] Analyze legitimate phone number', async function() {
      const callPage = new CallAnalyzerPage(driver);
      await callPage.visit(`${config.baseUrl}/call-analyzer`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Call Analyzer page', 'SUCCESS');

      await callPage.scanPhoneNumber('+91 94401 23456');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted legitimate phone number for scan', 'SUCCESS');

      expect(await callPage.isDisplayed(callPage.phoneScanResult)).to.be.true;
      const resultText = await callPage.getText(callPage.phoneScanResult);
      expect(resultText).to.include('Safe');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified legitimate number marked Safe', 'PASSED');
    });

    it('[TC017] Analyze spam caller number', async function() {
      const callPage = new CallAnalyzerPage(driver);
      await callPage.visit(`${config.baseUrl}/call-analyzer`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Call Analyzer page', 'SUCCESS');

      await callPage.scanPhoneNumber('+91 88888 88888');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted spam preset phone number for scan', 'SUCCESS');

      expect(await callPage.isDisplayed(callPage.phoneScanResult)).to.be.true;
      const resultText = await callPage.getText(callPage.phoneScanResult);
      expect(resultText).to.include('Suspicious');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified spam preset marked Suspicious', 'PASSED');
    });

    it('[TC018] Analyze unknown caller', async function() {
      const callPage = new CallAnalyzerPage(driver);
      await callPage.visit(`${config.baseUrl}/call-analyzer`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Call Analyzer page', 'SUCCESS');

      await callPage.scanPhoneNumber('+91 70135 66677');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Submitted unknown phone number for scan', 'SUCCESS');

      expect(await callPage.isDisplayed(callPage.phoneScanResult)).to.be.true;
      const resultText = await callPage.getText(callPage.phoneScanResult);
      expect(resultText).to.include('Marked as');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified call risk assessment generated and shown', 'PASSED');
    });

    it('[TC019] Block suspicious caller', async function() {
      const callPage = new CallAnalyzerPage(driver);
      await callPage.visit(`${config.baseUrl}/call-analyzer`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Call Analyzer page', 'SUCCESS');

      await callPage.blockPhoneNumber('+91 99999 00000');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Blocked phone number manually', 'SUCCESS');

      const blockedText = await callPage.getBlockedCallersText();
      expect(blockedText).to.include('+91 99999 00000');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified number successfully appended to Blocked List table', 'PASSED');
    });

    it('[TC020] View call analysis history', async function() {
      const callPage = new CallAnalyzerPage(driver);
      await callPage.visit(`${config.baseUrl}/call-analyzer`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Call Analyzer page', 'SUCCESS');

      // Add a scan to populate history
      await callPage.scanPhoneNumber('+91 77777 77777');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Scanned caller number to log history entry', 'SUCCESS');

      await callPage.waitForTextToContain(callPage.callHistoryTbody, '+91 77777 77777');
      const historyText = await callPage.getCallHistoryText();
      expect(historyText).to.include('+91 77777 77777');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified scanned calls displays in Screening Logs', 'PASSED');
    });
  });

  // ==========================================
  // MODULE 5 – BANKING AWARENESS (TC021 - TC025)
  // ==========================================
  describe('Module 5: Banking Awareness', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
      await performLogin(driver, 'user@safebank.ai', 'Password123');
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC021] Open fraud awareness page', async function() {
      const awarenessPage = new AwarenessPage(driver);
      await awarenessPage.visit(`${config.baseUrl}/awareness`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Awareness page', 'SUCCESS');

      expect(await awarenessPage.getCurrentUrl()).to.include('/awareness');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified page loaded successfully', 'PASSED');
    });

    it('[TC022] Load educational content', async function() {
      const awarenessPage = new AwarenessPage(driver);
      await awarenessPage.visit(`${config.baseUrl}/awareness`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Awareness page', 'SUCCESS');

      await driver.sleep(500); // Wait for React hydration
      const articleTitleLocator = By.className('article-title');
      expect(await awarenessPage.isDisplayed(articleTitleLocator)).to.be.true;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified educational articles catalog displays', 'PASSED');
    });

    it('[TC023] Play awareness video', async function() {
      const awarenessPage = new AwarenessPage(driver);
      await awarenessPage.visit(`${config.baseUrl}/awareness`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Awareness page', 'SUCCESS');

      await driver.sleep(500); // Wait for React hydration
      await awarenessPage.playVideo();
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Clicked Play Video button', 'SUCCESS');

      await awarenessPage.waitForTextToContain(awarenessPage.videoState, 'Playing');
      const videoStateText = await awarenessPage.getText(awarenessPage.videoState);
      expect(videoStateText).to.include('Playing');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified video player status changed to Playing', 'PASSED');
    });

    it('[TC024] Search awareness topics', async function() {
      const awarenessPage = new AwarenessPage(driver);
      await awarenessPage.visit(`${config.baseUrl}/awareness`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Awareness page', 'SUCCESS');

      await awarenessPage.searchTopic('OTP');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Typed search query "OTP"', 'SUCCESS');

      const titleEl = await driver.findElement(By.className('article-title'));
      const text = await titleEl.getText();
      expect(text).to.include('OTP');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified articles list filtered based on search query', 'PASSED');
    });

    it('[TC025] Bookmark awareness article', async function() {
      const awarenessPage = new AwarenessPage(driver);
      await awarenessPage.visit(`${config.baseUrl}/awareness`);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Awareness page', 'SUCCESS');

      await driver.sleep(500); // Wait for React hydration
      await awarenessPage.bookmarkArticle(0);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Clicked bookmark action button on index 0', 'SUCCESS');

      await awarenessPage.waitForTextToContain(awarenessPage.bookmarkBadge, 'OTP');
      const bookmarkSummary = await awarenessPage.getBookmarkedText();
      expect(bookmarkSummary).to.not.be.empty;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified article added to Bookmarked Resources section', 'PASSED');
    });
  });

  // ==========================================
  // MODULE 6 – DASHBOARD & ANALYTICS (TC026 - TC030)
  // ==========================================
  describe('Module 6: Dashboard & Analytics', function() {
    beforeEach(async function() {
      driver = await baseTest.setupTest(this);
      await performLogin(driver, 'user@safebank.ai', 'Password123');
    });

    afterEach(async function() {
      await baseTest.teardownTest(this);
    });

    it('[TC026] Dashboard loads successfully', async function() {
      const dashboard = new DashboardPage(driver);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Dashboard page', 'SUCCESS');

      expect(await dashboard.isDisplayed(dashboard.monthlyReportCard)).to.be.true;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified security dashboard cards loaded', 'PASSED');
    });

    it('[TC027] Threat statistics displayed', async function() {
      const dashboard = new DashboardPage(driver);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Dashboard page', 'SUCCESS');

      expect(await dashboard.isDisplayed(dashboard.safetyScore)).to.be.true;
      const score = await dashboard.getText(dashboard.safetyScore);
      expect(score).to.include('98');
      
      const scanned = await dashboard.getText(dashboard.messagesScanned);
      expect(scanned).to.not.be.empty;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified metrics visible on telemetry cards', 'PASSED');
    });

    it('[TC028] Filter analytics', async function() {
      const dashboard = new DashboardPage(driver);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Dashboard page', 'SUCCESS');

      await dashboard.filterAnalytics('Last 30 Days');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Changed statistics filter option to Last 30 Days', 'SUCCESS');

      // Stats values should change dynamically
      const threatsText = await dashboard.getText(dashboard.threatsBlocked);
      expect(threatsText).to.equal('27');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified threat statistics numbers change dynamically', 'PASSED');
    });

    it('[TC029] Monthly fraud report loads', async function() {
      const dashboard = new DashboardPage(driver);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Dashboard page', 'SUCCESS');

      await driver.sleep(500); // Wait for React hydration
      await dashboard.openMonthlyReport();
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Opened monthly report modal', 'SUCCESS');

      await dashboard.waitForTextToContain(dashboard.monthlyReportModal, 'Overview');
      expect(await dashboard.isDisplayed(dashboard.monthlyReportModal)).to.be.true;
      
      await dashboard.closeMonthlyReport();
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Closed monthly report modal', 'SUCCESS');
      
      // Wait for modal fade out
      await driver.sleep(500);
      expect(await dashboard.isDisplayed(dashboard.monthlyReportModal)).to.be.false;
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified monthly intelligence report toggle details', 'PASSED');
    });

    it('[TC030] Export analytics report', async function() {
      const dashboard = new DashboardPage(driver);
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Navigated to Dashboard page', 'SUCCESS');

      await driver.sleep(500); // Wait for React hydration
      await dashboard.triggerExport();
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Clicked Export Report button', 'SUCCESS');

      await dashboard.waitForTextToContain(dashboard.exportSuccessMsg, 'successfully');
      expect(await dashboard.isDisplayed(dashboard.exportSuccessMsg)).to.be.true;
      const successText = await dashboard.getText(dashboard.exportSuccessMsg);
      expect(successText).to.include('successfully exported');
      excelGenerator.addExecutionLog(new Date(), this.test.title, 'Verified analytics export triggers download confirmation banner', 'PASSED');
    });
  });
});
