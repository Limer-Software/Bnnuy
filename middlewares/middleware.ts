/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { minimatch } from "minimatch";

import BnnuyResponse from "../utils/bnnuyResponse";
import MiddlewareBase from "./middlewareBase";


export type NextFunction = () => void;
export type BnnuyMiddlewareResponse = Omit<BnnuyResponse, 'getResponse'>;
export type BnnuyHandler = (req: Request, res: BnnuyMiddlewareResponse, next: NextFunction) => Promise<void> |
							((req: Request, res: BnnuyMiddlewareResponse) => Promise<void>);


export type BnnuyMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'ANY';


class Middleware implements MiddlewareBase
{
	private method: BnnuyMethods;
	private paths: string[];
	private handlers: BnnuyHandler[];


	constructor(method: BnnuyMethods, paths: string[], ...handlers: BnnuyHandler[])
	{
		this.method = method;
		this.paths = paths;
		this.handlers = handlers;

		for (const i in this.paths) {
			if (this.paths[i] === '') {
				throw new Error('The path cannot be empty.');
			}

			if (this.paths[i] === '*') {
				this.paths[i] = '**';
			}
		}
	}


	public getPaths(): string[]
	{
		return this.paths;
	}

	public getHandlers(): BnnuyHandler[]
	{
		return this.handlers;
	}

	public containsPath(path: string): boolean
	{
		for (const p of this.paths) {
			if (minimatch(path, p)) {
				return true;
			}
		}

		return false;
	}


	/**
	 * Handle the middleware.
	 * @returns A boolean indicating if the middleware should do a fallback.
	 */
	public async handle(req: Request, res: BnnuyMiddlewareResponse): Promise<boolean>
	{
		if (this.handlers.length === 0) {
			return true;
		}

		if (this.method !== 'ANY' && this.method !== req.method) {
			return true;
		}

		
		var doFallback = false;
		function nextFunction(): void
		{
			doFallback = true;
		}

		const url = new URL(req.url);


		for (const path of this.paths) {
			if (minimatch(url.pathname, path)) {
				for (const handler of this.handlers) {
					try {
						doFallback = false;
						await handler(req, res, nextFunction);

						if (doFallback) {
							continue;
						}

						return false;
					} catch (e) {
						throw e;
					}
				}
			}
		}

		return true;
	}
}


export default Middleware;