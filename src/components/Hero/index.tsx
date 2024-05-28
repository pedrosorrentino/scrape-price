export const Hero = () => {
  return (
    <div className='flex items-center justify-center gap-2 mb-10 mt-5'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth='3'
        stroke='currentColor'
        className='size-5 sm:size-7 text-indigo-900'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
        />
      </svg>

      <h1 className='text-xl sm:text-3xl md:text-4xl font-bold relative'>
        <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-900'>
          Compra
        </span>
        <span className='text-indigo-900'>Inteligente</span>
      </h1>
    </div>
  );
};
