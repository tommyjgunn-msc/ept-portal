// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import { TestModeProvider } from '../context/TestModeContext';

function MyApp({ Component, pageProps }) {
  return (
    <TestModeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </TestModeProvider>
  );
}

export default MyApp;