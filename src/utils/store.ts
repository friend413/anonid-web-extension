export default { get, set, remove, clear };

const keyPre = "lightwallet-";

function get<T>(key: string): T | null {
  key = keyPre + key;
  const str = localStorage.getItem(key);
  if (!str) {
    return null;
  }
  try {
    const json = JSON.parse(str);
    if (typeof json === "object" && json !== null) {
      if ('type' in json && 'data' in json) {
        return json.data as T;
      }
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function set<T>(key: string, value: T): void {
  key = keyPre + key;
  const json = {
    type: typeof value,
    data: value,
  };
  localStorage.setItem(key, JSON.stringify(json));
}

function remove(key: string): void {
  localStorage.removeItem(keyPre + key);
}

function clear(): void {
  localStorage.clear();
}
