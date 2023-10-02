/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { watch } from 'fs';
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
}


class StaticMiddleware
{
	private path: string;

	// { 'virtual/path': 'real/path' | 403 }
	private directories: { [key: string]: string | 403 } = {};


	constructor(path: string)
	{
		this.path = path;


		const watcher = chokidar.watch(path, { persistent: true });

		watcher.on('add', async (path) =>
		{
			await this.loadPaths();
		});

		watcher.on('unlink', async (path) =>
		{
			delete this.directories[this.realPathToVirtualPath(path)];
		});
	}


	private async loadDirectory(dir: string,
								pathToRemove: string | undefined = undefined,
								options: ServeStaticOptions = {})
	{
		const files = await readdir(dir, { withFileTypes: true });

		for (const file of files) {
			if (pathToRemove === undefined) {
				pathToRemove = dir;
			}

			const path = `${dir}/${file.name}`;
			const virtualPath = `${path}`.replace(pathToRemove, '');

			// Exclude dot files
			if (options.excludeDotFiles === true) {
				if (file.name.startsWith('.')) {
					continue;
				}
			}


			if (file.isDirectory()) {
				if (options.useDirHTTPCode !== undefined) {
					this.directories[virtualPath] = 403;
					this.directories[`${virtualPath}/`] = 403;
				}

				await this.loadDirectory(path, pathToRemove, options);

			} else {
				// Exclude files
				var exclude = false;

				for (const pattern of options.exclude ?? []) {
					if (minimatch(path, pattern, { matchBase: true })) {
						exclude = true;
						continue;
					}
				}

				if (exclude) {
					continue;
				}

				// Prevent duplicates
				if (this.directories[virtualPath] === undefined) {
					this.directories[virtualPath] = path;
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


	public async loadPaths(options: ServeStaticOptions = {})
	{
		this.directories = {};

		await this.loadDirectory(this.path, undefined, options);
	}


	public get(path: string)
	{
		return this.directories[path];
	}
}


export default StaticMiddleware;