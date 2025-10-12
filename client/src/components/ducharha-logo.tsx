interface DucharhaLogoProps {
  className?: string;
  size?: number;
}

export function DucharhaLogo({ className = "", size = 120 }: DucharhaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle 
        cx="100" 
        cy="100" 
        r="90" 
        stroke="currentColor" 
        strokeWidth="8" 
        fill="none"
        opacity="0.9"
      />
      
      <path
        d="M65 65 L65 135 L100 135 C120 135 135 120 135 100 C135 80 120 65 100 65 L65 65 Z M85 85 L100 85 C108 85 115 92 115 100 C115 108 108 115 100 115 L85 115 L85 85 Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}
