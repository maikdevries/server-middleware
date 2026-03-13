/**
 * This module provides a flexible approach to define and compose contextful middleware functions in a type-safe manner.
 * Each middleware can specify both the context properties it requires and the properties it provides. A final request
 * handler consumes the accumulated context and produces a response. The type system ensures at compile-time that all
 * required properties are provided by earlier middleware in the chain.
 *
 * @example Basic usage
 * ```ts
 * import { chain, type Empty, type Handler, type Middleware } from '@maikdevries/server-middleware';
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
 *
 * @module
 */

export { chain, type Empty, type Handler, type Middleware } from '@self/core';
