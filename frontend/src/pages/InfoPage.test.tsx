import { render, screen } from "@testing-library/react";
import { InfoPage } from "./InfoPage";

describe("InfoPage", () => {
  it("explains the application purpose", () => {
    render(<InfoPage />);

    expect(screen.getByRole("heading", { name: "What This Site Does" })).toBeInTheDocument();
    expect(screen.getByText(/A simple forum where you can register/i)).toBeInTheDocument();
  });
});
