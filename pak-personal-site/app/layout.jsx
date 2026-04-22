import "./globals.css";

export const metadata = {
  title: "Pak Yat Hui | Electrical Engineering Portfolio",
  description:
    "Portfolio website for Pak Yat Hui, a Master of Electrical Engineering student focused on embedded systems, FPGA, digital design, testing, and electronics."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
