import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { requireUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const { text, speaker, uid } = body;

    // 验证必要参数
    if (!text || !speaker || !uid) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 提取转发头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化TTS客户端
    const config = new Config({ timeout: 15000 }); // 15秒超时
    const client = new TTSClient(config, customHeaders);

    // 调用语音合成
    const response = await client.synthesize({
      uid,
      text,
      speaker,
      audioFormat: 'mp3',
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error in /api/tts:', error);
    
    // 降级方案：返回错误信息，但不影响游戏继续
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
