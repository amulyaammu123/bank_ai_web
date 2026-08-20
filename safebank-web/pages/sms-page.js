const { By } = require('selenium-webdriver');
const BasePage = require('./base-page');

class SmsScannerPage extends BasePage {
  constructor(driver) {
    super(driver);

    // Navigation Tabs
    this.tabSmsScan = By.id('tab-sms-scan');
    this.tabUrlScan = By.id('tab-url-scan');

    // SMS Locators
    this.smsInput = By.id('sms-input');
    this.smsScanBtn = By.id('sms-scan-btn');
    this.smsScanResult = By.id('sms-scan-result');
    this.smsThreatScore = By.id('sms-threat-score');

    // URL Locators
    this.urlInput = By.id('url-input');
    this.urlScanBtn = By.id('url-scan-btn');
    this.urlScanResult = By.id('url-scan-result');
  }

  async ensureLoggedIn() {
    try {
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.includes('/login')) {
        const LoginPage = require('./login-page');
        const loginPage = new LoginPage(this.driver);
        await loginPage.login('user@safebank.ai', 'Password123');
        await this.driver.sleep(500);
      }
    } catch (e) {}
  }

  async scanSms(message) {
    await this.ensureLoggedIn();
    await this.click(this.tabSmsScan);
    if (message !== null) await this.writeInput(this.smsInput, message);
    await this.click(this.smsScanBtn);
  }

  async scanUrl(url) {
    await this.ensureLoggedIn();
    await this.click(this.tabUrlScan);
    if (url !== null) await this.writeInput(this.urlInput, url);
    await this.click(this.urlScanBtn);
  }
}

module.exports = SmsScannerPage;
