let cache = new Map<string, {until: number, value: any}>()

export async function cached<T>(key: string, f: () => Promise<T>): Promise<T> {
    const data = cache.get(key);
    if (!data || Date.now() > data.until) {
        console.log(`computing ${key}`);
        const value = await f();
        cache.set(key, {
            until: (10 * 60 * 1000) + Date.now(), 
            value: value
        });
        console.log(`computed ${key}`);
    } else {
        console.log(`returning ${key} from cache`)
    }
    return cache.get(key)!.value;
}