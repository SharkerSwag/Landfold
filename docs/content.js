export const regionalSource = {
  title: "Cultural Landscape of Honghe Hani Rice Terraces",
  publisher: "UNESCO World Heritage Centre",
  url: "https://whc.unesco.org/en/list/1111/",
};

export const photos = {
  cover: {
    file: "assets/yuanyang-terraces-charrine-liu.jpg",
    title: "The Terrace Of Yuanyang China",
    author: "Charrine Liu",
    date: "2015 年前发布；原始资料未提供确切拍摄日期",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:The_Terrace_Of_Yuanyang_China_(102441505).jpeg",
    width: 2048,
    height: 1365,
    alt: "云南元阳的真实摄影：层层蓄水的梯田映着天空，远处山峦在雾气中逐层淡去。",
  },
  green: {
    file: "assets/hani-terraces-xiquinhosilva.jpg",
    title: "Hani Rice Terraces",
    author: "Xiquinho Silva",
    date: "2023 年 6 月 23 日",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Hani_Rice_Terraces_(53696483750).jpg",
    width: 2560,
    height: 1709,
    alt: "云南元阳绿色梯田的真实摄影，田间可见林地、局部水面与小型建筑。",
  },
};

// Relative positions identify visible photographic details, not measured map coordinates.
export const topics = {
  terraces: {
    number: "01",
    label: "梯田的纹理",
    title: "沿着山势，一层一层",
    position: [0.61, 0.64],
    summary:
      "照片里的田埂沿坡面层叠展开。顺着弧线看，耕地的尺度、坡地的起伏，便逐渐有了可辨认的秩序。",
    context:
      "区域资料记录，哈尼梯田随山地轮廓展开，农业与当地环境长期相互适应。",
    prompt: "先找一条田埂，再用目光沿着它，读一读山坡的起伏。",
  },
  water: {
    number: "02",
    label: "水面的光",
    title: "让水，在坡地上停留",
    position: [0.6, 0.82],
    summary:
      "田面反射的亮光，让平整的水面与起伏的坡地形成对照。细看明暗交界，田埂与田面的边界就显现出来。",
    context: "这一区域的灌溉依靠沟渠与分水系统，也包含社区共同维护的实践。",
    prompt: "照片中哪些地方在反光？它们和田埂之间是什么关系？",
  },
  forest: {
    number: "03",
    label: "林与田",
    title: "耕地之外，还有山林",
    position: [0.34, 0.53],
    summary:
      "照片中，树木与耕地相邻，构成不同的纹理与颜色。它们在画面里的边界，也是一条值得细读的线索。",
    context:
      "在更大的哈尼梯田系统中，山顶森林、供水、村寨与梯田彼此联系。照片里的局部树木，不等同于区域资料所说的山顶森林。",
    prompt: "从田面移开目光，看一看树木与耕地怎样出现在同一个坡面上。",
  },
  people: {
    number: "04",
    label: "人的痕迹",
    title: "生活，留在山的纹理里",
    position: [0.19, 0.67],
    summary:
      "田埂、小路和耕作留下的尺度，让这片景观有了人的痕迹。理解它，也需要关注劳动与生活如何在这里发生。",
    context: "聚落、土地利用与社区水资源协作，共同构成了这片文化景观。",
    prompt: "把目光放近：哪些细小的痕迹，能让你感受到人的尺度？",
  },
};
