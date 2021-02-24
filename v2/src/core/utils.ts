export function addQueryParam(url: string, name: string, value: string | number | boolean | Record<string, string>) {
  if (typeof value === "object") {
    for (let key in value) {
      url += addQueryParam(url, key, value[key]);
      return url;
    }
  }
  if (url.indexOf("?") < 0) {
    url += "?";
  }

  if (url[url.length - 1] !== "?") {
    url += "&";
  }

  url += encodeURIComponent(name);
  url += "=";
  url += encodeURIComponent(value as string);

  return url;
}
