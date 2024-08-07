import _ from "lodash";
import webconfig from "../webconfig";

export function formatterSizeStr(size: number | string): string {
  const obj = formatterSize(size);
  return `${obj.size} ${obj.ext}`;
}

export function formatterSize(count: number | string): { size: string, ext: string } {
  if (!count) {
    console.log("!count", count);
    return {
      size: "0",
      ext: "KB",
    };
  }
  if (_.isString(count)) {
    count = _.toNumber(count);
  }
  if (count === 0) return { size: "0", ext: "KB" };
  const k = 1024;
  const currencyStr = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = 0;
  for (let l = 0; l < currencyStr.length; l++) {
    if (count / Math.pow(k, l) < 1) {
      break;
    }
    i = l;
  }
  return {
    size: (_.round(count / Math.pow(k, i), 2)).toFixed(2),
    ext: currencyStr[i],
  };
}

export function formatBalance(balance: number | string | { free?: string }): string {
  if (!balance) {
    return "";
  }
  if (typeof balance === "string") {
    balance = parseInt(balance.replace(/,/g, ""), 10);
  }
  if (typeof balance === "object" && balance.free) {
    balance = parseInt(balance.free.toString(), 10);
  }
  if (isNaN(balance as number)) {
    return balance as string;
  }
  let numBalance = balance as number / 1e18;
  if (numBalance > 1) {
    numBalance = fixed(numBalance);
  }
  return numBalance.toString();
}

export function formatBalanceStr(count: number | string): string {
  if (!count) return "0";
  if (typeof count === "string") {
    count = parseInt(count, 10);
  }
  count = (count as number) / 1e18;
  const k = 1000;
  const currencyStr = ["", "K", "M", "G", "T", "P"];
  let i = 0;
  for (let l = 0; l < currencyStr.length; l++) {
    if (count / Math.pow(k, l) < 1) {
      break;
    }
    i = l;
  }
  return `${(_.round(count / Math.pow(k, i), 2)).toFixed(2)} ${currencyStr[i]}`;
}

export function formatAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
}

export function formatAddressLong(addr: string): string {
  if (!addr) return "";
  if (addr.length < 26) return addr;
  return `${addr.slice(0, 13)}...${addr.slice(-13)}`;
}

export function fixed(n: number): number {
  return Math.floor(n * 100) / 100;
}

export function fixedBigInt(n: bigint): number {
  // Multiplies by 100 to simulate shifting decimal two places to the right
  const scaled = n * BigInt(100);

  // Divides by 10000 and then multiplies by 100 to floor to two decimal places,
  // effectively doing a Math.floor operation
  const fixed_result = (scaled / BigInt(10000)) * BigInt(100);
  if (fixed_result <= BigInt(Number.MAX_SAFE_INTEGER) && fixed_result >= BigInt(Number.MIN_SAFE_INTEGER)) {
    const result = Number(fixed_result);
    return result;
  } else {
      return 0; // Or handle this case as appropriate
  }
}


export function toLocaleString(coin: number): string {
  return coin.toLocaleString("zh", { style: "decimal" });
}

export function formatTime(time: number): string {
  const h = Math.floor((time / 3600) % 24);
  const hh = h < 10 ? `0${h}` : h.toString();
  const m = Math.floor((time / 60) % 60);
  const mm = m < 10 ? `0${m}` : m.toString();
  const s = Math.floor(time % 60);
  const ss = s < 10 ? `0${s}` : s.toString();
  if (h > 0) {
    return `${hh}:${mm}:${ss}`;
  } else {
    return `${mm}:${ss}`;
  }
}

export function isJson(str: string): boolean {
  if (typeof str === "string") {
    try {
      const obj = JSON.parse(str);
      return typeof obj === "object" && obj !== null;
    } catch (e) {
      console.log(`error: ${str}!!!${e}`);
      return false;
    }
  }
  return false;
}

export function formatPicUrl(fid: string, extend?: string): string {
  let url = `${webconfig.picBaseUrl}download/${fid}`;
  if (extend) {
    url += `.${extend}`;
  }
  return url;
}
