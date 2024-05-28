import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import Image from 'next/image';
import Link from 'next/link';
import { NotFound } from '../NotFound';

export const totalItems = 5;

interface ProductsProps {
  title: string;
  reviewCount: number;
  priceOffer: number;
  priceOriginal: number;
  link: string;
  imageUrl: string;
}

export const ProductList = ({ products, nameShop }: any) => {
  const { products: data, error, message } = products;

  const providerLogos = {
    amazon:
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    aliexpress:
      'https://upload.wikimedia.org/wikipedia/commons/3/3b/Aliexpress_logo.svg',
    wallapop:
      'https://upload.wikimedia.org/wikipedia/commons/5/56/Wallapop.svg',
    ebay: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',

    pccomponentes:
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/PcComponentes.png',
  };
  const providerName:
    | 'amazon'
    | 'aliexpress'
    | 'wallapop'
    | 'ebay'
    | 'pccomponentes' = nameShop.toLowerCase();
  const shopImage = providerLogos[providerName];

  const sortedProducts = data?.sort((a: any, b: any) => {
    const priceA = a.priceOffer !== 0 ? a.priceOffer : a.priceOriginal;
    const priceB = b.priceOffer !== 0 ? b.priceOffer : b.priceOriginal;
    return priceB - priceA;
  });
  return (
    <div className='container mx-auto p-4 mb-10'>
      <div className='flex justify-center'>
        <img
          src={shopImage}
          alt={providerName}
          title={providerName}
          width={200}
          height={200}
        />
      </div>
      {(sortedProducts.length === 0 || message || error) && <NotFound />}
      {sortedProducts?.length > 0 && (
        <Table products={sortedProducts} shop={nameShop} />
      )}
    </div>
  );
};

const Table = ({
  products,
  shop,
}: {
  products: ProductsProps[];
  shop: string;
}) => {
  const dateNow = new Date();
  const day = dateNow.getDate();
  const month = dateNow.getMonth() + 1;
  const year = dateNow.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <div className='max-w-4xl mx-auto'>
      {products.map((product) => (
        <Link
          href={product.link}
          key={product.link}
          target='_blank'
          className='relative w-full my-8 md:my-16 flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6 px-4 py-8 border-2 border-dashed border-gray-400 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg'
        >
          <span className=' text-indigo-500 absolute text-xs font-medium top-0 left-0 rounded-br-lg rounded-tl-lg px-2 py-1 bg-primary-100   border-gray-400 border-b-2 border-r-2 border-dashed '>
            {shop}
          </span>
          <Image
            className='rounded-2xl mx-auto'
            src={product.imageUrl}
            alt={product.title}
            width={200}
            height={100}
            onError={(e) => {
              e.currentTarget.src = '/no-image.webp';
            }}
          />

          <div className='w-full sm:w-auto flex flex-col items-center sm:items-start'>
            <h2 className='text-slate-700 font-display mb-2 sm:text-2xl font-semibold capitalize'>
              {product.title}
            </h2>

            <div className='mb-4 text-gray-400'>
              <p>
                Han comprado este artículo más de {product.reviewCount} veces
              </p>
            </div>
            <div className='flex items-center gap-5'>
              <div>
                <p className='text-slate-700 font-semibold'>Precio actual</p>
                <p className='text-xs text-slate-400'>{formattedDate}</p>
              </div>

              <p className='text-2xl font-semibold text-lime-500'>
                {product.priceOffer !== 0
                  ? product.priceOffer
                  : product.priceOriginal}{' '}
                €
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
