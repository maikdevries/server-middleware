/**
 * This module provides a flexible approach to define and compose contextful middleware functions in a type-safe manner.
 * Each middleware can specify both the context properties it requires and the properties it provides. A final request
 * handler consumes the accumulated context and produces a response. The type system ensures at compile-time that all
 * required properties are provided by earlier middleware in the chain.
 *
 * @example Basic usage
 * ```ts
 * import type { Handler, Middleware } from '@maikdevries/server-middleware';
 * import { chain } from '@maikdevries/server-middleware';
 *
 * const uuid: Middleware<Empty, { uuid: string }> = async (request, context, next) => {
 * 	return await next(request, { ...context, 'uuid': self.crypto.randomUUID() });
 * };
 *
 * const authorise: Middleware<{ uuid: string }, { user: User }> = async (request, context, next) => {
 * 	return await next(request, { ...context, 'user': authoriseUser(context.uuid) });
 * };
 *
 * const greeting: Handler<{ user: User }> = async (request, context) => {
 * 	return new Response(`Hi ${context.user.name}!`);
 * };
 *
 * const app = chain(uuid).add(authorise).add(greeting);
 * ```
 *
 * @module
 */

export * from '@self/core';
