import { randomUUID } from "node:crypto";
import { investigate } from "./agent.mjs";
import { validTransect } from "../docs/investigation-data.js";
import { validRechargeSelection } from "../docs/recharge-data.js";

const maxBody = 8192;
const ttl = 60 * 60 * 1000;

function json(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBody) {
      // Drain excess bytes without storing them so the server can return a status.
      continue;
    }
    chunks.push(chunk);
  }
  if (size > maxBody) throw new Error("请求太长。");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function agentRoute(config) {
  const sessions = new Map();
  const busy = new Set();
  return async (request, response) => {
    if (request.method === "GET")
      return json(response, 200, { available: Boolean(config) });
    if (request.method !== "POST")
      return json(response, 405, { error: "请求方式无效。" });
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (
      !/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host) ||
      (origin && origin !== "http://" + host)
    ) {
      return json(response, 403, { error: "请从 Landfold 本地页面发起对话。" });
    }
    if (!config) return json(response, 503, { error: "尚未配置模型服务。" });
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      return json(response, 415, { error: "请从 Landfold 页面发起对话。" });
    }

    let data;
    try {
      data = await readBody(request);
    } catch {
      return json(response, 400, { error: "请求内容无效或过长。" });
    }
    const question =
      typeof data?.question === "string" ? data.question.trim() : "";
    if (!question || question.length > 1200) {
      return json(response, 400, {
        error: "请输入 1200 字以内的问题。",
      });
    }
    const mode = data.mode ?? "map";
    let selection;
    if (mode === "recharge") {
      if (!validRechargeSelection(data.months)) {
        return json(response, 400, { error: "请选取两个不同的研究月份。" });
      }
      selection = { mode, months: data.months };
    } else if (mode === "map") {
      const reference = data.reference ?? null;
      if (
        !validTransect(data.points) ||
        (reference !== null && !validTransect(reference))
      ) {
        return json(response, 400, { error: "请检查当前选线和对照线。" });
      }
      selection = { mode, points: data.points, reference };
    } else {
      return json(response, 400, { error: "探究方式无效。" });
    }
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.at > ttl && !busy.has(id)) sessions.delete(id);
    }
    const previous = sessions.get(data.session);
    const id = previous ? data.session : randomUUID();
    if (busy.has(id)) return json(response, 409, { error: "上一问仍在查证。" });
    if (busy.size >= 4)
      return json(response, 429, { error: "查证请求较多，请稍后重试。" });
    busy.add(id);
    try {
      const history = previous?.history ?? [];
      const result = await investigate({
        config,
        history,
        question,
        ...selection,
      });
      sessions.delete(id);
      sessions.set(id, {
        history: [...history, result.turn].slice(-8),
        at: Date.now(),
      });
      for (const candidate of sessions.keys()) {
        if (sessions.size <= 32) break;
        if (!busy.has(candidate)) sessions.delete(candidate);
      }
      json(response, 200, {
        session: id,
        answer: result.answer,
        citations: result.citations,
        trace: result.trace,
      });
    } catch (error) {
      const message = error.message?.startsWith("模型")
        ? error.message
        : "无法连接模型服务，请检查配置后重试。";
      json(response, 502, { error: message });
    } finally {
      busy.delete(id);
    }
  };
}
