import type { ImgHTMLAttributes } from 'react';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogo = ({ alt = 'RJ Utility Services', ...props }: LogoProps) => {
  return <img src="/static/rjusl-logo.jpeg" alt={alt} {...props} />;
};
