import { HnClientService } from '@/services/hn-client.service';

describe('HnClientService', () => {
  let fetchSpy: jest.SpyInstance;
  let service: HnClientService;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    service = new HnClientService();
    // Speed up tests by mocking setTimeout/delay
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb() as any);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('fetchItem', () => {
    it('should successfully fetch an item by id', async () => {
      const mockItem = {
        id: 12345,
        type: 'story',
        by: 'dhouston',
        time: 1175714200,
        title: 'My Story',
        url: 'http://example.com',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      } as Response);

      const result = await service.fetchItem(12345);

      expect(fetchSpy).toHaveBeenCalledWith('https://hacker-news.firebaseio.com/v0/item/12345.json');
      expect(result).toEqual(mockItem);
    });

    it('should retry up to 3 times on temporary network failure and succeed', async () => {
      const mockItem = {
        id: 12345,
        type: 'story',
        by: 'dhouston',
        time: 1175714200,
      };

      // Fail twice, succeed on third attempt
      fetchSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockItem,
        } as Response);

      const result = await service.fetchItem(12345);

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockItem);
    });

    it('should throw an error after failing 3 consecutive times', async () => {
      fetchSpy
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockRejectedValueOnce(new Error('Network error 3'));

      await expect(service.fetchItem(12345)).rejects.toThrow('Failed to fetch item 12345 after 3 attempts');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchStoryIds', () => {
    const mockIds = [1, 2, 3, 4, 5];

    it.each([
      ['top', 'topstories.json'],
      ['new', 'newstories.json'],
      ['show', 'showstories.json'],
      ['job', 'jobstories.json'],
    ])('should fetch list of %s stories', async (type, endpoint) => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIds,
      } as Response);

      const result = await service.fetchStoryIds(type as any);

      expect(fetchSpy).toHaveBeenCalledWith(`https://hacker-news.firebaseio.com/v0/${endpoint}`);
      expect(result).toEqual(mockIds);
    });
  });

  describe('fetchItems', () => {
    it('should fetch multiple items concurrently using throttled limit', async () => {
      const mockItems = [
        { id: 1, type: 'story', by: 'user1', time: 100 },
        { id: 2, type: 'story', by: 'user2', time: 200 },
      ];

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockItems[0],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockItems[1],
        } as Response);

      const result = await service.fetchItems([1, 2]);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockItems);
    });
  });
});
