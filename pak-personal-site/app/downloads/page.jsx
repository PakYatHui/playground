import Link from "next/link";

export const metadata = {
  title: "Downloads | Pak Yat Hui"
};

export default function DownloadsPage() {
  return (
    <main className="subpage-shell">
      <div className="subpage-panel">
        <p className="eyebrow">Downloads</p>
        <h1>Document and file access placeholder.</h1>
        <p>
          This page is reserved for resume downloads and selected public files.
          In the current MVP, the final resume PDF has not been attached yet.
        </p>
        <div className="downloads-card">
          <h2>Pak_Yat_Hui_Resume.pdf</h2>
          <p>
            Placeholder entry only. Once the final document is ready, this page
            can expose a stable download path without changing the broader site
            structure.
          </p>
        </div>
        <Link href="/" className="button button-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
