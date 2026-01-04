# Rally Point 🎯

> 智能汇合点推荐 - 让聚会不再为地点发愁

多个朋友从不同出发点去同一个城市游玩，需要先找一个"汇合点"。Rally Point 帮助你快速找到最佳汇合地点，兼顾效率与公平。

## ✨ 功能特性

- 🗺️ **多点位置输入** - 支持 2-6 个出发点
- 🚗 **灵活出行方式** - 自驾 / 公共交通 / 步行
- 🎯 **智能推荐** - 输出 2-3 种汇合方案
- 📊 **详细对比** - 每个方案包含推荐理由、优缺点
- 📍 **地图可视化** - 直观查看所有位置和方案

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
```

### 配置高德地图 Key

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app) 申请 Key
2. 创建应用，选择 **Web端(JS API)** 类型
3. 复制 `.env.example` 为 `.env.local`
4. 填入你的 API Key

```bash
cp .env.example .env.local
# 编辑 .env.local 填入 NEXT_PUBLIC_AMAP_KEY
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
rally-point/
├── app/                    # Next.js App Router
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 主页面
├── components/             # React 组件
│   ├── LocationInput.tsx   # 位置输入组件
│   ├── MapView.tsx         # 地图展示组件
│   └── PlanCard.tsx        # 方案卡片组件
├── lib/                    # 工具库
│   ├── algorithm.ts        # 汇合点推荐算法
│   └── map.ts              # 地图相关工具
├── types/                  # TypeScript 类型定义
│   └── index.ts
├── .env.example            # 环境变量示例
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **地图**: 高德地图 JS API
- **图标**: Lucide React

## 📐 核心算法

汇合点推荐基于以下因素：

1. **几何中心计算** - 所有出发点的地理中心
2. **时间估算** - 基于出行方式的预估耗时
3. **公平性评估** - 最小化各方时间差异
4. **综合评分** - 60% 效率 + 40% 公平性

## 🗺️ MVP 限制

当前为 MVP 版本，存在以下限制：

- ⚠️ 时间估算基于简化模型，非实时路况
- ⚠️ 地址搜索使用预设数据，非真实 API
- ⚠️ 不包含登录、历史记录等功能

## 📝 后续规划

- [ ] 接入真实地图路径规划 API
- [ ] 支持实时路况
- [ ] 添加地点类型偏好（商场/地铁站等）
- [ ] 方案分享链接
- [ ] 费用估算

## 📄 License

MIT

---

Made with ❤️ for better meetups


