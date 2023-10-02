/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/

import { BnnuyRoutingHandler } from '../middlewares/types';
import { BnnuyRouterNode } from './bnnuyRouterNode';


export class BnnuyRouter
{
	private root: BnnuyRouterNode = new BnnuyRouterNode('/');


	public add(path: string, handler: BnnuyRoutingHandler): void
	{
		if (typeof path !== 'string') {
			throw new TypeError('The path must be a string.');
		}

		if (path === '/') {
			if (this.root.handler) {
				throw new Error(`Cannot create route '/' because a route already exists in the same location.`);
			}

			this.root.handler = handler;
			return;
		}


		if (path === '' || !path.startsWith('/')) {
			throw new Error(`Invalid route: '${path}'. The path must start with a slash.`);
		}


		const staticParts = path.split(/:.+?(?=\/|$)/);
		const dynamicParts = path.match(/:.+?(?=\/|$)/g);


		if (staticParts[staticParts.length - 1] === '') {
			staticParts.pop();
		}



		var pointer = this.root;

		for (var i = 0, j = 0; i < staticParts.length; i++) {
			var part = staticParts[i];

			if (part === '') {
				continue;
			}


			// Static parts
			if (part !== '/') {
				if (part.startsWith('/')) {
					part = part.slice(1);
				}

				if (part.endsWith('/')) {
					part = part.slice(0, -1);
				}


				const parts = part.split('/');

				for (const part of parts) {
					if (part === '') {
						throw new Error(`Invalid route: '${path}'. Empty static part.`);
					}


					if (!pointer.children.has(part)) {
						pointer.children.set(part, new BnnuyRouterNode(part));
					}
		
					pointer = pointer.children.get(part)!;
				}
			}


			// Dynamic parts
			if (dynamicParts && j < dynamicParts.length) {
				const dynamicPart = dynamicParts[j++].slice(1);


				if (!pointer.dynamicChild) {
					pointer.dynamicChild = new BnnuyRouterNode(dynamicPart, true);

				} else if (pointer.dynamicChild.name !== dynamicPart) {
					throw new Error(`Cannot create route '${path}' with parameter ':${dynamicPart}' because a route ` +
									`already exists with a different parameter name in the same location.`)
				}

				pointer = pointer.dynamicChild;
			}


			if (i < staticParts.length - 1) {
				continue;
			}


			if (!pointer.handler) {
				pointer.handler = handler;

			} else {
				throw new Error(`Cannot create route '${path}' because a route already exists in the same location.`);
			}
		}
	}

	public get(path: string): BnnuyRoutingHandler | undefined
	{
		if (typeof path !== 'string') {
			throw new TypeError('The path must be a string.');
		}

		if (path === '/') {
			return this.root.handler;
		}


		if (path === '' || !path.startsWith('/')) {
			throw new Error(`Invalid route: '${path}'. The path must start with a slash.`);
		}


		path = path.slice(1);

		if (path.endsWith('/')) {
			path = path.slice(0, -1);
		}


		const parts = path.split('/');

		var pointer = this.root;

		for (const part of parts) {
			if (part === '') {
				continue;
			}


			if (pointer.children.has(part)) {
				pointer = pointer.children.get(part)!;

			} else if (pointer.dynamicChild) {
				pointer = pointer.dynamicChild;

			} else {
				return undefined;
			}
		}

		return pointer.handler;
	}
}
