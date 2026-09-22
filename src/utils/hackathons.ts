// Shared by the homepage and both desktop/mobile navigation menus.
export const hackathons = [
  {
    name: { en: "Agentic Software Factory", zh: "智能体软件工厂" },
    text: {
      en: "A global Harness Engineering competition with an online qualifier and Grand Challenge leading to Demo Day at GOSIM Shenzhen 2026.",
      zh: "面向全球的 Harness Engineering 竞赛，从线上初赛与大奖赛一路走向 GOSIM 深圳 2026 现场 Demo Day。",
    },
    link: "https://create.gosim.org/factory26/",
  },
  {
    name: { en: "Agentic Observer", zh: "巡天智能体" },
    text: {
      en: "Build an observing agent that reads the state of the sky and chooses the next observation every 900 seconds.",
      zh: "构建面向智能巡天的观测智能体，读取天空状态，并在每 900 秒选择下一次观测。",
    },
    link: "https://create.gosim.org/survey26/",
  },
  {
    name: { en: "Agentic App", zh: "Agentic App" },
    text: {
      en: "Build agentic apps for everyday scenarios such as email, messaging, and calendars, with OctoSense at the core and robrix2 as the development baseline.",
      zh: "以 OctoSense 为核心、robrix2 为主要开发基线，围绕邮件、即时消息、日历等日常场景构建 Agentic 小程序。",
    },
    link: "https://create.gosim.org/agenticapp26/",
  },
];

export function hackathonHighlights(lang: "en" | "zh") {
  return hackathons.map(({ name, text, link }) => ({
    badge: lang === "zh" ? "黑客松" : "Hackathon",
    title: `${lang === "zh" ? "黑客松" : "Hackathon"} · ${name[lang]}`,
    text: text[lang],
    link,
    linkLabel: lang === "zh" ? "查看黑客松" : "View hackathon",
  }));
}

export function hackathonNavLinks(lang: "en" | "zh") {
  return hackathons.map(({ name, link }) => ({
    text: `${lang === "zh" ? "黑客松" : "Hackathon"} · ${name[lang]}`,
    link,
    openInNewTab: true,
  }));
}
