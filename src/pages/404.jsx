// pages/404.js
import Link from 'next/link';

export default function Custom404() {
  return (
    <div>
      <h1 className='mt-10 mb-5 text-2xl'>404 - Page Not Found</h1>
      <Link href="/">
        Go back home
      </Link>
    </div>
  );
}
