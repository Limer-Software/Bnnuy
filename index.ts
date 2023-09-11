/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { minimatch } from 'minimatch';
import BnnuyResponse from './utils/bnnuyResponse';
import Middleware, { BnnuyHandler, BnnuyMethods, BnnuyMiddlewareResponse } from './utils/middleware';
import MiddlewareBase from './utils/middlewareBase';
import StaticDirectory, { ServeStaticOptions } from './utils/staticDirectory';
import { Server } from 'bun';


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

	private headers: Headers = new Headers();
	private compression: boolean = false;


	constructor(options: BnnuyOptions = {})
	{
		this.headers.set('X-Powered-By', 'Bnnuy');
		this.headers.set('X-Ua-Compatible', 'IE=Edge');
		this.headers.set('X-Xss-Protection', '0; mode=block');
		this.headers.set('X-Content-Type-Options', 'nosniff');


		this.compression = options.compression ?? false;

		if (options.cors ?? true) {
			this.headers.set('Access-Control-Allow-Origin', 'self');
			this.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
			this.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
		}


		if (options.xPoweredBy !== undefined) {

			if (typeof options.xPoweredBy === 'string') {
				this.headers.set('X-Powered-By', options.xPoweredBy);

			} else if (options.xPoweredBy === false) {
				this.headers.delete('X-Powered-By');
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
		var body = res.getBody();
		var headers = res.getHeaders();
		const status = res.getStatusCode();

		for (const [key, value] of this.headers) {
			headers.set(key, value);
		}

		if (!headers.has('Content-Type')) {
			if (typeof body === 'string') {
				headers.set('Content-Type', 'text/html; charset=utf-8');
			}
		}


		if (this.compression && body !== null) {
			const temporalResponse = new Response(body, {
				status,
				headers
			});


			if (!temporalResponse.headers.has('Content-Type')) {
				headers.set('Content-Type', temporalResponse.headers.get('Content-Type') ?? 'text/html; charset=utf-8');
			}
			headers.set('Content-Encoding', 'gzip');


			body = Bun.gzipSync(Buffer.from(body.toString()));
		}


		return new Response(body, {
			status,
			headers
		});
	}


	/**
	 * Serve static files from a directory. It will automatically watch for changes and reload the paths.
	 * @param path The path to the directory.
	 * @param options Options for serving static files.
	 */
	public static(path: string, options: ServeStaticOptions = {}): Bnnuy
	{
		const staticDirectory = new StaticDirectory(path);

		(async () => {
			await staticDirectory.loadPaths(options);
		})();

		this.addMiddleware('static', staticDirectory);

		return this;
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
	public use(...handlers: BnnuyHandler[]): Bnnuy
	{
		this.middleware('*', ...handlers);
		return this;
	}

	/**
	 * Add a middleware for a specific method.
	 * @param method The method to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public all(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('ANY', route, ...handlers);
		return this;
	}

	/**
	 * Add a middleware for the GET method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public get(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('GET', route, ...handlers);
		return this;
	}

	/**
	 * Add a middleware for the POST method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public post(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('GET', route, ...handlers);
		return this;
	}

	/**
	 * Add a middleware for the PUT method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public put(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('PUT', route, ...handlers);
		return this;
	}

	/**
	 * Add a middleware for the DELETE method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public delete(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('DELETE', route, ...handlers);
		return this;
	}

	/**
	 * Add a middleware for the HEAD method.
	 * @param route The route to add the middleware to.
	 * @param handlers The handlers to add.
	 */
	public head(route: string | string[], ...handlers: BnnuyHandler[]): Bnnuy
	{
		this.route('HEAD', route, ...handlers);
		return this;
	}


	private getHTTPCodeResponse(res: BnnuyResponse, status: number, message: string): BnnuyResponse
	{
		res.status(status).send(
			'<!DOCTYPE html>' +
			'<html lang="en">' +
			`<title>${status}</title>` +
			`<p>${message}</p>`
		);

		return res;
	}


	/**
	 * Creates and starts a server listening on the specified port.
	 * @param port The port to listen on.
	 * @param callback A callback function to be called when the server starts listening.
	 * @returns The resulting server.
	 */
	public async listen(port: number | string, callback: ((server: Server) => void) | undefined = undefined)
	{
		const self = this;


		const server = Bun.serve({
			port: port,
			async fetch(req)
			{
				const res: BnnuyResponse = new BnnuyResponse();
				const url = new URL(req.url);

				res.locals.ping = Bun.nanoseconds();

				return new Promise<Response>(async (resolve, reject) =>
				{

					for (const entry of self.middlewares)
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
												self.getHTTPCodeResponse(res, 403, 'Forbidden');

												return resolve(self.prepareResponse(res));
											}

											res.status(200).send(Bun.file(file));

											return resolve(self.prepareResponse(res));
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

										return resolve(self.prepareResponse(res));
									}
								} catch (e) {
									return reject(e);
								}
								break;
						}
					}

					self.getHTTPCodeResponse(res, 404, 'Not Found');
					return resolve(self.prepareResponse(res));
				});
			}
		});


		if (callback !== undefined) {
			callback(server);
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
