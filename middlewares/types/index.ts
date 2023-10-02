/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import BnnuyRequest from '../../utils/bnnuyRequest';
import BnnuyResponse from '../../utils/bnnuyResponse';


export type NextFunction = () => void;
export type Response = Omit<BnnuyResponse, 'getResponse'>;
export type Request = BnnuyRequest;

export type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export type RoutingHandler = (req: Request, res: Response) => Promise<void>;


export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'ANY';


// export enum BnnuyMethods
// {
// 	GET = 1 << 0,
// 	POST = 1 << 1,
// 	PUT = 1 << 2,
// 	DELETE = 1 << 3,
// 	PATCH = 1 << 4,
// 	HEAD = 1 << 5,
// 	OPTIONS = 1 << 6,
// 	CONNECT = 1 << 7,
// 	TRACE = 1 << 8,

// 	ANY = GET | POST | PUT | DELETE | PATCH | HEAD | OPTIONS | CONNECT | TRACE
// }

// export function getMethodFromString(method: string): BnnuyMethods
// {
// 	switch (method.toUpperCase())
// 	{
// 		case 'GET':
// 			return BnnuyMethods.GET;
// 		case 'POST':
// 			return BnnuyMethods.POST;
// 		case 'PUT':
// 			return BnnuyMethods.PUT;
// 		case 'DELETE':
// 			return BnnuyMethods.DELETE;
// 		case 'PATCH':
// 			return BnnuyMethods.PATCH;
// 		case 'HEAD':
// 			return BnnuyMethods.HEAD;
// 		case 'OPTIONS':
// 			return BnnuyMethods.OPTIONS;
// 		case 'CONNECT':
// 			return BnnuyMethods.CONNECT;
// 		case 'TRACE':
// 			return BnnuyMethods.TRACE;
// 		case 'ANY':
// 			return BnnuyMethods.ANY;
// 	}

// 	return BnnuyMethods.GET;
// }
