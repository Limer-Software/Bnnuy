/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


import BnnuyRequest from '../../utils/bnnuyRequest';
import BnnuyResponse from '../../utils/bnnuyResponse';


export type NextFunction = () => void;
export type BnnuyMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'ANY';
export type Response = Omit<BnnuyResponse, 'getResponse'>;
export type Request = BnnuyRequest;

export type BnnuyHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

