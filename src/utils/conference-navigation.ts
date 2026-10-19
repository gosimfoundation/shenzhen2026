interface NavigationLink {
  text: string;
  link?: string;
  anchor?: string;
  openInNewTab?: boolean;
  isGroupLabel?: boolean;
  subLinks?: NavigationLink[];
}

export function conferenceNavigation(lang: "en" | "zh"): NavigationLink[] {
  const zh = lang === "zh";
  const base = zh ? "/zh" : "";
  return [
    { text: zh ? "议程" : "Schedule", link: `${base}/schedule/` },
    { text: zh ? "讲师" : "Speakers", link: `${base}/speakers/` },
    { text: zh ? "赞助商" : "Sponsors", link: `${base}/sponsors/` },
    {
      text: zh ? "更多" : "More",
      subLinks: [
        { text: zh ? "大会资料" : "Conference Information", isGroupLabel: true },
        { text: zh ? "大会地点" : "Venue", link: `${base}/venue/` },
        { text: zh ? "旅费报销" : "Travel Reimbursement", link: `${base}/travel-fund-policy/` },
        { text: zh ? "志愿者致谢" : "Volunteer Thanks", link: `${base}/volunteers/` },
        { text: zh ? "同期活动" : "Co-located Events", isGroupLabel: true },
        { text: zh ? "联合国开源专题会议" : "UN Open Source Convening", link: `${base}/un-open-source-convening/` },
        { text: zh ? "Spotlight 与黑客松" : "Spotlight & Hackathons", link: `${base}/#highlights` },
        { text: zh ? "AI 愿景论坛" : "AI Vision Forum", link: `https://shenzhen2026.visionforum.ai/${zh ? "zh-cn" : "en"}/`, openInNewTab: true },
        { text: "RustChinaConf 2026", link: `https://rustchinaconf.org${zh ? "/zh-CN/" : "/"}`, openInNewTab: true },
      ],
    },
  ];
}
