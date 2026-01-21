import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

describe("Card Components", () => {
  describe("Card", () => {
    it("should render children", () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should have correct display name", () => {
      expect(Card.displayName).toBe("Card");
    });
  });

  describe("CardHeader", () => {
    it("should render children", () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CardHeader className="custom-header">Content</CardHeader>
      );
      expect(container.firstChild).toHaveClass("custom-header");
    });

    it("should have correct display name", () => {
      expect(CardHeader.displayName).toBe("CardHeader");
    });
  });

  describe("CardTitle", () => {
    it("should render as h3", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveTextContent("Title");
    });

    it("should apply custom className", () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveClass("custom-title");
    });

    it("should have correct display name", () => {
      expect(CardTitle.displayName).toBe("CardTitle");
    });
  });

  describe("CardDescription", () => {
    it("should render children", () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CardDescription className="custom-desc">Description</CardDescription>
      );
      expect(container.firstChild).toHaveClass("custom-desc");
    });

    it("should have correct display name", () => {
      expect(CardDescription.displayName).toBe("CardDescription");
    });
  });

  describe("CardContent", () => {
    it("should render children", () => {
      render(<CardContent>Content Area</CardContent>);
      expect(screen.getByText("Content Area")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      expect(container.firstChild).toHaveClass("custom-content");
    });

    it("should have correct display name", () => {
      expect(CardContent.displayName).toBe("CardContent");
    });
  });

  describe("CardFooter", () => {
    it("should render children", () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveClass("custom-footer");
    });

    it("should have correct display name", () => {
      expect(CardFooter.displayName).toBe("CardFooter");
    });
  });

  describe("Composed Card", () => {
    it("should render all components together", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Footer actions</CardFooter>
        </Card>
      );

      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Test Card");
      expect(screen.getByText("This is a test card")).toBeInTheDocument();
      expect(screen.getByText("Main content here")).toBeInTheDocument();
      expect(screen.getByText("Footer actions")).toBeInTheDocument();
    });
  });
});
