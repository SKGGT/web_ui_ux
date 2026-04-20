import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DiscussionCard } from "./DiscussionCard";
import { makeDiscussion } from "../test/testUtils";

describe("DiscussionCard", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders linked author information and metadata", () => {
    render(
      <MemoryRouter>
        <DiscussionCard discussion={makeDiscussion()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Launch plan" })).toHaveAttribute("href", "/discussions/discussion-1");
    expect(screen.getByRole("link", { name: "Taylor User" })).toHaveAttribute("href", "/users/user-1");
    expect(screen.getByText("Created: formatted date")).toBeInTheDocument();
    expect(screen.getByText("Last activity: formatted date")).toBeInTheDocument();
    expect(screen.getByText("Views: 42")).toBeInTheDocument();
    expect(screen.getByText("Comments: 3")).toBeInTheDocument();
  });

  it("renders plain text for anonymous authors and closed discussions", () => {
    render(
      <MemoryRouter>
        <DiscussionCard
          discussion={makeDiscussion({
            created_by: { display_name: "Anonymous", user_id: null },
            is_closed: true,
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Created by: Anonymous/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anonymous" })).not.toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
