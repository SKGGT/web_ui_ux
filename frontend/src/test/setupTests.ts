import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

Object.defineProperty(global, "TextEncoder", {
  value: TextEncoder,
  writable: true,
});

Object.defineProperty(global, "TextDecoder", {
  value: TextDecoder,
  writable: true,
});

afterEach(() => {
  jest.clearAllMocks();
});
