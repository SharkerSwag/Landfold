import { readFileSync } from "node:fs";
import {
  classes,
  evidence,
  sampleTransect,
  transectLabel,
} from "../docs/investigation-data.js";
import {
  compareRecharge,
  monthLabel,
  rechargeSource,
} from "../docs/recharge-data.js";
import { readTerrain } from "../docs/terrain-data.js";

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
  tool(
    "read_terrain_profile",
    "Read SRTM elevation at the selected point and the regional profile's overall relief. These coordinates do not align with the published land-use map.",
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
    lineLabel: transectLabel(points),
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

function formatCurrentReadings(mode, readings) {
  if (mode === "terrain") {
    const profile = readings.get("read_terrain_profile");
    return "**剖面读数。** " + profile.label + "，第 " + profile.pointNumber +
      " 点，距起点 " + profile.sampleDistanceKm + " 公里，海拔 " +
      profile.sampleElevationM + " 米。全线 " + profile.distanceKm +
      " 公里，最低 " + profile.minElevationM + " 米，最高 " +
      profile.maxElevationM + " 米，最大高差 " + profile.reliefM + " 米 [terrain]。";
  }
  if (mode !== "combined") return "";
  const lines = [
    ["当前线", readings.get("sample_current_transect")],
    ["对照线", readings.get("sample_reference_transect")],
  ]
    .filter(([, reading]) => reading)
    .map(([kind, { lineLabel, counts, count }]) =>
      kind + "「" + lineLabel + "」共 " + count + " 点（" +
      Object.entries(counts).map(([label, total]) => label + " " + total).join("、") + "）",
    );
  const { first, second, secondMinusFirst } = readings.get("compare_recharge_months");
  const groundwater = secondMinusFirst.groundwaterPercentagePoints;
  const difference = groundwater > 0 ? "+" + groundwater : String(groundwater);
  return "**地图读数。** " + lines.join("，") + " [map]。\n\n" +
    "**水源读数。** 地下水补给占比由 " + monthLabel(first.month) + "的 " +
    first.groundwater + "% 到 " + monthLabel(second.month) + "的 " +
    second.groundwater + "%，B 减 A 为 " + difference + " 个百分点 [recharge]。";
}

export async function investigate({
  config,
  history,
  question,
  mode = "map",
  points,
  reference = null,
  months,
  terrain,
}) {
  const useMap = mode === "map" || mode === "combined";
  const useRecharge = mode === "recharge" || mode === "combined";
  const useTerrain = mode === "terrain";
  const requiredTools = new Set();
  if (useMap) requiredTools.add("sample_current_transect");
  if (useMap && reference) requiredTools.add("sample_reference_transect");
  if (useRecharge) requiredTools.add("compare_recharge_months");
  if (useTerrain) requiredTools.add("read_terrain_profile");
  const requiredSources = [
    ...(mode === "combined" ? ["map"] : []),
    ...(useRecharge ? ["recharge"] : []),
    ...(useTerrain ? ["terrain"] : []),
  ];
  const activeTools = tools.filter(
    ({ function: specification }) =>
      specification.name === "lookup_evidence" ||
      requiredTools.has(specification.name),
  );
  const turn = [
    {
      role: "user",
      content: JSON.stringify({
        mode,
        question,
        ...(useMap ? { currentLine: points, referenceLine: reference } : {}),
        ...(useRecharge ? { selectedMonths: months } : {}),
      }),
    },
  ];
  const trace = [];
  const citations = new Map();
  const readings = new Map();
  let correction = "";
  let toolChoice = "auto";
  const roundLimit = mode === "combined" ? 8 : 6;
  const nextCheck = () => {
    const missingTool = [...requiredTools].find((name) => !readings.has(name));
    if (missingTool) return { name: missingTool, detail: "" };
    const missingSource = requiredSources.find((id) => !citations.has(id));
    if (missingSource || !citations.size) {
      return {
        name: "lookup_evidence",
        detail: missingSource ? "，id 使用 " + missingSource : "",
      };
    }
    return null;
  };
  for (let round = 0; round < roundLimit; round++) {
    const message = await complete(
      config,
      [
        {
          role: "system",
          content:
            "你是 Landfold 元阳地理探究助手。按下列 Skill 查证，以本轮 mode 和选择为准。\n\n" +
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
    if (!Array.isArray(calls) || calls.length > 12)
      throw new Error("模型返回的工具请求超出范围。");
    if (calls.length === 0) {
      const missing = nextCheck();
      if (missing) {
        correction = "\n本轮还需调用 " + missing.name + missing.detail + "。";
        toolChoice = { type: "function", function: { name: missing.name } };
        continue;
      }
      const interpretation = message.content?.trim();
      if (!interpretation) throw new Error("模型没有返回解读。");
      const ids = [...interpretation.matchAll(/\[([a-z]+)\]/g)].map(
        (match) => match[1],
      );
      if (
        !ids.length ||
        ids.some((id) => !citations.has(id)) ||
        requiredSources.some((id) => !ids.includes(id))
      ) {
        correction =
          "\n请引用本轮工具实际返回的资料 ID。可用 ID：" +
          [...citations.keys()].map((id) => "[" + id + "]").join("、") +
          (requiredSources.length
            ? "。本轮必引资料：" +
              requiredSources.map((id) => "[" + id + "]").join("、") + "。"
            : "。");
        toolChoice = "none";
        continue;
      }
      const answer = [formatCurrentReadings(mode, readings), interpretation]
        .filter(Boolean).join("\n\n");
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
      if (name === "compare_recharge_months" && useRecharge) {
        result = {
          ...compareRecharge(months),
          sourceEvidenceId: "recharge",
          unit: "月度补给占比为百分比，变化为百分点。",
          limit: rechargeSource.limit,
        };
        if (!readings.has(name)) trace.push({
          name: "比较水源补给",
          detail: months.map(monthLabel).join(" / "),
        });
        readings.set(name, result);
      } else if (name === "read_terrain_profile" && useTerrain) {
        result = readTerrain(terrain);
        if (!readings.has(name)) trace.push({
          name: "读取区域地形",
          detail: result.label + " · 第 " + result.pointNumber + " 点",
        });
        readings.set(name, result);
      } else if (name === "sample_current_transect" && useMap) {
        result = traceLine(points);
        if (!readings.has(name)) trace.push({
          name: "读取当前选线",
          detail: result.count + " 个采样点",
        });
        readings.set(name, result);
      } else if (name === "sample_reference_transect" && useMap) {
        result = { error: "本轮没有固定对照线。" };
        if (reference) {
          result = traceLine(reference);
          if (!readings.has(name)) trace.push({
            name: "读取对照线",
            detail: result.count + " 个采样点",
          });
          readings.set(name, result);
        }
      } else if (name === "lookup_evidence") {
        let id;
        try {
          id = JSON.parse(call.function.arguments).id;
        } catch {}
        if (typeof id === "string" && Object.hasOwn(evidence, id)) {
          result = { id, ...evidence[id] };
          if (!citations.has(id))
            trace.push({ name: "查阅资料", detail: result.title });
          citations.set(id, result);
        }
      }
      turn.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
    const ready = !nextCheck();
    toolChoice = ready && (mode === "combined" || round >= 3) ? "none" : "auto";
    correction = ready
      ? "\n本轮已取得基础证据。若当前问题需要另一资料，可继续查阅。使用已有工具结果，避免重复调用。"
      : "";
  }
  throw new Error("模型未在工具调用次数内完成查证，请缩小问题范围后重试。");
}
