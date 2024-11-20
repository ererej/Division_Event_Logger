const cheerio = require('cheerio');

async function fetchMetadata(url) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const body = await response.text();
    const $ = cheerio.load(body);

    const metadata = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text(),
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      url: $('meta[property="og:url"]').attr('content') || url
    };

    return metadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

const url = 'https://www.roblox.com/games/9559929713/Trident-Battlegrounds-III?privateServerLinkCode=99137534053693667377594524231257';
fetchMetadata(url).then(metadata => {
  if (metadata) {
    let gameName = metadata.description.split('Check out ')[1];
    gameName = gameName.split('.')[0]
    console.log(gameName);
  } else {
    console.log('Failed to fetch metadata.');
  }
});