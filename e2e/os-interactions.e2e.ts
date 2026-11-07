import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // These are UI regressions; isolate them from music/weather provider availability.
  await page.route("**/api/music/playlist?*", (route) => route.fulfill({ json: {
    name: "测试歌单", trackCount: 1,
    tracks: [{ id: "123", title: "测试歌曲", author: "测试歌手", pic: "https://example.com/cover.png", url: "https://example.com/audio.mp3" }],
  } }));
  await page.route("**/api/weather", (route) => route.fulfill({ json: {
    temperature: 22, code: 3, isDay: true, label: "阴", icon: "cloud",
  } }));
  await page.route("**/api/music/lyrics?*", (route) => route.fulfill({ json: { lyrics: "" } }));
  await page.route("https://example.com/**", (route) => route.abort());
});

async function enter(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator('.os[data-ready="true"]')).toBeVisible();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
}

async function menuApp(page: Page, name: string) {
  await page.getByRole("button", { name: "Mateo OS 菜单", exact: true }).click();
  await page.locator(".space-menu").getByRole("button", { name, exact: true }).first().click();
}

async function searchFragment(page: Page) {
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "搜索", exact: true }).fill("中场");
  await page.getByRole("option").filter({ hasText: "碎片 · 运动" }).click();
}

test("explicitly opening the same note works after local selection; ordinary restore preserves selection", async ({ page }) => {
  await enter(page);
  const file = page.getByRole("button", { name: "关于", exact: true });
  await file.click();
  await expect(page.locator(".notes-document h1")).toHaveText("关于我");
  await page.locator(".notes-list").getByRole("button", { name: /我为什么喜欢踢球/ }).click();
  await page.getByRole("button", { name: "最小化备忘录", exact: true }).click();
  await menuApp(page, "备忘录");
  await expect(page.locator(".notes-document h1")).toHaveText("我为什么喜欢踢球");
  await file.click();
  await expect(page.locator(".notes-document h1")).toHaveText("关于我");
});

test("reopening the same Spotlight fragment restores its closed detail", async ({ page }) => {
  await enter(page);
  await searchFragment(page);
  await expect(page.locator(".fragment-detail > strong")).toHaveText("中场");
  await page.locator(".fragment-detail").getByRole("button", { name: "关闭", exact: true }).click();
  await expect(page.locator(".fragment-detail")).toHaveCount(0);
  await searchFragment(page);
  await expect(page.locator(".fragment-detail > strong")).toHaveText("中场");
});

