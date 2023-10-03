/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


class BnnuyBodyConsumer
{
	private raw: Request;

	constructor(req: Request)
	{
		this.raw = req;
	}


	public stream(): ReadableStream<any> | null
	{
		return this.raw.body;
	}

	public async text(): Promise<string>
	{
		return await this.raw.text();
	}

	public async json(): Promise<any>
	{
		return await this.raw.json();
	}

	public async formData(): Promise<FormData>
	{
		return await this.raw.formData();
	}

	public async arrayBuffer(): Promise<ArrayBuffer>
	{
		return await this.raw.arrayBuffer();
	}

	public async blob(): Promise<Blob>
	{
		return await this.raw.blob();
	}

	public async buffer(): Promise<Buffer>
	{
		return Buffer.from(await this.raw.arrayBuffer());
	}
}


export type Route = string;

export interface ParamsDictionary
{
	[key: string]: string;
}


class BnnuyRequest
{
	public readonly headers: Headers = new Headers();

	private __raw: Request;
	private __method: string;
	private __url: URL;
	private __body: BnnuyBodyConsumer;
	private __params: ParamsDictionary;

	private __nanoseconds: number = 0;


	constructor(req: Request)
	{
		this.__raw = req;
		this.__method = req.method;
		this.__url = new URL(req.url);
		this.__body = new BnnuyBodyConsumer(req);
		this.__params = {};

		this.headers = req.headers;
	}



	public get method(): string
	{
		return this.__method;
	}

	public get body(): BnnuyBodyConsumer
	{
		return this.__body;
	}

	public get url(): URL
	{
		return this.__url;
	}

	public get params(): ParamsDictionary
	{
		return this.__params;
	}

	public get raw(): Request
	{
		return this.__raw;
	}

	public get ip(): string
	{
		return this.__raw.headers.get('x-forwarded-for') ?? 'unknown';
	}

	public get nanoseconds(): number
	{
		return this.__nanoseconds;
	}


	public setParams(params: ParamsDictionary): void
	{
		this.__params = params;
	}

	public setNanoseconds(nanoseconds: number): void
	{
		this.__nanoseconds = nanoseconds;
	}
}

export default BnnuyRequest;
