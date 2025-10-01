const baseUrl = import.meta.env.BASE_URL ?? '/';

const normalizeBase = (value: string): string => {
	if (!value || value === '/') return '';
	return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const basePath = normalizeBase(baseUrl);

const ensureLeadingSlash = (value: string): string => {
	if (!value) return '/';
	return value.startsWith('/') ? value : `/${value}`;
};

export const withBasePath = (path: string = '/'): string => {
	const normalizedPath = ensureLeadingSlash(path);
	if (normalizedPath === '/') {
		return basePath ? `${basePath}/` : '/';
	}
	return basePath ? `${basePath}${normalizedPath}` : normalizedPath;
};

export const stripTrailingSlash = (value: string): string => {
	if (!value) return '';
	if (value === '/') return '/';
	return value.endsWith('/') ? value.slice(0, -1) : value;
};

export { baseUrl };
