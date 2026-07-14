// components/Layout.js
import Navigation from './Navigation';
import { useRouter } from 'next/router';

// Pages that handle their own full-screen layout
const FULL_PAGE_ROUTES = ['/login', '/test-portal'];

export default function Layout({ children }) {
  const router = useRouter();
  const isFullPage = FULL_PAGE_ROUTES.includes(router.pathname);

  if (isFullPage) {
    return (
      <div className="min-h-screen">
        <Navigation />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ftm-night">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
