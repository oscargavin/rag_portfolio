import "./global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1b1c" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: "Oscar Gavin's Portfolio",
  description: "Interactive terminal interface for Oscar Gavin's portfolio",
};
