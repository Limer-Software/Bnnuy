/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/

import { BnnuyRoutingHandler } from '../middlewares/types';
import { BnnuyRouterDynamicNode, BnnuyRouterNode } from './bnnuyRouterNode';


export class BnnuyRouter
{
	private root: BnnuyRouterNode = new BnnuyRouterNode();


	public add(path: string, handler: BnnuyRoutingHandler): void
	{
		if (typeof path !== 'string') {
			throw new TypeError('The path must be a string.');
		}

		if (path === '/') {
			this.root.handler = handler;
			return;
		}


		if (path === '' || path[0] !== '/') {
			throw new Error(`Invalid route: '${path}'. The path must start with a slash.`);
		}


		const staticParts = path.split(/:.+?(?=\/|$)/);
		const dynamicParts = path.match(/:.+?(?=\/|$)/g);


		if (staticParts[staticParts.length - 1] === '') {
			staticParts.pop();
		}


		var pointer = this.root;
		var dynamicIndex = 0;


		for (var i = 0; i < staticParts.length; i++) {
			const part = staticParts[i];

			if (part === '') {
				throw new Error(`Invalid route: '${path}'. Empty static part.`);
			}


			// Static parts
			if (!pointer.staticChildren) {
				pointer.staticChildren = new Map();

				pointer.staticChildren.set(part, new BnnuyRouterNode());
			}

			
			if (!pointer.staticChildren.has(part)) {
				pointer.staticChildren.set(part, new BnnuyRouterNode());
			}

			pointer = pointer.staticChildren.get(part)!;


			// Dynamic parts
			if (dynamicParts && dynamicIndex < dynamicParts.length) {
				const dynamicPart = dynamicParts[dynamicIndex++].slice(1);


				if (!pointer.dynamicChild) {
					pointer.dynamicChild = new BnnuyRouterDynamicNode(dynamicPart);

				} else if (pointer.dynamicChild.name !== dynamicPart) {
					throw new Error(`Cannot create route '${path}' with parameter ':${dynamicPart}' because a route ` +
									`already exists with a different parameter name in the same location.`)
				}


				if (!pointer.dynamicChild.staticChildren) {
					pointer.dynamicChild.staticChildren = new BnnuyRouterNode();

					pointer = pointer.dynamicChild.staticChildren;
					continue;
				}

				pointer = pointer.dynamicChild.staticChildren;
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
}
