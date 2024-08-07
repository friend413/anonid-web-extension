import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import webconfig from '../webconfig';

interface AjaxResponse {
  data?: unknown;
  code?: number;
  msg?: string;
}

interface ErrorResponse {
  data?: {
    code?: number;
    data?: string;
    msg?: string;
  };
  message?: string;
}

async function ajax(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<AjaxResponse> {
  try {
    if (!url.includes("http")) {
      url = webconfig.apiUrl + url;
    }
    const op: AxiosRequestConfig = {
      method: data ? 'post' : 'get',
      url,
      headers,
      data: data || undefined,
    };

    const res: AxiosResponse = await axios(op);
    let ret: AjaxResponse | string = res.data;

    if (typeof ret === 'string') {
      try {
        ret = JSON.parse(ret);
      } catch (e2) {
        // Handle JSON parse error if necessary
      }
    }

    if (typeof ret === 'object' && ret.code === 200) {
      ret.msg = "ok";
    }

    return ret as AjaxResponse;
  } catch (error: unknown) {
    console.log(error);
    const err = error as ErrorResponse; // Use type assertion here after checking the type

    if (err.data?.code === 403) {
      return { msg: 'Please relogin.' };
    } else if (err.data?.data) {
      return { msg: err.data.data };
    } else if (err.data?.msg) {
      return { msg: err.data.msg };
    }
    return { msg: err.message || "Unknown error" };
  }
}

export default ajax;
