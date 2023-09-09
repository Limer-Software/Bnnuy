/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
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

import { minimatch } from "minimatch";

import BnnuyResponse from "./bnnuyResponse";
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


		for (const path of this.paths) {
			if (path === '*' || minimatch(req.url, path)) {
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
