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
  village: {
    file: "assets/bada-village-chensiyuan.jpg",
    title: "Village seen from Bada, Yuanyang",
    author: "chensiyuan",
    date: "标题标注 2012；EXIF 标注 2013 年 1 月 4 日，信息存在差异",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:1_yuanyang_county_rice_terrace_bada_view_2012.jpg",
    width: 1280,
    height: 935,
    rendition: "Wikimedia 提供的 1280px 缩略版本；保留完整构图。",
    alt: "从元阳巴达方向望去，村落位于林地之间，坡面耕地与云雾环绕其下。",
  },
};

export const folio = {
  cover: {
    title: "水面，收藏一片天光。",
    label: "水面的银",
    credit: "PHOTOGRAPH © Charrine Liu / 拍摄日期未详",
    description: "蓄水的田面映着天空，田埂将明亮的倒影分成细密的形状。",
  },
  green: {
    title: "稻色，铺满山的褶皱。",
    label: "田野的绿",
    credit: "PHOTOGRAPH © Xiquinho Silva / 2023.06.23",
    description: "绿色的田面与细密田埂，让坡地呈现出另一种纹理。",
  },
};

export const relations = {
  forest: {
    number: "01",
    name: "森林",
    label: "FOREST / 山顶森林",
    title: "水的故事，|从山林开始。",
    copy: "区域资料将山顶森林与水源联系起来。水经沟渠输送到坡面上的梯田，森林因而是理解农田系统的一部分。",
    question: "试着想一想：田里的水，与田地之外的哪些地方有关？",
  },
  village: {
    number: "02",
    name: "村寨",
    label: "VILLAGE / 山间人居",
    title: "在林与田之间，|安放生活。",
    copy: "村寨位于山顶森林与梯田之间。水的分配与沟渠维护也依赖社区协作，人与人的关系，参与塑造了这片地景。",
    question: "看一处聚落时，除了房屋，还可以追问它与水和耕地的关系。",
  },
  terraces: {
    number: "03",
    name: "梯田",
    label: "TERRACES / 坡地耕作",
    title: "顺着坡地，|留下水与稻。",
    copy: "梯田沿山势展开，沟渠将水带入田中。弯曲的田埂既是照片里的纹理，也与耕作和水的管理相连。",
    question: "同一条田埂，怎样同时成为画面中的线条与生活中的设施？",
  },
  river: {
    number: "04",
    name: "河流",
    label: "RIVER / 山下河谷",
    title: "把目光，|放回整个流域。",
    copy: "红河位于山地之下。将视野从单块田地扩展到山林、聚落与河谷，才能看见地景所处的更大空间。",
    question: "照片之外，还有哪些联系，需要借助区域资料才能理解？",
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
