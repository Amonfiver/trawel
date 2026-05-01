import { useState } from 'react';
import styles from './CountryFlag.module.css';

interface CountryFlagProps {
  isoAlpha2?: string;
  countryName: string;
  size?: 'small' | 'medium' | 'large';
}

export function CountryFlag({ isoAlpha2, countryName, size = 'medium' }: CountryFlagProps) {
  const [hasError, setHasError] = useState(false);
  const code = isoAlpha2?.trim().toLowerCase();

  if (!code || !/^[a-z]{2}$/.test(code) || hasError) {
    return null;
  }

  const width = size === 'large' ? 80 : 40;

  return (
    <img
      className={`${styles.flag} ${styles[size]}`}
      src={`https://flagcdn.com/w${width}/${code}.png`}
      alt={`Bandera de ${countryName}`}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}
