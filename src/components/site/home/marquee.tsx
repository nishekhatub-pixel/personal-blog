export function Marquee({
  className = "",
  text,
}: {
  className?: string;
  text: string;
}) {
  return (
    <div aria-label={text} className={`site-marquee ${className}`} role="status">
      <span className="sr-only">{text}</span>
      <div aria-hidden="true" className="site-marquee__track">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="site-marquee__item" key={index}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
