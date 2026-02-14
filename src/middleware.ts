import type { Empty, Merge, Reduce } from './types.ts';

/**
 * A request handler that processes an HTTP request with optional context data.
 *
 * @template C - Context object type available within the handler (defaults to {@link Empty})
 *
 * @param request - The incoming HTTP {@link Request}
 * @param context - Context object to be passed through the middleware chain
 * @returns HTTP {@link Response} (synchronously or as {@link Promise})
 */
export type Handler<C = Empty> = (request: Request, context: C) => Response | Promise<Response>;

/**
 * Middleware function that intercepts HTTP requests and can modify the context before passing it to the next handler.
 *
 * The middleware receives the current context object of type `R`, to which it can add properties of type `P` and passes the merged context
 * {@linkcode Merge}`<R, P>` to the next handler.
 *
 * @template R - Required context properties that must be present
 * @template P - Provided context properties that this middleware adds
 *
 * @param request - The incoming HTTP {@link Request}
 * @param context - Current context object
 * @param next - Next {@link Handler} in the chain which receives the merged context
 * @returns HTTP {@link Response} (synchronously or as {@link Promise})
 */
export type Middleware<R = Empty, P = Empty> = (
	request: Request,
	context: R,
	next: Handler<Merge<R, P>>,
) => Response | Promise<Response>;

/**
 * A middleware chain that can be extended with (multiple) {@link Middleware} or single {@link Handler}.
 *
 * @template R - Required context properties that must be present
 * @template P - Provided context properties that this middleware adds (for middleware only)
 *
 * @internal
 */
type Chain<R, P> = {
	/**
	 * Invokes the middleware chain.
	 *
	 * @param request - The incoming HTTP {@link Request}
	 * @param context - Current context object
	 * @param next - Next {@link Handler} in the chain which receives the merged context
	 * @returns HTTP {@link Response} (synchronously or as {@link Promise})
	 */
	(request: Request, context: R, next: Handler<Merge<R, P>>): Response | Promise<Response>;

	/**
	 * Appends a {@link Handler} to the chain, terminating the middleware chain.
	 *
	 * @template RS - Required context properties of the appended handler
	 *
	 * @param handler - {@link Handler} to append
	 * @returns Complete request handler with reduced context object types
	 */
	add<RS>(handler: Handler<RS>): Handler<Reduce<R, RS, P>>;

	/**
	 * Appends a {@link Middleware} to the chain, extending the context type.
	 *
	 * @template RS - Required context properties of the appended middleware
	 * @template PS - Provided context properties of the appended middleware
	 *
	 * @param middleware - {@link Middleware} to append
	 * @returns Middleware chain with updated context object types
	 */
	add<RS, PS>(middleware: Middleware<RS, PS>): Chain<Reduce<R, RS, P>, Merge<P, PS>>;
};

/**
 * Composes two {@link Middleware} or one {@link Middleware} and one {@link Handler} into a single {@link Middleware}.
 *
 * The first middleware receives the original context, the second receives the context modified by the first.
 *
 * @template RF - Required context properties of the first middleware
 * @template PF - Provided context properties of the first middleware
 * @template RS - Required context properties of the second middleware or handler
 * @template PS - Provided context properties of the second middleware (set to {@link Empty} for handlers)
 *
 * @param first - First {@link Middleware}
 * @param second - Second {@link Middleware} or {@link Handler}
 * @returns Composed {@link Middleware} with updated context object types
 */
function compose<RF, PF, RS, PS>(
	first: Middleware<RF, PF>,
	second: Middleware<RS, PS> | Handler<RS>,
): Middleware<Reduce<RF, RS, PF>, Merge<PF, PS>> {
	// @ts-expect-error: The expected Context and Middleware types do overlap with the function parameters
	return (request, context, next) => first(request, context, (r, c) => second(r, c, next));
}

/**
 * Creates a middleware chain to allow for composition of (multiple) {@link Middleware} or single {@link Handler}.
 *
 * When given a {@link Middleware}, returns a middleware chain with an `add` method for composition.
 * When given a {@link Handler}, returns the handler unchanged.
 *
 * @template R - Required context properties that must be present
 * @template P - Provided context properties that the middleware adds (for middleware only)
 *
 * @param middleware - {@link Middleware} to make chainable or {@link Handler}
 * @returns A middleware chain or the original handler
 *
 * @example
 * ```ts
 * const logger: Middleware<Empty, { id: string }> = ...;
 * const authorise: Middleware<Empty, { user: User }> = ...;
 * const handler: Handler<{ id: string, user: User }> = ...;
 *
 * const app = chain(logger).add(authorise).add(handler);
 * ```
 */
export function chain<R>(handler: Handler<R>): Handler<R>;
export function chain<R, P>(middleware: Middleware<R, P>): Chain<R, P>;
// @ts-ignore: https://github.com/denoland/deno/issues/30285
export function chain<R, P>(middleware: Handler<R> | Middleware<R, P>): Handler<R> | Chain<R, P> {
	const copy = middleware.bind(null);

	// @ts-expect-error: The function type is already defined as part of the Chain type which avoids exposure on Handlers
	copy.add = (m) => chain(compose(middleware, m));

	return copy as Handler<R> | Chain<R, P>;
}
