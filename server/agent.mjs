import { readFileSync } from "node:fs";
import {
  classes,
  evidence,
  sampleTransect,
} from "../docs/investigation-data.js";
import {
  compareRecharge,
  monthLabel,
  rechargeSource,
} from "../docs/recharge-data.js";

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
    "compare_recharge_months",
    "Read published recharge proportions for the two months selected in this turn and calculate the changes in percentage points.",
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

async function complete(config, messages, toolChoice, activeTools) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools: activeTools,
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
  const { count, counts, runs } = sampleTransect(points);
  return {
    source: "Liu 等，Water 2022，图 1c",
    pointsInMapImage: points,
    pointOrder: "从 A 到 B，点号从 1 开始。",
    count,
    counts: Object.fromEntries(
      Object.entries(counts).map(([id, number]) => [classes[id].name, number]),
    ),
    orderedRuns: runs.map(({ id, ...bounds }) => ({
      class: classes[id].name,
      ...bounds,
    })),
    limit:
      "图面颜色采样，采样点数仅描述这条线。地图坐标归一化，未配准到经纬度，无高程。图中文字、河流符号和未匹配颜色为未判读。",
  };
}

export async function investigate({
  config,
  history,
  question,
  mode = "map",
  points,
  reference = null,
  months,
}) {
  const recharge = mode === "recharge";
  const currentTool = recharge
    ? "compare_recharge_months"
    : "sample_current_transect";
  const activeTools = tools.filter(
    ({ function: specification }) =>
      specification.name === "lookup_evidence" ||
      specification.name === currentTool ||
      (!recharge &&
        reference &&
        specification.name === "sample_reference_transect"),
  );
  const turn = [
    {
      role: "user",
      content: JSON.stringify({
        mode,
        question,
        ...(recharge
          ? { selectedMonths: months }
          : { currentLine: points, referenceLine: reference }),
      }),
    },
  ];
  const trace = [];
  const citations = new Map();
  let sampled = false;
  let sampledReference = false;
  let correction = "";
  let toolChoice = "auto";
  const requiredCitation = () =>
    recharge ? citations.has("recharge") : citations.size > 0;
  for (let round = 0; round < 6; round++) {
    const message = await complete(
      config,
      [
        {
          role: "system",
          content:
            "你是 Landfold 全福庄地理探究助手。按下列 Skill 查证，以本轮 mode 和选择为准。\n\n" +
            skill +
            correction,
        },
        ...history.flat(),
        ...turn,
      ],
      toolChoice,
      activeTools,
    );
    const calls = message.tool_calls ?? [];
    if (!Array.isArray(calls) || calls.length > 6)
      throw new Error("模型返回的工具请求超出范围。");
    if (calls.length === 0) {
      const missingTool = !sampled
        ? currentTool
        : reference && !sampledReference
          ? "sample_reference_transect"
          : !requiredCitation()
            ? "lookup_evidence"
            : null;
      if (missingTool) {
        correction =
          "\n本轮还需调用 " +
          missingTool +
          (recharge && missingTool === "lookup_evidence"
            ? "，id 使用 recharge。"
            : "。");
        toolChoice = { type: "function", function: { name: missingTool } };
        continue;
      }
      const answer = message.content?.trim();
      if (!answer) throw new Error("模型没有返回解读。");
      const ids = [...answer.matchAll(/\[([a-z]+)\]/g)].map(
        (match) => match[1],
      );
      if (
        !ids.length ||
        ids.some((id) => !citations.has(id)) ||
        (recharge && !ids.includes("recharge"))
      ) {
        correction =
          "\n请引用本轮工具实际返回的资料 ID。可用 ID：" +
          [...citations.keys()].map((id) => "[" + id + "]").join("、") +
          (recharge ? "。月份数值需要引用 [recharge]。" : "。");
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
      if (name === "compare_recharge_months" && recharge) {
        result = {
          ...compareRecharge(months),
          sourceEvidenceId: "recharge",
          unit: "月度补给占比为百分比，变化为百分点。",
          limit: rechargeSource.limit,
        };
        sampled = true;
        trace.push({
          name: "比较水源补给",
          detail: months.map(monthLabel).join(" / "),
        });
      } else if (name === "sample_current_transect" && !recharge) {
        result = traceLine(points);
        sampled = true;
        trace.push({
          name: "读取当前选线",
          detail: result.count + " 个采样点",
        });
      } else if (name === "sample_reference_transect" && !recharge) {
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
    const ready =
      sampled && (!reference || sampledReference) && requiredCitation();
    toolChoice = ready && round >= 3 ? "none" : "auto";
    correction = ready
      ? "\n本轮已取得基础证据。若当前问题需要另一资料，可继续查阅。使用已有工具结果，避免重复调用。"
      : "";
  }
  throw new Error("模型未在工具调用次数内完成查证，请缩小问题范围后重试。");
}
