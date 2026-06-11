const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Cache rates for 5 minutes to avoid overloading source
let cachedRates = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Currency name mapping: Arabic keyword → English key
const CURRENCY_MAP = {
    'دولار امريكي': 'USD',
    'دولار أمريكي': 'USD',
    'ريال سعودي': 'SAR',
    'يورو': 'EUR',
    'جنيه استرليني': 'GBP',
    'درهم اماراتي': 'AED',
    'دينار كويتي': 'KWD',
    'ريال عماني': 'OMR',
    'ريال قطري': 'QAR',
    'دينار بحريني': 'BHD',
    'جنيه مصري': 'EGP',
    'ليرة تركي': 'TRY',
    'ليرة تركية': 'TRY',
    'دينار عراقي': 'IQD',
    'دينار اردني': 'JOD',
    'دينار أردني': 'JOD',
    'روبية هندي': 'INR',
    'روبية هندية': 'INR',
    'يوان صيني': 'CNY',
    'رنجت ماليزي': 'MYR',
    'دولار كندي': 'CAD',
    'دولار استرالي': 'AUD',
    'فرنك سويسري': 'CHF',
    'كرونة سويدية': 'SEK',
    'كرون نرويجي': 'NOK',
    'روبل روسي': 'RUB',
    'وون كوري': 'KRW',
    'بات تايلاندي': 'THB',
    'بيزو فلبيني': 'PHP',
    'راند جنوب افريقي': 'ZAR',
    'راند جنوب أفريقي': 'ZAR',
    'ريال مغربي': 'MAD',
    'دينار جزائري': 'DZD',
    'دينار ليبي': 'LYD',
    'شلن صومالي': 'SOS',
    'جنيه سوداني': 'SDG',
};

function detectCurrency(arabicName) {
    for (const [arabic, code] of Object.entries(CURRENCY_MAP)) {
        if (arabicName.includes(arabic)) return code;
    }
    return null;
}

// Core function to fetch and parse rates from khbr.me
async function fetchRates() {
    const { data } = await axios.get('https://www.khbr.me/rate.html', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
    });

    const $ = cheerio.load(data);

    let exchangeData = {
        aden: { YER: 1 },
        sanaa: { YER: 1 }
    };

    // Find all rates sections
    $('div.rates-section').each((index, element) => {
        // Determine region from city name in header
        const cityName = $(element).find('h2.city-name').text().trim();
        let region = null;
        if (cityName.includes('عدن')) region = 'aden';
        else if (cityName.includes('صنعاء')) region = 'sanaa';
        // Skip non-city sections (e.g., gold prices)
        if (!region) return;

        // Parse each row in the table
        $(element).find('table.rates-table tbody tr').each((trIndex, trElement) => {
            const cells = $(trElement).find('td');
            if (cells.length >= 4) {
                // Cell 0: currency name (inside span.currency-name)
                const currencyName = $(cells[0]).find('span.currency-name').text().trim();
                // Cell 1: sell price (inside span.price-value)
                const sellText = $(cells[1]).find('span.price-value').text().trim().replace(/,/g, '');
                // Cell 3: buy price (inside span.price-value)
                const buyText = $(cells[3]).find('span.price-value').text().trim().replace(/,/g, '');

                const sellPrice = parseFloat(sellText);
                const buyPrice = parseFloat(buyText);

                const currencyCode = detectCurrency(currencyName);
                if (currencyCode && !isNaN(sellPrice) && !isNaN(buyPrice)) {
                    exchangeData[region][currencyCode] = {
                        buy: buyPrice,
                        sell: sellPrice,
                        name: currencyName
                    };
                }
            }
        });
    });

    return {
        success: true,
        base_currency: "YER",
        updated_at: new Date().toISOString(),
        rates: exchangeData
    };
}

// Get fresh or cached rates
async function getRates() {
    if (cachedRates && (Date.now() - lastFetch) < CACHE_DURATION) {
        return cachedRates;
    }

    try {
        cachedRates = await fetchRates();
        lastFetch = Date.now();
        return cachedRates;
    } catch (error) {
        // Return stale cache on error
        if (cachedRates) {
            return { ...cachedRates, cached: true, error: error.message };
        }
        throw error;
    }
}

// Main rates endpoint
app.get('/api/rates', async (req, res) => {
    try {
        const ratesData = await getRates();
        res.json(ratesData);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Region-specific rates endpoint
app.get('/api/rates/:region', async (req, res) => {
    try {
        const region = req.params.region;
        if (!['aden', 'sanaa'].includes(region)) {
            return res.status(400).json({ success: false, error: 'Invalid region. Use "aden" or "sanaa".' });
        }

        const ratesData = await getRates();

        res.json({
            success: true,
            base_currency: "YER",
            region: region,
            updated_at: ratesData.updated_at,
            rates: ratesData.rates[region]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Convert amount between currencies
app.get('/api/convert', async (req, res) => {
    try {
        const { from, to, amount, region = 'aden' } = req.query;

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing parameters. Required: from, to, amount. Optional: region (aden|sanaa)'
            });
        }

        if (!['aden', 'sanaa'].includes(region)) {
            return res.status(400).json({ success: false, error: 'Invalid region. Use "aden" or "sanaa".' });
        }

        const ratesData = await getRates();
        const rates = ratesData.rates[region];
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount)) {
            return res.status(400).json({ success: false, error: 'Amount must be a number.' });
        }

        let result;

        if (from === 'YER' && rates[to]) {
            // Convert from YER to foreign currency (use sell rate)
            result = numAmount / rates[to].sell;
        } else if (to === 'YER' && rates[from]) {
            // Convert from foreign currency to YER (use buy rate)
            result = numAmount * rates[from].buy;
        } else if (rates[from] && rates[to]) {
            // Convert via YER: foreign1 → YER → foreign2
            const inYER = numAmount * rates[from].buy;
            result = inYER / rates[to].sell;
        } else {
            return res.status(400).json({
                success: false,
                error: `Unsupported currency. Available: YER, ${Object.keys(rates).filter(k => k !== 'YER').join(', ')}`
            });
        }

        res.json({
            success: true,
            from,
            to,
            amount: numAmount,
            result: Math.round(result * 100) / 100,
            region,
            rate_date: ratesData.updated_at
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        last_update: lastFetch ? new Date(lastFetch).toISOString() : null,
        cache_status: cachedRates ? 'populated' : 'empty'
    });
});

app.listen(PORT, () => {
    console.log(`Yemen Exchange Rate API running on port ${PORT}`);
});
