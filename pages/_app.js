// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { TestModeProvider } from '../context/TestModeContext';
import { ProctoringProvider } from '../context/ProctoringContext';
import { ToastProvider } from '../components/ToastContext';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <TestModeProvider>
        <ProctoringProvider>
          <ToastProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ToastProvider>
        </ProctoringProvider>
      </TestModeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
