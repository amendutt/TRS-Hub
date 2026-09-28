import React from 'react';
import { LogoConfig, LogoMarkShape } from '../../types/logo';

interface BrandLogoProps {
  config: LogoConfig;
  variant?: 'horizontal' | 'stacked' | 'icon_only' | 'text_only';
  themeMode?: 'light' | 'dark' | 'monochrome';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTaglineOverride?: boolean;
}

export const BrandLogoMark: React.FC<{
  shape: LogoMarkShape;
  primaryColor: string;
  accentColor: string;
  stemColor?: string;
  badgeBorderColor?: string;
  badgeFillColor?: string;
  size?: number;
}> = ({ shape, primaryColor, accentColor, stemColor, badgeBorderColor, badgeFillColor, size = 32 }) => {
  if (shape === 'none') return null;

  const stemFill = stemColor || accentColor || '#E2E8F0';
  const badgeBorder = badgeBorderColor || '#E2E8F0';
  const badgeFill = badgeFillColor || '#FFFFFF';

  switch (shape) {
    case 'trs_badge':
      // Authentic Tech Refresh Solution Official Squircle Badge from uploaded PNG
      return (
        <svg
          width={size}
          height={size * (220 / 240)}
          viewBox="0 0 240 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-200"
        >
          {/* Squircle Outer Frame with soft rounded border */}
          <rect
            x="14"
            y="12"
            width="212"
            height="196"
            rx="52"
            ry="52"
            stroke={badgeBorder}
            strokeWidth="15"
            fill={badgeFill}
            fillOpacity="0.95"
          />

          {/* Top-Right Soft Complementary Circuit Stem */}
          <path
            d="M136 56H178"
            stroke={stemFill}
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Left Vertical Circuit Column */}
          <path
            d="M92 84V168"
            stroke={stemFill}
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Right Vertical Circuit Column */}
          <path
            d="M148 84V168"
            stroke={stemFill}
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Signature Vibrant Green Tech Refresh Wave Path */}
          <path
            d="M62 56H100C118 56 122 86 140 86H178"
            stroke={primaryColor}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'trs_minimal':
      // Dynamic Green Wave & Circuit paths without outer badge
      return (
        <svg
          width={size}
          height={size * (140 / 180)}
          viewBox="0 0 180 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path d="M106 32H148" stroke={stemFill} strokeWidth="18" strokeLinecap="round" />
          <path d="M62 60V126" stroke={stemFill} strokeWidth="16" strokeLinecap="round" />
          <path d="M118 60V126" stroke={stemFill} strokeWidth="16" strokeLinecap="round" />
          <path
            d="M32 32H70C88 32 92 62 110 62H148"
            stroke={primaryColor}
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'haven_arch':
      // Architectural Scandinavian harbor arch with warm sun accent dot
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-200"
        >
          {/* Outer sanctuary arch */}
          <path
            d="M6 26V16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16V26"
            stroke={primaryColor}
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          {/* Inner minimalist haven aperture */}
          <path
            d="M11 26V18C11 15.2386 13.2386 13 16 13C18.7614 13 21 15.2386 21 18V26"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Golden sun core */}
          <circle cx="16" cy="18" r="2.2" fill={accentColor} />
          {/* Base waterline threshold */}
          <line x1="4" y1="26" x2="28" y2="26" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'minimal_sail':
      // Maritime harbor sail line
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M16 4C16 4 25 14 25 24H16V4Z"
            fill={primaryColor}
            fillOpacity="0.9"
          />
          <path
            d="M14 9C14 9 7 17 7 24H14V9Z"
            fill={accentColor}
          />
          <line x1="16" y1="26" x2="16" y2="28" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'nordic_h':
      // Classic Monolithic Serif H
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M7 6H13M7 26H13M19 6H25M19 26H25M10 6V26M22 6V26M10 16H22"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="2.5" fill={accentColor} />
        </svg>
      );

    case 'organic_leaf':
      // Earthen organic living leaf
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M6 26C6 26 8 13 18 7C28 1 27 15 23 20C19 25 6 26 6 26Z"
            stroke={primaryColor}
            strokeWidth="2.4"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d="M6 26C12 21 16 16 23 11"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'geometric_crest':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <polygon
            points="16,4 27,10 27,22 16,28 5,22 5,10"
            stroke={primaryColor}
            strokeWidth="2.2"
            fill="none"
          />
          <path
            d="M11 12V20M21 12V20M11 16H21"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  config,
  variant = 'horizontal',
  themeMode = 'light',
  className = '',
  size = 'md',
  showTaglineOverride
}) => {
  // Determine effective colors based on theme mode
  let primary = config.primaryColor || '#0F5257';
  let accent = config.accentColor || '#D9A441';

  if (themeMode === 'dark') {
    primary = config.darkPrimaryColor || '#EDEFEA';
    accent = config.darkAccentColor || '#D9A441';
  } else if (themeMode === 'monochrome') {
    primary = '#111827';
    accent = '#4B5563';
  }

  // Dimension scaling
  const sizeMap = {
    xs: { mark: 18, text: '13px', tagline: '8px', gap: 'gap-1.5' },
    sm: { mark: 24, text: '16px', tagline: '9px', gap: 'gap-2' },
    md: { mark: 30, text: '20px', tagline: '10px', gap: 'gap-2.5' },
    lg: { mark: 38, text: '26px', tagline: '11px', gap: 'gap-3' },
    xl: { mark: 52, text: '36px', tagline: '13px', gap: 'gap-4' }
  };

  const currentSize = sizeMap[size];
  const markPixelSize = Math.round(currentSize.mark * (config.markScale || 1.0));
  const showTagline = showTaglineOverride !== undefined ? showTaglineOverride : config.showTagline;

  // Custom Image Upload mode if set
  if (config.customImageUrl) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src={config.customImageUrl}
          alt={config.brandName}
          className="object-contain"
          style={{ height: `${markPixelSize * 1.5}px` }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Icon only
  if (variant === 'icon_only' || config.markPosition === 'mark_only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} title={config.brandName}>
        <BrandLogoMark
          shape={config.markShape}
          primaryColor={primary}
          accentColor={accent}
          stemColor={config.stemColor}
          badgeBorderColor={config.badgeBorderColor}
          badgeFillColor={config.badgeFillColor}
          size={markPixelSize}
        />
      </div>
    );
  }

  // Text only
  if (config.markPosition === 'text_only') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          style={{
            fontFamily: config.fontFamily || 'Inter',
            fontWeight: config.fontWeight || 700,
            letterSpacing: `${config.letterSpacing || 1}px`,
            fontSize: currentSize.text,
            color: primary,
            lineHeight: 1.15
          }}
        >
          {config.brandName}
        </span>
        {showTagline && config.tagline && (
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 500,
              letterSpacing: '1.8px',
              fontSize: currentSize.tagline,
              color: accent,
              marginTop: '2px'
            }}
          >
            {config.tagline}
          </span>
        )}
      </div>
    );
  }

  // Stacked variant (emblem over text, matching the user's uploaded PNG)
  if (variant === 'stacked' || config.markPosition === 'top') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <BrandLogoMark
          shape={config.markShape}
          primaryColor={primary}
          accentColor={accent}
          stemColor={config.stemColor}
          badgeBorderColor={config.badgeBorderColor}
          badgeFillColor={config.badgeFillColor}
          size={markPixelSize * 1.3}
        />
        <div className="mt-2.5 flex flex-col items-center">
          <span
            style={{
              fontFamily: config.fontFamily || 'Inter',
              fontWeight: config.fontWeight || 700,
              letterSpacing: `${config.letterSpacing || 2}px`,
              fontSize: currentSize.text,
              color: primary,
              lineHeight: 1.15,
              textTransform: 'uppercase'
            }}
          >
            {config.brandName}
          </span>
          {showTagline && config.tagline && (
            <span
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '2px',
                fontSize: currentSize.tagline,
                color: accent,
                marginTop: '3px'
              }}
            >
              {config.tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      <BrandLogoMark
        shape={config.markShape}
        primaryColor={primary}
        accentColor={accent}
        stemColor={config.stemColor}
        badgeBorderColor={config.badgeBorderColor}
        badgeFillColor={config.badgeFillColor}
        size={markPixelSize}
      />
      <div className="flex flex-col justify-center">
        <span
          style={{
            fontFamily: config.fontFamily || 'Inter',
            fontWeight: config.fontWeight || 700,
            letterSpacing: `${config.letterSpacing || 1.5}px`,
            fontSize: currentSize.text,
            color: primary,
            lineHeight: 1.15,
            textTransform: 'uppercase'
          }}
        >
          {config.brandName}
        </span>
        {showTagline && config.tagline && (
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 600,
              letterSpacing: '1.6px',
              fontSize: currentSize.tagline,
              color: accent,
              marginTop: '1px'
            }}
          >
            {config.tagline}
          </span>
        )}
      </div>
    </div>
  );
};
