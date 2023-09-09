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


import StaticDirectory, { ServeStaticOptions } from './utils/staticDirectory';


interface BnnuyOptions
{
	/**
	 * Set the X-Powered-By header. Set it to false to disable.
	 */
	xPoweredBy?: string | boolean;

	/**
	 * Enable gzip and deflate compression.
	 */
	compression?: boolean;
}


class Bnnuy
{
	private staticDirectories: StaticDirectory[] = [];
	private headers: HeadersInit = {};

	constructor(options: BnnuyOptions = {})
	{
		this.headers = {
			'X-Powered-By': 'Bnnuy'
		};


		if (options.xPoweredBy !== undefined) {

			if (typeof options.xPoweredBy === 'string') {
				this.headers['X-Powered-By'] = options.xPoweredBy;

			} else if (options.xPoweredBy === false) {
				delete this.headers['X-Powered-By'];
			}
		}
	}



	public async static(path: string, options: ServeStaticOptions = {})
	{
		const staticDirectory = new StaticDirectory(path);
		await staticDirectory.load(path, options);

		this.staticDirectories.push(staticDirectory);
	}


	public async listen(port: number | string, callback: (() => void) | undefined = undefined)
	{
		const staticDirectories = this.staticDirectories;
		const headers = this.headers;

		Bun.serve({
			port: port,
			async fetch(req) {
				const url = new URL(req.url);

				if (url.pathname.endsWith('/')) {
					url.pathname = url.pathname.slice(0, -1);
				}


				return new Promise<Response>((resolve, reject) => {
					try {

						for (const staticDirectory of staticDirectories) {
							const file = staticDirectory.get(url.pathname);

							if (file !== undefined) {
								if (file === 403) {
									return resolve(new Response('Forbidden', {
										status: 403
									}));
								}

								return resolve(new Response(Bun.file(file), { headers }));
							}
						}

						return resolve(new Response('Not Found', { status: 404 }));
					} catch (e) {
						return reject(e);
					}
				});
			}
		});


		if (callback !== undefined) {
			callback();
		}
	}
}


export default function bnnuy() {
	return new Bnnuy();
}
