// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import { TestModeProvider } from '../context/TestModeContext';
import { ProctoringProvider } from '../context/ProctoringContext';
import { ToastProvider } from '../components/ToastContext'; // New

function MyApp({ Component, pageProps }) {
  return (
    <TestModeProvider>
      <ProctoringProvider>
        <ToastProvider> {/* New wrapper */}
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ToastProvider>
      </ProctoringProvider>
    </TestModeProvider>
  );
}

export default MyApp;
