'use client';

import { Geist } from "next/font/google";
import "./globals.css";
import KeycloakProvider from "./KeycloakProvider";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

const geistSans = Geist({
  subsets: ["latin"],
});

const theme = createTheme({
  typography: {
    fontFamily: geistSans.style.fontFamily,
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Box component="body" sx={{ m: 0, p: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <KeycloakProvider>
              {children}
            </KeycloakProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </Box>
    </html>
  );
}
