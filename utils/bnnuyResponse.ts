/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	
	Licensed under LGPLv3 <https://www.gnu.org/licenses/lgpl-3.0.txt>
*/


export type BnnuyResponseBody = ReadableStream<any> | BlobPart | BlobPart[] | FormData | URLSearchParams | null;


class BnnuyResponse
{
	public locals: { [key: string]: any } = {};

	private headers: { [key: string]: string } = {};
	private body: BnnuyResponseBody = null;
	private statusCode: number = 200;

	private readyToSend: boolean = false;



	/**
	 * Set a header to the response. It will replace the header if it already exists.
	 * @param name The name of the header.
	 * @param value The value of the header.
	 */
	public setHeader(name: string, value: string): BnnuyResponse
	{
		if (this.readyToSend) {
			throw new Error('The response is already ready to send.');
		}
		
		this.headers[name] = value;
		return this;
	}

	/**
	 * Set multiple headers to the response. It will replace the headers if they already exist.
	 * @param headers The headers to set.
	 */
	public setHeaders(headers: { [key: string]: string }): BnnuyResponse
	{
		if (this.readyToSend) {
			throw new Error('The response is already ready to send.');
		}

		for (const name in headers) {
			this.headers[name] = headers[name];
		}

		return this;
	}


	/**
	 * Adds the body to the response and marks it as ready to send.
	 * @param body The body to send.
	 */
	public send(body?: BnnuyResponseBody): void
	{
		if (this.readyToSend) {
			throw new Error('The response is already ready to send.');
		}

		if (body) {
			this.body = body;
		}

		this.readyToSend = true;
	}


	public getHeaders(): HeadersInit
	{
		return this.headers;
	}

	public getBody(): BnnuyResponseBody
	{
		return this.body;
	}

	public getStatusCode(): number
	{
		return this.statusCode;
	}

	public status(code: number): BnnuyResponse
	{
		this.statusCode = code;
		return this;
	}


	/**
	 * Returns a Bun Response object.
	 */
	public getResponse(headers: HeadersInit): Response
	{
		if (!this.readyToSend) {
			throw new Error('The response is not ready to send.');
		}

		return new Response(this.body, {
			status: this.statusCode,
			headers: Object.assign(headers, this.headers)
		});
	}
}


export default BnnuyResponse;
