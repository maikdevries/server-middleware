import type { Empty, Merge, Reduce } from '@self/core';

/**
 * A request handler that processes an HTTP request with supplemental context data.
 *
 * @template C - Context properties available within this handler, defaults to {@link Empty}
 */
export type Handler<C = Empty> = (request: Request, context: C) => Response | Promise<Response>;

/**
 * Middleware function that intercepts HTTP requests and either short-circuits the chain by returning a response, or
 * passes control to the next handler, optionally expanding the context.
 *
 * @template R - Context properties that this middleware requires, defaults to {@link Empty}
 * @template P - Context properties that this middleware provides, defaults to {@link Empty}
 */
export type Middleware<R = Empty, P = Empty> = (
	request: Request,
	context: R,
	next: Handler<Merge<R, P>>,
) => Response | Promise<Response>;

/**
 * A middleware chain that can either be extended with {@link Middleware} and other {@link Chain | Chains}, or closed
 * with a single {@link Handler}.
 *
 * @template R - Context properties that this middleware chain requires
 * @template P - Context properties that this middleware chain provides
 */
export type Chain<R, P> = {
	(request: Request, context: R, next: Handler<Merge<R, P>>): Response | Promise<Response>;

	/**
	 * Closes the chain by appending a {@link Handler} and returning the complete request handler.
	 */
	add<RS>(handler: Handler<RS>): Handler<Reduce<R, RS, P>>;

	/**
	 * Extends the chain by appending a {@link Middleware} or {@link Chain}, which optionally expands the context.
	 */
	add<RS, PS>(next: Middleware<RS, PS> | Chain<RS, PS>): Chain<Reduce<R, RS, P>, Merge<P, PS>>;
};

/**
 * Composes a {@link Middleware} with a subsequent {@link Middleware}, {@link Chain} or {@link Handler} into a single
 * middleware function.
 *
 * The second middleware receives the original context merged with any properties provided by the first.
 */
function compose<RF, PF, RS, PS>(
	first: Middleware<RF, PF>,
	second: Middleware<RS, PS> | Chain<RS, PS> | Handler<RS>,
): Middleware<Reduce<RF, RS, PF>, Merge<PF, PS>> {
	return (request, context, next) =>
		first(request, context, (r, c) => second(r, c as RS, next as unknown as Handler<Merge<RS, PS>>));
}

/**
 * This function should not be used in practice as it simply returns an unchanged copy of the input handler. This is
 * defined only to achieve complete type safety.
 *
 * @ignore
 */
export function chain<R>(handler: Handler<R>): Handler<R>;

/**
 * Constructs a middleware chain that allows composing (multiple) {@link Middleware} with a single {@link Handler}.
 *
 * @example Basic usage
 * ```ts
 * import { chain, type Empty, type Handler, type Middleware } from '@maikdevries/server-middleware/core';
 *
 * const timing: Middleware = async (request, context, next) => {
 * 	const start = self.performance.now();
 * 	const response = await next(request, context);
 * 	const end = self.performance.now();
 *
 * 	self.console.log(`[${(end - start).toFixed(2)} ms] ${request.method} ${request.url} - ${response.status}`);
 * 	return response;
 * };
 *
 * const uuid: Middleware<Empty, { 'uuid': string }> = async (request, context, next) => {
 * 	return await next(request, { ...context, 'uuid': self.crypto.randomUUID() });
 * };
 *
 * const respond: Handler<{ 'uuid': string }> = async (request, context) => {
 * 	return new Response(`This request's unique UUID is ${context.uuid}`);
 * };
 *
 * const app = chain(timing).add(uuid).add(respond);
 * ```
 */
export function chain<R, P>(middleware: Middleware<R, P>): Chain<R, P>;

// @ts-ignore: https://github.com/denoland/deno/issues/30285
export function chain<R, P>(initial: Handler<R> | Middleware<R, P>): Handler<R> | Chain<R, P> {
	const copy = initial.bind(null);

	// @ts-expect-error: The function type is defined as part of the Chain type which prevents exposure on Handler
	copy.add = <RS, PS>(next: Middleware<RS, PS> | Chain<RS, PS>) => chain(compose(initial, next));

	return copy as Handler<R> | Chain<R, P>;
}
