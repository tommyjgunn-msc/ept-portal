// pages/_app.js
import '../styles/globals.css';
import { TestModeProvider } from '../context/TestModeContext';

function MyApp({ Component, pageProps }) {
  return (
    <TestModeProvider>
      <Component {...pageProps} />
    </TestModeProvider>
  );
}

export default MyApp;