/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/





class BnnuyRequest
{
	private headers: { [key: string]: string } = {};
	private body: any = null;
	private method: string = 'GET';
	private url: string = '/';
	private params: { [key: string]: string } = {};
	private query: { [key: string]: string } = {};

	
}
