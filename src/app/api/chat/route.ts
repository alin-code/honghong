import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, scenario, messages, affection, step, isGameOver, won } = body;

    // 验证必要参数
    if (!gender || !scenario) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 提取转发头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化LLM客户端
    const config = new Config({ timeout: 30000 }); // 30秒超时
    const client = new LLMClient(config, customHeaders);

    // 构建对话历史（包含所有消息）
    const chatHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'partner' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // 根据好感度确定情绪状态
    let emotionState = '';
    if (affection < 0) {
      emotionState = '非常生气，可能会冷暴力或激烈质问';
    } else if (affection < 30) {
      emotionState = '还在生气，但愿意听对方说';
    } else if (affection < 60) {
      emotionState = '开始软化，嘴上生气但语气缓和';
    } else if (affection < 80) {
      emotionState = '快被哄好了，可能撒娇或小声说"哼"';
    } else {
      emotionState = '原谅了，但要求对方保证不再犯';
    }

    // 游戏结束时的prompt
    if (isGameOver) {
      const systemPrompt = `你是一个${gender === 'male' ? '男生' : '女生'}，正在和对象玩"哄哄模拟器"游戏。
场景：${scenario}
当前好感度：${affection}
游戏结果：${won ? '成功通关' : '通关失败'}

${won ? '对方成功把你哄好了，你需要说一句甜蜜的结束语，表示原谅和开心。可以撒娇、表达爱意，语气要温柔甜蜜。' : '对方没能把你哄好，你需要说一句绝情的结束语，表示失望和需要时间冷静。语气要冷淡但不要太过分。'}

要求：
- 不要超过50个字
- 可以包含括号里的动作描述，如(开心地笑)、(叹气)等
- 不要使用任何markdown格式
- 直接输出对话内容，不要加引号或其他标记`;

      const messages_ = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: '[游戏结束，请说结束语]' },
      ];

      const response = await client.invoke(messages_, { temperature: 0.9 });
      
      return NextResponse.json({
        partnerMessage: response.content,
        options: [],
      });
    }

    // 正常游戏轮次的prompt
    const systemPrompt = `你是一个${gender === 'male' ? '男生' : '女生'}，正在和对象玩"哄哄模拟器"游戏。
场景：${scenario}
当前轮次：第${step}轮，共10轮
当前好感度：${affection}（范围：-50到100，目标：80+）
当前情绪状态：${emotionState}

游戏规则：
1. 你需要根据对方的回答调整好感度
2. 每轮你需要说一句话，并提供6个选项供对方选择
3. 选项中要包含2个加分选项（+5到+20）和4个减分选项（-5到-30）
4. 减分选项中要有2-3个奇葩搞笑选项，离谱到好笑
5. 选项顺序要随机打乱

对话要求：
- 根据当前好感度调整语气和情绪
- 不要重复之前说过的话
- 可以包含括号里的动作描述，如(跺脚)、(撇嘴)等
- 不要使用任何markdown格式
- 直接输出对话内容，不要加引号或其他标记

选项格式（严格按照JSON数组格式）：
[
  {"id": "1", "content": "选项内容1", "score": 分数},
  {"id": "2", "content": "选项内容2", "score": 分数},
  ...
]

现在请输出你的回复和6个选项。回复内容单独一行，选项数组单独一行（用JSON标记包裹）。`;

    const messages_ = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
    ];

    // 如果是第一轮，添加初始提示
    if (step === 1 && chatHistory.length === 0) {
      messages_.push({
        role: 'user',
        content: '游戏开始，请生气地质问我为什么犯了这样的错误。',
      });
    }

    const response = await client.invoke(messages_, { temperature: 0.9 });
    
    // 解析回复，提取对话和选项
    const content = response.content;
    let { partnerMessage, options } = parseChatResponse(content);

    // 如果没有找到选项，使用整个回复作为对话，生成默认选项
    if (options.length === 0) {
      partnerMessage = sanitizePartnerMessage(content);
      options = generateDefaultOptions();
    }

    // 验证选项数量
    if (!isValidOptions(options) || options.length !== 6) {
      options = generateDefaultOptions();
    }

    return NextResponse.json({
      partnerMessage: partnerMessage || '哼，你怎么不说话了？',
      options,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    
    // 降级方案：返回默认对话和选项
    return NextResponse.json({
      partnerMessage: '哼，你怎么这么笨，连话都不会说了！',
      options: generateDefaultOptions(),
    });
  }
}

// 生成默认选项
function generateDefaultOptions() {
  return [
    { id: '1', content: '对不起，我错了', score: 10 },
    { id: '2', content: '我马上改，给我一个机会', score: 15 },
    { id: '3', content: '别生气了嘛', score: 5 },
    { id: '4', content: '你管我', score: -20 },
    { id: '5', content: '我懒得理你', score: -15 },
    { id: '6', content: '能不能别这么作', score: -25 },
  ];
}

function parseChatResponse(content: string) {
  const normalizedContent = content.replace(/```json\s*/gi, '```').trim();
  const arrayText = extractLastJsonArray(normalizedContent);

  if (!arrayText) {
    return {
      partnerMessage: '',
      options: [] as Array<{ id: string; content: string; score: number }>,
    };
  }

  try {
    const parsed = JSON.parse(arrayText);

    if (!isValidOptions(parsed)) {
      return {
        partnerMessage: '',
        options: [] as Array<{ id: string; content: string; score: number }>,
      };
    }

    const partnerMessage = sanitizePartnerMessage(
      normalizedContent.replace(arrayText, '').replace(/```/g, '').trim()
    );

    return {
      partnerMessage,
      options: parsed,
    };
  } catch (error) {
    console.error('Failed to parse options:', error);
    return {
      partnerMessage: '',
      options: [] as Array<{ id: string; content: string; score: number }>,
    };
  }
}

function extractLastJsonArray(content: string) {
  let depth = 0;
  let start = -1;
  let inString = false;
  let isEscaped = false;
  let lastArray = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      if (depth === 0) {
        start = i;
      }
      depth++;
      continue;
    }

    if (char === ']') {
      if (depth === 0) {
        continue;
      }

      depth--;
      if (depth === 0 && start !== -1) {
        lastArray = content.slice(start, i + 1);
        start = -1;
      }
    }
  }

  return lastArray;
}

function sanitizePartnerMessage(content: string) {
  return content
    .replace(/```/g, '')
    .replace(/^回复内容[:：]\s*/gm, '')
    .replace(/^选项[:：]\s*/gm, '')
    .trim();
}

function isValidOptions(options: unknown): options is Array<{ id: string; content: string; score: number }> {
  if (!Array.isArray(options)) {
    return false;
  }

  return options.every((option) => {
    return (
      typeof option === 'object' &&
      option !== null &&
      typeof option.id === 'string' &&
      typeof option.content === 'string' &&
      typeof option.score === 'number'
    );
  });
}
