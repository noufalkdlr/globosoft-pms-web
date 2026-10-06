// Gmail ignores case, dots and "+tag" parts, so "Noufal.Globosoft@gmail.com"
// and "noufalglobosoft+pms@gmail.com" are one account. This is the rule the
// backend must apply when it looks a person up by email: compare these
// normalised values, but store the address the admin typed (in lower case).
export function normalizeEmail(email: string): string {
  const [localPart = "", domain = ""] = email.trim().toLowerCase().split("@");

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.split("+")[0].replaceAll(".", "")}@gmail.com`;
  }

  return `${localPart}@${domain}`;
}

// A simple shape check ("something@something.something"), not a full
// validation: the real proof that an address exists is the person signing in
export function isValidEmail(email: string): boolean {
  const value = email.trim();

  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
