// Edge-compatible cookie utilities
export const setAuthToken = (token: string): void => {
  if (typeof document !== 'undefined') {
    document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
  }
};

export const getAuthToken = (): string | null => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        return value;
      }
    }
  }
  return null;
};

export const removeAuthToken = (): void => {
  if (typeof document !== 'undefined') {
    document.cookie = 'authToken=; path=/; max-age=0; secure; samesite=strict';
  }
};