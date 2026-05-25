const { chromium } =
require("playwright");

async function getToken() {

const browser =
await chromium.launch({

headless: true

});

try {

const context =
await browser.newContext({

storageState:
"auth.json"

});

const page =
await context.newPage();

let token = null;

page.on(

"request",

request => {

const url =
request.url();

const auth =
request.headers()
.authorization;

if (

url.includes(
"charts-spotify-com-service.spotify.com/auth/v0/charts"
)

&&

auth?.startsWith(
"Bearer "
)

) {

token = auth;

}

}

);

await page.goto(

"https://charts.spotify.com/charts/view/artist-global-weekly/latest",

{

waitUntil:
"networkidle"

}

);

await page.waitForTimeout(
3000
);

if (!token) {

throw new Error(
"NO TOKEN FOUND 😭"
);

}

return token;

}

finally {

await browser.close();

}

}

module.exports =
getToken;
