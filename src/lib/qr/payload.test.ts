import { describe, expect, it } from "vitest"
import {
  buildEmailPayload,
  buildPayload,
  buildPhonePayload,
  buildSmsPayload,
  buildTextPayload,
  buildUrlPayload,
  buildWifiPayload,
  QrPayloadError,
} from "./payload"

describe("buildTextPayload", () => {
  it("keeps arbitrary text, including unicode, emoji, CJK and Arabic", () => {
    expect(buildTextPayload("Hello 世界 مرحبا 🌟\nline two")).toBe("Hello 世界 مرحبا 🌟\nline two")
  })

  it("rejects empty text", () => {
    expect(() => buildTextPayload("   ")).toThrow(QrPayloadError)
  })

  it("enforces the character limit", () => {
    expect(() => buildTextPayload("x".repeat(2001))).toThrow(/too long/)
  })
})

describe("buildUrlPayload", () => {
  it("accepts http and https URLs and normalizes them", () => {
    expect(buildUrlPayload(" https://example.com/a?b=1 ")).toBe("https://example.com/a?b=1")
    expect(buildUrlPayload("http://example.com")).toBe("http://example.com/")
  })

  it("rejects malformed URLs and unsafe protocols", () => {
    expect(() => buildUrlPayload("not a url")).toThrow(/valid URL/)
    expect(() => buildUrlPayload("javascript:alert(1)")).toThrow(/Only http/)
    expect(() => buildUrlPayload("file:///etc/passwd")).toThrow(/Only http/)
    expect(() => buildUrlPayload("data:text/html,x")).toThrow(/Only http/)
    expect(() => buildUrlPayload("ftp://example.com")).toThrow(/Only http/)
  })

  it("never touches the network (pure function, no fetch possible)", () => {
    expect(buildUrlPayload("https://example.com")).toBe("https://example.com/")
  })
})

describe("buildWifiPayload", () => {
  it("builds a WPA/WPA2 payload", () => {
    expect(
      buildWifiPayload({ ssid: "MyNet", password: "s3cret!", security: "WPA", hidden: false })
    ).toBe("WIFI:T:WPA;S:MyNet;P:s3cret!;;")
  })

  it("builds an open-network payload without a password", () => {
    expect(
      buildWifiPayload({ ssid: "Open", password: "", security: "nopass", hidden: false })
    ).toBe("WIFI:T:nopass;S:Open;;")
  })

  it("adds H:true for hidden networks", () => {
    expect(buildWifiPayload({ ssid: "Hid", password: "pw", security: "WPA", hidden: true })).toBe(
      "WIFI:T:WPA;S:Hid;P:pw;H:true;;"
    )
  })

  it("escapes special characters in SSID and password", () => {
    const payload = buildWifiPayload({
      ssid: 'a;b,c:d"e\\f',
      password: 'p;w,o:r"d\\e',
      security: "WPA",
      hidden: false,
    })
    expect(payload).toContain('S:a\\;b\\,c\\:d\\"e\\\\f')
    expect(payload).toContain('P:p\\;w\\,o\\:r\\"d\\\\e')
  })

  it("rejects missing SSID and WPA missing password", () => {
    expect(() =>
      buildWifiPayload({ ssid: "", password: "x", security: "WPA", hidden: false })
    ).toThrow(/SSID/)
    expect(() =>
      buildWifiPayload({ ssid: "Net", password: "", security: "WPA", hidden: false })
    ).toThrow(/Enter a password/)
  })
})

describe("buildEmailPayload", () => {
  it("builds a plain mailto:", () => {
    expect(buildEmailPayload({ email: "a@b.com", subject: "", body: "" })).toBe("mailto:a@b.com")
  })

  it("encodes subject and body into the query string", () => {
    const payload = buildEmailPayload({
      email: "a@b.com",
      subject: "Hello & hi",
      body: "line1\nline2",
    })
    expect(payload).toMatch(/^mailto:a@b\.com\?/)
    const query = payload.slice(payload.indexOf("?") + 1)
    const params = new URLSearchParams(query)
    expect(params.get("subject")).toBe("Hello & hi")
    expect(params.get("body")).toBe("line1\nline2")
  })

  it("rejects an empty address", () => {
    expect(() => buildEmailPayload({ email: " ", subject: "", body: "" })).toThrow(/email/i)
  })
})

describe("buildPhonePayload", () => {
  it("builds tel: payloads", () => {
    expect(buildPhonePayload("+1 555 123 4567")).toBe("tel:+1 555 123 4567")
    expect(buildPhonePayload("+1(555)123-4567")).toBe("tel:+1(555)123-4567")
  })

  it("rejects letters and other invalid characters", () => {
    expect(() => buildPhonePayload("911-call-now")).toThrow(/digits/)
    expect(() => buildPhonePayload("")).toThrow(/phone/i)
  })
})

describe("buildSmsPayload", () => {
  it("builds sms: with an encoded message", () => {
    const payload = buildSmsPayload({ phone: "+5550100", message: "See you @ home!" })
    expect(payload.startsWith("sms:+5550100?body=")).toBe(true)
    expect(payload).toContain(encodeURIComponent("See you @ home!"))
  })

  it("builds sms: without a message", () => {
    expect(buildSmsPayload({ phone: "+5550100", message: "  " })).toBe("sms:+5550100")
  })
})

describe("buildPayload dispatch", () => {
  it("routes each content type to the right builder", () => {
    expect(buildPayload({ type: "text", text: "hi" })).toBe("hi")
    expect(buildPayload({ type: "url", url: "https://x.dev" })).toBe("https://x.dev/")
    expect(buildPayload({ type: "phone", phone: "+1 2 3" })).toBe("tel:+1 2 3")
    expect(buildPayload({ type: "sms", phone: "1", message: "" })).toBe("sms:1")
    expect(
      buildPayload({ type: "wifi", ssid: "n", password: "p", security: "WPA", hidden: false })
    ).toBe("WIFI:T:WPA;S:n;P:p;;")
    expect(buildPayload({ type: "email", email: "a@b.co", subject: "", body: "" })).toBe(
      "mailto:a@b.co"
    )
  })
})
