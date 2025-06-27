import { Inter } from "next/font/google";
import "./ui/globals.css";

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${interFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
