'use client';

import { type FormEvent, useState } from 'react';

export default function ProductSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
    setQuery('');
  };

  return (
    <form
      className='flex justify-center items-center space-x-5 mx-10 sm:mx-0 mb-20'
      onSubmit={handleSubmit}
    >
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Buscar los mejores precios...'
        className='w-64 py-2 px-4 rounded-lg border border-indigo-500 focus:outline-none focus:border-indigo-700'
      />
      <button
        type='submit'
        className='py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:bg-indigo-700'
      >
        Buscar
      </button>
    </form>
  );
}
