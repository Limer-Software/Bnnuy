/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/

import { RoutingHandler } from '../middlewares/types';


export class BnnuyRouterNode
{
	public name: string;
	public isDynamic: boolean;

	public handler?: RoutingHandler;
	public children: Map<string, BnnuyRouterNode> = new Map();
	public dynamicChild?: BnnuyRouterNode;


	public constructor(name: string, isDynamic: boolean = false)
	{
		this.name = name;
		this.isDynamic = isDynamic;
	}
}
