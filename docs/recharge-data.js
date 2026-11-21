export const rechargeSource = {
  title: "梯田水补给比例",
  source: "Liu 等，Water，2022，表 2",
  url: "https://doi.org/10.3390/w14244110",
  summary:
    "研究用稳定氧同位素与二元混合模型估算各月降水和地下水对梯田水的补给占比。",
  limit:
    "数据限于全福庄研究区 2015 年 5 月至 2016 年 4 月。占比表示估算的水源构成。判断水量变化还需要总补给量，外推到其他年份或田块需要额外证据。",
};

// Table 2, listed in monthly sampling order (§3.1).
export const rechargeMonths = [
  ["2015-05", 38, 62],
  ["2015-06", 82, 18],
  ["2015-07", 96, 4],
  ["2015-08", 84, 16],
  ["2015-09", 69, 31],
  ["2015-10", 56, 44],
  ["2015-11", 83, 17],
  ["2015-12", 91, 9],
  ["2016-01", 56, 44],
  ["2016-02", 77, 23],
  ["2016-03", 48, 52],
  ["2016-04", 22, 78],
].map(([month, rain, groundwater]) => ({ month, rain, groundwater }));

export const defaultRechargeSelection = ["2015-07", "2016-04"];
const rows = new Map(rechargeMonths.map((row) => [row.month, row]));

export function monthLabel(month) {
  const [year, number] = month.split("-");
  return year + " 年 " + Number(number) + " 月";
}

export function validRechargeSelection(months) {
  return (
    Array.isArray(months) &&
    months.length === 2 &&
    months[0] !== months[1] &&
    months.every((month) => rows.has(month))
  );
}

export function compareRecharge(months) {
  if (!validRechargeSelection(months))
    throw new Error("请选择两个不同的研究月份。");
  const [first, second] = months.map((month) => rows.get(month));
  return {
    first,
    second,
    secondMinusFirst: {
      rainPercentagePoints: second.rain - first.rain,
      groundwaterPercentagePoints: second.groundwater - first.groundwater,
    },
  };
}
