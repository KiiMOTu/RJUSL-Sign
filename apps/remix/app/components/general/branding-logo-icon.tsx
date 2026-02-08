import type { ImgHTMLAttributes } from 'react';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogoIcon = ({ alt = 'RJ Utility Services', ...props }: LogoProps) => {
  return <img src="/static/rjusl-logo.jpeg" alt={alt} {...props} />;
};
