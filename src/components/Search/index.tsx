'use client';
import { fetchArticles } from '@/libs/actions';
import { useState } from 'react';
import ProductSearch from './SearchBar';
import type { AmazonProduct } from '@/app/api/provider/amazon/route';
import type { AliexpressProduct } from '@/app/api/provider/aliexpress/route';
import type { EbayProduct } from '@/app/api/provider/ebay/route';
import type { WallapopProduct } from '@/app/api/provider/wallapop/route';
import type { PccomponentesProduct } from '@/app/api/provider/pccomponentes/route';
import { ProductList } from '../ProductList';
import { Loading } from './Loading';

interface ProductsResponse {
  amazon: AmazonProduct[];
  aliexpress: AliexpressProduct[];
  ebay: EbayProduct[];
  wallapop: WallapopProduct[];
  pccomponentes: PccomponentesProduct[];
}

export const Search = () => {
  const [listProducts, setListProducts] = useState<ProductsResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setListProducts(null);
    setIsLoading(true);

    try {
      const response = await fetchArticles(query);
      setListProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ProductSearch onSearch={handleSearch} />
      {isLoading && <Loading />}
      {listProducts && (
        <ProductList products={listProducts.amazon} nameShop='Amazon' />
      )}
      {listProducts && (
        <ProductList products={listProducts.aliexpress} nameShop='Aliexpress' />
      )}
      {listProducts?.ebay && (
        <ProductList products={listProducts.ebay} nameShop='Ebay' />
      )}
      {listProducts?.wallapop && (
        <ProductList products={listProducts.wallapop} nameShop='Wallapop' />
      )}
      {listProducts?.pccomponentes && (
        <ProductList
          products={listProducts.pccomponentes}
          nameShop='Pccomponentes'
        />
      )}
    </div>
  );
};
