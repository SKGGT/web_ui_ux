import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CommentItem } from "./CommentItem";
import { makeComment } from "../test/testUtils";

describe("CommentItem", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a linked author when the comment is associated with a user", () => {
    render(
      <MemoryRouter>
        <CommentItem comment={makeComment()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Taylor User" })).toHaveAttribute("href", "/users/user-1");
    expect(screen.getByText("formatted date")).toBeInTheDocument();
    expect(screen.getByText("First comment")).toBeInTheDocument();
  });

  it("renders plain text when the comment author is anonymous", () => {
    render(
      <MemoryRouter>
        <CommentItem
          comment={makeComment({
            author: {
              display_name: "Anonymous",
              user_id: null,
            },
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anonymous" })).not.toBeInTheDocument();
  });
});
