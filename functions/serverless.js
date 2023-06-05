const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    context.callbackWaitsForEmptyEventLoop = true;
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  const { firstName, lastName, emailAddress, birthDay, zipCode } = JSON.parse(event.body);

  try {
    if (!firstName || !lastName || !emailAddress || !birthDay || !zipCode) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
      headless: true,
    });

    const progressiveQuoteDate = await progressive(browser, lastName, emailAddress, birthDay, zipCode);
    const geicoQuoteDate = await geico(browser, lastName, emailAddress, birthDay, zipCode);
    const stateFarmQuoteDate = await stateFarm(browser, firstName, lastName, emailAddress, birthDay, zipCode);

    await browser.close();

    const quoteCount = (progressiveQuoteDate ? 1 : 0) + (geicoQuoteDate ? 1 : 0) + (stateFarmQuoteDate ? 1 : 0);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ quoteDate: quoteCount }),
    };
  } catch (error) {
    console.error('Puppeteer error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'An error occurred during scraping' }),
    };
  }
};

// Rest of the code...




async function progressive(browser, lastName, emailAddress, birthDay, zipCode) {
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
}

async function geico(browser, lastName, emailAddress, birthDay, zipCode) {
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
}

async function stateFarm(browser, firstName, lastName, emailAddress, birthDay, zipCode) {
  const page3 = await browser.newPage();
  await page3.goto('https://www.statefarm.com/insurance/auto/quote');
  await page3.waitForSelector('#quoteFirstName');
  await page3.type('#quoteFirstName', firstName);
  await page3.type('#quoteLastName', lastName);
  await page3.type('#quoteEmailAddress', emailAddress);
  await page3.type('#quoteDob', birthDay);
  await page3.type('#quoteZipCode', zipCode);
  await page3.click('#AutoQuoteContinue');
  await page3.waitForTimeout(5000);

  const noQuote = '.AutoQuoteError';

  if (await page3.$(noQuote)) {
    console.log('No State Farm quote!');
    return null;
  } else {
    const stateFarmQuoteDate = true;
    console.log(`State Farm: ${stateFarmQuoteDate}`);
    return stateFarmQuoteDate;
  }
}
