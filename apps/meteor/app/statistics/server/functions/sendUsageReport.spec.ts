import type { Logger } from '@rocket.chat/logger';

import { sendUsageReport } from './sendUsageReport';

const mockLogger: Logger = {
	error: jest.fn(),
} as any;

jest.mock('@rocket.chat/models', () => ({
	Statistics: {
		findLast: jest.fn(),
		updateOne: jest.fn(),
	},
}));

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: jest.fn(),
}));

jest.mock('..', () => ({
	statistics: { save: jest.fn() },
}));

jest.mock('../../../cloud/server', () => ({
	getWorkspaceAccessToken: jest.fn().mockResolvedValue('workspace-token'),
}));

jest.mock('meteor/meteor', () => ({
	Meteor: { absoluteUrl: jest.fn().mockReturnValue('http://localhost:3000/') },
}));

describe('sendUsageReport', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		delete process.env.RC_DISABLE_STATISTICS_REPORTING;
	});

	it('should save statistics locally and not send to collector when RC_DISABLE_STATISTICS_REPORTING is true', async () => {
		const {
			statistics: { save: mockStatisticsSave },
		} = await import('..');
		const { serverFetch: mockServerFetch } = await import('@rocket.chat/server-fetch');

		process.env.RC_DISABLE_STATISTICS_REPORTING = 'true';

		const result = await sendUsageReport(mockLogger);

		expect(mockStatisticsSave).toHaveBeenCalled();
		expect(mockServerFetch).not.toHaveBeenCalled();
		expect(result).toBeUndefined();
	});

	it('should save statistics locally and send to collector when RC_DISABLE_STATISTICS_REPORTING is false', async () => {
		const {
			statistics: { save: mockStatisticsSave },
		} = await import('..');
		const { serverFetch: mockServerFetch } = await import('@rocket.chat/server-fetch');

		process.env.RC_DISABLE_STATISTICS_REPORTING = 'false';

		const result = await sendUsageReport(mockLogger);

		expect(mockStatisticsSave).toHaveBeenCalled();
		expect(mockServerFetch).toHaveBeenCalledTimes(1);
		expect(mockServerFetch).toHaveBeenCalledWith('https://collector.rocket.chat/', expect.objectContaining({ method: 'POST' }));
		expect(result).toBeUndefined();
	});
});
