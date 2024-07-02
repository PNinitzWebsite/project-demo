import { CookiesProvider } from 'react-cookie';

import { useState, useEffect } from 'react';
import Router from 'next/router'; 
import Loading from '../components/Loading'; // Adjust the path as necessary
import '../styles/global.css';


export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    const handleError = () => setLoading(false);

    // Add event listeners for route change events
    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleComplete);
    Router.events.on('routeChangeError', handleError);

    // Cleanup function to remove event listeners
    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleComplete);
      Router.events.off('routeChangeError', handleError);
    };
  }, []);

  return (
    <CookiesProvider>
      {loading && <Loading />}
      <Component {...pageProps} />
    </CookiesProvider>
  );
}