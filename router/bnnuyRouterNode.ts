/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/

import { BnnuyRoutingHandler } from "../middlewares/types";


export class BnnuyRouterDynamicNode
{
	public name: string;

	public handler?: BnnuyRoutingHandler;
	public staticChildren?: BnnuyRouterNode;
	public dynamicChild?: BnnuyRouterNode;


	public constructor(name: string)
	{
		this.name = name;
	}
}


export class BnnuyRouterNode
{
	public handler?: BnnuyRoutingHandler;
	public staticChildren?: Map<string, BnnuyRouterNode>;
	public dynamicChild?: BnnuyRouterDynamicNode;
}
