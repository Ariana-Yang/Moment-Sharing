# 测试基础设施指南

## 📦 安装测试依赖

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

## 🔧 配置说明

### vitest.config.ts
- 配置了测试环境为 jsdom（模拟浏览器环境）
- 设置了路径别名（@, @components, @hooks等）
- 配置了代码覆盖率报告
- 支持TypeScript和React

### src/tests/setup.ts
- 配置了全局测试环境
- Mock了IndexedDB（用于Dexie.js）
- Mock了crypto.randomUUID
- Mock了browser-image-compression

## 🚀 运行测试

### 运行所有测试
```bash
npm run test
```

### 运行测试并监听变化
```bash
npm run test:watch
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 运行测试并打开UI界面
```bash
npm run test:ui
```

## 📁 测试文件结构

```
src/tests/
├── setup.ts                    # 测试环境配置
├── unit/                       # 单元测试
│   ├── useMemories.test.ts     # Hook测试
│   └── AddButton.test.tsx      # 组件测试
├── integration/                # 集成测试（待补充）
└── mocks/                      # Mock数据（待补充）
```

## 📝 编写测试指南

### 单元测试示例

#### 1. 测试React Hook
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYourHook } from '@/hooks/useYourHook';

describe('useYourHook', () => {
  it('should perform action', async () => {
    const { result } = renderHook(() => useYourHook());

    await act(async () => {
      await result.current.someAction();
    });

    expect(result.current.value).toBe('expected');
  });
});
```

#### 2. 测试React组件
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockHandler = vi.fn();

    render(<YourComponent onClick={mockHandler} />);

    await user.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### 集成测试示例

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '@/App';

describe('Memory Management Flow', () => {
  it('should create, view, and delete memory', async () => {
    render(<App />);

    // 1. 登录
    await userEvent.type(screen.getByLabelText(/密码/i), 'test123');
    await userEvent.click(screen.getByRole('button', { name: /登录/i }));

    // 2. 创建记忆
    await userEvent.click(screen.getByRole('button', { name: /添加记忆/i }));
    await userEvent.upload(screen.getByLabelText(/上传图片/i), mockFile);
    await userEvent.click(screen.getByRole('button', { name: /保存/i }));

    // 3. 验证记忆创建
    await waitFor(() => {
      expect(screen.getByText('记忆已创建')).toBeInTheDocument();
    });

    // 4. 删除记忆
    await userEvent.click(screen.getByRole('button', { name: /删除/i }));
    await userEvent.click(screen.getByRole('button', { name: /确认/i }));

    // 5. 验证删除
    await waitFor(() => {
      expect(screen.queryByText('Test memory')).not.toBeInTheDocument();
    });
  });
});
```

## 🎯 测试覆盖目标

### 优先级P0（必须）
- [ ] 密码验证流程
- [ ] 记忆CRUD操作
- [ ] 图片上传和压缩
- [ ] 图片下载

### 优先级P1（重要）
- [ ] 时间轴筛选功能
- [ ] 分享模式配置
- [ ] 数据导出/导入
- [ ] 深色模式切换

### 优先级P2（次要）
- [ ] UI交互细节
- [ ] 边界情况处理
- [ ] 错误提示显示

## 🛠️ 常用测试工具

### Testing Library Queries
```typescript
// 按文本查找
screen.getByText('Hello')
screen.queryByText('Hello')  // 不存在时返回null
screen.findByText('Hello')   // 异步等待

// 按角色查找
screen.getByRole('button')
screen.getByRole('button', { name: /提交/i })

// 按label查找
screen.getByLabelText('用户名')

// 按testId查找
screen.getByTestId('submit-button')
```

### UserEvent（用户交互）
```typescript
const user = userEvent.setup();

// 点击
await user.click(element)

// 输入
await user.type(input, 'text')

// 上传
await user.upload(input, file)

// 悬停
await user.hover(element)
```

### Mock函数
```typescript
// 创建mock
const mockFn = vi.fn();

// 检查调用
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(3)

// Mock返回值
vi.fn().mockReturnValue('result')
vi.fn().mockResolvedValue('async result')

// Mock模块
vi.mock('@/db/db', () => ({
  db: {
    memories: {
      toArray: vi.fn(),
    },
  },
}));
```

## 📊 覆盖率目标

- **整体覆盖率**: > 80%
- **核心业务逻辑**: > 90%
- **组件渲染**: > 75%

### 查看覆盖率报告
```bash
npm run test:coverage
```

报告生成在 `coverage/index.html`，在浏览器中打开查看详细覆盖率。

## ⚠️ 注意事项

### 1. Mock IndexedDB
由于项目使用Dexie.js（基于IndexedDB），测试时需要Mock：
```typescript
vi.mock('@/db/db');
```

### 2. 异步操作
使用 `waitFor` 或 `findBy` 查询处理异步操作：
```typescript
await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument();
});
```

### 3. 清理副作用
每个测试后自动清理（配置在setup.ts中）：
```typescript
afterEach(() => {
  cleanup();
});
```

### 4. 时间相关测试
使用 `vi.useFakeTimers()` Mock时间：
```typescript
vi.useFakeTimers();
// ... 测试代码
vi.useRealTimers();
```

## 📚 参考资料

- [Vitest文档](https://vitest.dev/)
- [Testing Library文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library UserEvent](https://testing-library.com/docs/user-event/intro)
- [Dexie.js测试指南](https://dexie.org/docs/Testing/Testing-with-Dexie)

## 🚀 下一步

1. ✅ 安装测试依赖
2. ✅ 运行现有测试确保通过
3. ⏳ 为核心功能补充测试
4. ⏳ 达到80%覆盖率目标
5. ⏳ 建立CI/CD自动化测试
