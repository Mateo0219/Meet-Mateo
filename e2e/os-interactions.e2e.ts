import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // These are UI regressions; isolate them from music/weather provider availability.
  await page.route("**/api/weather", (route) => route.fulfill({ json: {
    temperature: 22, code: 3, isDay: true, label: "阴", icon: "cloud",
  } }));
  await page.route("**/api/moments", (route) => route.fulfill({ json: {
    moments: [{ id: "11111111-1111-1111-1111-111111111111", text: "测试动态", location: "北京", images: [], likes: 2, createdAt: "2026-01-01T00:00:00.000Z" }],
    owner: false, enabled: true, nextBefore: null,
  } }));
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
    ["/football", "打一局乒乓球", "乒乓球"],
  ]) {
    test(`${path} ${link} opens ${app} (${restored ? "restored" : "fresh"} session)`, async ({ page }) => {
      if (restored) await page.addInitScript(() => sessionStorage.setItem("mateo-os-unlocked", "1"));
      await page.goto(path);
      await page.getByRole("link", { name: link, exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/" && url.hash === (app === "乒乓球" ? "#pingpong" : "#fragments"));
      await expect(page.locator(`.os-window-frame[aria-label="${app}"]`)).toBeVisible();
    });
  }
}

test("minimized windows cannot capture focus, and restore remains usable", async ({ page }) => {
  await enter(page);
  const brand = page.getByRole("button", { name: "Mateo OS 菜单", exact: true });
  await menuApp(page, "备忘录");
  const frame = page.locator('.os-window-frame[aria-label="备忘录"]');
  const search = frame.getByRole("textbox", { name: "搜索备忘录" });
  await search.fill("足球");
  await page.getByRole("button", { name: "最小化备忘录", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(brand).toBeFocused();
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
  await page.evaluate(() => { location.hash = "pingpong"; });
  await expect(page.getByRole("dialog", { name: "乒乓球", exact: true })).toBeVisible();
});

test("a consumed deep link is not reopened on resize", async ({ page }) => {
  await enter(page, "/#fragments");
  await page.getByRole("button", { name: "关闭碎片", exact: true }).click();
  await expect(page.locator(".fragments-app")).toHaveCount(0);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.getByRole("navigation", { name: "程序坞" }).getByRole("button", { name: "乒乓球", exact: true }).click();
  await expect(page.locator(".pingpong-app")).toBeVisible();
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
  await expect(page.getByRole("heading", { name: /在北京 vibe coding、\s*打乒乓球、\s*听歌。/ })).toBeVisible();
  await expect(page.locator(".space-scene-art img")).toHaveCount(3);
  const dock = page.getByRole("navigation", { name: "程序坞" });
  for (const [title, selector, text] of [
    ["作品", ".projects-app h1", "把想法做成作品。"],
    ["乒乓球", ".pingpong-app", "打一局"],
    ["生活", ".moments-app", "测试动态"],
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

test("the Dock stays reachable above tall windows and toggles the front app", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 });
  await enter(page);
  await menuApp(page, "此刻");
  const dock = page.getByRole("navigation", { name: "程序坞" });
  const work = dock.getByRole("button", { name: "作品", exact: true });
  await work.click();
  await expect(page.locator(".projects-app")).toBeVisible();
  await work.click();
  await expect(page.locator('.os-window-frame[aria-label="作品"]')).toHaveClass(/is-minimized/);
});

test("Spotlight keeps the keyboard selection in view", async ({ page }) => {
  await enter(page);
  await page.keyboard.press("Control+k");
  for (let i = 0; i < 14; i++) await page.keyboard.press("ArrowDown");
  const inView = await page.locator('.spotlight-results li[aria-selected="true"]').evaluate((item) => {
    const list = item.parentElement!.getBoundingClientRect(), rect = item.getBoundingClientRect();
    return rect.top >= list.top && rect.bottom <= list.bottom;
  });
  expect(inView).toBe(true);
});

test("a locked session resumes a pending deep link on unlock", async ({ page }) => {
  await enter(page);
  await menuApp(page, "锁定屏幕");
  await page.evaluate(() => { location.hash = "pingpong"; });
  await expect(page.locator(".pingpong-app")).toHaveCount(0);
  await page.getByRole("button", { name: "进入", exact: true }).click();
  await expect(page.locator(".pingpong-app")).toBeVisible();
});

test("the mobile home scrolls through all scenes without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  for (const scene of ["Vibe Coding", "乒乓球", "生活碎片"]) {
    const art = page.getByRole("button", { name: `进入${scene}`, exact: true });
    await art.scrollIntoViewIfNeeded();
    await expect(art).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".space-intro").evaluate((el) => el.getBoundingClientRect().bottom < 0)).toBe(true);
  await page.getByRole("button", { name: "进入生活碎片", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "朋友圈", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "朋友圈", exact: true })).toHaveCount(0);
});

