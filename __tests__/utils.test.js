const { Utils } = require('../src/utils');

describe('Utils', () => {
    let utils;

    beforeEach(() => {
        utils = new Utils();
    });

    describe('formatBytes', () => {
        test('should format bytes correctly', () => {
            expect(utils.formatBytes(0)).toBe('0 Bytes');
            expect(utils.formatBytes(1024)).toBe('1 KB');
            expect(utils.formatBytes(1024 * 1024)).toBe('1 MB');
            expect(utils.formatBytes(1536)).toBe('1.5 KB');
        });

        test('should handle decimal places', () => {
            expect(utils.formatBytes(1536, 0)).toBe('2 KB');
            expect(utils.formatBytes(1536, 1)).toBe('1.5 KB');
            expect(utils.formatBytes(1536, 2)).toBe('1.5 KB'); // Default behavior
        });
    });

    describe('calculatePercentageChange', () => {
        test('should calculate percentage change correctly', () => {
            expect(utils.calculatePercentageChange(100, 120)).toBe(20);
            expect(utils.calculatePercentageChange(100, 80)).toBe(-20);
            expect(utils.calculatePercentageChange(0, 50)).toBe(100);
            expect(utils.calculatePercentageChange(0, 0)).toBe(0);
        });
    });

    describe('getScoreColor', () => {
        test('should return correct colors for normal scores', () => {
            expect(utils.getScoreColor(95)).toBe('#4caf50'); // green
            expect(utils.getScoreColor(75)).toBe('#ff9800'); // orange
            expect(utils.getScoreColor(50)).toBe('#f44336'); // red
        });

        test('should return correct colors for inverse scores', () => {
            expect(utils.getScoreColor(30, true)).toBe('#4caf50'); // green
            expect(utils.getScoreColor(70, true)).toBe('#ff9800'); // orange
            expect(utils.getScoreColor(90, true)).toBe('#f44336'); // red
        });
    });

    describe('formatDate', () => {
        test('should format timestamp correctly', () => {
            const timestamp = '2024-01-15T10:30:00.000Z';
            const formatted = utils.formatDate(timestamp);
            expect(formatted).toMatch(/\d{4}.*\d{1,2}.*\d{1,2}.*\d{2}:\d{2}/);
        });
    });

    describe('isValidEmail', () => {
        test('should validate email addresses correctly', () => {
            expect(utils.isValidEmail('test@example.com')).toBe(true);
            expect(utils.isValidEmail('user@domain.co.uk')).toBe(true);
            expect(utils.isValidEmail('invalid-email')).toBe(false);
            expect(utils.isValidEmail('missing@.com')).toBe(false);
            expect(utils.isValidEmail('')).toBe(false);
        });
    });

    describe('generateId', () => {
        test('should generate unique IDs', () => {
            const id1 = utils.generateId();
            const id2 = utils.generateId();
            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
            expect(id1.length).toBeGreaterThan(0);
        });
    });

    describe('deepClone', () => {
        test('should clone objects deeply', () => {
            const original = {
                a: 1,
                b: {
                    c: 2,
                    d: [3, 4, { e: 5 }]
                },
                f: new Date('2024-01-01')
            };

            const cloned = utils.deepClone(original);
            
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.b).not.toBe(original.b);
            expect(cloned.b.d).not.toBe(original.b.d);
            expect(cloned.f).not.toBe(original.f);
        });

        test('should handle null and primitive values', () => {
            expect(utils.deepClone(null)).toBe(null);
            expect(utils.deepClone(42)).toBe(42);
            expect(utils.deepClone('string')).toBe('string');
            expect(utils.deepClone(true)).toBe(true);
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        test('should debounce function calls', () => {
            const mockFn = jest.fn();
            const debouncedFn = utils.debounce(mockFn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should execute immediately when immediate flag is set', () => {
            const mockFn = jest.fn();
            const debouncedFn = utils.debounce(mockFn, 100, true);

            debouncedFn();
            expect(mockFn).toHaveBeenCalledTimes(1);

            debouncedFn();
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});