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
    const internetUnavailable = await isInternetUnavailable();
    if (internetUnavailable || Date.now() - entry.timestamp < timeout) {
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

/**
 * Checks if the device has an active internet connection.
 * @param testUrl Optional URL to ping. Defaults to a reliable, lightweight endpoint.
 * @returns Promise<boolean> True if online, false if offline.
 */
const isInternetUnavailable =
  async () // testUrl: string = "https://google.com",
  : Promise<boolean> => {
    // 1. Fast local check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return true;
    }

    return false;
    // try {
    //   await fetch(testUrl, {
    //     method: "HEAD", // Only fetch headers to save data
    //     mode: "no-cors", // Prevents CORS errors on third-party domains
    //     cache: "no-store", // Avoids cached success responses
    //   });
    //   return false;
    // } catch (error) {
    //   return true;
    // }
  };

export { memoizedJSONRequest, ONE_DAY_MS };
