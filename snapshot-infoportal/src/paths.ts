/** The file extension of the last path segment ("png" for "/media/a/b.png?width=1"), or undefined for pages. */
export function fileExtension(path: string): string | undefined {
	const lastSegment = path.split(/[?#]/)[0].split('/').pop() ?? '';
	return /\.([a-z0-9]{1,8})$/i.exec(lastSegment)?.[1]?.toLowerCase();
}

export function hasFileExtension(path: string): boolean {
	return fileExtension(path) !== undefined;
}
