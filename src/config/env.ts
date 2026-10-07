const apiUrl = import.meta.env.VITE_API_URL;

// Fail fast at startup instead of sending requests to "undefined/..."
if (!apiUrl) {
  throw new Error("VITE_API_URL is missing");
}

// Only http(s) addresses are used as links: anything else in the setting is ignored
function webAddress(value: string | undefined): string | undefined {
  return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

// Only public values belong here: everything prefixed with VITE_ is bundled
// into the browser code. Never put secrets in a frontend env file.
export const env = {
  apiUrl,
  // Where the phone app is in its store. While a store's address is missing,
  // phones of that kind are not sent anywhere and simply use the web app.
  androidAppUrl: webAddress(import.meta.env.VITE_ANDROID_APP_URL),
  iosAppUrl: webAddress(import.meta.env.VITE_IOS_APP_URL),
};
