import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFallbackTips, generateTips } from './tipGenerator.js';

const mockFootprintResult = {
  categories: [
    { id: 'transport', label: 'Transport', value: 800, percent: 35 },
    { id: 'electricity', label: 'Electricity', value: 600, percent: 26 },
    { id: 'diet', label: 'Diet', value: 260, percent: 11 },
    { id: 'flights', label: 'Travel', value: 350, percent: 15 },
    { id: 'lifestyle', label: 'Lifestyle', value: 300, percent: 13 }
  ],
  totalTonnes: 2.31,
  comparison: { indiaAvg: 1.9, globalAvg: 4.7 }
};

describe('getFallbackTips', () => {
  it('returns an array of tips', () => {
    const tips = getFallbackTips(mockFootprintResult);
    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);
  });

  it('each tip has required fields', () => {
    const tips = getFallbackTips(mockFootprintResult);
    for (const tip of tips) {
      expect(tip).toHaveProperty('title');
      expect(tip).toHaveProperty('description');
      expect(tip).toHaveProperty('estimatedSavingsKg');
      expect(tip).toHaveProperty('effort');
      expect(tip).toHaveProperty('category');
      expect(typeof tip.title).toBe('string');
      expect(typeof tip.estimatedSavingsKg).toBe('number');
    }
  });

  it('tips are sorted by estimated savings descending', () => {
    const tips = getFallbackTips(mockFootprintResult);
    for (let i = 1; i < tips.length; i++) {
      expect(tips[i - 1].estimatedSavingsKg).toBeGreaterThanOrEqual(tips[i].estimatedSavingsKg);
    }
  });

  it('prioritizes tips from highest-emission category', () => {
    const tips = getFallbackTips(mockFootprintResult);
    const transportTips = tips.filter(t => t.category === 'Transport');
    expect(transportTips.length).toBeGreaterThan(0);
  });

  it('returns fallback tips for null input', () => {
    const tips = getFallbackTips(null);
    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);
  });

  it('returns fallback tips for missing categories', () => {
    const tips = getFallbackTips({});
    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);
  });

  it('has no duplicate tips', () => {
    const tips = getFallbackTips(mockFootprintResult);
    const titles = tips.map(t => t.title);
    expect(titles.length).toBe(new Set(titles).size);
  });
});

describe('generateTips (Grok API)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('immediately returns fallback tips if no API key is provided', async () => {
    const tips = await generateTips(mockFootprintResult, '');
    expect(tips.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns fallback tips if API key is placeholders', async () => {
    const tips = await generateTips(mockFootprintResult, 'your_api_key_here');
    expect(tips.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('successfully fetches and parses tips array from grok-2', async () => {
    const mockTipsResponse = [
      { title: 'Tip A', description: 'Desc A', estimatedSavingsKg: 200, effort: 'Easy', category: 'Transport' },
      { title: 'Tip B', description: 'Desc B', estimatedSavingsKg: 100, effort: 'Medium', category: 'Electricity' }
    ];

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockTipsResponse) } }]
      })
    });

    const tips = await generateTips(mockFootprintResult, 'valid-key');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('grok-2')
      })
    );
    expect(tips).toHaveLength(2);
    expect(tips[0].title).toBe('Tip A');
  });

  it('successfully parses tips when response is wrapped in markdown code blocks', async () => {
    const mockTipsResponse = [
      { title: 'Markdown Tip', description: 'Desc M', estimatedSavingsKg: 300, effort: 'Hard', category: 'Diet' }
    ];

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(mockTipsResponse)}\n\`\`\`` } }]
      })
    });

    const tips = await generateTips(mockFootprintResult, 'valid-key');
    expect(tips).toHaveLength(1);
    expect(tips[0].title).toBe('Markdown Tip');
  });

  it('successfully parses tips when response is wrapped in object with tips key', async () => {
    const mockTipsResponse = {
      tips: [
        { title: 'Wrapped Tip', description: 'Desc W', estimatedSavingsKg: 150, effort: 'Easy', category: 'Lifestyle' }
      ]
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockTipsResponse) } }]
      })
    });

    const tips = await generateTips(mockFootprintResult, 'valid-key');
    expect(tips).toHaveLength(1);
    expect(tips[0].title).toBe('Wrapped Tip');
  });

  it('falls back to grok-beta if grok-2 fails', async () => {
    const mockTipsResponse = [
      { title: 'Beta Tip', description: 'Desc Beta', estimatedSavingsKg: 250, effort: 'Medium', category: 'Travel' }
    ];

    // First fetch for grok-2 fails
    fetch.mockResolvedValueOnce({ ok: false });
    // Second fetch for grok-beta succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockTipsResponse) } }]
      })
    });

    const tips = await generateTips(mockFootprintResult, 'valid-key');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(tips).toHaveLength(1);
    expect(tips[0].title).toBe('Beta Tip');
  });

  it('falls back to local curated tips if both model requests fail', async () => {
    fetch.mockResolvedValue({ ok: false });

    const tips = await generateTips(mockFootprintResult, 'valid-key');
    expect(tips.length).toBeGreaterThan(0);
    // Since API failed, it should match the fallback tips
    const fallback = getFallbackTips(mockFootprintResult);
    expect(tips[0].title).toBe(fallback[0].title);
  });
});

