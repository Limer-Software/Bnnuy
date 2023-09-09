/*
	personal-website - The personal website of RobotoSkunk
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


import { readdir } from 'fs/promises';
import { minimatch } from 'minimatch';


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


class StaticDirectory
{
	private path: string;

	// { 'virtual/path': 'real/path' | 403 }
	private directories: { [key: string]: string | 403 } = {};


	constructor(path: string)
	{
		this.path = path;
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


	public async load(path: string, options: ServeStaticOptions = {})
	{
		this.directories = {};

		await this.loadDirectory(path, undefined, options);
	}


	public get(path: string)
	{
		return this.directories[path];
	}
}


export default StaticDirectory;
