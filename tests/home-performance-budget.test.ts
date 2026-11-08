import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const cssRule = (css: string, selector: string) =>
  css.match(new RegExp(`${selector.replace(/\./g, "\\.")}\\s*\\{([^}]*)\\}`))?.[1];

describe("Mateo OS performance budget", () => {
  it("keeps the desktop free of an always-rendering WebGL runtime", () => {
    const packageJson = JSON.parse(projectFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty("three");
    expect(packageJson.devDependencies).not.toHaveProperty("@types/three");
  });

  it("never animates or filters the full-screen wallpaper", () => {
    const css = projectFile("app/os.css");

    for (const selector of [".os-wallpaper", ".wallpaper-sparkles"]) {
      const rule = cssRule(css, selector);
      expect(rule, selector).toBeDefined();
      expect(rule).not.toContain("animation:");
      expect(rule).not.toMatch(/filter:\s*blur/);
      expect(rule).not.toContain("backdrop-filter");
    }
  });

  it("drives window drags with motion values instead of React state", () => {
    const windowSource = projectFile("components/os/Window.tsx");

    expect(windowSource).toContain("setPointerCapture");
    expect(windowSource).not.toMatch(/onPointerMove=\{[^}]*dispatch/);
  });
});
