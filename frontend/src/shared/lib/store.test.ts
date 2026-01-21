import { describe, it, expect, beforeEach } from "vitest";
import { usePopupStore } from "./store";
import { act } from "@testing-library/react";

describe("usePopupStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePopupStore.setState({ type: null, isOpen: false });
  });

  it("should have initial state with closed popup", () => {
    const state = usePopupStore.getState();
    expect(state.type).toBeNull();
    expect(state.isOpen).toBe(false);
  });

  it("should open logout popup", () => {
    const { openPopup } = usePopupStore.getState();

    act(() => {
      openPopup("logout");
    });

    const state = usePopupStore.getState();
    expect(state.type).toBe("logout");
    expect(state.isOpen).toBe(true);
  });

  it("should open deleteUser popup", () => {
    const { openPopup } = usePopupStore.getState();

    act(() => {
      openPopup("deleteUser");
    });

    const state = usePopupStore.getState();
    expect(state.type).toBe("deleteUser");
    expect(state.isOpen).toBe(true);
  });

  it("should close popup and reset type", () => {
    const { openPopup, closePopup } = usePopupStore.getState();

    act(() => {
      openPopup("logout");
    });

    expect(usePopupStore.getState().isOpen).toBe(true);

    act(() => {
      closePopup();
    });

    const state = usePopupStore.getState();
    expect(state.type).toBeNull();
    expect(state.isOpen).toBe(false);
  });

  it("should switch popup type when opening different popup", () => {
    const { openPopup } = usePopupStore.getState();

    act(() => {
      openPopup("logout");
    });

    expect(usePopupStore.getState().type).toBe("logout");

    act(() => {
      openPopup("deleteUser");
    });

    expect(usePopupStore.getState().type).toBe("deleteUser");
    expect(usePopupStore.getState().isOpen).toBe(true);
  });

  it("should handle opening with null type", () => {
    const { openPopup } = usePopupStore.getState();

    act(() => {
      openPopup(null);
    });

    const state = usePopupStore.getState();
    expect(state.type).toBeNull();
    expect(state.isOpen).toBe(true);
  });
});
