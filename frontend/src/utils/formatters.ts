import i18n from '../config/i18n';

/**
 * Get the current locale from i18n or fallback to browser/default
 */
const getCurrentLocale = (): string => {
  // Try to get locale from i18n (if initialized)
  try {
    if (i18n && i18n.language) {
      // If language already contains a hyphen, it's a full locale (e.g., "en-US")
      if (i18n.language.includes('-')) {
        return i18n.language;
      }

      // Map i18n language codes to Intl locale codes
      const localeMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
      };
      return localeMap[i18n.language] || `${i18n.language}-${i18n.language.toUpperCase()}`;
    }
  } catch (e) {
    // Ignore errors, will fallback
  }

  // Fallback to browser language or default
  return navigator?.language || 'en-US';
};

export const formatCurrency = (amountMinor: number, currency: string): string => {
  const amount = amountMinor / 100;
  const locale = getCurrentLocale();

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    const locale = getCurrentLocale();
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const locale = getCurrentLocale();

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(dateString);
  }
};
