#!/usr/bin/env python3
"""
Conference Speaker to Event Tags Mapping Generator

This script creates a mapping of each speaker ID to all the event tags they should have
based on their participation in different conference tracks.

Tag Rules:
- Plenary tracks → "plenary" tag
- Main tracks (ai-models-infra, embodied-ai, etc.) → track name as tag
- Workshops (ws-*) → workshop tag
- Co-located events → event tag (rustchinaconf for all rust-china events)
- Speakers in multiple events get all corresponding tags
"""

def create_speaker_event_mapping():
    """Create a mapping of speaker IDs to their event tags."""

    # Initialize the mapping dictionary
    speaker_tags = {}

    # Helper function to add tags for speakers
    def add_speaker_tags(speakers, tag):
        for speaker in speakers:
            speaker = speaker.strip()
            if speaker not in speaker_tags:
                speaker_tags[speaker] = []
            if tag not in speaker_tags[speaker]:
                speaker_tags[speaker].append(tag)

    # Main Conference Tracks
    # Plenary track
    plenary_speakers = [
        "tao-jiang", "mehdi-snene", "bill-ren", "michael-yuan",
        "yonghua-lin", "li-jianzhong"
    ]
    add_speaker_tags(plenary_speakers, "plenary")

    # AI Models & Infrastructure track
    ai_models_infra_speakers = [
        "guang-liu", "krzysztof-ociepa", "markus-tavenrath", "yuxuan-zhang",
        "speaker-zhu-de-jiang", "zhang-yubo", "chen-zicong", "speaker-chen-hai-quan",
        "speaker-ding-yi-bin", "aurlienmorgan-claudon", "speaker-he-wan-qing",
        "kaichao-you", "jingdong-chen", "vincent-caldeira", "speaker-wang-tian-ce",
        "paul-yang", "zhang-renwei", "xuan-son-nguyen", "richard-reiner", "jingya-huang"
    ]
    add_speaker_tags(ai_models_infra_speakers, "ai-models-infra")

    # Embodied AI track
    embodied_ai_speakers = [
        "satya-mallick", "xueqin-dong", "edgar-riba", "mashengyue", "speaker-yin-yun-peng",
        "jinwei-gu", "speaker-wang-peng-wei", "xuan-xia", "cen-ming", "yu-huang",
        "xavier-tao", "tao-li", "martino-russi", "yuyuan-yuan", "jian-shi", "yongsen-mao"
    ]
    add_speaker_tags(embodied_ai_speakers, "embodied-ai")

    # Agentic Web track
    agentic_web_speakers = [
        "philippe-le-hegaret", "speaker-chang-gao-wei", "manuel-rego", "speaker-zhang-yun-fei",
        "joaquin-salvachua", "jennie-shi", "jesse-ezell", "zhigang-sun", "drummond-reed",
        "markus-sabadello", "chunhui-mo", "wenjing-chu", "jos-andrs-muoz-arcentales",
        "robin-shang", "martin-alvarez-espinar", "guangzhen-li"
    ]
    add_speaker_tags(agentic_web_speakers, "agentic-web")

    # Apps & Agents track
    apps_agents_speakers = [
        "speaker-wang-xin-meng", "speaker-di-ji-dong", "zhuo-wu", "wilson-wang",
        "yin-zhenxi", "shuangrui-chen", "hugejile", "evan-fannin", "yanzhi-wang",
        "speaker-liu-nan-bing", "speaker-han-hong-ying", "speaker-bai-ting",
        "xiang-ying", "sizhe-cheng", "alexy-khrabrov-", "zhao-weiqi", "zhiyu-li",
        "abdallah-essa", "dandjinou-charbel"
    ]
    add_speaker_tags(apps_agents_speakers, "apps-agents")

    # AI Next track
    ai_next_speakers = [
        "wang-jialiang", "speaker-wei-wei", "alexandra-boucherifi", "yichuan-yue",
        "huixin-xue", "jixun-yao", "zhenghao-chen", "salim-nahle", "wei-wang",
        "karol-stryja", "katarzyna-z-staroslawska", "speaker-shi-zhong-zhi", "nicolas-flores-herr", "jingbin-zhang",
        "kai-du", "qian-zheng", "hu-he", "speaker-zhang-quan-shi", "shiwei-liu"
    ]
    add_speaker_tags(ai_next_speakers, "ai-next")

    # Workshops
    # SGLang Workshop
    ws_sglang_speakers = [
        "yi-zhang", "shangming-cai-", "yanbo-yang", "junrong-lin", "yikai-zhu",
        "chao-wang", "yizhong-cao-", "xiaoming-bao", "speaker-wang-dong", "xiaolei-zhang"
    ]
    add_speaker_tags(ws_sglang_speakers, "ws-sglang")

    # Cangjie Workshop
    ws_cangjie_speakers = [
        "speaker-wang-xue-zhi", "speaker-zhao-dong", "speaker-pan-wan-kun",
        "speaker-zhang-yin", "wang-jianfeng", "speaker-chen-yu-long",
        "speaker-wu-jing-run", "speaker-zhang-hao-yang"
    ]
    add_speaker_tags(ws_cangjie_speakers, "ws-cangjie")

    # Dora Workshop
    ws_dora_speakers = [
        "ruping-cen", "yang-li", "yiming-zhang", "baorui-lv", "tao-li",
        "xiang-yang", "hu-youhao", "zhongjin-lu", "yijun-chen", "gege-wang", "bob-ding"
    ]
    add_speaker_tags(ws_dora_speakers, "ws-dora")

    # Future Web Workshop
    ws_future_web_speakers = [
        "ming-fu", "martin-robinson", "gregory-terzian", "jing-zhang",
        "zhizhen-ye", "jingshi-shangguan", "philippe-le-hegaret"
    ]
    add_speaker_tags(ws_future_web_speakers, "ws-future-web")

    # Edge AI Workshop
    ws_edge_ai_speakers = [
        "mats-lundgren", "zhuo-wu", "xuan-son-nguyen", "yanzhi-wang",
        "jingyua-huang", "weiyu-xie", "sebastien-crozet", "yue-bao", "markus-tavenrath"
    ]
    add_speaker_tags(ws_edge_ai_speakers, "ws-edge-ai")

    # CANN Workshop
    ws_cann_speakers = [
        "xiaolei-wang", "xu-han", "su-tong-hua", "jinxiang-wang"
    ]
    add_speaker_tags(ws_cann_speakers, "ws-cann")

    # AI Education Workshop
    ws_ai_education_speakers = [
        "yuegang-liu", "yuqing-yan", "maohua-zhou", "weidong-shao", "zhigang-sun",
        "haiyang-xin", "yan-feng", "yanzhi-wang", "yonghui-wu"
    ]
    add_speaker_tags(ws_ai_education_speakers, "ws-ai-education")

    # Embedded Rust Workshop
    ws_embedded_rust_speakers = [
        "rik-arends", "sebastian-michailidis"
    ]
    add_speaker_tags(ws_embedded_rust_speakers, "ws-embedded-rust")

    # Flutter Meetup
    ws_flutter_speakers = [
        "jesse-ezell", "matt-carroll"
    ]
    add_speaker_tags(ws_flutter_speakers, "ws-flutter")

    # React Native Workshop
    ws_rn_speakers = [
        "michal-pierzchala", "oskar-kwasniewski"
    ]
    add_speaker_tags(ws_rn_speakers, "ws-rn")

    # ChiTu Workshop
    ws_chitu_speakers = [
        "speaker-he-wan-qing", "shizhi-tang", "runqing-zhang", "jian-li",
        "ji-li", "tongyu-guo", "zhixing-li", "zhibin-jia", "xiaowei-shen"
    ]
    add_speaker_tags(ws_chitu_speakers, "ws-chitu")

    # Solana Workshop
    ws_solana_speakers = [
        "mike-ma-solana"
    ]
    add_speaker_tags(ws_solana_speakers, "ws-solana")

    # Globalization Workshop
    ws_globalization_speakers = [
        "guofeng-zhang", "william-guo", "richard-lin", "adina-yakefu",
        "michael-yuan", "qin-wang"
    ]
    add_speaker_tags(ws_globalization_speakers, "ws-globalization")

    # Co-located Events
    # AI Vision Forum
    forum_aivision_speakers = [
        "tao-jiang", "salim-nahle", "vivian-cai", "wei-wang", "bella-ren",
        "zheng-haoyun", "yuegang-liu", "zhigang-sun", "yuqing-yan", "wang-juchen",
        "alexandra-boucherifi", "yan-feng", "speaker-wei-wei", "maohua-zhou",
        "zhan-yiwen", "li-jianzhong", "yin-danqing", "zhao-simiao", "liu-qunkai",
        "kai-du", "nicolas-flores-herr", "kuang-kun", "florent-zara", "zhou-hui",
        "cailean-osborne", "jesse-mccrosky", "xiaohu-zhu", "christian-maitre",
        "wu-shaoqing", "abdallah-essa", "emily-chen", "mehdi-snene", "sameer-chauhan",
        "emily-bennett", "carlos-correia", "yonghua-lin", "qin-wang", "richard-bian",
        "piao-yishi", "bill-ren"
    ]
    add_speaker_tags(forum_aivision_speakers, "forum-aivision")

    # Open for SDG
    open_for_sdg_speakers = [
        "tiejun-huang", "mehdi-snene", "yonghua-lin", "nicolas-flores-herr",
        "joaquin-salvachua", "johann-diedrick", "richard-bian", "yong-qin",
        "bangxu-yu", "xinwei-hu", "anni-lai", "nooman-fehri", "vincent-caldeira",
        "matt-white", "liyun-yang", "alex-zhu", "alexy-khrabrov-", "minghui-zhou",
        "mohamed-farahat", "walid-mathlouthi", "yao-chen", "bryan-che", "kai-du",
        "satya-mallick", "yin-peng"
    ]
    add_speaker_tags(open_for_sdg_speakers, "open-for-sdg")

    # Rust China Conference (all rust-china events use "rustchinaconf" tag)
    # Rust China Plenary
    rust_china_plenary_speakers = [
        "mike-tang", "rebecca-rumbul", "meng-ke", "yizhou-lu", "jack-huey",
        "josh-triplett", "miguel-ojeda", "yongyi-yu", "rolland-dudemaine",
        "sebastien-crozet", "yu-chen", "michael-yuan"
    ]
    add_speaker_tags(rust_china_plenary_speakers, "rustchinaconf")

    # Rust China Track 1
    rust_china_1_speakers = [
        "james-munns", "adam-harvey", "zili-chen", "jindi-shen", "dean-little",
        "haobo-gu", "zhenchi-zhong", "hongbo-zhang", "yubin-zhao", "xiaoyu-chen",
        "xuecheng-yang", "zan-pan"
    ]
    add_speaker_tags(rust_china_1_speakers, "rustchinaconf")

    # Rust China Track 2
    rust_china_2_speakers = [
        "esteban-kuber", "jonathan-kelly", "isacc-zhang", "orhun-parmaksiz",
        "alejandra-gonzalez", "yuan-li", "jiayan-wu", "bohao-tang", "kevin-boos",
        "guillaume-gomez", "david-lattimore", "qiqi-zhang", "xudong-huang", "jiping-zhou"
    ]
    add_speaker_tags(rust_china_2_speakers, "rustchinaconf")

    # Rust China Track 3
    rust_china_3_speakers = [
        "hongliang-tian", "bart-massey", "li-zhang", "rik-arends", "han-jiang",
        "hui-ding", "manuel-drehwald", "zhifeng-sun", "xuewo-ding", "yifei-sheng",
        "lio-qing", "archer-aimo", "yuxiao-wang", "mingxuan-liu"
    ]
    add_speaker_tags(rust_china_3_speakers, "rustchinaconf")

    # Sort tags for each speaker for consistency
    for speaker in speaker_tags:
        speaker_tags[speaker].sort()

    return speaker_tags


