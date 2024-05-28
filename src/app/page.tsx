import { Hero } from '@/components/Hero';
import { Search } from '@/components/Search';

export default async function Home() {
  return (
    <main className='space-y-10'>
      <Hero />
      <Search />
    </main>
  );
}
