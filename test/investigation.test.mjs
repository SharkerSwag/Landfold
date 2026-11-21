import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import {
  readTransect,
  samplePosition,
  sampleTransect,
  transects,
} from "../docs/investigation-data.js";
import { agentRoute } from "../server/agent-route.mjs";
import {
  compareRecharge,
  defaultRechargeSelection,
  rechargeMonths,
  validRechargeSelection,
} from "../docs/recharge-data.js";
import { readTerrain, validTerrainSelection } from "../docs/terrain-data.js";

async function start(t, handler) {
  const server = http.createServer(handler).listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");
  return "http://127.0.0.1:" + server.address().port;
}

test("the two study lines give distinct readings on the published figure", () => {
  const settlement = sampleTransect(transects.settlement.points);
  const terraces = sampleTransect(transects.terraces.points);
  assert.ok(settlement.counts.v > 0 && settlement.counts.t > 0);
  assert.ok(terraces.counts.t > 0);
  assert.equal(terraces.counts.v, 0);
  assert.deepEqual(
    settlement.runs.filter((run) => run.id === "v"),
    [{ id: "v", startPoint: 37, endPoint: 44 }],
  );
  const reversed = sampleTransect([...transects.settlement.points].reverse());
  assert.deepEqual(
    reversed.runs.filter((run) => run.id === "v"),
    [{ id: "v", startPoint: 12, endPoint: 19 }],
  );
  assert.equal(
    Object.values(settlement.counts).reduce((a, b) => a + b, 0),
    settlement.count,
  );
  assert.throws(() =>
    sampleTransect([
      [0, 0],
      [0, 0],
    ]),
  );
});

test("shared coordinates restore the exact line and sample positions", () => {
  const points = [
    [0.25, 0.53],
    [0.25, 0.89],
  ];
  const restored = readTransect(points.flat().join(","));
  assert.deepEqual(restored, points);
  assert.deepEqual(samplePosition(restored, 2, 0), [0.25, 0.62]);
  assert.equal(readTransect("0,0,0,0"), null);
  assert.equal(readTransect("0,0,2,0"), null);
  assert.equal(readTransect("0,0,,.5"), null);
});

test("recharge data preserves the source values and calculates signed changes", () => {
  assert.equal(rechargeMonths.length, 12);
  assert.ok(rechargeMonths.every((row) => row.rain + row.groundwater === 100));
  const { first, second, secondMinusFirst } = compareRecharge(
    defaultRechargeSelection,
  );
  assert.deepEqual(
    [first.rain, first.groundwater, second.rain, second.groundwater],
    [96, 4, 22, 78],
  );
  assert.deepEqual(secondMinusFirst, {
    rainPercentagePoints: -74,
    groundwaterPercentagePoints: 74,
  });
  assert.equal(
    compareRecharge([...defaultRechargeSelection].reverse()).secondMinusFirst
      .groundwaterPercentagePoints,
    -74,
  );
  assert.equal(validRechargeSelection(["2015-07", "2015-07"]), false);
  assert.equal(validRechargeSelection(["2015-07", "2017-01"]), false);
});

