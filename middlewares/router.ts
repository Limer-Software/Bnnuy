/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import { Methods, RoutingHandler } from './types';
import { BnnuyRouter, BnnuyRouterResponse } from '../router/bnnuyRouter';


class RouterMiddleware
{
	// <method, router>
	private routes = new Map<Methods, BnnuyRouter>();


	public add(method: Methods, paths: string[], handler: RoutingHandler): void
	{
		for (const path of paths) {
			if (!this.routes.has(method)) {
				this.routes.set(method, new BnnuyRouter());
			}
	
			this.routes.get(method)?.add(path, handler);
		}
	}


	public get(method: Methods, path: string): BnnuyRouterResponse | undefined
	{
		if (!this.routes.has(method)) {
			return undefined;
		}

		return this.routes.get(method)?.get(path);
	}
}


export default RouterMiddleware;
