interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/** Shared header logo image. */
export function Logo({ className, width = 120, height }: LogoProps) {
  const h = height ?? (width * (450 / 458));
  return (
    <img
      src="/header-logo.svg"
      alt=""
      aria-hidden
      className={className}
      width={width}
      height={h}
      decoding="async"
    />
  );
}