test("each turn reads its active view and retains earlier tool results", async (t) => {
  const observed = [];
  let correctedCitation = false;
  const model = await start(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const { messages, tools } = JSON.parse(Buffer.concat(chunks));
    const lastUser = messages.findLastIndex(
      (message) => message.role === "user",
    );
    const results = messages
      .slice(lastUser + 1)
      .filter((message) => message.role === "tool");
    const { mode, referenceLine } = JSON.parse(messages[lastUser].content);
    const isRecharge = mode === "recharge";
    const isCombined = mode === "combined";
    const isTerrain = mode === "terrain";
    const names = isCombined
      ? [
          "sample_current_transect", "sample_reference_transect",
          "compare_recharge_months", "lookup_evidence", "lookup_evidence",
        ]
      : isTerrain
        ? ["read_terrain_profile", "lookup_evidence"]
        : isRecharge
      ? ["compare_recharge_months", "lookup_evidence"]
      : referenceLine
        ? [
            "sample_current_transect",
            "sample_reference_transect",
            "lookup_evidence",
          ]
        : ["sample_current_transect", "lookup_evidence"];
    let message;
    if (results.length < names.length) {
      const name = names[results.length];
      const source = isCombined
        ? results.length === 3 ? "map" : "recharge"
        : isRecharge ? "recharge" : isTerrain ? "terrain" : "region";
      message = {
        content: null,
        tool_calls: [
          {
            id: "call_" + lastUser + "_" + results.length,
            type: "function",
            function: {
              name,
              arguments:
                name === "lookup_evidence"
                  ? JSON.stringify({ id: source })
                  : "{}",
            },
          },
        ],
      };
    } else if (referenceLine && !messages[0].content.includes("可用 ID")) {
      message = { content: isCombined ? "接口测试应答 [map]" : "接口测试应答 [water]" };
    } else {
      if (referenceLine)
        correctedCitation = messages[0].content.includes("可用 ID");
      observed.push({
        skillLoaded: messages[0].content.includes("name: check-transect"),
        earlierResults: messages
          .slice(0, lastUser)
          .filter((entry) => entry.role === "tool").length,
        sample: JSON.parse(results[0].content),
        reference: referenceLine ? JSON.parse(results[1].content) : null,
        rechargeComparison: isCombined ? JSON.parse(results[2].content) : null,
        tools: tools.map((entry) => entry.function.name),
      });
      message = {
        content: isCombined
          ? "接口测试应答 [map][recharge]"
          : isTerrain ? "接口测试应答 [terrain]"
            : isRecharge ? "接口测试应答 [recharge]" : "接口测试应答 [region]",
      };
    }
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ choices: [{ message }] }));
  });
  const service = await start(
    t,
    agentRoute({ endpoint: model, key: "test-only", model: "test-only" }),
  );
  async function ask(selection, session) {
    const response = await fetch(service, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "这条线经过村寨吗？",
        session,
        ...selection,
      }),
    });
    assert.equal(response.status, 200);
    return response.json();
  }
  const first = await ask({ points: transects.settlement.points });
  const second = await ask(
    {
      points: transects.terraces.points,
      reference: transects.settlement.points,
    },
    first.session,
  );
  assert.equal(second.session, first.session);
  assert.deepEqual(
    second.trace.map((step) => step.name),
    ["读取当前选线", "读取对照线", "查阅资料"],
  );
  assert.equal(second.citations[0].id, "region");
  assert.equal(observed[0].skillLoaded, true);
  assert.ok(observed[0].sample.counts["村寨"] > 0);
  assert.deepEqual(
    observed[0].sample.orderedRuns.filter((run) => run.class === "村寨"),
    [{ class: "村寨", startPoint: 37, endPoint: 44 }],
  );
  assert.equal(observed[1].sample.counts["村寨"], 0);
  assert.equal(
    observed[1].reference.counts["村寨"],
    observed[0].sample.counts["村寨"],
  );
  assert.equal(observed[1].earlierResults, 2);
  assert.equal(correctedCitation, true);
  const third = await ask(
    { mode: "recharge", months: defaultRechargeSelection },
    first.session,
  );
  assert.equal(third.session, first.session);
  assert.deepEqual(
    third.trace.map((step) => step.name),
    ["比较水源补给", "查阅资料"],
  );
  assert.deepEqual(observed[2].tools, [
    "compare_recharge_months",
    "lookup_evidence",
  ]);
  assert.equal(
    observed[2].sample.secondMinusFirst.groundwaterPercentagePoints,
    74,
  );
  assert.equal(observed[2].earlierResults, 5);
  const combined = await ask({
    mode: "combined",
    points: transects.settlement.points,
    reference: transects.terraces.points,
    months: defaultRechargeSelection,
  }, first.session);
  assert.equal(combined.session, first.session);
  assert.equal(observed[3].earlierResults, 7);
  assert.equal(observed[3].sample.counts["村寨"], 8);
  assert.equal(observed[3].reference.counts["村寨"], 0);
  assert.equal(
    observed[3].rechargeComparison.secondMinusFirst.groundwaterPercentagePoints, 74,
  );
  assert.deepEqual(combined.citations.map((source) => source.id), ["map", "recharge"]);
  assert.match(combined.answer, /\[map\]\[recharge\]/);
  const terrain = await ask({ mode: "terrain", terrain: { route: "ns", point: 22 } }, first.session);
  assert.equal(terrain.session, first.session);
  assert.equal(observed[4].earlierResults, 12);
  assert.equal(observed[4].sample.sampleElevationM, 2124);
  assert.equal(terrain.citations[0].id, "terrain");
});

test("terrain profiles validate the selection and use route-specific distances and relief", () => {
  const north = readTerrain({ route: "ns", point: 22 });
  assert.equal(north.sampleDistanceKm, 2.22);
  assert.equal(north.reliefM, 415);
  const east = readTerrain({ route: "ew", point: 29 });
  assert.equal(east.sampleElevationM, 2179);
  assert.equal(east.reliefM, 389);
  assert.equal(validTerrainSelection({ route: "ns", point: 45 }), false);
  assert.equal(validTerrainSelection({ route: "toString", point: 0 }), false);
});
