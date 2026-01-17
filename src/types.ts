type Common<A, B> = {
	[K in keyof A & keyof B]: B[K] extends never ? A[K] : B[K];
};

type Distinct<A, B> = {
	[K in keyof Omit<A, keyof B>]: A[K];
};

export type Empty = Record<never, never>;

export type Merge<A, B> = Common<A, B> & Distinct<A, B> & Distinct<B, A>;

type CommonKeys<A, B> = {
	[K in keyof A & keyof B]: A[K] extends B[K] ? K : never;
}[keyof A & keyof B];

export type Reduce<A, B, C> = A & Omit<B, CommonKeys<C, B>>;
