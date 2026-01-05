import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// 每个测试后清理DOM
afterEach(() => {
  cleanup();
});

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
  databases: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
  },
});

// Mock ImageCompression
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}));

// 扩展 Vitest 的 expect matchers
expect.extend({});
