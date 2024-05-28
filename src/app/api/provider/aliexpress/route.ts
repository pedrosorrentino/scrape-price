import { totalItems } from '@/components/ProductList';
import { userAgentsPlaywright } from '@/libs/user-agent';
import { chromium } from 'playwright';

export interface AliexpressProduct {
  title: string;
  reviewCount: number;
  priceOffer: number;
  priceOriginal: number;
  link: string;
  imageUrl: string;
}

const config = {
  baseUrl: 'https://es.aliexpress.com',
  timeout: 10000,
  selectors: {
    acceptCookiesButtons: '.btn-accept-cookies, .btn-accept',
    productContainer: '#card-list .list--gallery--C2f2tvm',
    productTitle: '.multi--titleText--nXeOvyr',
    priceOffer: '.multi--price-sale--U-S0jtj',
    priceOriginal: '.multi--price-original--1zEQqOK',
    productLink: 'a.multi--container--1UZxxHY',
    productImage: '.images--item--3XZa6xf',
  },
};

async function acceptCookies(page: any) {
  try {
    const acceptCookiesButton = await page.waitForSelector(
      config.selectors.acceptCookiesButtons,
      { timeout: config.timeout }
    );
    if (acceptCookiesButton) {
      console.log('Botón de aceptar cookies encontrado, haciendo clic en él');
      await acceptCookiesButton.click();
      await page.waitForTimeout(config.timeout);
    }
  } catch (error) {
    console.log('No se encontró el botón de aceptar cookies');
  }
}

async function filterValidItems(
  items: any[],
  searchKeywords: string[]
): Promise<any[]> {
  const validItems = [];

  for (const item of items) {
    const titleElement = await item.$(config.selectors.productTitle);
    const title = titleElement
      ? ((await titleElement.textContent()) || '').trim()
      : '';

    const containsSearchText = searchKeywords.every((word) =>
      title.toLowerCase().includes(word)
    );
    if (containsSearchText) {
      validItems.push(item);
    }
  }

  return validItems;
}

async function extractProductData(
  item: any
): Promise<AliexpressProduct | null> {
  const titleElement = await item.$(config.selectors.productTitle);
  const title = titleElement
    ? ((await titleElement.textContent()) || '').trim()
    : '';

  const priceOfferElement = await item.$(config.selectors.priceOffer);
  const priceOfferText = priceOfferElement
    ? ((await priceOfferElement.textContent()) || '').trim()
    : '';
  const priceOffer = priceOfferText
    ? parseFloat(priceOfferText.replace(/[^0-9,.]+/g, '').replace(',', '.'))
    : 0;

  const priceOriginalElement = await item.$(config.selectors.priceOriginal);
  const priceOriginalText = priceOriginalElement
    ? ((await priceOriginalElement.textContent()) || '').trim()
    : '';
  const priceOriginal = priceOriginalText
    ? parseFloat(priceOriginalText.replace(/[^0-9,.]+/g, '').replace(',', '.'))
    : 0;

  const linkElement = await item.$(config.selectors.productLink);
  const link = linkElement ? await linkElement.getAttribute('href') : '';
  const cleanedLink = link ? `${config.baseUrl}${link}` : '';

  const imageElement = await item.$(config.selectors.productImage);
  const imageUrl = imageElement ? await imageElement.getAttribute('src') : '';
  const cleanedImage = imageUrl ? `https:${imageUrl}` : '';

  const reviewCount = Math.floor(Math.random() * 1000);

  return {
    title,
    reviewCount,
    priceOffer,
    priceOriginal,
    link: cleanedLink ? cleanedLink.split('?')[0] : '',
    imageUrl: cleanedImage,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const searchText = searchParams.get('search') || '';

  console.log('Comienza la extracción de datos de AliExpress');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      userAgentsPlaywright[
        Math.floor(Math.random() * userAgentsPlaywright.length)
      ],
  });

  let products: AliexpressProduct[] = [];
  let error: string | null = null;
  let message: string | null = null;

  try {
    console.log('Iniciando navegación hacia la página de AliExpress');
    await page.goto(
      `${config.baseUrl}/wholesale?SearchText=${searchText?.replaceAll(
        ' ',
        '+'
      )}`,
      { timeout: config.timeout }
    );

    await acceptCookies(page);

    console.log('Página cargada correctamente');
    console.log('Esperando elementos de productos');
    await page.waitForSelector(config.selectors.productContainer, {
      timeout: config.timeout,
    });

    const resultItems = await page.$$(config.selectors.productContainer);
    console.log('Artículos encontrados:', resultItems.length);

    const searchKeywords = searchText.toLowerCase().split(' ');
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
