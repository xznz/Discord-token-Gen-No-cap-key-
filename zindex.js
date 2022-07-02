const setTitle = require('node-bash-title');
setTitle('AYU GEN | DM me if you need more tools');
// Libs
const crypto = require("crypto")
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer')
const {fetch} = require('cross-fetch')
const fs = require('fs')
const config = require('./config.json');
const colors = require('colors')
const { title } = require("process")

// Settings
const captchakey = ''
const BROWSER_CONFIG = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=950,0',
    '--window-size=500,800',
  ],
  defaultViewport: null,
  ignoreHTTPSErrors: true,
  headless: false,
}

// Init plugins
puppeteer.use(StealthPlugin())

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: captchakey,
    },
    visualFeedback: true,
    throwOnError: true
  })
)

// Console logs
const accounts = fs.createWriteStream('accounts.txt', {flags:'a'})
const tokens = fs.createWriteStream('tokens.txt', {flags:'a'})

async function dsne(page, infoname, info){
  const p = await page.$('input[name=' + infoname + ']');
  await p.focus();
  await page.keyboard.type(info);
}

async function cli(page, name, min, max) {
  var i = await page.$('[class*=input' + name + "]");
  if (i === null) {
    i = await page.$("[class*=" + name + "]");
  }
  await i.click();
  var r = Math.floor(Math.random() * (max - min + 1)) + min;

  await page.waitForSelector('[class*=option]');
  await page.$eval("[class$=option]", function(e, r){e.parentNode.childNodes[r].click()}, r);

  return r
}

async function discordInput(dspagee, username, password, email){
  await dspagee.bringToFront();
  await dspagee.goto('https://discord.com/register', {"waitUntil" : "networkidle0", timeout: 70000});

  await cli(dspagee, "year", 17, 24);
  await cli(dspagee, "day", 0, 28);
  await cli(dspagee, "month", 0, 11);

  dspagee.waitForSelector('input[type*=checkbox]').then(() => {
    dspagee.$eval('input[type*=checkbox]', el => el.click());
  }).catch(e => {});

  await dsne(dspagee, "username", username);
  await dsne(dspagee, "password", password);
  await dsne(dspagee, "email", email);
  await dspagee.$eval('button[type=submit]', (el) => el.click());

}

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function captchaby(DiscordPage){
  try {
    await DiscordPage.waitForSelector('[src*=sitekey]');
    await DiscordPage.addScriptTag({content: `hcaptcha.execute()`})

    while(true){
      try{
        await DiscordPage.solveRecaptchas();
        return true;
      } catch(err) {
        sleep(3000);
      }
    }
  } catch(e){
  };
}


async function generate_email(MailPage){
  console.log("[STARTED]".brightGreen);
  PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(MailPage);
  });

  await MailPage.bringToFront();
  await MailPage.goto("https://temp-mail.org/", { waitUntil: 'networkidle2', timeout: 0});
  var info_id = "#mail";

  try {
    await MailPage.waitForSelector(info_id);
    await MailPage.waitForFunction((info_id) => document.querySelector(info_id).value.indexOf("@") != -1, {}, info_id);
    
    var email = await MailPage.$eval('#mail', el => el.value);
    return email;
  } catch(e){
    console.log("Found error - Mail generation");
    return false;
  };
}

async function emailvery(MailPage){
  console.log("[EMAIL IS ON VERIFY]".brightGreen);
  await MailPage.bringToFront();

  while(true){
    await MailPage.mouse.wheel({ deltaY: (Math.random()-0.5)*200 });

    try {
      await MailPage.waitForSelector('[title*=Discord]', {timeout: 500});
      sleep(1000);
      await MailPage.$eval('[title*=Discord]', e => e.parentNode.click());
    
      await MailPage.waitForSelector("td > a[href*='discord'][style*=background]");
      const elem = await MailPage.$eval("td > a[href*='discord'][style*=background]", el => el.href);
    
      return elem;
    } catch(e){};
  }
}

async function verif2(chrom, link){
  const page = await chrom.newPage();
  await page.goto(link, {"waitUntil" : "networkidle0", "timeout": 60000});
  captchaby(page);
  }

function getRandomUsername() {
  var lines = fs.readFileSync("usernames.txt").toString().split('\n');
  return lines[Math.floor(Math.random()*lines.length)];
}

async function create_accinfos(browser, d) {

  // Variables importantes
  const username = getRandomUsername();
  const password = crypto.randomBytes(16).toString('hex');
  const MailPage = (await browser.pages())[0];
  var email;

  while(!email){
    try {
      email = await generate_email(MailPage);
    } catch(e){};
  }

  console.log(`USER: ${username}`.brightGreen);
  console.log(`PASS: ${password}`.brightWhite);
  console.log(`MAIL: ${email}`.brightRed);

  // Create acc, pass captcha
  const DiscordPage = d;
  await discordInput(DiscordPage, username, password, email);

  const client = d._client;
  var token;

  client.on('Network.webSocketFrameSent', ({response}) => {
    try {
      const json = JSON.parse(response.payloadData);
      if(!token && json["d"]["token"]){
        token = json["d"]["token"];
        console.log(`[Token: ${token}]`.brightWhite);
        tokens.write(`${token}` + "\n");
        fetch(`https://discord.com/api/v8/invites/${config.code}}`, {
          method: 'POST',
          headers: {
            authorization: `${token}`,
          },
        }).then(userRes => userRes.json())
                    .then(console.log("[JOIN TO SERVER SUCCEED]"));
      };
    } catch(e){};
  })
  await captchaby(DiscordPage);

  // Verify email
  let verifyy = await emailvery(MailPage);
  await verif2(browser, verifyy);
  console.error("[ACCOUNTE VERIFY]".brightBlue);

  if(!token){
    console.log("Token not found, trying to get it")
    await DiscordPage.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  };

  return `${email}:${username}:${password}:${token}`;
}

(async () => {
  console.log('  ░█████╗░██╗░░░██╗██╗░░░██╗  ░██████╗░███████╗███╗░░██╗'.brightPink);
  console.log('  ██╔══██╗╚██╗░██╔╝██║░░░██║  ██╔════╝░██╔════╝████╗░██║'.brightPurple);
  console.log('  ███████║░╚████╔╝░██║░░░██║  ██║░░██╗░█████╗░░██╔██╗██║'.brightPink);
  console.log('  ██╔══██║░░╚██╔╝░░██║░░░██║  ██║░░╚██╗██╔══╝░░██║╚████║'.brightPurple);
  console.log('  ██║░░██║░░░██║░░░╚██████╔╝  ╚██████╔╝███████╗██║░╚███║║'.brightPink);
  console.log('  ╚═╝░░╚═╝░░░╚═╝░░░░╚═════╝░  ░╚═════╝░╚══════╝╚═╝░░╚══╝'.brightPurple);
     
     console.log("Name : Ayu Gen".brightGreen);
     console.log("Maker : Ayu#6969".brightWhite);
     

     sleep(3);



  const browser = await puppeteer.launch(BROWSER_CONFIG);

  try {
    const page = await browser.newPage();
  

    await page.goto('http://httpbin.org/ip');
    const infos = await create_accinfos(browser, page);
    console.log("[SAVING INFORMATION]".brightRed);
    accounts.write(infos + "\n");
  } catch(e) {
    console.log(e);
  } finally {
    console.log("[DONE]".brightRed);
    try{
      browser.close();
    } catch(e){};
	setTimeout(function(){


    }, 120000); 
  }
})();

