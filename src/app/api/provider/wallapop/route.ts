import { totalItems } from '@/components/ProductList';
import { userAgentsPlaywright } from '@/libs/user-agent';
import { chromium, Page, ElementHandle } from 'playwright';

export interface WallapopProduct {
  title: string;
  reviewCount: number;
  priceOffer: number;
  priceOriginal: number;
  link: string;
  imageUrl: string;
}

const config = {
  baseUrl: 'https://es.wallapop.com',
  timeout: 10000,
  selectors: {
    acceptCookiesButton: '#onetrust-accept-btn-handler',
    productItem: 'a.ItemCardList__item',
    productTitle: 'title',
    productImage: '.carousel .carousel-item img',
    productPrice: 'span.ItemCard__price--bold',
  },
};

async function acceptCookies(page: Page): Promise<void> {
  const acceptCookiesButton = await page.$(
    config.selectors.acceptCookiesButton
  );
  if (acceptCookiesButton) {
    await acceptCookiesButton.click();
    await page.waitForTimeout(1000); // Reducir el tiempo de espera
  }
}

async function getTextContent(
  element: ElementHandle,
  selector: string,
  defaultValue: string = ''
): Promise<string> {
  const selectedElement = await element.$(selector);
  const textContent = selectedElement
    ? await selectedElement.textContent()
    : null;
  return textContent ? textContent.trim() : defaultValue;
}

async function getAttribute(
  element: ElementHandle,
  attribute: string,
  defaultValue: string = ''
): Promise<string> {
  return (await element.getAttribute(attribute)) || defaultValue;
}

async function filterValidItems(
  items: ElementHandle[],
  searchKeywords: string[]
): Promise<ElementHandle[]> {
  const validItems: ElementHandle[] = [];
  for (const item of items) {
    const title = await getAttribute(item, config.selectors.productTitle);
    const titleLower = title.toLowerCase();
    const containsAllKeywords = searchKeywords.every((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(titleLower)
    );
    if (containsAllKeywords) {
      const priceText = await getTextContent(
        item,
        config.selectors.productPrice
      );
      const priceOriginal =
        parseFloat(priceText.replace(',', '.').replace('€', '').trim()) || 0;
      if (priceOriginal > 0) {
        validItems.push(item);
      }
    }
  }
  return validItems;
}

async function extractProductData(
  item: ElementHandle
): Promise<WallapopProduct | null> {
  const title = await getAttribute(item, config.selectors.productTitle);
  const url = await getAttribute(item, 'href');
  const imageElement = await item.$(config.selectors.productImage);
  const imageUrl = imageElement ? await getAttribute(imageElement, 'src') : '';
  const priceText = await getTextContent(item, config.selectors.productPrice);
  const priceOriginal =
    parseFloat(priceText.replace(',', '.').replace('€', '').trim()) || 0;
  if (priceOriginal === 0) return null;
  const reviewCount = Math.floor(Math.random() * 1000);
  return {
    title,
    reviewCount,
    priceOffer: 0,
    priceOriginal,
    link: url,
    imageUrl,
  };
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const searchText = searchParams.get('search') || '';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      userAgentsPlaywright[
        Math.floor(Math.random() * userAgentsPlaywright.length)
      ],
  });

  let products: WallapopProduct[] = [];
  let error: string | null = null;
  let message: string | null = null;

  try {
    const searchUrl = `${
      config.baseUrl
    }/app/search?keywords=${searchText.replaceAll(' ', '+')}`;
    await page.goto(searchUrl, {
      timeout: config.timeout,
      waitUntil: 'networkidle',
    });
    await acceptCookies(page);
    await page.waitForSelector(config.selectors.productItem, {
      timeout: config.timeout,
    });
    const resultItems = await page.$$(config.selectors.productItem);
    const searchKeywords = searchText.toLowerCase().split(' ');
    const validItems = await filterValidItems(resultItems, searchKeywords);

    for (const item of validItems.slice(0, totalItems)) {
      const productData = await extractProductData(item);
      if (productData) products.push(productData);
    }
  } catch (err) {
    console.error('Ocurrió un error:', err);
    error = 'Error al obtener los datos';
    message = (err as Error).message;
  } finally {
    if (products.length === 0) message = 'No se encontraron artículos';
    await browser.close();
  }

  return new Response(JSON.stringify({ products, error, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// import { chromium } from 'playwright';

// export interface WallapopProduct {
//   title: string;
//   reviewCount: number;
//   priceOffer: number;
//   priceOriginal: number;
//   link: string;
//   imageUrl: string;
// }

// async function acceptCookies(page: any) {
//   const acceptCookiesButton = await page.$('#onetrust-accept-btn-handler');
//   if (acceptCookiesButton) {
//     await acceptCookiesButton.click();
//     await page.waitForTimeout(1000); // Reducir el tiempo de espera
//   }
// }

// export async function GET(req: Request) {
//   const timeout = 10000; // Reducir el tiempo de espera
//   const { searchParams } = new URL(req.url);
//   const searchText = searchParams.get('search') || '';

//   const browser = await chromium.launch({ headless: true }); // Modo headless
//   const page = await browser.newPage();

//   let products: WallapopProduct[] = [];
//   let error: string | null = null;
//   let message: string | null = null;

//   try {
//     const searchUrl = `https://es.wallapop.com/app/search?keywords=${searchText.replaceAll(
//       ' ',
//       '+'
//     )}`;
//     await page.goto(searchUrl, { timeout, waitUntil: 'networkidle' });
//     await acceptCookies(page);

//     await page.waitForSelector('a.ItemCardList__item', { timeout }); // Mantener la consulta original

//     const resultItems = await page.$$('a.ItemCardList__item');

//     const searchKeywords = searchText.toLowerCase().split(' ');
//     const validItems = (
//       await Promise.all(
//         resultItems.map(async (item) => {
//           const title = (await item.getAttribute('title')) || '';
//           const titleLower = title.toLowerCase();
//           const containsAllKeywords = searchKeywords.every((word) => {
//             const regex = new RegExp(`\\b${word}\\b`, 'i');
//             return regex.test(titleLower);
//           });
//           return containsAllKeywords ? item : null;
//         })
//       )
//     ).filter(Boolean);

//     for (const item of validItems) {
//       const title = (await item?.getAttribute('title')) || '';
//       const url = (await item?.getAttribute('href')) || '';
//       const imageElement = await item?.$('.carousel .carousel-item img');
//       const imageUrl = imageElement
//         ? await imageElement.getAttribute('src')
//         : '';

//       const price = await item?.$eval(
//         'span.ItemCard__price--bold',
//         (span) => span.textContent?.trim() || null
//       );

//       if (price) {
//         products.push({
//           title,
//           reviewCount: 0,
//           priceOffer: 0,
//           priceOriginal: parseFloat(
//             price.replace(',', '.').replace('€', '').trim()
//           ),
//           link: url,
//           imageUrl: imageUrl || '',
//         });
//       }
//     }
//   } catch (err) {
//     error = 'Error al obtener los datos';
//     message = (err as Error).message;
//   }

//   if (products.length === 0) {
//     message = 'No se encontraron artículos';
//   }

//   await browser.close();

//   return new Response(JSON.stringify({ products, error, message }), {
//     headers: { 'Content-Type': 'application/json' },
//   });
// }
