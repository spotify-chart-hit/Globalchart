const fs = require("fs");
const getToken =
require("./auto-token");

const sleep = ms =>
new Promise(resolve =>
setTimeout(resolve, ms)
);

async function getLatestDates(
token
){

let daily;
let weekly;

while(true){

daily =
await fetch(
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/regional-global-daily/latest",
{
headers:{
Authorization:
token
}
}
);

weekly =
await fetch(
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/regional-global-weekly/latest",
{
headers:{
Authorization:
token
}
}
);

if(
daily.status===429
||
weekly.status===429
){

console.log(
"429 latestDate 😭"
);

await sleep(
8000
);

continue;
}

break;

}

const dailyJson =
await daily.json();

const weeklyJson =
await weekly.json();

return{

daily:

dailyJson
?.displayChart
?.chartMetadata
?.dimensions
?.latestDate

||

dailyJson
?.displayChart
?.date,

weekly:

weeklyJson
?.displayChart
?.chartMetadata
?.dimensions
?.latestDate

||

weeklyJson
?.displayChart
?.date

};

}

async function scrape(
token
){

console.log(
"SCRAPING GLOBAL 😭🔥"
);

const results = {

updatedAt:
new Date()
.toISOString(),

song:{
daily:[],
weekly:[]
},

artist:{
daily:[],
weekly:[]
},

album:{
weekly:[]
}

};

const endpoints = [

{
type:"song",
mode:"daily",
url:
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/regional-global-daily/latest"
},

{
type:"song",
mode:"weekly",
url:
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/regional-global-weekly/latest"
},

{
type:"artist",
mode:"daily",
url:
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/artist-global-daily/latest"
},

{
type:"artist",
mode:"weekly",
url:
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/artist-global-weekly/latest"
},

{
type:"album",
mode:"weekly",
url:
"https://charts-spotify-com-service.spotify.com/auth/v0/charts/album-global-weekly/latest"
}

];

for(
const item
of endpoints
){

try{

console.log(
`CHECKING
${item.type}
${item.mode}`
);

let response =
await fetch(
item.url,
{
headers:{
Authorization:
token,
Accept:
"application/json"
}
}
);

while(
response.status===429
){

console.log(
`429 😭
${item.type}
${item.mode}`
);

await sleep(
8000
);

response =
await fetch(
item.url,
{
headers:{
Authorization:
token,
Accept:
"application/json"
}
}
);

}

if(
response.status!==200
){
continue;
}

const data =
await response
.json();

const entries =
data.entries
||
data.chartEntryViewResponses
||
[];
  for(
const entry
of entries
){

// SONG
if(
item.type
==="song"
){

const artists =
entry
.trackMetadata
?.artists
||
[];

const hasJimin =
artists.some(
artist =>
artist.name
?.toLowerCase()
===
"jimin"
);

if(
hasJimin
){

const currentRank =
entry
.chartEntryData
?.currentRank;

const previousRank =
entry
.chartEntryData
?.previousRank;

const rankChange =
previousRank
? Math.abs(
currentRank -
previousRank
)
: 0;

let direction =
"=";

if(
previousRank
){

if(
currentRank <
previousRank
){

direction =
"up";

}

else if(
currentRank >
previousRank
){

direction =
"down";

}

}

results
.song
[item.mode]
.push({

rank:
currentRank,

previousRank,

peakRank:

entry
.chartEntryData
?.peakRank,

appearances:

entry
.chartEntryData
?.appearancesOnChart,

streams:

entry
.chartEntryData
?.rankingMetric
?.value,

track:

entry
.trackMetadata
?.trackName,

artists:

artists.map(
a=>a.name
),

image:

entry
.trackMetadata
?.displayImageUri,

rankChange,
direction,

entryStatus:

entry
.chartEntryData
?.entryStatus

});

console.log(
`FOUND SONG 😭🔥
${entry.trackMetadata?.trackName}`
);

}

}

// ARTIST
if(
item.type
==="artist"
){

const artistName =
entry
.artistMetadata
?.artistName
?.toLowerCase();

if(
artistName
===
"jimin"
){

results
.artist
[item.mode]
.push({

rank:

entry
.chartEntryData
?.currentRank,

previousRank:

entry
.chartEntryData
?.previousRank,

peakRank:

entry
.chartEntryData
?.peakRank,

appearances:

entry
.chartEntryData
?.appearancesOnChart,

artist:

entry
.artistMetadata
?.artistName,

image:

entry
.artistMetadata
?.visualIdentity
?.imageUri

});

console.log(
"FOUND ARTIST 😭🔥"
);

}

}

// ALBUM
if(
item.type
==="album"
){

const artists =
entry
.albumMetadata
?.artists
||
[];

const hasJimin =
artists.some(
artist =>
artist.name
?.toLowerCase()
===
"jimin"
);

if(
hasJimin
){

results
.album
.weekly
.push({

rank:

entry
.chartEntryData
?.currentRank,

previousRank:

entry
.chartEntryData
?.previousRank,

peakRank:

entry
.chartEntryData
?.peakRank,

appearances:

entry
.chartEntryData
?.appearancesOnChart,

album:

entry
.albumMetadata
?.albumName,

artists:

artists.map(
a=>a.name
),

image:

entry
.albumMetadata
?.coverArtUri

});

console.log(
`FOUND ALBUM 😭🔥
${entry.albumMetadata?.albumName}`
);

}

}

}

await sleep(
800
);

}catch(err){

console.log(
err.message
);

}

}

fs.writeFileSync(
"global-chart.json",
JSON.stringify(
results,
null,
2
)
);

console.log(
"UPDATED global-chart.json 😍"
);

  }
async function start(){

const token =
await getToken();

let savedDates =
null;

if(
fs.existsSync(
"global-chart-dates.json"
)
){

savedDates =
JSON.parse(
fs.readFileSync(
"global-chart-dates.json"
)
);

}

const latest =
await getLatestDates(
token
);

const firstRun =

!savedDates

||

!fs.existsSync(
"global-chart.json"
);

if(
firstRun
){

console.log(
"FIRST RUN 😍"
);

await scrape(
token
);

fs.writeFileSync(
"global-chart-dates.json",
JSON.stringify(
latest,
null,
2
)
);

return;

}

const changed =

latest.daily
!==
savedDates.daily

||

latest.weekly
!==
savedDates.weekly;

if(
changed
){

console.log(
"NEW GLOBAL CHART 😍"
);

await scrape(
token
);

fs.writeFileSync(
"global-chart-dates.json",
JSON.stringify(
latest,
null,
2
)
);

}

else{

console.log(
"SAME GLOBAL 😴"
);

}

}

start();
  