test("the old moments page redirects into the feed", async ({ page }) => {
  await page.goto("/moments");
  await expect(page.locator(".moments-app")).toContainText("测试动态");
});

test("visitors can like but not post; ping pong serves and shows both tabs", async ({ page }) => {
  await page.route("**/api/moments/*/like", (route) => route.fulfill({ json: { likes: 3 } }));
  await enter(page, "/#moments");
  await expect(page.getByRole("button", { name: "发表动态" })).toHaveCount(0);
  const like = page.getByRole("button", { name: /点赞/ });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText("3");

  await page.getByRole("navigation", { name: "程序坞" }).getByRole("button", { name: "乒乓球", exact: true }).click();
  const status = page.locator(".pp-status");
  await expect(status).toHaveText("点击球台发球");
  await page.locator(".pp-canvas").click();
  await expect(status).not.toHaveText("点击球台发球");
  await page.getByRole("button", { name: "我的球", exact: true }).click();
  await expect(page.locator(".pp-empty")).toContainText("打球的片段还在整理");
  await page.getByRole("button", { name: "去打一局", exact: true }).click();
  await expect(page.locator(".pp-canvas")).toBeVisible();
});

test("the owner sees the composer once signed in", async ({ page }) => {
  await page.route("**/api/moments", (route) => route.fulfill({ json: { moments: [], owner: true, enabled: true, nextBefore: null } }));
  await enter(page, "/#moments");
  await page.getByRole("button", { name: "发表动态" }).click();
  await page.getByRole("textbox", { name: "这一刻的想法" }).fill("你好");
  await expect(page.getByRole("button", { name: "发表", exact: true })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "发表动态" })).toHaveCount(0);
  await expect(page.locator(".moments-app")).toBeVisible();
});

test("visitors play as Mateo, finish the day and can fly to Eshan", async ({ page }) => {
  await page.goto("/world?skip=1");
  await expect(page.locator('.world[data-loaded="true"]')).toBeVisible();
  await page.getByRole("button", { name: "去乒乓球场（乒乓球）" }).click();
  await expect(page.locator(".world-prompt")).toContainText("乒乓球场");
  await page.keyboard.press("Space");
  await expect(page.locator(".pingpong-app")).toBeVisible();
  await expect(page.locator(".world-todos li.is-done")).toContainText("打一局球");
  await page.getByRole("button", { name: "关闭乒乓球", exact: true }).click();
  await page.getByRole("button", { name: "去小机场（我从哪来）" }).click();
  await page.keyboard.press("Space");
  await expect(page.locator(".world-badge")).toContainText("峨山");
  await expect(page.locator(".world-talk")).toContainText("我长大的地方");
});

test("the opening card asks the visitor to be Mateo", async ({ page }) => {
  await page.goto("/world");
  await expect(page.locator(".world-card")).toContainText("今天换你来当我");
  await page.getByRole("button", { name: "开始这一天", exact: true }).click();
  await expect(page.locator(".world-card")).toHaveCount(0);
});
