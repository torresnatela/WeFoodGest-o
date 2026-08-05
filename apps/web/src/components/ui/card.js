export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      {...props}
      className={`rounded-lg border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </Tag>
  );
}
