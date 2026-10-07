export type PhoneOs = "android" | "ios";

// The few things of `navigator` the check reads, so it can be tested
interface NavigatorInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

// Which phone the browser is running on, or null when it is not a phone
// (a computer, a tablet, or a phone showing the "desktop site").
//
// This is read from what the browser says about itself, so a person can always
// change it. Use it to point people to the right app, never to keep anyone out.
export function getPhoneOs(
  info: NavigatorInfo = navigator,
): PhoneOs | null {
  const { userAgent, platform, maxTouchPoints } = info;

  // iPads: since iPadOS 13 Safari calls itself a Mac, so a "Mac" with a touch
  // screen is an iPad. Tablets have room for the web app.
  if (/iPad/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1)) {
    return null;
  }

  if (/iPhone|iPod/i.test(userAgent)) {
    return "ios";
  }

  // Android phones say "Mobile" in the user agent; Android tablets do not
  if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) {
    return "android";
  }

  return null;
}
