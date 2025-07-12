# TypeScript React.useState 错误排查记录

## 问题描述
在工作目录下，TypeScript 报错：
```
TS2305: Module '"react"' has no exported member 'useState'.
```

但是相同的代码在测试环境中可以正常工作。

## 排查过程

### 1. 初始假设 - 依赖版本问题
- **怀疑**：TypeScript 版本或依赖包版本不一致
- **测试方法**：创建 `/test` 目录，逐步添加相同的依赖
- **结果**：测试环境使用相同版本的依赖包也能正常工作

### 2. TypeScript 版本兼容性问题
- **发现**：`@types/react` 18.3.23 有条件类型导出：
  ```json
  "typesVersions": {
    "<=5.0": {
      "*": ["ts5.0/*"]
    }
  }
  ```
- **问题**：TypeScript 4.9.5 被重定向到 `ts5.0/index.d.ts`，而 TypeScript 5.0+ 使用主 `index.d.ts`
- **尝试**：升级 TypeScript 到 5.x，但与 react-scripts 5.0.1 不兼容

### 3. 配置文件差异
- **对比**：tsconfig.json、package.json 等配置文件
- **结果**：配置基本相同，问题不在这里

### 4. 类型定义覆盖尝试
- **方法1**：修改 `@types/react/package.json` 的 `typesVersions`
- **方法2**：创建本地类型声明文件覆盖
- **方法3**：使用 tsconfig paths 映射
- **结果**：都未能解决问题

### 5. 根本原因发现
- **关键发现**：`src/types/styled-jsx.d.ts` 文件重新声明了整个 React 模块
- **问题代码**：
  ```typescript
  declare module "react" {
    interface HTMLAttributes<T> {
      jsx?: boolean;
      global?: boolean;
    }
  }
  ```
- **影响**：这个声明覆盖了原始的 React 类型定义，导致 `useState` 等函数丢失

## 解决方案

修改 `src/types/styled-jsx.d.ts`，添加 import 语句确保先导入原始类型：

```typescript
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}
```

## 关键知识点

### TypeScript 模块声明的影响
- `declare module "react"` 会**完全覆盖**原始模块的类型定义
- 正确做法是先 `import` 原始模块，再进行扩展
- 模块扩展应该是**增量的**，而不是**替换的**

### @types/react 的版本策略
- `@types/react` 18.3.23 为不同 TypeScript 版本提供不同的类型文件
- TypeScript ≤ 5.0 使用 `ts5.0/*` 目录下的类型
- TypeScript > 5.0 使用根目录的类型文件

### 排查思路
1. **隔离环境测试**：创建最小复现环境
2. **逐步对比**：版本、配置、代码结构
3. **深入源码**：检查类型定义文件
4. **关注覆盖**：寻找可能的类型声明冲突

## 经验教训

1. **模块扩展要谨慎**：确保不会意外覆盖原始类型
2. **测试环境很重要**：能快速定位问题范围
3. **版本兼容性复杂**：现代包管理中类型定义的条件导出增加了复杂性
4. **全局搜索有效**：应该更早检查项目中的 `.d.ts` 文件

## 预防措施

1. 编写类型扩展时，总是先导入原始模块
2. 定期检查项目中的自定义类型定义文件
3. 使用 TypeScript 的 `--traceResolution` 来调试模块解析问题
4. 建立测试环境来验证类型定义的正确性