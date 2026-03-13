import type { Empty, Merge, Reduce } from './types.ts';

/**
 * A request handler that processes an HTTP request with optional context data.
 *
 * @template C - Context object type available within the handler
 *
 * @param request - The incoming HTTP {@link Request}
 * @param context - Context object to be passed through the middleware chain
 * @returns HTTP {@link Response} (synchronously or as {@link Promise})
 */
export type Handler<C = Empty> = (request: Request, context: C) => Response | Promise<Response>;

/**
 * Middleware function that intercepts HTTP requests and can modify the context before passing it to the next handler.
 *
 * The middleware receives the current context object of type `R`, to which it can add properties of type `P` and passes
 * the merged context to the next handler.
 *
 * @template R - Context properties that this middleware requires
 * @template P - Context properties that this middleware provides
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
 * A middleware chain that can be extended with {@link Middleware} and {@link Chain} or ended with a {@link Handler}.
 *
 * @template R - Context properties that this middleware chain requires
 * @template P - Context properties that this middleware chain provides
 *
 * @internal
 */
type Chain<R, P> = {
	(request: Request, context: R, next: Handler<Merge<R, P>>): Response | Promise<Response>;

	/**
	 * Appends a {@link Handler} to the current chain, ending the middleware chain.
	 *
	 * @template RS - Context properties that the appended handler requires
	 *
	 * @param handler - {@link Handler} to append
	 * @returns Complete request handler with updated context object types
	 */
	add<RS>(handler: Handler<RS>): Handler<Reduce<R, RS, P>>;

	/**
	 * Appends a {@link Middleware} or {@link Chain} to the current chain, extending the context type.
	 *
	 * @template RS - Context properties that the appended middleware or chain requires
	 * @template PS - Context properties that the appended middleware or chain provides
	 *
	 * @param next - {@link Middleware} or {@link Chain} to append
	 * @returns Middleware chain with updated context object types
	 */
	add<RS, PS>(next: Middleware<RS, PS> | Chain<RS, PS>): Chain<Reduce<R, RS, P>, Merge<P, PS>>;
};

/**
 * Composes two {@link Middleware} or one {@link Middleware} and one {@link Chain} or {@link Handler} into a single
 * {@link Middleware}.
 *
 * The first middleware receives the original context, the second receives the context modified by the first.
 *
 * @template RF - Context properties that the first middleware requires
 * @template PF - Context properties that the first middleware provides
 * @template RS - Context properties that the second middleware or chain or handler requires
 * @template PS - Context properties that the second middleware or chain provides
 *
 * @param first - First {@link Middleware}
 * @param second - Second {@link Middleware} or {@link Chain} or {@link Handler}
 * @returns Composed {@link Middleware} with updated context object types
 */
function compose<RF, PF, RS, PS>(
	first: Middleware<RF, PF>,
	second: Middleware<RS, PS> | Chain<RS, PS> | Handler<RS>,
): Middleware<Reduce<RF, RS, PF>, Merge<PF, PS>> {
	return (request, context, next) =>
		first(request, context, (r, c) => second(r, c as RS, next as unknown as Handler<Merge<RS, PS>>));
}

/**
 * This version should not be used in practice as it simply returns an unchanged copy of the input handler. This is
 * included only to achieve complete type safety.
 *
 * @ignore
 */
export function chain<R>(handler: Handler<R>): Handler<R>;

/**
 * Creates a middleware chain that allows composing (multiple) {@link Middleware} with a {@link Handler}.
 *
 * @template R - Context properties that the middleware requires
 * @template P - Context properties that the middleware provides
 *
 * @param middleware - {@link Middleware} to make composable
 * @returns Middleware chain
 *
 * @example Basic usage
 * ```ts ignore
 * const logger: Middleware<Empty, { id: string }> = ...;
 * const authorise: Middleware<Empty, { user: User }> = ...;
 * const handler: Handler<{ id: string, user: User }> = ...;
 *
 * const app = chain(logger).add(authorise).add(handler);
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
