import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取歌曲播放链接
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: '请提供歌曲 URL' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 处理不同的响应格式
    // 可能是 { url: "..." } 或 { data: { url: "..." } } 或直接是字符串
    let playUrl = '';
    if (typeof data === 'string') {
      playUrl = data;
    } else if (data.url) {
      playUrl = data.url;
    } else if (data.data?.url) {
      playUrl = data.data.url;
    } else if (data.data && typeof data.data === 'string') {
      playUrl = data.data;
    }

    return NextResponse.json({ url: playUrl, raw: data });
  } catch (error: any) {
    console.error('获取播放链接错误:', error);
    return NextResponse.json(
      { 
        error: '获取播放链接失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

