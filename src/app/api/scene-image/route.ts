import { NextRequest, NextResponse } from 'next/server';

const ARK_IMAGE_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const ARK_IMAGE_MODEL = 'doubao-seedream-5-0-260128';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, scenario, voiceType } = body as {
      gender?: 'female' | 'male';
      scenario?: { title?: string; description?: string };
      voiceType?: string;
    };

    if (!gender || !scenario?.title || !voiceType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const authorization = getArkAuthorizationHeader(process.env.ARK_API_KEY);
    if (!authorization) {
      return NextResponse.json(
        { error: 'ARK_API_KEY is missing' },
        { status: 500 }
      );
    }

    const prompt = buildSceneImagePrompt({
      gender,
      scenarioTitle: scenario.title,
      scenarioDescription: scenario.description ?? '',
      voiceType,
    });

    const response = await fetch(ARK_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({
        model: ARK_IMAGE_MODEL,
        prompt,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from Ark image API:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate scene image' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const imageUrl = extractImageUrl(data);

    if (!imageUrl) {
      console.error('Unexpected Ark image response:', data);
      return NextResponse.json(
        { error: 'Image URL missing in response' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl,
      prompt,
    });
  } catch (error) {
    console.error('Error in /api/scene-image:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene image' },
      { status: 500 }
    );
  }
}

function getArkAuthorizationHeader(apiKey?: string) {
  if (!apiKey) {
    return '';
  }

  return apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
}

function buildSceneImagePrompt({
  gender,
  scenarioTitle,
  scenarioDescription,
  voiceType,
}: {
  gender: 'female' | 'male';
  scenarioTitle: string;
  scenarioDescription: string;
  voiceType: string;
}) {
  const partnerDescription = gender === 'female' ? '年轻女生' : '年轻男生';
  const voiceStyle = getVoiceStyle(voiceType);

  return [
    `恋爱互动游戏场景插画，主角是一个${partnerDescription}，正在经历“${scenarioTitle}”的情绪瞬间。`,
    `场景背景：${scenarioDescription}。`,
    `人物气质与声音感觉：${voiceStyle}。`,
    '画面要求人物半身到全身构图，表情委屈又生气，带一点戏剧化张力。',
    '风格精致唯美，电影感光影，真实细腻，色彩层次丰富，具有恋爱游戏封面质感。',
    '构图适合作为聊天界面顶部横幅，主体清晰，背景有环境细节但不要过度杂乱。',
    '不要文字，不要对话框，不要水印说明。',
  ].join(' ');
}

function getVoiceStyle(voiceType: string) {
  switch (voiceType) {
    case 'gentle-female':
      return '温柔细腻，眼神柔软但带委屈';
    case 'cool-female':
      return '高冷强势，压着情绪，气场明显';
    case 'cute-female':
      return '可爱灵动，带撒娇感和一点鼻音委屈';
    case 'deep-male':
      return '低沉克制，情绪压抑，带一点失落';
    case 'gentle-male':
      return '温柔隐忍，表面冷静但眼神受伤';
    default:
      return '情绪鲜明，适合恋爱剧情演出';
  }
}

function extractImageUrl(data: unknown) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const payload = data as {
    data?: Array<{ url?: string }>;
  };

  return payload.data?.[0]?.url ?? '';
}