for (const restored of [false, true]) {
  for (const [path, link, app] of [
    ["/football", "回到碎片", "碎片"],
    ["/football", "回去听歌", "音乐"],
    ["/moments", "回到碎片", "碎片"],
  ]) {
    test(`${path} ${link} opens ${app} (${restored ? "restored" : "fresh"} session)`, async ({ page }) => {
      if (restored) await page.addInitScript(() => sessionStorage.setItem("mateo-os-unlocked", "1"));
      await page.goto(path);
      await page.getByRole("link", { name: link, exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/" && url.hash === (app === "音乐" ? "#listen" : "#fragments"));
      await expect(page.locator(`.os-window-frame[aria-label="${app}"]`)).toBeVisible();
      if (app === "音乐") expect(await page.locator("audio").getAttribute("src")).toBeNull();
    });
  }
}

test("minimized windows cannot capture focus, and restore remains usable", async ({ page }) => {
  await enter(page);
  const dock = page.getByRole("navigation", { name: "程序坞" });
  await dock.getByRole("button", { name: "乒乓球", exact: true }).click();
  const frame = page.locator('.os-window-frame[aria-label="备忘录"]');
  const search = frame.getByRole("textbox", { name: "搜索备忘录" });
  await search.fill("足球");
  await page.getByRole("button", { name: "最小化备忘录", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(dock.getByRole("button", { name: "乒乓球", exact: true })).toBeFocused();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    expect(await frame.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  }
  await frame.locator("input").evaluate((el: HTMLInputElement) => el.focus());
  expect(await frame.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  await menuApp(page, "备忘录");
  await search.focus();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("足球");
});

test("mobile deep links open the destination and follow subsequent hash navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, "/#fragments");
  await expect(page.getByRole("dialog", { name: "碎片", exact: true })).toBeVisible();
  await page.evaluate(() => { location.hash = "listen"; });
  await expect(page.getByRole("dialog", { name: "音乐", exact: true })).toBeVisible();
  expect(await page.locator("audio").getAttribute("src")).toBeNull();
});

test("a consumed deep link is not reopened on resize", async ({ page }) => {
  await enter(page, "/#fragments");
  await page.getByRole("button", { name: "关闭碎片", exact: true }).click();
  await expect(page.locator(".fragments-app")).toHaveCount(0);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.getByRole("navigation", { name: "程序坞" }).getByRole("button", { name: "乒乓球", exact: true }).click();
  await expect(page.locator(".notes-app")).toBeVisible();
  await expect(page.locator(".fragments-app")).toHaveCount(0);
});

test("minimizing an app outside the Dock returns focus to the system menu", async ({ page }) => {
  await enter(page);
  await menuApp(page, "llms.txt");
  await page.getByRole("button", { name: "最小化llms.txt", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Mateo OS 菜单", exact: true })).toBeFocused();
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 800, height: 700 }, { width: 390, height: 844 }]) {
  test(`token candidates are visible and clickable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enter(page);
    await menuApp(page, "此刻");
    const token = page.locator(".token-sampled").last();
    await token.click();
    const popup = page.getByRole("dialog", { name: "候选词", exact: true });
    const option = popup.getByRole("button").last();
    // Hit testing catches ancestor clipping, which toBeVisible alone does not.
    await expect.poll(() => option.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await option.click();
    await expect(token).toContainText("下一次尝试");
    await expect(popup).toHaveCount(0);
    await token.click();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(token).toBeFocused();
    if (viewport.width > 760) {
      await token.click();
      await page.keyboard.press("Control+k");
      await expect(page.getByRole("dialog", { name: "Spotlight 搜索" })).toBeVisible();
      await expect(popup).toHaveCount(0);
    }
  });
}

test("the spatial home connects each scene and keeps overview navigation reversible", async ({ page }) => {
  await enter(page);
  await expect(page.getByRole("heading", { name: /在上海写代码、\s*打乒乓球、\s*听歌。/ })).toBeVisible();
  await expect(page.locator(".space-scene-art img")).toHaveCount(4);
  expect(await page.locator("audio").count()).toBe(0);
  const dock = page.getByRole("navigation", { name: "程序坞" });
  for (const [title, selector, text] of [
    ["作品", ".projects-app h1", "把想法做成作品。"],
    ["乒乓球", ".notes-document h1", "乒乓"],
    ["生活", ".fragments-app", "20 个碎片"],
  ]) {
    await dock.getByRole("button", { name: title, exact: true }).click();
    await expect(page.locator(selector)).toContainText(text);
    await dock.getByRole("button", { name: "总览", exact: true }).click();
    await expect(page.locator(".os-window-frame:not(.is-minimized)")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "放大画布", exact: true }).click();
  await expect(page.getByRole("button", { name: "重置画布", exact: true })).toHaveText("110%");
  const before = await page.locator(".space-wordmark").boundingBox();
  await page.mouse.move(720, 500);
  await page.mouse.down();
  await page.mouse.move(820, 545, { steps: 8 });
  await page.mouse.up();
  const after = await page.locator(".space-wordmark").boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x + 50);
  await expect(page.locator(".os-window-frame:not(.is-minimized)")).toHaveCount(0);
  await page.getByRole("button", { name: "重置画布", exact: true }).click();
  await expect(page.getByRole("button", { name: "重置画布", exact: true })).toHaveText("100%");
});

test("a locked session resumes a pending deep link on unlock", async ({ page }) => {
  await enter(page);
  await menuApp(page, "锁定屏幕");
  await page.evaluate(() => { location.hash = "listen"; });
  await expect(page.locator(".music-app")).toHaveCount(0);
  await page.getByRole("button", { name: "进入", exact: true }).click();
  await expect(page.locator(".music-app")).toBeVisible();
});

test("the mobile home scrolls through all scenes without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  for (const scene of ["代码与产品", "乒乓球", "音乐", "生活碎片"]) {
    const art = page.getByRole("button", { name: `进入${scene}`, exact: true });
    await art.scrollIntoViewIfNeeded();
    await expect(art).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".space-intro").evaluate((el) => el.getBoundingClientRect().bottom < 0)).toBe(true);
  await page.getByRole("button", { name: "进入生活碎片", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "碎片", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "碎片", exact: true })).toHaveCount(0);
});

test("the mini player controls the actual audio while its window is minimized", async ({ page }) => {
  // A valid local WAV gives the real media element deterministic playback.
  const samples = 8000 * 12;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(samples * 2, 40);
  await page.route("https://example.com/audio.mp3", (route) => route.fulfill({ body: wav, contentType: "audio/wav" }));
  await enter(page);
  await page.getByRole("button", { name: "播放音乐", exact: true }).click();
  await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => !audio.paused && audio.currentTime > 0)).toBe(true);
  await page.getByRole("button", { name: "最小化音乐", exact: true }).click();
  await page.getByRole("button", { name: "暂停音乐", exact: true }).click();
  await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.getByRole("button", { name: "播放音乐", exact: true }).click();
  await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true);
  await page.getByRole("navigation", { name: "程序坞" }).getByRole("button", { name: "音乐", exact: true }).click();
  await page.getByRole("button", { name: "关闭音乐", exact: true }).click();
  await expect(page.locator("audio")).toHaveCount(0);
  await page.getByRole("navigation", { name: "程序坞" }).getByRole("button", { name: "音乐", exact: true }).click();
  await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused && !audio.getAttribute("src"))).toBe(true);
});
