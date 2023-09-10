# bnnuy
Bnnuy is a future framework for Bun's HTTP API. It is currently in development and is not ready for use.


## Philosophy
Bnnuy has to be:
- Fast as possible.
- Lightweight.
- Simple, but powerful when you need it.
- Dynamic.


## Basic syntax
The syntax is pretty similar to Express, but with a few differences (mainly internally).

Here we have a simple example of a Hello World server, which listens on port 3000.

```ts
import bnnuy from 'bnnuy';

bnnuy()
	.get('/', async (_req, res) => {
		res.send('Hello World!');
	})
	.listen(3000);
```


And now here's another example, but this time we're serving static files from the `public` directory.

```ts
import bnnuy from 'bnnuy';

bnnuy()
	.static('public').
	.get('/', async (_req, res) => {
		res.send('Hello World!');
	})
	.listen(3000);
```

This still looks pretty much the same to Express, but the static middleware is actually a `static middleware`,
meanwhile, the `get` method is a `routing middleware`.


## Middleware concepts
To handle requests faster than a normal Middleware based framework, Bnnuy uses a concept called `middleware types`.

These types tells Bnnuy how to handle the middleware, and what to do with it.


For now, there are 3 types of middleware:
- `basic middleware`
- `static middleware`
- `routing middleware`


### Basic middleware
This middleware is the classic concept of middleware, it's a function that takes 3 arguments: `req`, `res` and `next`.

- `req` is the request object, which contains all the information about the request.
- `res` is the response object, this tells Bnnuy how to respond to the request.
- `next` is a function that tells Bnnuy to continue to the next middleware.

These middlewares are called on every request, and are usually used for logging, authentication, etc.

### Static middleware
As the name suggests, this middleware is used to serve static files. The difference with the basic middleware is that
it doesn't take a `next` argument, and it's only called if the file exists.

The O-notation of this middleware is `O(1)`, because it doesn't need to iterate over all the middlewares.

### Routing middleware
This middleware is used to handle requests to a specific path. It's similar to the basic middleware, but it doesn't
take a `next` argument, and it's only called if the path matches the request path.


## Contributing
All help is highly appreciated!

You can open an issue or a pull request, and I'll try to respond as soon as possible.

# License
This project is licensed under the LGPL-3.0 license. See the [LICENSE](LICENSE) file for more information.
