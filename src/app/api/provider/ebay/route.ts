import { totalItems } from '@/components/ProductList';
import { userAgentsPlaywright } from '@/libs/user-agent';
import { chromium } from 'playwright';

export interface EbayProduct {
  title: string;

  reviewCount: number;

  priceOffer: number;

  priceOriginal: number;

  link: string;

  imageUrl: string;
}

const config = {
  baseUrl: 'https://www.ebay.es',
  timeout: 5000,
  selectors: {
    productItem: '.s-item',
    productTitle: '.s-item__title',
    productImage: '.s-item__image img',
    priceOriginal: '.ITALIC',
    productLink: 'a.s-item__link:link',
  },
};

async function getTextContent(
  element: any,
  selector: string,
  defaultValue: string = ''
): Promise<string> {
  const selectedElement = await element.$(selector);

  return selectedElement
    ? (await selectedElement.textContent()).trim()
    : defaultValue;
}

async function getAttribute(
  element: any,
  selector: string,
  attribute: string,
  defaultValue: string = ''
): Promise<string> {
  const selectedElement = await element.$(selector);

  return selectedElement
    ? await selectedElement.getAttribute(attribute)
    : defaultValue;
}

function parsePrice(priceText: string): number {
  return parseFloat(priceText.replace(/[^0-9,.]+/g, '').replace(',', '.')) || 0;
}

async function filterValidItems(
  items: any[],
  searchKeywords: string
): Promise<any[]> {
  const validItems = [];

  for (const item of items) {
    const title = await getTextContent(
      item,
      config.selectors.productTitle,
      'Sin título'
    );

    const priceOriginalText = await getTextContent(
      item,
      config.selectors.priceOriginal
    );

    const priceOriginal = parsePrice(priceOriginalText);

    const containsSearchText = title.toLowerCase().includes(searchKeywords);

    if (containsSearchText && priceOriginal > 0) {
      validItems.push(item);
    }
  }

  return validItems;
}

async function extractProductData(item: any): Promise<EbayProduct | null> {
  const title = (
    await getTextContent(item, config.selectors.productTitle)
  ).replaceAll('Anuncio nuevo', '');

  const imageUrl = await getAttribute(
    item,
    config.selectors.productImage,
    'src'
  );

  const priceOriginalText = await getTextContent(
    item,
    config.selectors.priceOriginal
  );

  const priceOriginal = parsePrice(priceOriginalText);

  const findLink = await getAttribute(
    item,
    config.selectors.productLink,
    'href'
  );

  const cleanedLink = findLink
    ? new URL(findLink, config.baseUrl).origin +
      new URL(findLink, config.baseUrl).pathname
        .split('/')
        .slice(1, 4)
        .join('/')
    : '';

  const reviewCount = Math.floor(Math.random() * 1000);

  return {
    title,

    reviewCount,

    priceOffer: 0,

    priceOriginal,

    link: cleanedLink,

    imageUrl,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const searchText = searchParams.get('search') || '';

  console.log('Comienza la extracción de datos de Ebay');

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    userAgent:
      userAgentsPlaywright[
        Math.floor(Math.random() * userAgentsPlaywright.length)
      ],
  });

  let products: EbayProduct[] = [];

  let error: string | null = null;

  let message: string | null = null;

  try {
    console.log('Iniciando navegación hacia la página de Ebay');

    await page.goto(
      `${config.baseUrl}/sch/i.html?_nkw=${searchText.replaceAll(' ', '+')}`,
      { timeout: config.timeout }
    );

    console.log('Página cargada correctamente');

    console.log('Esperando elementos .s-result-item');

    await page.waitForSelector('.srp-river-results', {
      timeout: config.timeout,
    });

    const resultItems = await page.$$(config.selectors.productItem);

    console.log('Artículos encontrados:', resultItems.length);

    const searchKeywords = searchText.toLowerCase();

    const validItems = await filterValidItems(resultItems, searchKeywords);

    for (const item of validItems.slice(0, totalItems)) {
      const productData = await extractProductData(item);

      if (productData) {
        products.push(productData);
      }
    }

    console.log('Extracción de datos completada');
  } catch (err) {
    console.error('Ocurrió un error:', err);

    error = 'Error al obtener los datos';

    message = (err as Error).message;
  } finally {
    console.log('Cerrando el navegador');

    await browser.close();
  }

  return new Response(JSON.stringify({ products, error, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
