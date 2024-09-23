const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');
const { put } = require('@vercel/blob');
const express = require('express');
const app = express();
require('dotenv').config();
const port = 3001;

async function getBrowser() {
  return puppeteer.launch({
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar`
    ),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

app.get('/triggerScrape', async (req, res) => {
    console.log("In scrape");
    (async () => {
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.evaluateHandle('document.fonts.ready');
        await page.setViewport({ width: 1180, height: 920 });
        const website_url = 'https://www.snow-forecast.com/resorts/Turoa/6day/mid';
        const divCoverSelector = "#forecast-table > div > div";
    
        await page.goto(website_url, { waitUntil: 'networkidle0' });    
        const targetElement = await page.$(divCoverSelector);
        await targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
        await page.evaluate((sel) => {
            var elements = document.querySeldectorAll(sel);
            for(var i=0; i< elements.length; i++){
                elements[i].parentNode.removeChild(elements[i]);
            }
        }, divCoverSelector)
    
        var oDate = new Date();
        var sDate = oDate.getDate() + "-" + (oDate.getMonth() - 1) + "-" + oDate.getFullYear()
    
        const screenshotBuffer = await page.screenshot();
        const { url } = await put(`turoaScrapes/${sDate}_weather.jpg`, screenshotBuffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    
        const report_url = 'https://www.pureturoa.nz/turoa-report';
        await page.goto(report_url, { waitUntil: 'networkidle0' });
        const reportScreenshotBuffer = await page.screenshot();   
        const { reportUrl } = await put(`turoaScrapes/${sDate}_report.jpg`, reportScreenshotBuffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    
        await browser.close();
        res.json({output: "Complete"});
    })();
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
}) 

module.exports = app;