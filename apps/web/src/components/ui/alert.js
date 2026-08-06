export default function Alert({ children }) {
  if (!children) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}
