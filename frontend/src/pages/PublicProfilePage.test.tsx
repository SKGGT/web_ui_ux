import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicProfilePage } from "./PublicProfilePage";
import { profileApi } from "../api/profiles";
import { makeUser } from "../test/testUtils";

jest.mock("../api/profiles", () => ({
  profileApi: {
    getById: jest.fn(),
  },
}));

const mockedProfileApi = jest.mocked(profileApi);

describe("PublicProfilePage", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("joined date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads and renders a public profile", async () => {
    mockedProfileApi.getById.mockResolvedValue(makeUser({ id: "user-2", name: "Alex Public" }));

    render(
      <MemoryRouter initialEntries={["/users/user-2"]}>
        <Routes>
          <Route path="/users/:id" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Alex Public" })).toBeInTheDocument();
    expect(mockedProfileApi.getById).toHaveBeenCalledWith("user-2");
  });
});
