const { taskManager, taskStatus } = require('./taskList.js');

// import chromedriver so that Selenium can by itself open a chrome driver
require("chromedriver");
const { resultWebAnalysisList } = require('./testdomResult.js')
const edge = require('selenium-webdriver/edge');
// import this class from Selenium
const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const maxDomTaskConcurrency = 10;
const axios = require("axios");
const cheerio = require("cheerio");
// let options = new edge.Options();
const baseUrl = "https://www.staging-bing-int.com/?setapplicationendpoint=BNZEEAP000184D1&";
exports.DomTest = async (task) => {
    let resultAnalysis = [];
    try {
        //open chrome browser
        const { query, features, flights, market, language, params } = task;
        let urlList = [];
        let exec = [];
        addUrlList(urlList, features, flights, query, market, language, params);
        let truncatelist = truncateList(urlList);
        for (var i = 0; i < truncatelist.length; i++) {
            for (var z = 0; z < truncatelist[i].length; z++) {
                exec.push(scrawDon(truncatelist[i][z], resultAnalysis));
            }
            await Promise.all(exec);
        }
    } catch (e) {
        console.log(e);
    }
    task.status = taskStatus.completed;
    taskManager.taskRunningCount--;
    if (resultAnalysis.length == 0) {
        resultWebAnalysisList[task.id] = `No Exception Detected`;
    }
    else {
        resultWebAnalysisList[task.id] = resultAnalysis.join(' And ');
    }
    return resultAnalysis;
}

let truncateList = (list) => {
    let truncatelist = [];
    let subList = [];
    for (var i = 0; i < list.length; i++) {
        if (subList.length < maxDomTaskConcurrency) {
            subList.push(list[i]);
        }
        else {
            truncatelist.push(subList);
            subList = [];
        }
    }
    if (truncatelist.length == 0) {
        truncatelist.push(subList);
    }
    return truncatelist;
}

let getFeatures = (str) => {
    if (str) {
        let index1 = str.indexOf("features=");
        let index2 = str.indexOf("&tag");
        if (index1 != -1) {
            return str.slice(index1 + 9, index2);
        }
    }
}

let getFlight = (str) => {
    if (str) {
        let index1 = str.indexOf("setflight=");
        let index2 = str.indexOf("&tag");
        if (index1 != -1) {
            return str.slice(index1 + 10, index2);
        }
    }
}

async function searchElement(driver, resultAnalysis, url) {
    try {
        let webResults = await driver.findElements(By.css("#b_results>li"));
        for (let index in webResults) {
            let webresult = webResults[index];
            let text = await driver.executeScript("return arguments[0].innerHTML;", webresult);
            if (text.indexOf("WebResultAnswer_SingleResult") != -1) {
                if (text.indexOf('Exception') != -1) {
                    var flight = getFlight(url);
                    if (flight) {
                        resultAnalysis.push(`[Flight: ${flight}] may cause an exception`);
                    }
                    else {
                        resultAnalysis.push(`[Features: ${getFeatures(url)}] may cause cause an exception`);
                    }
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
};

let scrawDon = async (url, resultAnalysis, retryCount = 0) => {
    if (retryCount > 2) {
        return false;
    }
    // go to shadow dom demo page
    let driver = await new Builder().forBrowser("chrome").build();
    // let driver = await new Builder().forBrowser(Browser.EDGE).build();
    try {
        // await driver.manage().setTimeouts({implicit: 22000});
        // driver.manage().timeouts().implicitlyWait(100000, TimeUnit.SECONDS);
        await driver.get(url);
        try {
            // let loading = await Promise.all([driver.wait(until.elementLocated(By.css('.b_vtl_deeplinks')), 13000),
            // driver.wait(until.elementLocated(By.css('.b_go_big')), 13000),
            // driver.wait(until.elementLocated(By.css('.b_algoBigWiki')), 13000)]);
            await driver.wait(until.elementLocated(By.css('.b_vtl_deeplinks')), 13000);
        } catch (e) {
            console.log(e);
        }
        try {
            await searchElement(driver, resultAnalysis, url);
        } catch (e) {
            console.log(e);
        }
    } catch (e) {
        console.log(e);
    }
    driver.close();
};

let checkHeight = async (url, webElem, resultAnalysis) => {
    if (webElem) {
        let height = (await webElem.getCssValue("height")).split("px")[0];
        if (height < 100) {
            var flight = getFlight(url);
            if (flight) {
                resultAnalysis.push(`[Flight: ${flight}] may cause issue, ux height is abnormal`);
            }
            else {
                resultAnalysis.push(`[Features: ${getFeatures(url)}] may cause issue, ux height is abnormal`);
            }
        }
        else {
            // TODO
            // console.log(`${url} height is ${height}`);
        }
    }
}

let addUrlList = (urlList, featuresList, flightList, querys, market, language, params) => {
    featureArr = featuresList ? featuresList.split(',') : [];
    flightArr = flightList ? flightList.split(',') : [];
    queryArr = querys ? querys.split(',') : [];
    for (var j = 0; j < queryArr.length; j++) {
        if (!queryArr[j]) continue;
        let query = queryArr[j];
        for (var i = 0; featuresList && i < featureArr.length; i++) {
            urlList.push(`${baseUrl}&q=${query}&cvid=05a227d0c0a24930963e4e12a49cc412&aqs=edge.0.69i59j46j69i57j46l2j0j46j0l2.1727j0j1&pglt=41&FORM=ANNAB1&PC=LCTS&testhooks=1&features=${featureArr[i] ?? ""}&tag&setmkt=${market ?? ""}&setlang=${language ?? ""}&${params ?? ""}`)
        }
        for (var i = 0; flightList && i < flightArr.length; i++) {
            urlList.push(`${baseUrl}&q=${query}&cvid=05a227d0c0a24930963e4e12a49cc412&aqs=edge.0.69i59j46j69i57j46l2j0j46j0l2.1727j0j1&pglt=41&FORM=ANNAB1&PC=LCTS&testhooks=1&setflight=${flightArr[i] ?? ""}&tag&setmkt=${market ?? ""}&setlang=${language ?? ""}&${params ?? ""}`)
        }
    }
}