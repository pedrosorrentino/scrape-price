import { totalItems } from '@/components/ProductList';
import { userAgentsPlaywright } from '@/libs/user-agent';
import { chromium, Page } from 'playwright';

export interface PccomponentesProduct {
  title: string;
  reviewCount: number;
  priceOffer: number;
  priceOriginal: number;
  link: string;
  imageUrl: string;
}

const config = {
  baseUrl: 'https://www.pccomponentes.com',
  timeout: 10000,
};

async function acceptCookies(page: Page): Promise<void> {
  const acceptCookiesButton = await page.$('#cookiesrejectAll');
  if (acceptCookiesButton) {
    await acceptCookiesButton.click();
    await page.waitForTimeout(1000);
  }
}

function titleContainsKeyword(title: string, keyword: string): boolean {
  const titleLower = title.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const keywordParts = keywordLower.split(' ');

  let currentIndex = 0;
  for (const part of keywordParts) {
    const index = titleLower.indexOf(part, currentIndex);
    if (index === -1) {
      return false;
    }
    currentIndex = index + part.length;
  }
  return true;
}

async function extractProductData(
  page: Page,
  searchText: string
): Promise<PccomponentesProduct[]> {
  const products: PccomponentesProduct[] = [];
  const productsSelector = page.locator('#search-results-product-grid');
  const productsList = await productsSelector
    .locator('[data-testid="normal-link"]')
    .all();

  for (const item of productsList.slice(0, totalItems)) {
    const title = (await item.getByRole('heading').textContent()) || '';
    if (!titleContainsKeyword(title, searchText)) {
      continue;
    }

    const url = (await item.getAttribute('href')) || '';
    const image = (await item.locator('img').getAttribute('src')) || '';
    const reviewSelector = await item
      .locator('.product-card__rating-container')
      .allTextContents();
    const reviewCountText = reviewSelector.toString().replace(/[()]/g, '');
    const reviewCount = parseInt(reviewCountText) || 0;

    const priceSelector = await item.getByText('€').allTextContents();
    const priceOffer = priceSelector[0]
      ? parseFloat(priceSelector[0].replace(/[^0-9,.]+/g, '').replace(',', '.'))
      : 0;
    const priceOriginal = priceSelector[1]
      ? parseFloat(priceSelector[1].replace(/[^0-9,.]+/g, '').replace(',', '.'))
      : 0;

    products.push({
      title,
      reviewCount,
      priceOffer,
      priceOriginal,
      link: url,
      imageUrl: image,
    });
  }
  return products;
}

export async function GET(req: Request): Promise<Response> {
  let products: PccomponentesProduct[] = [];
  let error: string | null = null;
  let message: string | null = null;

  const { searchParams } = new URL(req.url);
  const searchText = searchParams.get('search') || '';

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    userAgent:
      userAgentsPlaywright[
        Math.floor(Math.random() * userAgentsPlaywright.length)
      ],
  });

  try {
    const searchUrl = `${config.baseUrl}/search/?query=${searchText.replaceAll(
      ' ',
      '+'
    )}`;
    await page.goto(searchUrl, {
      timeout: config.timeout,
      waitUntil: 'networkidle',
    });

    await acceptCookies(page);

    products = await extractProductData(page, searchText);
  } catch (err) {
    console.error('Ocurrió un error:', err);
    error = 'Error al obtener los datos';
    message = (err as Error).message;
  } finally {
    if (products.length === 0) {
      message = 'No se encontraron artículos';
    }
    await browser.close();
  }

  return new Response(JSON.stringify({ products, error, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
