const cheerio = require('cheerio');
module.exports = async (url) => {
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