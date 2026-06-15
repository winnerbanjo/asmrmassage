import { del, list, put } from "@vercel/blob";

const bookingPrefix = "bookings/";
const receiptPrefix = "receipts/";

const sendJson = (res, status, data) => {
  res.setHeader("cache-control", "no-store");
  res.status(status).json(data);
};

const parseBody = (req) => {
  if (!req.body) {
    return {};
  }

  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
};

const isAdmin = (req) => {
  const configuredPin = process.env.ADMIN_PIN || "123456";
  const requestPin = req.headers["x-admin-pin"];

  return configuredPin && requestPin && requestPin === configuredPin;
};

const readBooking = async (url) => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not read booking");
  }

  return response.json();
};

const getBookings = async () => {
  const { blobs } = await list({ prefix: bookingPrefix, limit: 1000 });
  const bookings = await Promise.all(blobs.map((blob) => readBooking(blob.url)));

  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const writeBooking = async (booking) => {
  await put(`${bookingPrefix}${booking.id}.json`, JSON.stringify(booking), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
};

const getFileBuffer = (dataUrl) => {
  const [meta, base64] = String(dataUrl || "").split(",");
  const contentType = meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";

  return {
    buffer: Buffer.from(base64 || "", "base64"),
    contentType,
  };
};

const createBooking = async (req, res) => {
  const body = parseBody(req);

  if (!body.name || !body.phone || !body.email || !body.service || !body.day || !body.time || !body.receiptData) {
    return sendJson(res, 400, { error: "Missing booking fields" });
  }

  const id = crypto.randomUUID();
  const reference = `SASMR-${Date.now().toString().slice(-6)}`;
  const receipt = getFileBuffer(body.receiptData);

  if (!receipt.buffer.length || receipt.buffer.length > 2 * 1024 * 1024) {
    return sendJson(res, 400, { error: "Receipt must be smaller than 2MB" });
  }

  const receiptBlob = await put(`${receiptPrefix}${id}-${body.receiptName || "receipt"}`, receipt.buffer, {
    access: "public",
    contentType: receipt.contentType,
  });

  const booking = {
    id,
    reference,
    service: body.service,
    day: body.day,
    time: body.time,
    name: body.name,
    phone: body.phone,
    email: body.email,
    receiptName: body.receiptName || "receipt",
    receiptUrl: receiptBlob.url,
    status: "Pending",
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  await writeBooking(booking);

  return sendJson(res, 201, { booking });
};

const updateBooking = async (req, res) => {
  if (!isAdmin(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const body = parseBody(req);
  const { blobs } = await list({ prefix: `${bookingPrefix}${body.id}.json`, limit: 1 });

  if (!body.id || !body.status || !blobs.length) {
    return sendJson(res, 404, { error: "Booking not found" });
  }

  const booking = await readBooking(blobs[0].url);
  const updatedBooking = { ...booking, status: body.status };
  await writeBooking(updatedBooking);

  return sendJson(res, 200, { booking: updatedBooking });
};

const clearBookings = async (req, res) => {
  if (!isAdmin(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const [{ blobs: bookingBlobs }, { blobs: receiptBlobs }] = await Promise.all([
    list({ prefix: bookingPrefix, limit: 1000 }),
    list({ prefix: receiptPrefix, limit: 1000 }),
  ]);
  const urls = [...bookingBlobs, ...receiptBlobs].map((blob) => blob.url);

  if (urls.length) {
    await del(urls);
  }

  return sendJson(res, 200, { ok: true });
};

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!isAdmin(req)) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      return sendJson(res, 200, { bookings: await getBookings() });
    }

    if (req.method === "POST") {
      return createBooking(req, res);
    }

    if (req.method === "PATCH") {
      return updateBooking(req, res);
    }

    if (req.method === "DELETE") {
      return clearBookings(req, res);
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Server error" });
  }
}
