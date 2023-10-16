/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { readdir } from 'fs/promises';
import { minimatch } from 'minimatch';
import chokidar from 'chokidar';


export interface ServeStaticOptions
{
	/**
	 * Simulate a 403 HTTP code when the directory of a static file is requested.
	 */
	useDirHTTPCode?: boolean;

	/**
	 * Exclude files from the static files (written in glob pattern).
	 */
	exclude?: string[];

	/**
	 * Exclude dot files (files starting with a dot, including directories).
	 */
	excludeDotFiles?: boolean;

	/**
	 * Sets the max age of the Cache-Control header in milliseconds or a string in ms format.
	 */
	maxAge?: number | string;
}


class StaticMiddleware
{
	private path: string;

	// { 'virtual/path': 'real/path' | 403 }
	private directories: Map<string, string | 403> = new Map();

	private _options: ServeStaticOptions;


	constructor(path: string, options: ServeStaticOptions = {})
	{
		this.path = path;
		this._options = options;

		this.directories = new Map();


		const watcher = chokidar.watch(path, { persistent: true });

		watcher.on('add', async (path) =>
		{
			await this.loadPaths();
		});

		watcher.on('unlink', async (path) =>
		{
			this.directories.delete(this.realPathToVirtualPath(path));
		});
	}


	public get options()
	{
		return this._options;
	}


	private async loadDirectory(dir: string, pathToRemove: string | undefined = undefined)
	{
		const files = await readdir(dir, { withFileTypes: true });

		for (const file of files) {
			if (pathToRemove === undefined) {
				pathToRemove = dir;
			}

			const path = `${dir}/${file.name}`;
			const virtualPath = `${path}`.replace(pathToRemove, '');

			// Exclude dot files
			if (this.options.excludeDotFiles === true) {
				if (file.name.startsWith('.')) {
					continue;
				}
			}


			if (file.isDirectory()) {
				if (this.options.useDirHTTPCode !== undefined) {
					this.directories.set(virtualPath, 403);
					this.directories.set(`${virtualPath}/`, 403);
				}

				await this.loadDirectory(path, pathToRemove);

			} else {
				// Exclude files
				var exclude = false;

				for (const pattern of this.options.exclude ?? []) {
					if (minimatch(path, pattern, { matchBase: true })) {
						exclude = true;
						continue;
					}
				}

				if (exclude) {
					continue;
				}

				// Prevent duplicates
				if (!this.directories.has(virtualPath)) {
					this.directories.set(virtualPath, path);
				}
			}
		}
	}


	// private realPathExistsInDirectories(path: string)
	// {
	// 	const virtualPath = this.realPathToVirtualPath(path);

	// 	return this.directories[virtualPath] !== undefined;
	// }

	private realPathToVirtualPath(path: string)
	{
		return `${path}`.replace(this.path, '');
	}


	public async loadPaths()
	{
		await this.loadDirectory(this.path, undefined);
	}


	public get(path: string)
	{
		return this.directories.get(path);
	}
}


export default StaticMiddleware;
