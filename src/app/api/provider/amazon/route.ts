import { totalItems } from '@/components/ProductList';
import { userAgentsPlaywright } from '@/libs/user-agent';
import { chromium } from 'playwright';

export interface AmazonProduct {
  title?: string;
  reviewCount?: number;
  priceOffer?: number;
  priceOriginal?: number;
  link?: string;
  imageUrl?: string;
}

class ProductExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductExtractionError';
  }
}

const config = {
  baseUrl: 'https://www.amazon.es',
  timeout: 2000,
  selectors: {
    acceptCookiesButton: '.a-button-input.celwidget',
    productItem: '.s-result-item[data-component-type="s-search-result"]',
    title: 'h2 > a > span',
    priceOffer: '.a-price > .a-offscreen',
    priceOriginal: '.a-text-price > .a-offscreen',
    reviewCount: '.a-size-base.s-underline-text',
    image: '.s-image',
    link: 'h2 > a',
  },
};

async function acceptCookies(page: any) {
  const acceptCookiesButton = await page.$(
    config.selectors.acceptCookiesButton
  );
  if (acceptCookiesButton) {
    console.log('Botón de aceptar cookies encontrado, haciendo clic en él');
    await acceptCookiesButton.click();
    await page.waitForTimeout(config.timeout);
  }
}

async function extractTitle(item: any): Promise<string | undefined> {
  const titleElement = await item?.$(`${config.selectors.title}`);
  const title = titleElement
    ? ((await titleElement.textContent()) || '').trim().toLowerCase()
    : undefined;
  return title;
}

async function extractPrice(
  item: any
): Promise<{ priceOffer?: number; priceOriginal?: number }> {
  const priceOfferElement = await item?.$(`${config.selectors.priceOffer}`);
  const priceOfferText = priceOfferElement
    ? ((await priceOfferElement.textContent()) || '').trim()
    : 0;
  const priceOffer = priceOfferText
    ? parseFloat(priceOfferText.replace(/[^0-9,.]+/g, '').replace(',', '.'))
    : 0;

  const priceOriginalElement = await item?.$(config.selectors.priceOriginal);
  const priceOriginalText = priceOriginalElement
    ? ((await priceOriginalElement.textContent()) || '').trim()
    : 0;
  const priceOriginal = priceOriginalText
    ? parseFloat(priceOriginalText.replace(/[^0-9,.]+/g, '').replace(',', '.'))
    : 0;

  return { priceOffer, priceOriginal };
}

async function extractReviewCount(item: any): Promise<number | undefined> {
  const reviewCountElement = await item?.$(`${config.selectors.reviewCount}`);
  const reviewCountText = reviewCountElement
    ? await reviewCountElement.textContent()
    : undefined;

  const reviewCount = reviewCountText
    ? parseFloat(reviewCountText.replace(/[^0-9]/g, ''))
    : undefined;

  return reviewCount;
}

async function extractImageUrl(item: any): Promise<string | undefined> {
  const imageElement = await item?.$(`${config.selectors.image}`);
  const imageUrl = imageElement
    ? await imageElement.getAttribute('src')
    : undefined;
  return imageUrl;
}

async function extractLink(item: any): Promise<string | undefined> {
  const linkElement = await item?.$(`${config.selectors.link}`);
  const link = linkElement ? await linkElement.getAttribute('href') : undefined;
  let cleanedLink;

  if (link) {
    const url = new URL(link, config.baseUrl);
    const pathParts = url.pathname.split('/');
    const cleanedPath = pathParts.slice(1, 4).join('/');
    cleanedLink = `${url.origin}/${cleanedPath}`;
  }

  return cleanedLink;
}

async function extractProductData(
  item: any,
  searchKeywords: string[]
): Promise<AmazonProduct | null> {
  const title = await extractTitle(item);
  const { priceOffer, priceOriginal } = await extractPrice(item);
  const reviewCount = await extractReviewCount(item);
  const imageUrl = await extractImageUrl(item);
  const link = await extractLink(item);
  const dataAsin = await item?.getAttribute('data-asin');

  const containsSearchText = title
    ? searchKeywords.every((word) => title.includes(word))
    : false;

  if (
    containsSearchText &&
    dataAsin &&
    dataAsin.startsWith('B') &&
    link &&
    link.includes('/dp/') &&
    priceOffer &&
    priceOriginal
  ) {
    return {
      title,
      reviewCount,
      priceOffer,
      priceOriginal,
      link,
      imageUrl,
    };
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const searchText = searchParams.get('search') || '';
  const searchKeywords = searchText.toLowerCase().split(' ');

  console.log('Comienza la extracción de datos de Amazon');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      userAgentsPlaywright[
        Math.floor(Math.random() * userAgentsPlaywright.length)
      ],
  });

  let products: AmazonProduct[] = [];
  let error: string | null = null;
  let message: string | null = null;

  try {
    console.log('Iniciando navegación hacia la página de Amazon');

    await page.goto(
      `${config.baseUrl}/s?k=${searchText?.replaceAll(' ', '+')}`,
      {
        timeout: config.timeout,
      }
    );

    await acceptCookies(page);

    console.log('Página cargada correctamente');

    console.log('Esperando elementos de productos');

    await page.waitForSelector(config.selectors.productItem, {
      timeout: config.timeout,
    });

    const resultItems = await page.$$(config.selectors.productItem);

    console.log('Artículos encontrados:', resultItems.length);

    for (const item of resultItems.slice(0, totalItems)) {
      const productData = await extractProductData(item, searchKeywords);
      if (productData) {
        products.push(productData);
      }
    }

    console.log('Extracción de datos completada');
  } catch (err) {
    console.error('Ocurrió un error:', err);
    if (err instanceof ProductExtractionError) {
      error = err.message;
      message = 'Error al extraer datos de productos';
    } else {
      error = 'Error al obtener los datos';
      message = err instanceof Error ? err.message : 'Error desconocido';
    }
  } finally {
    console.log('Cerrando el navegador');
    await browser.close();
  }
  return new Response(JSON.stringify({ products, error, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
