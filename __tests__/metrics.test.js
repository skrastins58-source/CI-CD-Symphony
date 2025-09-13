const { MetricsCollector } = require('../src/metrics');

describe('MetricsCollector', () => {
    let metrics;

    beforeEach(() => {
        metrics = new MetricsCollector();
    });

    describe('fetchLatestMetrics', () => {
        test('should return metrics data', async () => {
            const data = await metrics.fetchLatestMetrics();
            
            expect(data).toHaveProperty('performance');
            expect(data).toHaveProperty('coverage');
            expect(data).toHaveProperty('bundleSize');
            expect(data).toHaveProperty('timestamp');
            
            expect(typeof data.performance).toBe('number');
            expect(typeof data.coverage).toBe('number');
            expect(typeof data.bundleSize).toBe('number');
            expect(typeof data.timestamp).toBe('string');
        });
    });

    describe('runAnalysis', () => {
        test('should return analysis results', async () => {
            const results = await metrics.runAnalysis();
            
            expect(results).toHaveProperty('performance');
            expect(results).toHaveProperty('coverage');
            expect(results).toHaveProperty('bundleSize');
            expect(results).toHaveProperty('timestamp');
            expect(results).toHaveProperty('analysis');
            
            expect(results.analysis).toHaveProperty('performanceBreakdown');
            expect(results.analysis).toHaveProperty('coverageDetails');
            expect(results.analysis).toHaveProperty('bundleBreakdown');
        });

        test('should generate realistic values', async () => {
            const results = await metrics.runAnalysis();
            
            expect(results.performance).toBeGreaterThanOrEqual(80);
            expect(results.performance).toBeLessThanOrEqual(100);
            expect(results.coverage).toBeGreaterThanOrEqual(70);
            expect(results.coverage).toBeLessThanOrEqual(100);
            expect(results.bundleSize).toBeGreaterThanOrEqual(100000);
            expect(results.bundleSize).toBeLessThanOrEqual(200000);
        });
    });

    describe('getHistory', () => {
        test('should return historical data', async () => {
            const history = await metrics.getHistory();
            
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThan(0);
            
            history.forEach(entry => {
                expect(entry).toHaveProperty('date');
                expect(entry).toHaveProperty('performance');
                expect(entry).toHaveProperty('coverage');
                expect(entry).toHaveProperty('bundleSize');
            });
        });
    });

    describe('getCurrentData', () => {
        test('should return complete data structure', async () => {
            const data = await metrics.getCurrentData();
            
            expect(data).toHaveProperty('current');
            expect(data).toHaveProperty('history');
            expect(data).toHaveProperty('meta');
            
            expect(data.meta).toHaveProperty('generated');
            expect(data.meta).toHaveProperty('version');
        });
    });

    describe('calculatePerformanceScore', () => {
        test('should calculate score correctly', () => {
            const perfectMetrics = {
                fcp: 1000,
                lcp: 2000,
                cls: 0.05,
                tbt: 100
            };
            
            const score = metrics.calculatePerformanceScore(perfectMetrics);
            expect(score).toBeGreaterThanOrEqual(90);
            expect(score).toBeLessThanOrEqual(100);
        });

        test('should penalize poor metrics', () => {
            const poorMetrics = {
                fcp: 3000,
                lcp: 5000,
                cls: 0.3,
                tbt: 1000
            };
            
            const score = metrics.calculatePerformanceScore(poorMetrics);
            expect(score).toBeLessThan(90);
        });
    });

    describe('analyzeBundleTrends', () => {
        test('should detect increasing trend', () => {
            const history = [
                { bundleSize: 100000 },
                { bundleSize: 110000 },
                { bundleSize: 120000 },
                { bundleSize: 130000 },
                { bundleSize: 140000 },
                { bundleSize: 150000 },
                { bundleSize: 160000 },
                { bundleSize: 170000 },
                { bundleSize: 180000 },
                { bundleSize: 190000 }
            ];
            
            const analysis = metrics.analyzeBundleTrends(history);
            expect(analysis.trend).toBe('increasing');
            expect(analysis.change).toBeGreaterThan(5);
        });

        test('should detect stable trend', () => {
            const history = Array(10).fill({ bundleSize: 150000 });
            
            const analysis = metrics.analyzeBundleTrends(history);
            expect(analysis.trend).toBe('stable');
            expect(Math.abs(analysis.change)).toBeLessThanOrEqual(5);
        });

        test('should handle insufficient data', () => {
            const history = [{ bundleSize: 150000 }];
            
            const analysis = metrics.analyzeBundleTrends(history);
            expect(analysis.trend).toBe('insufficient_data');
        });
    });
});