type ConsultationButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function ConsultationButton({
  href = "#contact",
  label = "立即咨询",
  className = "",
}: ConsultationButtonProps) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-black ${className}`}
    >
      {label}
    </a>
  );
}
