/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { Methods, Handler, Response, Request } from "./types";


export type NextFunction = () => void;


class Middleware
{
	private handlers: Handler[];


	constructor(...handlers: Handler[])
	{
		this.handlers = handlers;
	}

	public add(...handlers: Handler[]): void
	{
		this.handlers.push(...handlers);
	}


	public getHandlers(): Handler[]
	{
		return this.handlers;
	}


	/**
	 * Handle the middleware.
	 * @returns A boolean indicating if the middleware should do a fallback.
	 */
	public async handle(req: Request, res: Response): Promise<boolean>
	{
		if (this.handlers.length === 0) {
			return true;
		}

		
		var doFallback = false;

		function nextFunction(): void
		{
			doFallback = true;
		}


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

		return true;
	}
}


export default Middleware;
