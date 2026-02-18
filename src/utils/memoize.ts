import m from "mithril";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

const memoryCache = new Map<string, Promise<any>>();

async function memoizedJSONRequest<T>(
  url: string,
  key: string,
  timeout: number = ONE_DAY_MS,
): Promise<T> {
  // 1. Check Memory Cache (prevents duplicate requests in same session)
  if (memoryCache.has(url)) return memoryCache.get(url)!;

  // 2. Check LocalStorage
  const stored = localStorage.getItem(key);
  if (stored) {
    const entry: CacheEntry<T> = JSON.parse(stored);
    if (Date.now() - entry.timestamp < timeout) {
      const resolved = Promise.resolve(entry.data);
      memoryCache.set(url, resolved);
      return resolved;
    }
    localStorage.removeItem(key); // Expired
  }

  // 3. Form the Promise
  const requestPromise = m
    .request<T>({
      method: "GET",
      url: url,
    })
    .then((data) => {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(entry));
      return data;
    })
    .catch((err) => {
      memoryCache.delete(url);
      throw err;
    });

  memoryCache.set(url, requestPromise);
  return requestPromise;
}

export { memoizedJSONRequest, ONE_DAY_MS };
