# TypeScript React.useState 错误排查记录

## 问题描述

在工作目录下，TypeScript 报错：

```
TS2305: Module '"react"' has no exported member 'useState'.
```

但是相同的代码在测试环境中可以正常工作。

## 排查过程

### 1. 初始假设 - 依赖版本问题

-   **怀疑**：TypeScript 版本或依赖包版本不一致
-   **测试方法**：创建 `/test` 目录，逐步添加相同的依赖
-   **结果**：测试环境使用相同版本的依赖包也能正常工作

### 2. TypeScript 版本兼容性问题

-   **发现**：`@types/react` 18.3.23 有条件类型导出：
    ```json
    "typesVersions": {
      "<=5.0": {
        "*": ["ts5.0/*"]
      }
    }
    ```
-   **问题**：TypeScript 4.9.5 被重定向到 `ts5.0/index.d.ts`，而 TypeScript 5.0+ 使用主 `index.d.ts`
-   **尝试**：升级 TypeScript 到 5.x，但与 react-scripts 5.0.1 不兼容

### 3. 配置文件差异

-   **对比**：tsconfig.json、package.json 等配置文件
-   **结果**：配置基本相同，问题不在这里

### 4. 类型定义覆盖尝试

-   **方法 1**：修改 `@types/react/package.json` 的 `typesVersions`
-   **方法 2**：创建本地类型声明文件覆盖
-   **方法 3**：使用 tsconfig paths 映射
-   **结果**：都未能解决问题

### 5. 根本原因发现

-   **关键发现**：`src/types/styled-jsx.d.ts` 文件重新声明了整个 React 模块
-   **问题代码**：
    ```typescript
    declare module "react" {
    	interface HTMLAttributes<T> {
    		jsx?: boolean;
    		global?: boolean;
    	}
    }
    ```
-   **影响**：这个声明覆盖了原始的 React 类型定义，导致 `useState` 等函数丢失

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

-   `declare module "react"` 会**完全覆盖**原始模块的类型定义
-   正确做法是先 `import` 原始模块，再进行扩展
-   模块扩展应该是**增量的**，而不是**替换的**

### @types/react 的版本策略

-   `@types/react` 18.3.23 为不同 TypeScript 版本提供不同的类型文件
-   TypeScript ≤ 5.0 使用 `ts5.0/*` 目录下的类型
-   TypeScript > 5.0 使用根目录的类型文件

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

---

# API 服务实现与类型安全问题排查记录

## 项目背景

在为卡路里追踪应用实现前端 API 服务层时，遇到了 TypeScript 编译错误和类型安全问题。

## 遇到的问题

### 1. API 客户端类型转换问题

**问题描述**：

```typescript
TS2345: Argument of type 'FoodSearchParams' is not assignable to parameter of type 'Record<string, unknown>'.
Index signature for type 'string' is missing in type 'FoodSearchParams'.
```

**发生场景**：

-   在各个服务文件中调用 `apiClient.get()` 方法时
-   传递具体类型的参数对象（如 `FoodSearchParams`、`MealParams` 等）
-   TypeScript 严格模式下无法直接转换为 `Record<string, unknown>`

### 2. URL 重复拼接问题

**问题描述**：
API 请求生成了错误的 URL：`/api/v1/api/v1/test` 而不是 `/api/v1/test`

**根本原因**：

```typescript
// 错误的实现
async get<T>(endpoint: string, params?: Record<string, unknown>) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    // 问题：url.pathname 包含了 baseURL 的路径部分
    return this.request<T>(url.pathname + url.search, { method: "GET" });
}
```

### 3. 测试文件中的 undefined 访问问题

**问题描述**：

```typescript
TS18048: 'config' is possibly 'undefined'.
```

## 解决方案

### 1. 类型转换问题解决

使用双重类型断言确保类型安全：

```typescript
// 修复前
return apiClient.get<FoodSearchResult>("/foods/search", params);

// 修复后
return apiClient.get<FoodSearchResult>("/foods/search", params as unknown as Record<string, unknown>);
```

**原理说明**：

-   `as unknown` 先将类型擦除为 `unknown`
-   再 `as Record<string, unknown>` 进行目标类型转换
-   这是 TypeScript 中处理不兼容类型转换的安全方式

### 2. URL 拼接问题解决

重构 `get` 方法避免使用 `URL` 构造函数：

```typescript
// 修复后的实现
async get<T>(endpoint: string, params?: Record<string, unknown>) {
    let finalEndpoint = endpoint;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        finalEndpoint += `?${searchParams.toString()}`;
    }
    return this.request<T>(finalEndpoint, { method: "GET" });
}
```

### 3. 可选链操作符修复

```typescript
// 修复前
const formData = config.body as FormData;

// 修复后
const formData = config?.body as FormData;
```

## 技术细节与最佳实践

### 1. TypeScript 严格模式下的类型转换

-   **问题根源**：TypeScript 严格模式下，接口类型不能直接赋值给索引签名类型
-   **解决策略**：使用双重断言 `as unknown as TargetType`
-   **何时使用**：确定运行时类型兼容，但编译时类型检查过于严格的场景

### 2. API 客户端设计模式

-   **统一接口**：所有 HTTP 方法使用相同的参数格式
-   **类型安全**：保持泛型支持，确保返回值类型正确
-   **错误处理**：统一错误处理和日志记录
