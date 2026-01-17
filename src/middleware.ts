import type { Empty, Merge, Reduce } from './types.ts';

export type Handler<C = Empty> = (request: Request, context: C) => Response | Promise<Response>;

export type Middleware<R = Empty, P = Empty> = (
	request: Request,
	context: R,
	next: Handler<Merge<R, P>>,
) => Response | Promise<Response>;

type Chain<R, P> = {
	(request: Request, context: R, next: Handler<Merge<R, P>>): Response | Promise<Response>;

	add<RS>(handler: Handler<RS>): Handler<Reduce<R, RS, P>>;
	add<RS, PS>(middleware: Middleware<RS, PS>): Chain<Reduce<R, RS, P>, Merge<P, PS>>;
};

function compose<RF, PF, RS, PS>(
	first: Middleware<RF, PF>,
	second: Middleware<RS, PS> | Handler<RS>,
): Middleware<Reduce<RF, RS, PF>, Merge<PF, PS>> {
	// @ts-expect-error: The expected Context and Middleware types do overlap with the function parameters
	return (request, context, next) => first(request, context, (r, c) => second(r, c, next));
}

export function chain<R>(handler: Handler<R>): Handler<R>;
export function chain<R, P>(middleware: Middleware<R, P>): Chain<R, P>;
// @ts-ignore: https://github.com/denoland/deno/issues/30285
export function chain<R, P>(middleware: Handler<R> | Middleware<R, P>): Handler<R> | Chain<R, P> {
	const copy = middleware.bind(null);

	// @ts-expect-error: The function type is already defined as part of the Chain type which avoids exposure on Handlers
	copy.add = (m) => chain(compose(middleware, m));

	return copy as Handler<R> | Chain<R, P>;
}
