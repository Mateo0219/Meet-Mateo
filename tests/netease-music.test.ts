import { describe, expect, it } from "vitest";
import { normalizeNeteasePlaylist } from "../lib/netease-music";

describe("normalizeNeteasePlaylist", () => {
  it("converts the NetEase playlist response into safe client tracks", () => {
    const tracks = normalizeNeteasePlaylist({
      result: {
        tracks: [
          {
            id: 2114161073,
            name: "湘江中路",
            artists: [{ name: "庄达菲" }],
            album: {
              picUrl:
                "http://p1.music.126.net/cover/109951169233488460.jpg",
            },
          },
        ],
      },
      code: 200,
    });

    expect(tracks).toEqual([
      {
        id: "2114161073",
        title: "湘江中路",
        author: "庄达菲",
        pic: "https://p1.music.126.net/cover/109951169233488460.jpg",
        url: "https://music.163.com/song/media/outer/url?id=2114161073.mp3",
      },
    ]);
  });

  it("drops malformed tracks instead of exposing incomplete data", () => {
    expect(
      normalizeNeteasePlaylist({
        result: {
          tracks: [{ id: "not-a-number", name: "坏数据" }],
        },
      })
    ).toEqual([]);
  });
});
