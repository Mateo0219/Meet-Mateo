import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // These are UI regressions; isolate them from weather and storage availability.
  await page.route("**/api/weather", (route) => route.fulfill({ json: {
    temperature: 22, code: 3, isDay: true, label: "阴", icon: "cloud",
  } }));
  await page.route("**/api/moments", (route) => route.fulfill({ json: {
    moments: [{ id: "11111111-1111-1111-1111-111111111111", text: "测试动态", location: "北京", images: [], likes: 2, createdAt: "2026-01-01T00:00:00.000Z" }],
    owner: false, enabled: true, nextBefore: null,
  } }));
});

async function enter(page: Page, path = "/?skip=1") {
  await page.goto(path);
  await expect(page.locator('.world[data-loaded="true"]')).toBeVisible();
}

/** Jumps to a place with the minimap and interacts with it. */
async function visit(page: Page, name: string, hint: string) {
  await page.getByRole("button", { name: `去${name}（${hint}）` }).click();
  await expect(page.locator(".world-prompt")).toContainText(name);
  await page.keyboard.press("Space");
}

async function searchFragment(page: Page) {
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "搜索", exact: true }).fill("保持好奇");
  await page.getByRole("option").filter({ hasText: "碎片 · 生活" }).click();
}

test("the opening card asks the visitor to be Mateo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".world-card")).toContainText("今天换你来当我");
  await page.getByRole("button", { name: "开始这一天", exact: true }).click();
  await expect(page.locator(".world-card")).toHaveCount(0);
});

test("the arrow keys walk Mateo around", async ({ page }) => {
  await enter(page);
  const position = () => page.locator(".world-map-me").evaluate((el: HTMLElement) => parseFloat(el.style.left));
  await expect.poll(position).toBeGreaterThan(0);
  const before = await position();
  await page.keyboard.down("ArrowLeft");
  await expect.poll(position).toBeLessThan(before - 1);
  await page.keyboard.up("ArrowLeft");
});

test("visitors finish the day and can fly to Eshan and back", async ({ page }) => {
  await enter(page);
  await visit(page, "乒乓球场", "乒乓球");
  await expect(page.locator(".pingpong-app")).toBeVisible();
  await expect(page.locator(".world-todos li.is-done")).toContainText("打一局球");
  await page.getByRole("button", { name: "关闭乒乓球", exact: true }).click();
  await visit(page, "小机场", "我从哪来");
  await expect(page.locator(".world-badge")).toContainText("峨山");
  await expect(page.locator(".world-talk")).toContainText("我长大的地方");
  await page.locator(".world-talk").click();
  await page.locator(".world-talk").click();
  await visit(page, "回程", "飞回 Mateo 岛");
  await expect(page.locator(".world-badge")).toContainText("Mateo 岛");
});

test("football is gone from the site", async ({ page }) => {
  expect((await page.goto("/football"))?.status()).toBe(404);
  const llms = await (await page.request.get("/llms.txt")).text();
  expect(llms).not.toMatch(/足球|中场/);
});

test("the old addresses still lead to the island", async ({ page }) => {
  await page.goto("/world");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/moments");
  await expect(page.locator(".moments-app")).toContainText("测试动态");
});

test("visiting the room opens About again after reading another note", async ({ page }) => {
  await enter(page);
  await visit(page, "我的房间", "关于我");
  await expect(page.locator(".notes-document h1")).toHaveText("关于我");
  await page.locator(".notes-list").getByRole("button", { name: /这座岛怎么逛/ }).click();
  await expect(page.locator(".notes-document h1")).toHaveText("这座岛怎么逛");
  await page.getByRole("button", { name: "最小化备忘录", exact: true }).click();
  await visit(page, "我的房间", "关于我");
  await expect(page.locator(".notes-document h1")).toHaveText("关于我");
});

test("reopening the same Spotlight fragment restores its closed detail", async ({ page }) => {
  await enter(page);
  await searchFragment(page);
  await expect(page.locator(".fragment-detail > strong")).toHaveText("保持好奇");
  await page.locator(".fragment-detail").getByRole("button", { name: "关闭", exact: true }).click();
  await expect(page.locator(".fragment-detail")).toHaveCount(0);
  await searchFragment(page);
  await expect(page.locator(".fragment-detail > strong")).toHaveText("保持好奇");
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

test("minimized windows cannot capture focus, and reopening keeps their state", async ({ page }) => {
  await enter(page);
  await visit(page, "我的房间", "关于我");
  const frame = page.locator('.os-window-frame[aria-label="备忘录"]');
  const search = frame.getByRole("textbox", { name: "搜索备忘录" });
  await search.fill("乒乓");
  await page.getByRole("button", { name: "最小化备忘录", exact: true }).focus();
  await page.keyboard.press("Enter");
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    expect(await frame.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  }
  await page.locator(".world-canvas").click({ position: { x: 5, y: 500 } });
  await visit(page, "我的房间", "关于我");
  await expect(search).toHaveValue("乒乓");
});

test("mobile deep links open the destination and follow later hash changes", async ({ page }) => {
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
  await visit(page, "乒乓球场", "乒乓球");
  await expect(page.locator(".pingpong-app")).toBeVisible();
  await expect(page.locator(".fragments-app")).toHaveCount(0);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 800, height: 700 }, { width: 390, height: 844 }]) {
  test(`token candidates are visible and clickable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enter(page);
    await visit(page, "钟楼", "此刻");
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
  });
}

test("visitors can like but not post; ping pong serves and shows both tabs", async ({ page }) => {
  await page.route("**/api/moments/*/like", (route) => route.fulfill({ json: { likes: 3 } }));
  await enter(page, "/#moments");
  await expect(page.getByRole("button", { name: "发表动态" })).toHaveCount(0);
  const like = page.getByRole("button", { name: /点赞/ });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText("3");
  await page.getByRole("button", { name: "关闭朋友圈", exact: true }).click();

  await visit(page, "乒乓球场", "乒乓球");
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

test("the phone layout starts with the opening card and has no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "开始这一天", exact: true }).click();
  await expect(page.locator(".world-badge")).toContainText("Mateo 岛");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
