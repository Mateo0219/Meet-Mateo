import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取庄达菲歌单列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playlistId = searchParams.get('id') || '13049743731'; // 默认歌单 ID

    const apiUrl = `https://music.api.randallanjie.com/api?server=netease&type=playlist&id=${playlistId}&auth=undefined&r=${Math.random()}`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('获取歌单错误:', error);
    return NextResponse.json(
      { 
        error: '获取歌单失败',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

