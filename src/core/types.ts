/**
 * Extracts properties common to both `A` and `B`.
 *
 * For overlapping keys, `B` takes precedence unless `B[K]` is `never`.
 *
 * @internal
 */
type Common<A, B> = {
	[K in keyof A & keyof B]: B[K] extends never ? A[K] : B[K];
};

/**
 * Extracts properties from `A` that are not present in `B`.
 *
 * @internal
 */
type Distinct<A, B> = {
	[K in keyof Omit<A, keyof B>]: A[K];
};

/**
 * An empty object type that accepts no properties.
 *
 * Equivalent to `{}` but explicit in intent.
 */
export type Empty = Record<never, never>;

/**
 * Merges `A` with `B`, preserving all properties from both.
 *
 * For overlapping keys, `B` takes precedence unless `B[K]` is `never`.
 *
 * @example Basic usage
 * ```ts
 * type A = { a: string; b: string };
 * type B = { a: never; b: number; c: boolean };
 * type Result = Merge<A, B>; // { a: string; b: number; c: boolean }
 * ```
 */
export type Merge<A, B> = Common<A, B> & Distinct<A, B> & Distinct<B, A>;

/**
 * Extracts keys from `A` that have matching property types in `B`.
 *
 * @internal
 */
type CommonKeys<A, B> = {
	[K in keyof A & keyof B]: A[K] extends B[K] ? K : never;
}[keyof A & keyof B];

/**
 * Merges `A` with `B` while excluding properties from `B` that have matching types in `C`.
 *
 * @example Basic usage
 * ```ts
 * type A = { x: number };
 * type B = { y: string; z: boolean };
 * type C = { z: boolean };
 * type Result = Reduce<A, B, C>; // { x: number; y: string }
 * ```
 */
export type Reduce<A, B, C> = A & Omit<B, CommonKeys<C, B>>;
