export const GeometricShapes = () => (
    <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
        <div className='animate-float-reverse border-brand-from/15 dark:border-brand-from/10 absolute top-20 left-[8%] h-16 w-16 rotate-12 border-2' />
        <div className='animate-float border-brand-via/10 absolute top-32 right-[12%] h-20 w-20 rounded-full border-2' />
        <div className='absolute bottom-40 left-[15%] grid grid-cols-3 gap-1.5 opacity-20 dark:opacity-10'>
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className='bg-brand-from h-1.5 w-1.5 rounded-full' />
            ))}
        </div>
        <div className='animate-float via-brand-via/20 absolute top-1/2 right-[5%] h-px w-24 bg-gradient-to-r from-transparent to-transparent' />
        <div className='animate-float-reverse border-brand-from/10 absolute right-[18%] bottom-24 h-12 w-12 rotate-45 rounded-sm border-2' />
    </div>
);
