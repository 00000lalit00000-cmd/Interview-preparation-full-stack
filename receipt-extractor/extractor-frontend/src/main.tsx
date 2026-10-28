import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22c55e',
    },
    secondary: {
      main: '#38bdf8',
    },
    background: {
      default: '#020617',
      paper: '#020617',
    },
  },
  shape: {
    borderRadius: 16,
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