def main():
    """Generate and display the speaker-to-event-tags mapping."""

    print("Generating speaker to event tags mapping...")
    print("=" * 50)

    # Create the mapping
    speaker_mapping = create_speaker_event_mapping()

    # Display statistics
    total_speakers = len(speaker_mapping)
    speakers_with_multiple_tags = sum(1 for tags in speaker_mapping.values() if len(tags) > 1)

    print(f"Total speakers: {total_speakers}")
    print(f"Speakers with multiple tags: {speakers_with_multiple_tags}")
    print(f"Speakers with single tag: {total_speakers - speakers_with_multiple_tags}")
    print()

    # Display the complete mapping
    print("Complete Speaker to Event Tags Mapping:")
    print("=" * 50)

    # Sort speakers alphabetically for better readability
    for speaker in sorted(speaker_mapping.keys()):
        tags = speaker_mapping[speaker]
        print(f"'{speaker}': {tags}")

    print("\n" + "=" * 50)
    print("Mapping generation complete!")

    # Return the mapping for programmatic use
    return speaker_mapping


if __name__ == "__main__":
    # Execute the script and get the mapping
    speaker_event_mapping = main()

    # The mapping is now available as 'speaker_event_mapping' variable
    # You can also access it programmatically by calling create_speaker_event_mapping()