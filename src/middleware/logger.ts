import type { Empty, Middleware } from '@self';

export interface Log {
	'error'?: {
		'reason': string;
		'type': string;
	};
	'id': string;
	'request': {
		'method': Request['method'];
		'url': URL['href'];
	};
	'response'?: {
		'status': Response['status'];
	};
	'timestamp': number;
}

export function logger(): Middleware<Empty, { 'log': Log }> {
	return async (request, context, next) => {
		const log: Log = {
			'id': self.crypto.randomUUID(),
			'request': {
				'method': request.method,
				'url': request.url,
			},
			'timestamp': self.Date.now(),
		};

		try {
			const response = await next(request, { ...context, 'log': log });

			log.response = {
				'status': response.status,
			};

			return response;
		} finally {
			console.log(log);
		}
	};
}
