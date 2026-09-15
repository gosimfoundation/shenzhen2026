# GOSIM Shenzhen 2026

## 讲师与日程：只维护两个文件

- `src/json/Speakers.json`：讲师的姓名、职位、简介、照片、分类标签和 CFP 姓名别名。
- `src/json/Schedule.json`：大会日期、分类、议题标题、简介、讲师关联与时间安排。

中英文放在同一条记录的 `{ "en": "...", "zh": "..." }` 字段中。所有页面通过 `src/utils/conference.ts` 按语言读取，不生成额外 JSON。直接修改这两个文件就是修改网站内容。

### 修改讲师

在 `Speakers.json` 的 `speakers` 数组中编辑或添加记录：

```json
{
  "id": "example-speaker",
  "name": { "en": "Example Speaker", "zh": "示例讲师" },
  "roleOrg": { "en": "Engineer, Example", "zh": "Example 工程师" },
  "bio": { "en": "Works on AI systems.", "zh": "从事 AI 系统研发。" },
  "image": "/images/speakers/confirmed/example-speaker.png",
  "tags": ["ws-vllm"],
  "socialLinks": {},
  "sourceNames": ["Example Speaker", "示例讲师"],
  "source": "invited",
  "draft": false
}
```

`sourceNames` 保存 CFP 导出里的姓名及历史别名，避免再次导入时出现重复讲师。照片放在 `public/images/speakers/confirmed/<id>.png`。未通过 CFP 投稿的受邀讲师也直接添加在这里。

### 修改日程或译文

在 `Schedule.json` 对应分类的 `talks` 数组中修改：

- `title.en` / `title.zh`：页面显示的标题。
- `overview.en` / `overview.zh`：页面显示的活动介绍。
- `speakers`：讲师 ID 数组，引用 Speakers.json，不复制讲师资料。
- `date`：例如 `2026-10-17`；`timeSlot`：例如 `13:40-14:10`。
- `room`：可选的 `{ "en": "Room A", "zh": "A 会场" }`。
- `draft`：未完成时设为 `true`；两种语言和关联讲师就绪后设为 `false`。
- `manual: true`：签到、茶歇等手工新增活动。

修改显示标题或姓名时保留 `slug`、`ref` 和讲师 `id`，保证链接稳定。`originalTitle` / `originalAbstract` 是 CFP 原稿，页面不把它们作为译文展示。

分类名称、分组和日期只在 Schedule.json 维护。分类 `id` 用于日程页面，`sourceId` 对应 CFP 分类及讲师 `tags`。

### 下次导入 CFP

```bash
npm run import-speakers -- /path/to/export.json --dry-run
npm run import-speakers -- /path/to/export.json
# 可选：同时准备新照片的编辑副本
npm run import-speakers -- /path/to/export.json /path/to/photos.zip
npm run build
```

导入会合并到现有两个文件，保留人工翻译、姓名与职位、讲师关联、分类、排期、顺序、手工活动和受邀讲师；不会因一次导出缺少某条记录而删除它。

新条目作为草稿加入，未翻译的字段留空，不会把中文直接复制进英文字段。直接在同一记录中补齐翻译，再设置 `draft: false` 发布。日程引用的讲师必须先完成翻译并发布。

导入结果会列出新增条目、CFP 原稿变化（`sourceChanges`）和讲师关联差异（`speakerAssignmentChanges`），便于人工复核。已有讲师的简介和职位不会被导出覆盖；如来源有更新，应对照导出手工修改。新增分类先在 Schedule.json 建立，取消议题或更换讲师也由人工明确处理。

## How to add Sponsors
1. Add data to JSON file at `src/json/Sponsors.json`
2. Add sponsor file name, such as `sponsor-name.png`
3. Add sponsor images as PNG / JPG / SVG files to `public/images/sponsors/`

Current build only has one category for sponsors. To add additional categories:
1. Update JSON file with additional category values to the "categories" (required) and "partners" sections of JSON file. We have created a JSON file "sponsors-original-for-reference" which shows how to set it up.

## How to add FAQ
1. Add data to JSON file at `src/json/FAQ.json`

## How to edit Markdown pages (Code of Conduct, Privacy, Workshop)
1. Edit the Markdown file at `src/markdown/`

## Header Notification bar
1. By default we have the notification bar active. If you want to remove the notification bar, go to Header.astro and change "const hasNotificationBar = true;" to false.

## 🚀 Project Structure

```text
/
├── public/
│   └── fonts
│   └── icons
│   └── images
│       └── speakers
│       └── sponsors
│   └── js
│   └── videos
├── src/
│   ├── layouts/
│   ├── components/
│   └── pages/
│   └── styles/
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Want to learn more?

Feel free to check [the Astro documentation](https://docs.astro.build).
