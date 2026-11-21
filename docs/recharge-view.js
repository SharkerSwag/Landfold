import {
  compareRecharge,
  defaultRechargeSelection,
  monthLabel,
  rechargeMonths,
  rechargeSource,
  validRechargeSelection,
} from "./recharge-data.js";

function node(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}

export function rechargeUrl(base, months) {
  const url = new URL(base);
  url.hash = new URLSearchParams({
    view: "recharge",
    months: months.join(","),
  }).toString();
  return url.href;
}

function signed(value) {
  return value > 0 ? "+" + value : value < 0 ? "−" + Math.abs(value) : "0";
}

export function recordRecharge(months) {
  const { first, second, secondMinusFirst } = compareRecharge(months);
  return [
    ...[first, second].map(
      (row) =>
        monthLabel(row.month) +
        "：降水 " +
        row.rain +
        "%，地下水 " +
        row.groundwater +
        "%。",
    ),
    "地下水占比变化（B 减 A）：" +
      signed(secondMinusFirst.groundwaterPercentagePoints) +
      " 个百分点。",
    rechargeSource.limit,
    "[" + rechargeSource.source + "](" + rechargeSource.url + ")",
  ].join("\n\n");
}

export function createRechargeView() {
  const fields = [
    document.querySelector("#month-first"),
    document.querySelector("#month-second"),
  ];
  const chartRows = new Map();
  const chart = document.querySelector("#recharge-chart");
  const status = document.querySelector("#month-status");
  const comparison = document.querySelector("#recharge-comparison");
  let selection = [...defaultRechargeSelection];

  for (const row of rechargeMonths) {
    fields.forEach((field) =>
      field.append(new Option(monthLabel(row.month), row.month)),
    );
    const item = node("li");
    const label = node("span", monthLabel(row.month));
    const marks = node("div");
    marks.className = "recharge-bar";
    marks.setAttribute("aria-hidden", "true");
    for (const value of [row.rain, row.groundwater]) {
      const mark = node("span");
      mark.style.width = value + "%";
      marks.append(mark);
    }
    const values = node("span", row.rain + "% / " + row.groundwater + "%");
    values.className = "recharge-values";
    item.setAttribute(
      "aria-label",
      monthLabel(row.month) +
        "，降水 " +
        row.rain +
        "%，地下水 " +
        row.groundwater +
        "%",
    );
    item.append(label, marks, values);
    chartRows.set(row.month, item);
    chart.append(item);
  }

  function render(months) {
    selection = validRechargeSelection(months)
      ? [...months]
      : [...defaultRechargeSelection];
    const { first, second, secondMinusFirst } = compareRecharge(selection);
    fields.forEach((field, index) => {
      field.value = selection[index];
      for (const option of field.options)
        option.disabled = option.value === selection[1 - index];
    });
    for (const [month, row] of chartRows) {
      const marker =
        month === first.month ? "A" : month === second.month ? "B" : "";
      row.dataset.selection = marker;
      row.firstElementChild.textContent =
        (marker ? marker + " · " : "") + monthLabel(month);
    }
    document.querySelector("#month-first-column").textContent =
      "A · " + monthLabel(first.month);
    document.querySelector("#month-second-column").textContent =
      "B · " + monthLabel(second.month);
    const differences = [
      ["降水", first.rain, second.rain, secondMinusFirst.rainPercentagePoints],
      [
        "地下水",
        first.groundwater,
        second.groundwater,
        secondMinusFirst.groundwaterPercentagePoints,
      ],
    ];
    comparison.replaceChildren(
      ...differences.map(([label, a, b, delta]) => {
        const row = node("tr");
        const title = node("th", label);
        title.scope = "row";
        row.append(
          title,
          node("td", a + "%"),
          node("td", b + "%"),
          node("td", signed(delta)),
        );
        return row;
      }),
    );
    status.textContent =
      "B 月份的地下水补给占比较 A " +
      (secondMinusFirst.groundwaterPercentagePoints === 0
        ? "持平。"
        : (secondMinusFirst.groundwaterPercentagePoints > 0 ? "高 " : "低 ") +
          Math.abs(secondMinusFirst.groundwaterPercentagePoints) +
          " 个百分点。");
    document.querySelector("#month-share-fallback").hidden = true;
    document.querySelector("#month-share-status").textContent = "";
  }

  fields.forEach((field) =>
    field.addEventListener("change", () =>
      render(fields.map((input) => input.value)),
    ),
  );
  render(selection);
  return { selection: () => [...selection], render };
}
