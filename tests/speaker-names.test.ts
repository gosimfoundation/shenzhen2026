import { describe, expect, it } from "vitest";
import speakersEn from "../src/json/Speakers.json";
import speakersZh from "../src/json/SpeakersZh.json";

const bilingualNames: Record<string, [english: string, chinese: string]> = {
  "baofeng-wang": ["Baofeng Wang", "王宝峰"],
  "bo-tang": ["Bo Tang", "唐波"],
  "bohua-zhan": ["Bohua Zhan", "詹博华"],
  "cen-ming": ["Cen Ming", "岑明"],
  "chao-du": ["Chao Du", "杜超"],
  "chenzhe-jing": ["Chenzhe Jing", "井晨哲"],
  "fahua-jin": ["Fahua Jin", "金发华"],
  "fanshi-zhang": ["Fanshi Zhang", "张凡石"],
  "jacky-hsu": ["Jacky Hsu", "许建志"],
  "jiechen-liu": ["Jiechen Liu", "刘杰辰"],
  "kaiyan-zhang": ["Kaiyan Zhang", "张开颜"],
  "kerry-zhu": ["Kerry Zhu", "朱少民"],
  "meiyi-qiang": ["Meiyi Qiang", "强美伊"],
  "ning-liu": ["Ning Liu", "刘宁"],
  "peng-zhang": ["Peng Zhang", "张鹏"],
  "quanshi-zhang": ["Quanshi Zhang", "张拳石"],
  "sean-dong": ["Sean Dong", "董鑫"],
  "shiwei-liu": ["Shiwei Liu", "刘世伟"],
  "shuyue-hu": ["Shuyue Hu", "胡舒悦"],
  "tong-ling": ["Tong Ling", "凌通"],
  "weiqi-zhao": ["Weiqi Zhao", "赵维奇"],
  "wilson-wang": ["Wilson Wang", "王潇爽"],
  "xin-liu": ["Xin Liu", "刘鑫"],
  "xuewen-gao": ["Xuewen Gao", "高学文"],
  "yanwei-huang": ["Yanwei Huang", "黄言伟"],
  "yanzhi-wang": ["Yanzhi Wang", "王言治"],
  "yaowei-zheng": ["Yaowei Zheng", "郑耀威"],
  "yuheng-chen": ["Yuheng Chen", "陈昱衡"],
  "yuning-liang": ["Yuning Liang", "梁宇宁"],
  "zhichao-jiao": ["Zhichao Jiao", "焦智超"],
  "zhihong-mo": ["Zhihong Mo", "莫志宏"],
  "zixi-liu": ["Zixi Liu", "刘子夕"],
};

describe("speaker bilingual names", () => {
  it.each(Object.entries(bilingualNames))(
    "keeps the approved English and Chinese names for %s",
    (id, [englishName, chineseName]) => {
      const englishSpeaker = speakersEn.speakers.find(
        (speaker) => speaker.id === id,
      );
      const chineseSpeaker = speakersZh.speakers.find(
        (speaker) => speaker.id === id,
      );

      expect(englishSpeaker?.name).toBe(englishName);
      expect(chineseSpeaker?.name).toBe(chineseName);
      expect(chineseSpeaker?.nameEn).toBe(englishName);
    },
  );

  it("keeps every Chinese profile linked to its canonical English name", () => {
    const englishNamesById = new Map(
      speakersEn.speakers.map((speaker) => [speaker.id, speaker.name]),
    );

    for (const speaker of speakersZh.speakers) {
      expect(speaker.nameEn).toBe(englishNamesById.get(speaker.id));
    }
  });
});
