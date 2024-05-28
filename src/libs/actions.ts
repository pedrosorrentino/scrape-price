'use server';

import type { AliexpressProduct } from '@/app/api/provider/aliexpress/route';
import type { AmazonProduct } from '@/app/api/provider/amazon/route';
import type { EbayProduct } from '@/app/api/provider/ebay/route';
import type { PccomponentesProduct } from '@/app/api/provider/pccomponentes/route';
import type { WallapopProduct } from '@/app/api/provider/wallapop/route';

const BASE_URL = process.env.DOMAIN;

async function fetchFromAPI<T>(url: string, provider: string): Promise<T> {
  try {
    console.log(`Fetching ${provider} data from:`, url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from ${provider}: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${provider}:`, error);
    throw error;
  }
}

async function fetchAmazonData(searchQuery: string): Promise<AmazonProduct[]> {
  const amazonUrl = `${BASE_URL}/api/provider/amazon?search=${searchQuery}`;
  return await fetchFromAPI<AmazonProduct[]>(amazonUrl, 'Amazon');
}

async function fetchAliexpressData(
  searchQuery: string
): Promise<AliexpressProduct[]> {
  const aliexpressUrl = `${BASE_URL}/api/provider/aliexpress?search=${searchQuery}`;
  return await fetchFromAPI<AliexpressProduct[]>(aliexpressUrl, 'Aliexpress');
}

async function fetchEbayData(searchQuery: string): Promise<EbayProduct[]> {
  const ebayUrl = `${BASE_URL}/api/provider/ebay?search=${searchQuery}`;
  return await fetchFromAPI<EbayProduct[]>(ebayUrl, 'Ebay');
}

async function fetchWallapopData(
  searchQuery: string
): Promise<WallapopProduct[]> {
  const wallapopUrl = `${BASE_URL}/api/provider/wallapop?search=${searchQuery}`;
  return await fetchFromAPI<WallapopProduct[]>(wallapopUrl, 'Wallapop');
}

async function fetchPccomponentesData(
  searchQuery: string
): Promise<PccomponentesProduct[]> {
  const pcComponentesUrl = `${BASE_URL}/api/provider/pccomponentes?search=${searchQuery}`;
  return await fetchFromAPI<PccomponentesProduct[]>(
    pcComponentesUrl,
    'PcComponentes'
  );
}

export async function fetchArticles(props: string): Promise<{
  amazon: AmazonProduct[];
  aliexpress: AliexpressProduct[];
  ebay: EbayProduct[];
  wallapop: WallapopProduct[];
  pccomponentes: PccomponentesProduct[];
}> {
  try {
    const dataAmazon = await fetchAmazonData(props);
    const dataAliexpress = await fetchAliexpressData(props);
    const dataEbay = await fetchEbayData(props);
    const dataWallapop = await fetchWallapopData(props);
    const dataPcomponentes = await fetchPccomponentesData(props);
    return {
      amazon: dataAmazon,
      aliexpress: dataAliexpress,
      ebay: dataEbay,
      wallapop: dataWallapop,
      pccomponentes: dataPcomponentes,
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}
