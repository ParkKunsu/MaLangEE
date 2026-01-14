import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className utility)", () => {
  it("merges class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;

    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty strings", () => {
    expect(cn("base", "", "end")).toBe("base end");
  });

  it("handles array of classes", () => {
    expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
  });

  it("handles object syntax", () => {
    expect(
      cn({
        active: true,
        disabled: false,
        selected: true,
      })
    ).toBe("active selected");
  });

  it("merges Tailwind classes correctly (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-white", "bg-black")).toBe("bg-black");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("px-2 py-4", "mt-2")).toBe("px-2 py-4 mt-2");
  });

  it("handles complex Tailwind conflicts", () => {
    expect(cn("p-4", "px-2")).toBe("p-4 px-2");
    expect(cn("px-4 py-2", "p-8")).toBe("p-8");
  });

  it("handles responsive modifiers", () => {
    expect(cn("text-sm", "md:text-base", "lg:text-lg")).toBe(
      "text-sm md:text-base lg:text-lg"
    );
  });

  it("handles state modifiers", () => {
    expect(cn("bg-white", "hover:bg-gray-100", "focus:bg-gray-200")).toBe(
      "bg-white hover:bg-gray-100 focus:bg-gray-200"
    );
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles mixed input types", () => {
    expect(
      cn(
        "base",
        ["arr1", "arr2"],
        { active: true },
        undefined,
        "end"
      )
    ).toBe("base arr1 arr2 active end");
  });
});
