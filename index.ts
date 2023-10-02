/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { minimatch } from 'minimatch';
import BnnuyResponse from './utils/bnnuyResponse';
import Middleware from './middlewares/classic';
import RouterMiddleware from './middlewares/router';
import StaticMiddleware, { ServeStaticOptions } from './middlewares/static';
import { Server } from 'bun';
import { Handler, Methods, Request, RoutingHandler } from './middlewares/types';
import BnnuyRequest from './utils/bnnuyRequest';


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



interface ClassicMiddlewareEntry
{
	type: 'middleware';
	value: Middleware;
}

interface RouterMiddlewareEntry
{
	type: 'router';
	value: RouterMiddleware;
}

interface StaticMiddlewareEntry
{
	type: 'static';
	value: StaticMiddleware;
}

type MiddlewareEntry = ClassicMiddlewareEntry | RouterMiddlewareEntry | StaticMiddlewareEntry;
type MiddlewareKey = 'middleware' | 'router' | 'static';



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
		const middleware = new StaticMiddleware(path);

		(async () => {
			await middleware.loadPaths(options);
		})();

		this.middlewares.push({
			type: 'static',
			value: middleware
		});


		return this;
	}

	private route(method: Methods, path: string | string[], handler: RoutingHandler)
	{
		if (typeof path === 'string') {
			path = [ path ];
		}

		const lastEntry = this.middlewares[this.middlewares.length - 1];

		if (!lastEntry || lastEntry.type !== 'router') {
			const middleware = new RouterMiddleware();
			
			middleware.add(method, path, handler);

			this.middlewares.push({
				type: 'router',
				value: middleware
			});

			return;
		}


		lastEntry.value.add(method, path, handler);
	}

	/**
	 * Add a middleware.
	 * @param handler The handler to add.
	 */
	public use(...handlers: Handler[]): Bnnuy
	{
		const lastEntry = this.middlewares[this.middlewares.length - 1];

		if (!lastEntry || lastEntry.type !== 'middleware') {
			const middleware = new Middleware(...handlers);

			this.middlewares.push({
				type: 'middleware',
				value: middleware
			});

			return this;
		}

		lastEntry.value.add(...handlers);

		return this;
	}


	/**
	 * Add a middleware for a specific method.
	 * @param method The method to add the middleware to.
	 * @param handler The handler to add.
	 */
	public all(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('ANY', route, handler);
		return this;
	}

	/**
	 * Add a middleware for the GET method.
	 * @param route The route to add the middleware to.
	 * @param handler The handler to add.
	 */
	public get(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('GET', route, handler);
		return this;
	}

	/**
	 * Add a middleware for the POST method.
	 * @param route The route to add the middleware to.
	 * @param handler The handler to add.
	 */
	public post(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('GET', route, handler);
		return this;
	}

	/**
	 * Add a middleware for the PUT method.
	 * @param route The route to add the middleware to.
	 * @param handler The handler to add.
	 */
	public put(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('PUT', route, handler);
		return this;
	}

	/**
	 * Add a middleware for the DELETE method.
	 * @param route The route to add the middleware to.
	 * @param handler The handler to add.
	 */
	public delete(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('DELETE', route, handler);
		return this;
	}

	/**
	 * Add a middleware for the HEAD method.
	 * @param route The route to add the middleware to.
	 * @param handler The handler to add.
	 */
	public head(route: string | string[], handler: RoutingHandler): Bnnuy
	{
		this.route('HEAD', route, handler);
		return this;
	}


	private getHTTPCodeResponse(res: BnnuyResponse, status: number, message: string): BnnuyResponse
	{
		res.status(status).send(
			'<!DOCTYPE html>' +
			'<html lang="en">' +
			`<title>${status}</title>` +
			`<p>${Bun.escapeHTML(message)}</p>`
		);

		return res;
	}


	/**
	 * Creates and starts a server listening on the specified port.
	 * @param port The port to listen on.
	 * @param callback A callback function to be called when the server starts listening.
	 * @returns The resulting server.
	 */
	public async listen(port: number | string, callback?: (server: Server) => void)
	{
		const self = this;


		const server = Bun.serve({
			port: port,
			async fetch(request, server)
			{
				const res: BnnuyResponse = new BnnuyResponse();
				const req: BnnuyRequest = new BnnuyRequest(request);

				req.setNanoseconds(Bun.nanoseconds());


				return new Promise<Response>(async (resolve, reject) =>
				{
					for (const entry of self.middlewares)
					{
						switch (entry.type) {
							case 'static': // Handle static files
								if (request.method !== 'GET') {
									continue;
								}

								const file = entry.value.get(req.url.pathname);

								if (file) {	
									try {
										if (file === 403) {
											self.getHTTPCodeResponse(res, 403, 'Forbidden');

											return resolve(self.prepareResponse(res));
										}

										res.status(200).send(Bun.file(file));

										return resolve(self.prepareResponse(res));
										
									} catch (e) {
										return reject(e);
									}
								}

								break;

							case 'router': // Handle routing
								const response = entry.value.get(request.method.toUpperCase() as Methods,
																req.url.pathname);

								if (response) {
									try {
										req.setParams(response.params);
										await response.handler(req, res);

										return resolve(self.prepareResponse(res));
									} catch (e) {
										return reject(e);
									}
								}

								break;

							case 'middleware': // Handle middleware
								try {
									const fallback = await entry.value.handle(req, res);

									if (fallback) {
										continue;
									}

									return resolve(self.prepareResponse(res));

								} catch (e) {
									return reject(e);
								}
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
