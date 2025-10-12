interface DucharhaLogoProps {
  className?: string;
  size?: number;
}

export function DucharhaLogo({ className = "", size = 120 }: DucharhaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Heart */}
      <path
        d="M100 85C90 55 55 50 40 65C25 80 25 100 40 115C55 130 100 170 100 170C100 170 145 130 160 115C175 100 175 80 160 65C145 50 110 55 100 85Z"
        fill="currentColor"
      />
      
      {/* Infinity Symbol */}
      <path
        d="M50 200C35 200 25 210 25 220C25 230 35 240 50 240C65 240 80 230 100 210C120 230 135 240 150 240C165 240 175 230 175 220C175 210 165 200 150 200C135 200 120 210 100 230C80 210 65 200 50 200ZM50 210C58 210 70 215 82 227C70 239 58 234 50 234C42 234 35 230 35 220C35 214 42 210 50 210ZM150 210C158 210 165 214 165 220C165 230 158 234 150 234C142 234 130 239 118 227C130 215 142 210 150 210Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
