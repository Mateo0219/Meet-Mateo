import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取歌词
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lrcUrl = searchParams.get('url');

    if (!lrcUrl) {
      return NextResponse.json(
        { error: '请提供歌词 URL' },
        { status: 400 }
      );
    }

    const response = await fetch(lrcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const lyrics = await response.text();

    return NextResponse.json({ lyrics });
  } catch (error: any) {
    console.error('获取歌词错误:', error);
    return NextResponse.json(
      { 
        error: '获取歌词失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

