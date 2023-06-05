const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const corsOptions = require('./config/corsOptions')



const auth = 'brd-customer-hl_ab1190c6-zone-scraping_browser:jlres78sa3q0';
const app = express();
const port = 3000;
app.use(cors(corsOptions));
app.use(express.json());
// Use helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      upgradeInsecureRequests: [],
    },
  },
}));

app.post('/api/scrape', async (req, res) => {
  const { firstName, lastName, emailAddress, birthDay, zipCode } = req.body;



  try {
    if (!firstName || !lastName || !emailAddress || !birthDay || !zipCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let quoteCount = 0;
    const browser = await puppeteer.launch({ 
     //  headless: false 
    });

     const progressiveQuoteDate = await progressive(browser, lastName, emailAddress, birthDay, zipCode);
     const geicoQuoteDate = await geico(browser, lastName, emailAddress, birthDay, zipCode);
     const stateFarmQuoteDate = await stateFarm(browser, firstName, lastName, emailAddress, birthDay, zipCode);
   // const farmersQuoteDate = await farmers(browser, lastName, emailAddress, birthDay, zipCode);
    
    if (progressiveQuoteDate) {
        quoteCount++;
      }
      if (geicoQuoteDate) {
        quoteCount++;
      }
    //   if (allstateQuoteDate) {
    //     quoteCount++;
    //   }
      if (stateFarmQuoteDate) {
        quoteCount++;
      }
    //   if (farmersQuoteDate) {
    //     quoteCount++;
    //   }
    //   if (travelersQuoteDate) {
    //     quoteCount++;
    //   }

    await browser.close();

    res.json({ quoteDate: quoteCount });
  } catch (error) {
    console.error('Puppeteer error:', error);
    res.status(500).json({ error: 'An error occurred during scraping' });
  }
});

const progressive = async (browser, lastName, emailAddress, birthDay, zipCode) => {
  const page = await browser.newPage();
  await page.goto('https://progressive.com/home-retrieve/');
  await page.waitForSelector('input#lastName-email');
  await page.type('input#lastName-email', lastName);
  await page.type('input#emailAddress-email', emailAddress);
  await page.type('input#birthDate-email', birthDay);
  await page.type('input#zipCode-email', zipCode);
  await page.click('#qsButton-email');


await page.waitForTimeout(3000);
  const noQuote = '.title';


  if (await page.$(noQuote)) {
    console.log('You got NO quote!');
    return null;
  } else {
    const progressiveQuoteDate = true;
    console.log(`Progressive: ${progressiveQuoteDate}`);
    return progressiveQuoteDate;
  }
};

const geico = async (browser, lastName, emailAddress, birthDay, zipCode) => {
  const page2 = await browser.newPage();
  await page2.goto('https://sales.geico.com/recall');
  await page2.waitForSelector('input#email');
  await page2.type('input#email', emailAddress);
  await page2.type('input#dateOfBirth', birthDay);
  await page2.type('input#lastName', lastName);
  await page2.type('input#zipCode', zipCode);
  await page2.click('button.btn.btn--primary.btn--full-mobile.btn--pull-right');
  await page2.waitForTimeout(5000);

  const noQuote = '.alert--medium-importance';

  if (await page2.$(noQuote)) {
    console.log('No recent Geico quotes!');
    return null;
  } else {
    const geicoQuoteDate = true;
    console.log(`Geico: ${geicoQuoteDate}`);
    return geicoQuoteDate;
  }
};

const allstate = async (browser, lastName, emailAddress, birthDay, zipCode) => {
  const page3 = await browser.newPage();
  await page3.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36');
  await page3.goto('https://allstate.com');
  await page3.waitForSelector('a[id="1a3a317d-19e7-4ece-9251-0f01d4b7efa6promo-hero-quote-link"]');
  await page3.click('a[id="1a3a317d-19e7-4ece-9251-0f01d4b7efa6promo-hero-quote-link"]');
  await page3.waitForTimeout(1000);
  await page3.waitForSelector('input#last_name');
  await page3.type('input#last_name', lastName);
  await page3.type('input#dob', birthDay);
  await page3.type('input#email', emailAddress);
  await page3.type('input#zip', zipCode);
  await page3.click('#btnRetrieveQuote');

  const noQuote = '.message__bd';

  if (await page3.$(noQuote)) {
    console.log('You got NO quote!');
    return null;
  } else {
    const allstateQuoteDate = true;
    console.log(`Allstate: ${allstateQuoteDate}`);
    return allstateQuoteDate;
  }
};

const stateFarm = async (browser, firstName, lastName, emailAddress, birthDay, zipCode) => {
  const page4 = await browser.newPage();
  await page4.goto('https://apps.statefarm.com/retrieve-saved-quotes/');
  await page4.waitForSelector('#firstNameTextField-input');
  await page4.type('#firstNameTextField-input', firstName);
  await page4.type('#lastNameTextField-input', lastName);
  await page4.type('#birthdateTextField-input', birthDay, { delay: 169 });
  await page4.type('#emailTextField-input', emailAddress);
  await page4.waitForXPath('//*[@id="getSavedQuoteScreen-primary-button"]/button');
  const buttonElement = await page4.$x('//*[@id="getSavedQuoteScreen-primary-button"]/button');
  await buttonElement[0].click();
  await page4.waitForTimeout(2000);

  const noQuote = 'section.-oneX-notification__text[role="alert"]';
  if (await page4.$(noQuote)) {
    console.log('No recent state farm quotes!');
    return null;
  } else {
    const stateFarmQuoteDate = true;
    console.log(`State Farm: ${stateFarmQuoteDate}`);
    return stateFarmQuoteDate;
  }
};

const farmers = async (browser, lastName, emailAddress, birthDay, zipCode) => {
  const page5 = await browser.newPage();
  await page5.goto('https://esales.farmers.com/fastquote/');
  await page5.waitForXPath('//*[@id="ffq-app-container"]/app-landing/div/div/div[2]/div[1]/div[2]/div[1]/div[2]/h1');
  const headerElement = await page5.$x('//*[@id="ffq-app-container"]/app-landing/div/div/div[2]/div[1]/div[2]/div[1]/div[2]/h1');
  if (headerElement[0]) {
    await headerElement[0].click();
  }

  const lastNameElement = (await page5.$x('//*[@id="mat-input-1"]'))[0];
  await lastNameElement.type(lastName);
  const emailAddressElement = (await page5.$x('//*[@id="mat-input-3"]'))[0];
  await emailAddressElement.type(emailAddress);
  const birthDayElement = (await page5.$x('//*[@id="mat-input-2"]'))[0];
  await birthDayElement.type(birthDay);
  const zipCodeElement = (await page5.$x('//*[@id="mat-input-4"]'))[0];
  await zipCodeElement.type(zipCode);

  const buttonElement = await page5.$x('//*[@id="ffq-tab-panel-2"]/div/form/div[5]/button');
  await buttonElement[0].click();

await page5.waitForTimeout(5000);
const noQuote = '//*[@id="landingErrorInfoHeading"]';
if ( await page5.waitForXPath('//*[@id="landingErrorInfoHeading"]'))
{
  console.log('No recent farmers quotes!');
  return null; // Return null if there is no quote
  
}
else {
  const farmersQuoteDate = true;
  console.log(`Farmers: ${farmersQuoteDate}`);
}


//   if (await page5.$(noQuote)) {
//     console.log('No recent farmers quotes!');
//     return null;
//   } else {
//     const farmersQuoteDate = true;
//     console.log(`Farmers: ${farmersQuoteDate}`);
//     return farmersQuoteDate;
//   }
};

const travelers = async (browser, lastName, emailAddress, birthDay, zipCode) => {
  const page6 = await browser.newPage();
  await page6.goto('https://pijas.travelers.com/get-a-quote-now/entry.html?path=RETRIEVE');
  await page6.waitForSelector('input#email');
  await page6.type('input#email', emailAddress);
  await page6.type('input#lastName', lastName);
  await page6.type('input#zip', zipCode);
  const [birthMonth, birthDate, birthYear] = birthDay.split('/');
  await page6.type('input#dobMonth', birthMonth);
  await page6.type('input#dobDay', birthDate);
  await page6.type('input#dobYear', birthYear);
  await page6.waitForXPath('//*[@id="continue"]');
  const [buttonElement] = await page6.$x('//*[@id="continue"]');
  await buttonElement.click();

  console.log("SUCCESS!!!!!")
  await page6.waitForTimeout(5000);
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
