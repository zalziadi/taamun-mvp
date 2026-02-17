const eventBuffer = [];

function readEvents() {
  try {
    return JSON.parse(localStorage.getItem("taamun_events") || "[]");
  } catch {
    return [];
  }
}

export function track(eventName, meta = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    event: eventName,
    meta,
    ts: Date.now(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("[taamun-track]", payload);
  }

  eventBuffer.push(payload);
  if (eventBuffer.length > 200) eventBuffer.splice(0, eventBuffer.length - 200);

  const existing = readEvents();
  existing.push(payload);
  localStorage.setItem("taamun_events", JSON.stringify(existing.slice(-200)));
}
