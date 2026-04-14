# 哄哄模拟器 - 项目上下文

### 项目概述

哄哄模拟器是一个情侣互动游戏：AI 扮演生气的对象，用户通过选择题的方式在 10 轮内把对方哄好。

### 核心特性

- **动态对话生成**: 每轮对话和选项都由 LLM 实时生成，无预设题库
- **情绪化语音**: 使用 TTS 自动生成语音，体现情绪变化
- **趣味减分选项**: 包含搞笑、离谱的选项，增强分享欲
- **好感度系统**: 隐藏数值，通过进度条展示

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **项目理解加速**：初始可以依赖项目下`package.json`文件理解项目类型，如果没有或无法理解退化成阅读其他文件。
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。


## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**




### 游戏流程

```
开始界面 → 选择性别/场景/语音 → 游戏主界面 → 10轮互动 → 结束界面
```

### 核心文件说明

#### 类型定义
- `src/types/game.ts` - 游戏类型定义和常量
  - 性别、语音类型、场景、消息、选项等类型
  - 游戏状态接口
  - 预设场景列表和语音配置

#### 状态管理
- `src/context/GameContext.tsx` - 游戏状态管理
  - 使用 React Context API 管理全局状态
  - 提供游戏操作方法（开始、选择选项、重置等）

#### UI组件
- `src/components/StartScreen.tsx` - 开始界面
  - 性别选择、场景选择、语音选择
- `src/components/GameScreen.tsx` - 游戏主界面
  - 对话显示、选项选择、语音播放
- `src/components/GameOverScreen.tsx` - 结束界面
  - 成功/失败动画、结束对话、重玩按钮
- `src/components/AffectionBar.tsx` - 好感度进度条
- `src/components/LoadingAnimation.tsx` - 加载动画

#### API接口
- `src/app/api/chat/route.ts` - 对话生成接口
  - 使用 LLMClient 生成对话和选项
  - 根据好感度调整情绪
  - 生成包含搞笑选项的6个选项
- `src/app/api/tts/route.ts` - 语音合成接口
  - 使用 TTSClient 生成语音
  - 清理文本中的括号内容

### 好感度规则

- **初始值**: 20
- **范围**: -50 ~ 100
- **胜利条件**: 10轮内好感度 >= 80
- **失败条件**: 好感度 < -50 或 10轮用完好感度 < 80
- **展示**: 隐藏具体数值，只显示进度条

### 语音配置

**女声选项**:
- `zh_female_xiaohe_uranus_bigtts` - 温柔女声
- `zh_female_vv_uranus_bigtts` - 霸道御姐
- `saturn_zh_female_keainvsheng_tob` - 可爱软妹

**男声选项**:
- `zh_male_m191_uranus_bigtts` - 低沉男声
- `zh_male_taocheng_uranus_bigtts` - 温柔男声

### 关键实现要点

#### 闭包陷阱修复
- `startGame` 函数使用函数式更新从 `prev` 读取最新值
- 避免读取到旧的状态值

#### 语音更新问题修复
- 跟踪消息 ID，每轮生成新语音
- 使用 `currentAudioMessageId` 检测新消息
- 用户选择选项时重置语音状态

#### 防重复生成
- 使用 `isGeneratingRef` 跟踪生成状态
- 使用 `lastGeneratedStep` 避免重复生成同一轮

#### useEffect 依赖管理
- 精确控制依赖数组
- 对话生成依赖：step、currentOptions.length、gameOver
- 语音生成依赖：messages、voiceType、currentAudioMessageId

### 测试要点

1. **接口测试**:
   - `/api/chat` - 对话生成（需要 gender、scenario、messages、affection、step）
   - `/api/tts` - 语音合成（需要 text、speaker、uid）

2. **游戏流程测试**:
   - 开始界面选择后能正常进入游戏
   - 对话和选项能正常显示
   - 好感度变化正确
   - 语音能正常播放
   - 结束界面能正常显示

3. **边界情况**:
   - 好感度达到 -50 或 80 时游戏结束
   - 10轮用完后判定胜负
   - 网络错误时的降级处理
