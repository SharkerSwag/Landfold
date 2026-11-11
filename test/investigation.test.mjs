import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { sampleTransect, transects } from "../docs/investigation-data.js";
import { agentRoute } from "../server/agent-route.mjs";

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

test("each turn reads the current line and retains earlier tool results", async (t) => {
  const observed = [];
  const model = await start(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const { messages } = JSON.parse(Buffer.concat(chunks));
    const lastUser = messages.findLastIndex(
      (message) => message.role === "user",
    );
    const results = messages
      .slice(lastUser + 1)
      .filter((message) => message.role === "tool");
    let message;
    if (results.length < 2) {
      const name =
        results.length === 0 ? "sample_current_transect" : "lookup_evidence";
      message = {
        content: null,
        tool_calls: [
          {
            id: "call_" + lastUser + "_" + results.length,
            type: "function",
            function: {
              name,
              arguments: results.length === 0 ? "{}" : '{"id":"region"}',
            },
          },
        ],
      };
    } else {
      observed.push({
        skillLoaded: messages[0].content.includes("name: check-transect"),
        earlierResults: messages
          .slice(0, lastUser)
          .filter((entry) => entry.role === "tool").length,
        sample: JSON.parse(results[0].content),
      });
      message = { content: "接口测试应答 [region]" };
    }
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ choices: [{ message }] }));
  });
  const service = await start(
    t,
    agentRoute({ endpoint: model, key: "test-only", model: "test-only" }),
  );
  async function ask(points, session) {
    const response = await fetch(service, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "这条线经过村寨吗？", points, session }),
    });
    assert.equal(response.status, 200);
    return response.json();
  }
  const first = await ask(transects.settlement.points);
  const second = await ask(transects.terraces.points, first.session);
  assert.equal(second.session, first.session);
  assert.deepEqual(
    second.trace.map((step) => step.name),
    ["读取当前选线", "查阅资料"],
  );
  assert.equal(second.citations[0].id, "region");
  assert.equal(observed[0].skillLoaded, true);
  assert.ok(observed[0].sample.counts["村寨"] > 0);
  assert.equal(observed[1].sample.counts["村寨"], 0);
  assert.equal(observed[1].earlierResults, 2);
});
