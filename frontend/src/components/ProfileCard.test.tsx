import { render, screen } from "@testing-library/react";
import { ProfileCard } from "./ProfileCard";
import { makeUser } from "../test/testUtils";

describe("ProfileCard", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("joined date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders profile information with friendly labels", () => {
    render(<ProfileCard profile={makeUser()} />);

    expect(screen.getByRole("heading", { name: "Taylor User" })).toBeInTheDocument();
    expect(screen.getByText("taylor@example.com")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();
    expect(screen.getByText("1995-07-04")).toBeInTheDocument();
    expect(screen.getByText("joined date")).toBeInTheDocument();
  });

  it("hides optional fields when the profile is anonymous", () => {
    render(
      <ProfileCard
        profile={makeUser({
          email: null,
          gender: null,
          birth_date: null,
        })}
      />,
    );

    expect(screen.getAllByText("Hidden")).toHaveLength(3);
  });
});
