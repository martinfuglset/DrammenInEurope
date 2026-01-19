import type { ComponentProps } from 'react';

export const SharpStar = ({ className, size = 24, fill = "currentColor", ...props }: ComponentProps<'svg'> & { size?: number, fill?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 0L14.5 9L24 9L16 14.5L19 24L12 18L5 24L8 14.5L0 9L9.5 9L12 0Z" />
  </svg>
);
