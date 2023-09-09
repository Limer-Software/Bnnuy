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


import { minimatch } from 'minimatch';
import BnnuyResponse from './utils/bnnuyResponse';
import Middleware, { BnnuyHandler, BnnuyMethods, BnnuyMiddlewareResponse } from './utils/middleware';
import MiddlewareBase from './utils/middlewareBase';
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

	/**
	 * Enable CORS.
	 * @default true
	 */
	cors?: boolean;
}

type MiddlewareKey = 'middleware' | 'static' | 'routing';

interface MiddlewareEntry
{
	type: MiddlewareKey;
	paths: string[];
	values: (Middleware | StaticDirectory)[];
}


class Bnnuy
{
	private readonly middlewares: MiddlewareEntry[] = [];

	private headers: HeadersInit = {};
	private compression: boolean = false;


	constructor(options: BnnuyOptions = {})
	{
		this.headers = {
			'X-Powered-By': 'Bnnuy',
			'X-Ua-Compatible': 'IE=Edge',
			'X-Xss-Protection': '0; mode=block',
			'X-Content-Type-Options': 'nosniff'
		};

		this.compression = options.compression ?? false;

		if (options.cors ?? true) {
			this.headers = {
				...this.headers,
				'Access-Control-Allow-Origin': '*',
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Resource-Policy': 'same-origin'
			};
		}


		if (options.xPoweredBy !== undefined) {

			if (typeof options.xPoweredBy === 'string') {
				this.headers['X-Powered-By'] = options.xPoweredBy;

			} else if (options.xPoweredBy === false) {
				delete this.headers['X-Powered-By'];
			}
		}
	}


	private addMiddleware(type: MiddlewareKey, ...middlewares: (Middleware | StaticDirectory)[])
	{
		const lastEntry: MiddlewareEntry | undefined = this.middlewares.length ?
														this.middlewares[this.middlewares.length - 1] :
														undefined;

		const paths: string[] = [];

		for (const staticDirectory of middlewares as MiddlewareBase[]) {
			paths.push(...staticDirectory.getPaths());
		}


		if (lastEntry !== undefined && lastEntry.type === type) {
			lastEntry.values.push(...middlewares);
			lastEntry.paths.push(...paths);

			return;
		}

		this.middlewares.push({
			type,
			paths,
			values: middlewares
		});
	}


	private prepareResponse(res: BnnuyResponse)
	{
		const response = res.getResponse(this.headers);

		return response;
	}


	/**
	 * Serve static files from a directory. It will automatically watch for changes and reload the paths.
	 * @param path The path to the directory.
	 * @param options Options for serving static files.
	 */
	public async static(path: string, options: ServeStaticOptions = {})
	{
		const staticDirectory = new StaticDirectory(path);
		await staticDirectory.loadPaths(options);

		this.addMiddleware('static', staticDirectory);
	}


	private route(method: BnnuyMethods, path: string | string[], ...handlers: BnnuyHandler[])
	{
		if (typeof path === 'string') {
			path = [ path ];
		}

		this.addMiddleware('routing', new Middleware(method, path, ...handlers));
	}

	private middleware(path: string | string[], ...handlers: BnnuyHandler[])
	{
		if (typeof path === 'string') {
			path = [ path ];
		}

		this.addMiddleware('middleware', new Middleware('ANY', path, ...handlers));
	}

	/**
	 * Add a middleware.
	 * @param handlers The handlers to add.
	 */
	public use(...handlers: BnnuyHandler[])
	{
		this.middleware('*', ...handlers);
	}

	/**
	 * Add a middleware for a specific method.
	 * @param method The method to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public all(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('ANY', route, ...handlers);
	}

	/**
	 * Add a middleware for the GET method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public get(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('GET', route, ...handlers);
	}

	/**
	 * Add a middleware for the POST method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public post(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('GET', route, ...handlers);
	}

	/**
	 * Add a middleware for the PUT method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public put(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('PUT', route, ...handlers);
	}

	/**
	 * Add a middleware for the DELETE method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public delete(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('DELETE', route, ...handlers);
	}

	/**
	 * Add a middleware for the HEAD method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public head(route: string | string[], ...handlers: BnnuyHandler[])
	{
		this.route('HEAD', route, ...handlers);
	}




	/**
	 * Creates and starts a server listening on the specified port.
	 * @param port The port to listen on.
	 * @param callback A callback function to be called when the server starts listening.
	 * @returns The resulting server.
	 */
	public async listen(port: number | string, callback: (() => void) | undefined = undefined)
	{
		const prepareResponse = this.prepareResponse.bind(this);
		const middlewares = this.middlewares;


		const server = Bun.serve({
			port: port,
			async fetch(req)
			{
				const url = new URL(req.url);


				return new Promise<Response>(async (resolve, reject) =>
				{
					const res: BnnuyResponse = new BnnuyResponse();

					for (const entry of middlewares)
					{
						switch (entry.type) {
							case 'static': // Handle static files
								if (req.method !== 'GET') {
									continue;
								}

								// Rapidly check if the path is in the list of paths
								if (!entry.paths.includes(url.pathname)) {
									continue;
								}


								try {
									for (const staticDirectory of entry.values as StaticDirectory[]) {
										const file = staticDirectory.get(url.pathname);

										if (file !== undefined) {
											if (file === 403) {
												res.status(403).send('Forbidden');

												return resolve(prepareResponse(res));
											}

											res.status(200).send(Bun.file(file));

											return resolve(prepareResponse(res));
										}
									}
								} catch (e) {
									return reject(e);
								}
								break;

							case 'routing': // Handle routing
								const paths = entry.paths.filter(p => {
									return minimatch(url.pathname, p);
								});

								if (paths.length === 0) {
									continue;
								}

								// Fallback

							case 'middleware': // Handle middleware
								try {
									for (const middleware of entry.values as Middleware[]) {
										const shouldFallback = await middleware.handle(req,
																					   res as BnnuyMiddlewareResponse);

										if (shouldFallback) {
											continue;
										}

										return resolve(prepareResponse(res));
									}
								} catch (e) {
									return reject(e);
								}
								break;
						}
					}

					res.status(404).send('Not Found');
					return resolve(prepareResponse(res));
				});
			}
		});


		if (callback !== undefined) {
			callback();
		}

		return server;
	}
}


export default function bnnuy(options?: BnnuyOptions) {
	return new Bnnuy(options ?? {});
}


// export {
// 	BnnuyResponse,
// 	BnnuyMiddlewareResponse,
// 	BnnuyOptions
// };
