import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LogoutButton from "./components/logoutButton";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "WoningTovenaar - AI Property Listing Tool",
  description: "Professional real estate listing creation tool powered by AI",
  keywords: "real estate, property listing, AI, Netherlands, woningtovenaar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${inter.className} antialiased bg-gray-50`}
      >
        {/* Language Switcher Dropdown */}
        <div
          id="google_translate_element"
          className="fixed top-5 right-24 z-50"
        ></div>


        
        

        {children}

        {/* Google Translate Init Script */}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: 'en,nl',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false,
                  multilanguagePage: true
                },
                'google_translate_element'
              );

             
            }



          `}
        </Script>

        {/* Google Translate Library */}
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
