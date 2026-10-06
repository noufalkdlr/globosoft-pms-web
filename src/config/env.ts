const apiUrl = import.meta.env.VITE_API_URL;

// Fail fast at startup instead of sending requests to "undefined/..."
if (!apiUrl) {
  throw new Error("VITE_API_URL is missing");
}

// Only public values belong here: everything prefixed with VITE_ is bundled
// into the browser code. Never put secrets in a frontend env file.
export const env = {
  apiUrl,
};
