// import chromedriver so that Selenium can by itself open a chrome driver
require("chromedriver");

// import this class from Selenium
const { Builder, By , until} = require("selenium-webdriver");

(async function shadowDomTest() {
  try {
  //open chrome browser
  let driver = await new Builder().forBrowser("chrome").build();

  // go to shadow dom demo page
  await driver.get("https://www.bing.com/search?q=joe biden wiki&cvid=05a227d0c0a24930963e4e12a49cc412&aqs=edge.0.69i59j46j69i57j46l2j0j46j0l2.1727j0j1&pglt=41&FORM=ANNAB1&PC=LCTS&features=f1&setmkt=en-us&setlang=");
  let ele = await driver.wait(until.elementLocated(By.css('.b_algoBigWiki')), 10000);
  // get the shadow Root
  async function getShadowRootExtension() {
    let shadowHost;
    // let locator = By.css(".b_algoBigWiki")
    // let wait = new WebDriverWait(driver, 1000*10);
    // await wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    // driver.wait(function() {
    //   return driver.executeScript('return document.readyState').then(function(readyState) {
    //     return readyState === 'complete';
    //   });
    // });
    setTimeout(async() => {
      let elem = await driver.findElement(By.css(".b_algoBigWiki"));
    let height = await elem.getCssValue("height");
    if (height != "0px") {
        console.log(height);
    }
    driver.close()
    }, 10000)
  }

  // find the shadow DOM element
  async function locateShadowDomElement(shadowDomElement) {
    let shadowRoot;
    let element;
    await (shadowRoot = getShadowRootExtension());
  }

  let shadowElement = await locateShadowDomElement(".b_algoBigWiki");
  } catch(e) {
    console.log(e);
  }
})();
