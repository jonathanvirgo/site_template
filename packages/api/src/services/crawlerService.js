import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { downloadImages } from './imageService.js';

/**
 * Crawl a single URL and extract content
 */
export async function crawlUrl(url, options = {}) {
    const {
        waitForSelector = 'body',
        timeout = 30000,
        extractImages = true,
        downloadImagesLocal = false,
    } = options;

    let browser;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ]
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Navigate to URL
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout,
        });

        // Wait for content
        try {
            await page.waitForSelector(waitForSelector, { timeout: 5000 });
        } catch {
            // Continue even if selector not found
        }

        // Get page content
        const html = await page.content();
        const $ = cheerio.load(html);

        // Extract title
        const title = $('title').text() ||
            $('h1').first().text() ||
            $('meta[property="og:title"]').attr('content') ||
            'Untitled';

        // Extract meta description
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            '';

        // Extract main content
        // Try common content selectors
        const contentSelectors = [
            'article',
            '[role="main"]',
            'main',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '#content',
        ];

        let content = '';
        for (const selector of contentSelectors) {
            const element = $(selector);
            if (element.length) {
                // Remove scripts, styles, nav, etc.
                element.find('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement').remove();
                content = element.html();
                break;
            }
        }

        // Fallback to body if no content found
        if (!content) {
            $('body').find('script, style, nav, header, footer, aside, .sidebar').remove();
            content = $('body').html();
        }

        // Clean up content
        content = cleanHtml(content);

        // Extract images
        let images = [];
        if (extractImages) {
            const imgElements = $('img');
            imgElements.each((_, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src) {
                    const absoluteUrl = new URL(src, url).href;
                    images.push({
                        url: absoluteUrl,
                        alt: $(el).attr('alt') || '',
                    });
                }
            });

            // Remove duplicates
            images = [...new Map(images.map(img => [img.url, img])).values()];

            // Download images locally if requested
            if (downloadImagesLocal && images.length > 0) {
                const downloadResults = await downloadImages(images.slice(0, 50)); // Limit to 50 images
                images = downloadResults
                    .filter(r => r.success)
                    .map(r => ({
                        original: r.original.url,
                        local: r.url,
                        alt: r.original.alt,
                    }));
            }
        }

        // Extract metadata
        const metadata = {
            description,
            keywords: $('meta[name="keywords"]').attr('content') || '',
            author: $('meta[name="author"]').attr('content') || '',
            ogImage: $('meta[property="og:image"]').attr('content') || '',
            canonical: $('link[rel="canonical"]').attr('href') || url,
        };

        return {
            url,
            title: title.trim(),
            content,
            images,
            metadata,
            crawledAt: new Date().toISOString(),
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Crawl multiple pages from a website
 */
export async function crawlWebsite(startUrl, options = {}) {
    const {
        maxPages = 10,
        followLinks = true,
        urlPattern = null,
    } = options;

    const visited = new Set();
    const results = [];
    const queue = [startUrl];

    while (queue.length > 0 && results.length < maxPages) {
        const url = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);

        try {
            const result = await crawlUrl(url, options);
            results.push(result);

            // Extract links for further crawling
            if (followLinks && results.length < maxPages) {
                const $ = cheerio.load(result.content);
                $('a[href]').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href) {
                        try {
                            const absoluteUrl = new URL(href, url).href;
                            const isSameDomain = new URL(absoluteUrl).hostname === new URL(startUrl).hostname;

                            if (isSameDomain && !visited.has(absoluteUrl)) {
                                if (!urlPattern || absoluteUrl.match(urlPattern)) {
                                    queue.push(absoluteUrl);
                                }
                            }
                        } catch {
                            // Invalid URL, skip
                        }
                    }
                });
            }
        } catch (error) {
            console.error(`Error crawling ${url}:`, error.message);
        }
    }

    return results;
}

/**
 * Clean HTML content
 */
function cleanHtml(html) {
    if (!html) return '';

    const $ = cheerio.load(html);

    // Remove empty elements
    $('*').each((_, el) => {
        const $el = $(el);
        if (!$el.text().trim() && !$el.find('img, video, iframe').length) {
            $el.remove();
        }
    });

    // Remove excessive whitespace
    return $.html()
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
}

export default {
    crawlUrl,
    crawlWebsite,
};
