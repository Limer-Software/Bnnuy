import { readdir } from "fs/promises";


class BnnuyServer {
	private staticFiles: { [key: string]: string } = {}; // { 'real/path': 'virtual/path' }


	private async __serveStatic(dir: string, pathToRemove: string | undefined = undefined) {
		const files = await readdir(dir, { withFileTypes: true });
	
		for (const file of files) {
			const path = `${dir}/${file.name}`;
	
			if (pathToRemove === undefined) {
				pathToRemove = dir;
			}
	
			if (file.isDirectory()) {
				await this.__serveStatic(path, pathToRemove);
			} else {
				const filePath = `${path}`.replace(pathToRemove, '');


				// Prevent duplicates
				if (this.staticFiles[filePath] === undefined) {
					this.staticFiles[filePath] = path;
				}
			}
		}
	}



	public async serveStatic(path: string)
	{
		await this.__serveStatic(path);
	}


	public async listen(port: number | string, callback: (() => void) | undefined = undefined)
	{
		const staticFiles = this.staticFiles;

		Bun.serve({
			port: port,
			async fetch(req) {
				const url = new URL(req.url);

				return new Promise<Response>((resolve, reject) => {
					if (staticFiles[url.pathname] !== undefined) {
						return resolve(new Response(Bun.file(staticFiles[url.pathname])));
					}

					return reject(new Error('Not found'));
				});
			}
		});

		if (callback !== undefined) {
			callback();
		}
	}
}


export default function bnnuy() {
	return new BnnuyServer();
}
