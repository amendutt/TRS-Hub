import type { FC } from 'react';
import type { LogoConfig } from '../../types/logo';
import { BrandLogo } from './BrandLogo';

interface BrandLockupProps {
  config: LogoConfig;
  themeMode?: 'dark' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const BrandLockup: FC<BrandLockupProps> = ({
  config,
  themeMode = 'light',
  size = 'md',
  className,
  showTagline = true
}) => {
  const isDark = themeMode === 'dark';
  const logoConfig: LogoConfig = {
    ...config,
    brandName: config.brandName?.trim() || 'TECH REFRESH SOLUTION',
    tagline: 'QUALITY TECH, READY FOR MORE',
    showTagline,
    markShape: 'trs_minimal',
    markPosition: 'left',
    primaryColor: isDark ? '#79D4A2' : '#147B69',
    accentColor: isDark ? '#DCEBE5' : '#27494A',
    stemColor: isDark ? '#DCEBE5' : '#27494A',
    darkPrimaryColor: '#79D4A2',
    darkAccentColor: '#DCEBE5',
    customImageUrl: null,
    customSvgData: null
  };

  return (
    <BrandLogo
      config={logoConfig}
      themeMode={themeMode}
      size={size}
      className={className}
      showTaglineOverride={showTagline}
    />
  );
};
