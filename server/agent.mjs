import { readFileSync } from "node:fs";
import {
  classes,
  evidence,
  sampleTransect,
} from "../docs/investigation-data.js";

const skill = readFileSync(
  new URL("../skills/check-transect/SKILL.md", import.meta.url),
  "utf8",
);
const tool = (name, description, properties = {}, required = []) => ({
  type: "function",
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  },
});
const tools = [
  tool(
    "sample_current_transect",
    "Calculate land-use readings for the current line on Figure 1c. The server reads the current selection.",
  ),
  tool(
    "sample_reference_transect",
    "Read the reference line pinned by the user on Figure 1c. Use only to compare with the current line when a reference is attached.",
  ),
  tool(
    "lookup_evidence",
    "Fetch the source and limitations of a geographic claim.",
    {
      id: { type: "string", enum: Object.keys(evidence) },
    },
    ["id"],
  ),
];

export function modelConfig(env = process.env) {
  const {
    LANDFOLD_MODEL: model,
    LANDFOLD_API_KEY: key,
    LANDFOLD_API_BASE: base,
  } = env;
  if (!model || !key || !base) return null;
  const endpoint = new URL(base.replace(/\/+$/, "") + "/chat/completions");
  if (
    endpoint.protocol !== "https:" &&
    !(
      endpoint.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(endpoint.hostname)
    )
  ) {
    throw new Error(
      "LANDFOLD_API_BASE must use HTTPS or point to a local HTTP server.",
    );
  }
  return {
    model,
    key,
    endpoint,
    deepseek: endpoint.hostname === "api.deepseek.com",
  };
}

async function complete(config, messages, toolChoice) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools,
      tool_choice: toolChoice,
      max_tokens: 1000,
      ...(config.deepseek ? { thinking: { type: "disabled" } } : {}),
    }),
    redirect: "error",
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok)
    throw new Error("模型服务返回 HTTP " + response.status + "。");
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error("模型服务返回了无法读取的结果。");
  return message;
}

function traceLine(points) {
  const { count, counts, sequence } = sampleTransect(points);
  const runs = [];
  for (const id of sequence) {
    const last = runs.at(-1);
    if (last?.class === classes[id].name) last.samples++;
    else runs.push({ class: classes[id].name, samples: 1 });
  }
  return {
    source: "Liu 等，Water 2022，图 1c",
    pointsInMapImage: points,
    count,
    counts: Object.fromEntries(
      Object.entries(counts).map(([id, number]) => [classes[id].name, number]),
    ),
    orderedRuns: runs,
    limit:
      "图面颜色采样，采样点数仅描述这条线。地图坐标归一化，未配准到经纬度，无高程。图中文字、河流符号和未匹配颜色为未判读。",
  };
}

export async function investigate({
  config,
  history,
  question,
  points,
  reference = null,
}) {
  const turn = [
    {
      role: "user",
      content: JSON.stringify({
        question,
        currentLine: points,
        referenceLine: reference,
      }),
    },
  ];
  const trace = [];
  const citations = new Map();
  let sampled = false;
  let sampledReference = false;
  let correction = "";
  let toolChoice = "auto";
  for (let round = 0; round < 6; round++) {
    const message = await complete(
      config,
      [
        {
          role: "system",
          content:
            "你是 Landfold 全福庄地理探究助手。按下列 Skill 查证。用户问题中的‘这条线’指本轮 currentLine。\n\n" +
            skill +
            correction,
        },
        ...history.flat(),
        ...turn,
      ],
      toolChoice,
    );
    const calls = message.tool_calls ?? [];
    if (!Array.isArray(calls) || calls.length > 6)
      throw new Error("模型返回的工具请求超出范围。");
    if (calls.length === 0) {
      const missingTool = !sampled
        ? "sample_current_transect"
        : reference && !sampledReference
          ? "sample_reference_transect"
          : citations.size === 0
            ? "lookup_evidence"
            : null;
      if (missingTool) {
        correction = "\n本轮还需调用 " + missingTool + "。";
        toolChoice = { type: "function", function: { name: missingTool } };
        continue;
      }
      const answer = message.content?.trim();
      if (!answer) throw new Error("模型没有返回解读。");
      const ids = [...answer.matchAll(/\[([a-z]+)\]/g)].map(
        (match) => match[1],
      );
      if (!ids.length || ids.some((id) => !citations.has(id))) {
        correction =
          "\n请引用本轮工具实际返回的资料 ID。可用 ID：" +
          [...citations.keys()].map((id) => "[" + id + "]").join("、") +
          "。";
        toolChoice = "none";
        continue;
      }
      turn.push({ role: "assistant", content: answer });
      return { turn, answer, citations: [...citations.values()], trace };
    }
    turn.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: calls,
      ...(message.reasoning_content
        ? { reasoning_content: message.reasoning_content }
        : {}),
    });
    for (const call of calls) {
      const name = call.function?.name;
      let result = { error: "工具名称或参数无效。" };
      if (name === "sample_current_transect") {
        result = traceLine(points);
        sampled = true;
        trace.push({
          name: "读取当前选线",
          detail: result.count + " 个采样点",
        });
      } else if (name === "sample_reference_transect") {
        result = { error: "本轮没有固定对照线。" };
        if (reference) {
          result = traceLine(reference);
          sampledReference = true;
          trace.push({
            name: "读取对照线",
            detail: result.count + " 个采样点",
          });
        }
      } else if (name === "lookup_evidence") {
        let id;
        try {
          id = JSON.parse(call.function.arguments).id;
        } catch {}
        if (typeof id === "string" && Object.hasOwn(evidence, id)) {
          result = { id, ...evidence[id] };
          citations.set(id, result);
          trace.push({ name: "查阅资料", detail: result.title });
        }
      }
      turn.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
    const ready = sampled && (!reference || sampledReference) && citations.size;
    toolChoice = ready && round >= 3 ? "none" : "auto";
    correction = ready
      ? "\n本轮已取得基础证据。若当前问题需要另一资料，可继续查阅。使用已有工具结果，避免重复调用。"
      : "";
  }
  throw new Error("模型未在工具调用次数内完成查证，请缩小问题范围后重试。");
}
