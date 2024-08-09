// pages/404.js
import Link from 'next/link';

export default function Custom404() {
  return (
    <div>
      <h1 className='mt-10 mb-10 text-2xl'>404 - Page Not Found</h1>
      <Link href="/" className='btn-gray'>
        Go back home
      </Link>
    </div>
  );
}
