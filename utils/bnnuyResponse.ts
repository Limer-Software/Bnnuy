/*
	bnnuy - A fast and simple framework for Bun's HTTP API.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
			headers: {
				...this.headers,
				...headers
			}
		});
	}
}


export default BnnuyResponse;
