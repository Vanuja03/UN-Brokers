export function ProductCredit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-sm ${className}`}>
      <a className="hover:underline" href="https://vanuja03.github.io/My-portfolio/" target="_blank" rel="noreferrer">
        Product by Winvanz
      </a>
    </p>
  );
}
