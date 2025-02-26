// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import { TestModeProvider } from '../context/TestModeContext';
import { ProctoringProvider } from '../context/ProctoringContext';

function MyApp({ Component, pageProps }) {
  return (
    <TestModeProvider>
      <ProctoringProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ProctoringProvider>
    </TestModeProvider>
  );
}

export default MyApp;