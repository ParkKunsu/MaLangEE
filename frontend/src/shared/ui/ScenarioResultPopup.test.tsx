import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenarioResultPopup, type ScenarioResult } from "./ScenarioResultPopup";

describe("ScenarioResultPopup", () => {
  let portalRoot: HTMLDivElement;

  beforeEach(() => {
    portalRoot = document.createElement("div");
    portalRoot.id = "portal-root";
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    document.body.removeChild(portalRoot);
  });

  const defaultScenarioResult: ScenarioResult = {
    place: "카페",
    conversationPartner: "바리스타",
    conversationGoal: "커피를 주문하고 대화하기",
  };

  it("should render with scenario result data", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("카페")).toBeInTheDocument();
    expect(screen.getByText("바리스타")).toBeInTheDocument();
    expect(screen.getByText("커피를 주문하고 대화하기")).toBeInTheDocument();
  });

  it("should render with default title and subtitle", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("좋아요! 상황을 파악했어요.")).toBeInTheDocument();
    expect(screen.getByText("연습할 시나리오 정보를 확인해주세요.")).toBeInTheDocument();
  });

  it("should render with custom title and subtitle", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
        title="커스텀 제목"
        subtitle="커스텀 부제목"
      />
    );

    expect(screen.getByText("커스텀 제목")).toBeInTheDocument();
    expect(screen.getByText("커스텀 부제목")).toBeInTheDocument();
  });

  it("should render with default button texts", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("다음단계")).toBeInTheDocument();
    expect(screen.getByText("주제 다시 정하기")).toBeInTheDocument();
  });

  it("should render with custom button texts", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
        confirmText="시작하기"
        cancelText="다시 선택"
      />
    );

    expect(screen.getByText("시작하기")).toBeInTheDocument();
    expect(screen.getByText("다시 선택")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText("다음단계"));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText("주제 다시 정하기"));

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("should display '알수없음' for missing place", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={{ conversationPartner: "파트너", conversationGoal: "목표" }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("알수없음")).toBeInTheDocument();
  });

  it("should display '알수없음' for missing conversationPartner", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={{ place: "장소", conversationGoal: "목표" }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("알수없음")).toBeInTheDocument();
  });

  it("should display '알수없음' for missing conversationGoal", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={{ place: "장소", conversationPartner: "파트너" }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("알수없음")).toBeInTheDocument();
  });

  it("should render labels for each scenario field", () => {
    render(
      <ScenarioResultPopup
        scenarioResult={defaultScenarioResult}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("연습 장소")).toBeInTheDocument();
    expect(screen.getByText("대화 상대")).toBeInTheDocument();
    expect(screen.getByText("나의 미션")).toBeInTheDocument();
  });
});
