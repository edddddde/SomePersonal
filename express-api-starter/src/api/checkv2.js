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
const fetch = require("node-fetch");
// let options = new edge.Options();
const baseUrl = "https://www.bing.com/?&";
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

async function searchElement(element, resultAnalysis, url) {
    console.log(url);
    try {
        let webResults = await element("#b_results>li");
        for (let index in webResults) {
            let webresult = webResults[index];
            let text = element(webresult).html();
            // require('fs').writeSync(`./test${index}.html`, text,  {encode: 'utf8'})
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
    // let driver = await new Builder().forBrowser("chrome").build();
    // let driver = await new Builder().forBrowser(Browser.EDGE).build();
    try {
        // await driver.manage().setTimeouts({implicit: 22000});
        // driver.manage().timeouts().implicitlyWait(100000, TimeUnit.SECONDS);
        const data = await fetch(url, {
  "headers": {
    "cookie": `SUID=M; MUID=296C6F63BFC66DCB2CBD7DB0BE486CA4; MUIDB=296C6F63BFC66DCB2CBD7DB0BE486CA4; _EDGE_V=1; SRCHD=AF=ANNAB1; SRCHUID=V=2&GUID=1667D307815F4D33BE72681E6E9FBF6D&dmnchg=1; SRCHUSR=DOB=20230313; SRCHHPGUSR=SRCHLANG=en&PV=15.0.0; snrSetApplicationEndpoint=BNZEEAP000184D1; _SS=PC=LCTS&testretry=0&testcodehash=&testname=&tecontext=&suitenamehash=&testidentifier=&testselectionId=&SID=1CF71372052E65030A9501A104566409; SRCHS=PC=LCTS; OVRTH=; setapplicationendpoint=BNZEEAP000184D1; SnrOvr=F=enblhp; BFB=AhBJkU06X-b-9SpQwnH0jXu5TJMBcMHaSkTunrX3Gl8Za3TrIhwvRUtTWdEmeRuDrZHOZOMjlEqTRtsiYT_R0aacNaTRyPSSUAmeJXsFA29y-GZMf-497tKsfpLdupgvR72ZOZNS2ERKqLpch0UJy7VRszmabDXbs7nIU-e9VtIPcA; OID=AhDGzu5Sspg5dx1gM8O9ypAE7bRyHjatc74sJJ70x2x5RVZHChmFn62I8HVgkCI2zL3OAMtf468feMYEcJndUT_eHrHOsf5EyQzxpaJy60W1RVjSckzPH_eKJAB2ZcbHl4U; OIDR=ghCf3NHFIkmb69MtDybsezXGkO2sPiDFLx1Y8jXaWjDfWLgbdPAd02Aw1AB4MQ1BlWtGk8kqump-PzLDOyRumZ3YS--GRMFeDzcJO5nEHaDHTjSE0l1UaF_QvrYmGLYGgvotNYjC6CbDebMlZZIv8Ya-nm-s6VJ7c78THadGhsUb_YMjwY6BeQodsyLGmMgcwSZ8wQH9RRvJWbNKCY3iZYqlP6bX83IDQX49PL6K9bgi0PbuN004ny2qw_KSbJwpyyBssNm1N85brZ5anRVc0-fLA4xBCTqfSXyPpAzsdog1nBLHQDTLMr_v0hktLplfhGVTn7yTlRuvjSL6aHPVCuOblOGMmSJgZ17QN2rfdEWOaemppFrYJA9GGbi8MIPUatiHw_bLW1Tsebk_-NVEvUkb9SXm_H4BIB0FpUkuEHZtw15bFcuM5MkVUtxGhUHNDUEZj-mg5sVvYQELZ_mzU_M51v3tjmmWppdoATOhSIhq--Bi52E-ipno1lsECYiUD2UrcrUyVTMBQGKv8dg5lvdxGGmiOwt6e2gE3mjj6ZbPVxm5j4Fm5rK4OwG70kdAJzhNuaoIpl209zpy4A3hrXZeISPXrli-6CZQ9qXeWlgZ_MXQNyqbgJP7WHlHLmUp5DPSgYN31Y4LL6gLN79HvDtJc9UfBlZ3NW4pY6Lfif_G0ynZZqFezZu_fB-qO71OeaTTrQUTE92zykDYvgJewyo01wpXHAXIySGkJ_NgR9dzdbG19ODHrYc2vGzASu_2O9D1QCrY1uvAwucYEsPc_cteGjv9uXcJ6SwEMutG1yPg2_c51pIwcZKMgEL0hqaDD-kZ1Z40pzj2HHEc9E_wUSfRXhhDerkEbKlxHINlxezmzn2HMTfJj-5Z5D1q2Fn-SAn255mz1welyAhVe8UWvFeBLmcGLPP-37yY7h-NNuMbiepD0KzZFReIXXyLHQdSj9j34QW60wCbBs0tw2M0y32gXRXY3BraVxhqf2ILaMEKHbyo7kG_dT8X4gK7Syq4fLmaRuBQNhE2m4savrhB1JZ6wxOvBWYp5VIXwTwBTlcvmebi1l9njCUd2cPHX_ToW4rMSvPFKK79PgDeWhvqe8Wz7MlnuYBNDXzEluBxYFx_VC4AlCoVzrNlv5ad8Jh2rDjUeu_SrSK71_C_ikacQa614aP1mpfC-LTunzoXFn2pXa3IGGQoFClvkUjqB2zSu8DHnki6nzGkwJ35SpXEpPfrcsRO5UJaGcMF-QWjlEcKPy5EhlYNvd039PIkF9jSv8Xs4iIbxGcWW6nGXhyIeENvKA__61TMQzoVNvtTfypFb58zg-fdhfP9G6Ptfb5RA4Y; _EDGE_S=mkt=en-us&SID=1CF71372052E65030A9501A104566409&SetApplicationEndpoint=BNZEEAP000184D1; OIDI=ghC8TiG2SArTgP7njgKaCPVGFsWz8fYa1zM6nP84OB9Xo9z0HqPJVrzQUsTap2s5dCsvuzsZC4pyuVlK7-gQJezcRZCt5TnTl_xh2iY_OxEx79khck-02c_64UcThkKsy_tvf2kYGhaDtHKGfEwHEO3e5LV_MqiP0yPkV3A561x6Z6-FjocjC6YV-nLzG9Vy2PxkXovPRqjEUZCC2fV4iiWbpV8JoKTTb7vPF4Uk_L8pv0iiQWmDUEnrbzFqkZk1hc0J4DH2QmXZJBr7EmCTxEx3bXus55KFIfJ3wZ97Vp2ZVFX7Cg6Swk1CdXW40qsmuycfzEy3r8fQuGqweCa7gflvXdAU6RRlVA_7itUQ8fm-ON2Wwcor7V4Axr-zF8ic4dJfRgH8tEnuj6G3LSkz_KDJg5kkyOwrmLE6A3MTvoJpbkcsuOJ-s-M5lCLYzLoiwl77L1PJpGPxbHvHdSUWqLP1Ya0xXUo-GKy41vVbehMD62pp7fyvZvZF-qbkEeg2QTYIFrYR4ZZnVPaM-qeLVKZ-PYSSyOIhtPzuT204pa-Jkc_FiQ5IXKRugY9OSDIADBxL4Hflcm2BEUejUdRqzb6ukiBPR2r9Qs93MnLCJM4A3GJmDl4MnoZ4W4BsAqv_UEmHccyBw_eVsDp_jGJuLb5UkhnEHZdTHgwevo0QGkUgWP4mghfPBFbGtgS-s68PxgiS6nEH5u0si-7qgx0Bn9Loi4gJKbpxutlrNj2yTHtRp6fLBA3sRNpkpiRPEYWJh9azWfcwJc6pxukPgq_F_zKcigLJM8prZ3ygkgxIve-V84J25mT6OgWzMngYkhxZhQGnMSlZ1A9XjDz3ndC9IGGEktHQkX71WAeQjZjYdbEX5_Ynlq0jcemGcxQL0v4sEXowqGl7D3-wGi07UmuKoP8ptWCiFESsvsyZ3oePTESSlYfEUYTQn9tNghj3p-SjfKm6H1jQS5YIcrlcSx5jlRyc92JmFgs9R9e1vLAfE3Rsa1sTZDNU4fMajiKaVayIPQYXStCMgDkbFrrdb0rT3QB9Cd81y7CSKOovhPTRVqEWdJdWdmZ8ibGwWpgWwrfqsd5fAm6w1eoaKJqP0BcZDtoaXAIZmXskVMDNYgCTD2g8-iNgGiG2z0DglHPIqncDItZtYV654Iker6IzVkM3gDx_NZoYZyNdUzqehOeGV9IyRkc2Bx91xw2sZ-7KU_hJWABpq35ZydK5cXjkUVv8sHTlv8m5Gsp0S0TaI8UFruUS7UO9EszqzeMu8sT80YfPM3UZgKEx1Hp7ZahYCJ5MFoZJNNVsz23vvJBekuCgTLVXgK-FSAUxE5P6TWKmhwdTBsP5emmqwIKh0nyLkJq2-OJmUbyEA6C75qiZHDy1Rkpi2bNDYb7Woe9EbOSSlZApqpJ6U3Puwrts0eZm7njgz7BrDuaM7IHJCyqrU0Q_xOwgftI0S9jmZZCFXQcAX2_Sj6J5D_seLNYzWrcrbhpLxwssK9AuTKd-pdA8QcXTg1taa17nMic7wamd8K2rUNzZxA3eNBJUp-fYkT-ZE6BUlnhsGqY2CyY--8asraMHTaXikPmB-fBL1sq8ORpMFbmUa-eNS3iL1LeO4X1ZUAmsxpsVfE4ClMk266VEdqSiEBIakbVYTJhAFdc5u_MVuvjv8P9BS7ChnQTVR2HhYe6x7qCWhgHZp4355tGqZutULGWh3B7Ke73ia9Q1C8i9471IaBw0m4RKTbGo6ymKZTpJVhdHh7ogr36Jh7C2BlA70sxLd341lfswPdHKdDJ1ulvaGSurGfjhKPs7hI5y7qi1DpUY3vUQsN9DL2j5fUBLYgpU0R1iVL2rCP1hsY_XDHIjK_BsqNV3YIVRICaUMfq2J73IBtcS86eBUJWKjmBylecRmY2bF2ihHg8o5RIAx-NrV-I7c3JHidtZoSPQe1gIszdw-8uPdZzC-aOWbMc7-uyvOKB41ANjIcIgTchlAW-uFr363gqmJngYg4lp0X9rgPNjA4GAvIhE4qP-oHzAWLuHA4qCMe2L4T4GaA9Y0xJIwNhbjBze_qsXvUFM7proSM3OodrYN0Mp82jJLz07od6bdfJwBt_C_02FZsU24rd4arCU2F_V1q7H55O_QlWyxYs3Y-518cHqXKm37Di8vjMnADbFctax9DWNI7ruVr-aHSk`,
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
    "sec-ch-ua-arch": "\"x86\"",
    "sec-ch-ua-bitness": "\"64\"",
    "sec-ch-ua-full-version": "\"111.0.5563.65\"",
    "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"111.0.5563.65\", \"Not(A:Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"111.0.5563.65\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-ch-ua-platform-version": "\"15.0.0\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}).then(res => res.text()).then((html) => html)
        // const { data } = await axios.get("https://www.staging-bing-int.com/search?setapplicationendpoint=BNZEEAP000184D1&&q=mike%20youtube&cvid=05a227d0c0a24930963e4e12a49cc412&aqs=edge.0.69i59j46j69i57j46l2j0j46j0l2.1727j0j1&pglt=41&FORM=ANNAB1&PC=LCTS&testhooks=1&features=enblhp&tag&setmkt=en-us&setlang=&");
        const $ = cheerio.load(data);
        try {
            await searchElement($, resultAnalysis, url);
        } catch (e) {
            console.log(e);
        }
    } catch (e) {
        console.log(e);
    }
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