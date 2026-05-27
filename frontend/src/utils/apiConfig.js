const API_ORIGIN = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const getApiUrl = (path = '') => {
  if (!path) {
    return API_ORIGIN || '';
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
};

export const getUploadUrl = (path = '') => getApiUrl(path);