# SlotMachine 组件技术实现详解

## 📖 目录

- [组件概述](#组件概述)
- [核心原理](#核心原理)
- [实现细节](#实现细节)
- [动画演示](#动画演示)
- [关键代码注释](#关键代码注释)
- [常见问题](#常见问题)

---

## 组件概述

SlotMachine（老虎机）是一个经典的抽奖组件，通过多个滚筒列的滚动动画来展示中奖结果。本文档将深入讲解其核心实现原理。

### 核心特性

- ✅ **无限滚动效果**：通过列表复制实现视觉上的无限滚动
- ✅ **两段式动画**：平滑滚动 + 瞬间复位，支持可重复抽奖
- ✅ **依次启动**：多列滚筒错峰启动，增强视觉效果
- ✅ **精确控制**：可指定每列停止的精确位置
- ✅ **防重入保护**：避免动画进行中重复触发

---

## 核心原理

### 1. 无限滚动的实现

老虎机需要营造"一直在滚动"的视觉效果，但实际上列表是有限的。解决方案是**将奖品列表复制多次**。

```javascript
// 计算扩展后的奖品列表
const expandedList = computed(() => {
  let result = []
  // 默认复制 4 次
  for (let i = 0; i < props.concatCount; i++) {
    result = result.concat(props.list)
  }
  return result
})
```

**示意图：**

```
原始列表（3个奖品）:
[奖品A, 奖品B, 奖品C]

复制4次后：
[奖品A, 奖品B, 奖品C,  ← 第1组
 奖品A, 奖品B, 奖品C,  ← 第2组
 奖品A, 奖品B, 奖品C,  ← 第3组
 奖品A, 奖品B, 奖品C]  ← 第4组
```

### 2. 两段式滚动动画

这是整个组件最核心的设计！通过两段式滚动实现可重复抽奖。

#### 🎬 动画分解演示

```
初始状态（定位在底部）：
┌─────────┐
│         │ ← 可视区域（只显示这一部分）
│  奖品C  │
│         │
└─────────┘
    ↑
  奖品B
  奖品A
  奖品C   ← 第3组
  奖品B
  奖品A
  奖品C   ← 第2组
  奖品B
  奖品A
  奖品C   ← 第1组（顶部）
  奖品B
  奖品A
```

#### 第一阶段：平滑滚动（有动画，4秒）

```
滚动中...
┌─────────┐
│  奖品B  │ ← 列表向上滚动
│    ↑    │
│    │    │
└────┼────┘
     │
  奖品A   ← 从底部滚到顶部区域
  奖品C
  奖品B
  ...
```

滚动到顶部区域的目标位置：

```
滚动结束
┌─────────┐
│         │
│  奖品B  │ ← 停在顶部区域的目标位置
│         │
└─────────┘
  奖品A   ← 第1组（顶部）
  奖品C
  ...
```

#### 第二阶段：瞬间复位（无动画，0秒）

```
立即移动到底部的相同位置（用户看不出变化）

┌─────────┐
│         │
│  奖品B  │ ← 看起来还是奖品B
│         │
└─────────┘
  奖品A   
  奖品C   ← 第4组（底部）
  奖品B   ← 实际在这里！
  ...
```

**为什么要这样设计？**

1. **可重复性**：复位后又回到底部，下次可以继续从底部滚动
2. **无缝衔接**：因为列表是重复的，用户看不出从顶部跳到底部
3. **性能优化**：避免无限长的 DOM 列表

### 3. 依次启动效果

多个滚筒不是同时启动，而是依次启动，产生"波浪式"效果：

```
时间轴演示：

t=0ms    : 第1列开始滚动 🎰
t=500ms  : 第2列开始滚动   🎰
t=1000ms : 第3列开始滚动     🎰

t=4000ms : 第1列停止 ✋
t=4500ms : 第2列停止   ✋
t=5000ms : 第3列停止     ✋ → 触发结束事件
```

---

## 实现细节

### Props 配置详解

```javascript
const props = defineProps({
  // 奖品列表：每个奖品可包含 label（文字）或 image（图片）
  list: {
    type: Array,
    required: true,
    default: () => []
  },
  
  // 动画时间（秒）：控制滚动速度
  // 推荐值：3-5秒（太快看不清，太慢体验差）
  moveTime: {
    type: Number,
    default: 4
  },
  
  // 列表复制次数：决定滚动长度
  // 推荐值：4-6次（太少滚动不够长，太多性能浪费）
  concatCount: {
    type: Number,
    default: 4
  },
  
  // 滚筒列数：老虎机有几列
  // 经典老虎机是3列
  colCount: {
    type: Number,
    default: 3
  }
})
```

### 初始化位置函数

```javascript
/**
 * 初始化滚筒位置
 * 
 * 作用：将每个滚筒定位到底部，准备向上滚动
 * 
 * 原理：
 * - 计算整个列表的高度 ulHeight
 * - 使用 transform: translateY 将列表移到底部
 * - 预留一个奖品的高度 liHeight 用于显示
 * 
 * 视觉效果：
 *   可视区域
 *   ┌─────┐
 *   │奖品C│ ← 显示最后一个奖品
 *   └─────┘
 *      ↑
 *    奖品B（隐藏在上方）
 *    奖品A（隐藏在上方）
 *    ...
 */
const initPosition = () => {
  nextTick(() => {
    // 获取所有滚筒列
    const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
    if (!cols) return

    cols.forEach((col) => {
      // 获取可滚动的列表容器
      const ul = col.querySelector('.slot_machine__ul')
      // 获取隐藏的占位元素（用于计算单个奖品高度）
      const liHide = col.querySelector('.slot_machine__li.hide')
      
      if (ul && liHide) {
        // 整个列表的高度
        const ulHeight = ul.clientHeight
        // 单个奖品的高度
        const liHeight = liHide.clientHeight
        
        // 向上移动：列表高度 - 一个奖品高度
        // 效果：列表底部的奖品显示在可视区域
        ul.style.transform = `translateY(${-ulHeight + liHeight}px)`
      }
    })
  })
}
```

### 单列滚动动画函数

```javascript
/**
 * 播放单个滚筒的滚动动画
 * 
 * @param {HTMLElement} col - 滚筒列的 DOM 元素
 * @param {Number} index - 目标奖品的索引（0 到 list.length-1）
 * @param {Function} callback - 动画完成后的回调函数
 * 
 * 核心流程：
 * 1. 第一阶段：从底部平滑滚动到顶部区域的目标位置（有动画）
 * 2. 第二阶段：瞬间移动到底部区域的相同位置（无动画）
 */
const playCol = (col, index, callback) => {
  const ul = col.querySelector('.slot_machine__ul')
  const liHide = col.querySelector('.slot_machine__li.hide')
  
  if (!ul || !liHide) return

  // ===== 尺寸计算 =====
  const ulHeight = ul.clientHeight              // 整个列表高度
  const liHeight = liHide.clientHeight          // 单个奖品高度
  const oneCaseHeight = ulHeight / props.concatCount  // 一组奖品的高度

  // ===== 第一阶段：平滑滚动到顶部区域 =====
  
  // 计算目标位置
  // 公式解释：
  // - oneCaseHeight: 一组的高度（滚到第一组）
  // - (props.list.length - index) * liHeight: 从组底部往上数到目标奖品
  const translateY1 = -oneCaseHeight + ((props.list.length - index) * liHeight)
  
  // 设置动画属性
  ul.style.transitionProperty = 'transform'        // 只对 transform 做动画
  ul.style.transitionDuration = `${props.moveTime}s`  // 动画时长
  ul.style.transitionTimingFunction = 'ease-in-out'   // 缓动函数
  ul.style.transform = `translateY(${translateY1}px)` // 执行滚动

  // ===== 第二阶段：瞬间复位到底部 =====
  
  setTimeout(() => {
    // 计算底部区域的相同奖品位置
    // 公式：从最后一组的底部往上数到目标奖品
    const translateY2 = -ulHeight + ((props.list.length - index) * liHeight)
    
    // 移除过渡效果，实现瞬间移动
    ul.style.transitionProperty = 'none'
    ul.style.transform = `translateY(${translateY2}px)`
    
    // 触发回调
    if (callback) callback()
  }, props.moveTime * 1000)  // 等待第一阶段动画结束
}
```

**位置计算图解：**

```
假设：list.length = 3, index = 1（目标是奖品B）

列表结构：
位置  |  内容
─────┼─────────
  0  │  奖品A  ← 第1组开始
 64  │  奖品B
128  │  奖品C
192  │  奖品A  ← 第2组
256  │  奖品B
320  │  奖品C
384  │  奖品A  ← 第3组
448  │  奖品B
512  │  奖品C
576  │  奖品A  ← 第4组
640  │  奖品B
704  │  奖品C

第一阶段目标位置：
translateY1 = -192 + (3-1)*64 = -192 + 128 = -64
→ 滚动到第1组的奖品B（位置64）

第二阶段目标位置：
translateY2 = -768 + (3-1)*64 = -768 + 128 = -640
→ 移动到第4组的奖品B（位置640）
```

### 主控制函数

```javascript
/**
 * 开始抽奖
 * 
 * @param {Array} indices - 每列的中奖索引数组
 * @example go([0, 1, 2]) 
 *          第1列停在索引0（奖品A）
 *          第2列停在索引1（奖品B）
 *          第3列停在索引2（奖品C）
 * 
 * 流程：
 * 1. 参数校验
 * 2. 防重入检查
 * 3. 依次启动每列（每列延迟500ms）
 * 4. 最后一列结束后触发完成事件
 */
const go = (indices) => {
  // ===== 参数校验 =====
  
  // 必须是数组
  if (!Array.isArray(indices)) {
    console.error('go function error: The parameter type should be Array')
    return
  }
  
  // 数组长度必须等于列数
  if (indices.length !== props.colCount) {
    console.error(`go function error: The length of the argument must be equal to ${props.colCount}`)
    return
  }
  
  // 防止重复调用
  if (going.value) {
    console.warn('go function warning: Call repeatedly')
    return
  }

  // ===== 开始抽奖 =====
  
  going.value = true  // 设置抽奖中标志

  const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
  if (!cols) return

  // 依次启动每列的滚动
  cols.forEach((col, i) => {
    setTimeout(() => {
      // 启动第 i 列，停在 indices[i] 位置
      playCol(col, indices[i], () => {
        // 动画结束回调
        // 只有最后一列才触发完成事件
        if (i === cols.length - 1) {
          going.value = false      // 清除抽奖中标志
          emit('end', indices)     // 触发结束事件
        }
      })
    }, i * 500)  // 每列延迟 500ms 启动
  })
}
```

### DOM 结构说明

```html
<div class="slot_machine_wrapper">
  <!-- 老虎机主容器 -->
  <div class="slot_machine">
    
    <!-- 每个滚筒列 -->
    <div class="slot_machine__col">
      
      <!-- 可滚动的列表容器（会移动） -->
      <div class="slot_machine__ul">
        
        <!-- 奖品项（重复多次） -->
        <div class="slot_machine__li">
          <img src="..." class="slot_machine__image">
          <span class="slot_machine__label">奖品A</span>
        </div>
        
        <div class="slot_machine__li">...</div>
        <div class="slot_machine__li">...</div>
        <!-- ... 更多奖品 ... -->
        
      </div>
      
      <!-- 隐藏的占位元素（用于计算高度） -->
      <div class="slot_machine__li hide"></div>
      
    </div>
    
    <!-- 更多列... -->
  </div>
</div>
```

**CSS 关键样式：**

```css
/* 滚筒列：限制高度并隐藏溢出 */
.slot_machine__col {
  height: 64px;          /* 固定高度，只显示一个奖品 */
  overflow: hidden;      /* 隐藏超出部分 */
  flex: 1;              /* 平分宽度 */
}

/* 奖品项：固定高度 */
.slot_machine__li {
  height: 64px;          /* 与列高度一致 */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 隐藏占位元素 */
.slot_machine__li.hide {
  visibility: hidden;    /* 不显示但占据空间 */
}
```

---

## 动画演示

### 完整抽奖流程动画

```
【初始状态】
第1列      第2列      第3列
┌────┐   ┌────┐   ┌────┐
│ C  │   │ C  │   │ C  │
└────┘   └────┘   └────┘

↓ 点击开始抽奖 go([0, 1, 2])

【t=0ms】第1列开始滚动
┌────┐   ┌────┐   ┌────┐
│ ↑↑ │   │ C  │   │ C  │
└────┘   └────┘   └────┘
 滚动中

【t=500ms】第2列开始滚动
┌────┐   ┌────┐   ┌────┐
│ ↑↑ │   │ ↑↑ │   │ C  │
└────┘   └────┘   └────┘
 滚动中    滚动中

【t=1000ms】第3列开始滚动
┌────┐   ┌────┐   ┌────┐
│ ↑↑ │   │ ↑↑ │   │ ↑↑ │
└────┘   └────┘   └────┘
 滚动中    滚动中    滚动中

【t=4000ms】第1列停止（索引0=奖品A）
┌────┐   ┌────┐   ┌────┐
│ A  │   │ ↑↑ │   │ ↑↑ │
└────┘   └────┘   └────┘
 停止     滚动中    滚动中

【t=4500ms】第2列停止（索引1=奖品B）
┌────┐   ┌────┐   ┌────┐
│ A  │   │ B  │   │ ↑↑ │
└────┘   └────┘   └────┘
 停止     停止     滚动中

【t=5000ms】第3列停止（索引2=奖品C）
┌────┐   ┌────┐   ┌────┐
│ A  │   │ B  │   │ C  │
└────┘   └────┘   └────┘
 停止     停止     停止

↓ 触发 end 事件: [0, 1, 2]

【完成】显示中奖结果
═══════════════════════════
  恭喜中奖：A | B | C
═══════════════════════════
```

### 单列滚动细节动画

```
【初始】列表在底部
可视区域 →  ┌─────┐
            │  C  │ ← 显示区域（64px）
            └─────┘
               ↑
              B (隐藏)
              A (隐藏)
              C (隐藏)
              B (隐藏)
              A (隐藏)
              C (隐藏)
              B (隐藏)
              A (隐藏)

【滚动中】平滑上移（4秒动画）
            ┌─────┐
            │ ↑↑↑ │
            │ ↑↑↑ │
            └─────┘
             滚动
              ↑
             中...

【第一阶段结束】到达顶部目标位置
            ┌─────┐
            │  B  │ ← 停在目标位置（顶部区域）
            └─────┘
              A
              C
              B
              A
              C
              B
              A
              C (底部)

【第二阶段】瞬间复位（0秒）
            ┌─────┐
            │  B  │ ← 看起来还是B
            └─────┘
              A
              C (实际在底部区域的相同位置)
```

---

## 关键代码注释

### 完整注释版代码

```vue
<template>
  <div ref="slot_machine_wrapper" class="slot_machine_wrapper">
    <div class="slot_machine">
      <!-- 循环生成每个滚筒列 -->
      <div 
        v-for="colIndex in colCount" 
        :key="colIndex" 
        class="slot_machine__col"
      >
        <!-- 可滚动的列表容器 -->
        <div class="slot_machine__ul">
          <!-- 循环生成奖品项（已复制多次的列表） -->
          <div 
            v-for="(item, itemIndex) in expandedList" 
            :key="itemIndex" 
            class="slot_machine__li"
          >
            <!-- 显示奖品图片 -->
            <img 
              v-if="item.image" 
              :src="item.image" 
              class="slot_machine__image" 
              alt=""
            >
            <!-- 显示奖品文字 -->
            <span v-if="item.label" class="slot_machine__label">
              {{ item.label }}
            </span>
          </div>
        </div>
        <!-- 隐藏的占位元素，用于计算单个奖品的高度 -->
        <div class="slot_machine__li hide"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// ===== Props 定义 =====
const props = defineProps({
  list: {
    type: Array,
    required: true,
    default: () => []
  },
  moveTime: {
    type: Number,
    default: 4
  },
  concatCount: {
    type: Number,
    default: 4
  },
  colCount: {
    type: Number,
    default: 3
  }
})

// ===== 事件定义 =====
const emit = defineEmits(['end'])

// ===== 模板引用 =====
const slot_machine_wrapper = ref(null)  // 外层容器引用

// ===== 状态管理 =====
const going = ref(false)  // 是否正在抽奖中

// ===== 计算属性 =====
/**
 * 扩展后的奖品列表
 * 将原始列表复制 concatCount 次，实现无限滚动效果
 */
const expandedList = computed(() => {
  let result = []
  for (let i = 0; i < props.concatCount; i++) {
    result = result.concat(props.list)
  }
  return result
})

// ===== 方法 =====

/**
 * 初始化滚筒位置
 * 将所有滚筒定位到底部，准备向上滚动
 */
const initPosition = () => {
  nextTick(() => {
    const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
    if (!cols) return

    cols.forEach((col) => {
      const ul = col.querySelector('.slot_machine__ul')
      const liHide = col.querySelector('.slot_machine__li.hide')
      
      if (ul && liHide) {
        const ulHeight = ul.clientHeight    // 列表总高度
        const liHeight = liHide.clientHeight  // 单项高度
        // 向上移动（列表高度 - 单项高度），使最后一项显示
        ul.style.transform = `translateY(${-ulHeight + liHeight}px)`
      }
    })
  })
}

/**
 * 播放单列滚动动画
 * 
 * @param {HTMLElement} col - 滚筒列元素
 * @param {Number} index - 目标奖品索引
 * @param {Function} callback - 动画结束回调
 */
const playCol = (col, index, callback) => {
  const ul = col.querySelector('.slot_machine__ul')
  const liHide = col.querySelector('.slot_machine__li.hide')
  
  if (!ul || !liHide) return

  const ulHeight = ul.clientHeight
  const liHeight = liHide.clientHeight
  const oneCaseHeight = ulHeight / props.concatCount  // 单组高度

  // ===== 第一阶段：平滑滚动 =====
  const translateY1 = -oneCaseHeight + ((props.list.length - index) * liHeight)
  
  ul.style.transitionProperty = 'transform'
  ul.style.transitionDuration = `${props.moveTime}s`
  ul.style.transitionTimingFunction = 'ease-in-out'
  ul.style.transform = `translateY(${translateY1}px)`

  // ===== 第二阶段：瞬间复位 =====
  setTimeout(() => {
    const translateY2 = -ulHeight + ((props.list.length - index) * liHeight)
    ul.style.transitionProperty = 'none'  // 移除过渡效果
    ul.style.transform = `translateY(${translateY2}px)`
    
    if (callback) callback()
  }, props.moveTime * 1000)
}

/**
 * 开始抽奖
 * 
 * @param {Array} indices - 每列的中奖索引
 * @example go([0, 1, 2])
 */
const go = (indices) => {
  // 参数校验
  if (!Array.isArray(indices)) {
    console.error('go function error: The parameter type should be Array')
    return
  }
  
  if (indices.length !== props.colCount) {
    console.error(`go function error: The length of the argument must be equal to ${props.colCount}`)
    return
  }
  
  // 防重入
  if (going.value) {
    console.warn('go function warning: Call repeatedly')
    return
  }

  going.value = true

  const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
  if (!cols) return

  // 依次启动每列，每列延迟500ms
  cols.forEach((col, i) => {
    setTimeout(() => {
      playCol(col, indices[i], () => {
        // 最后一列结束时触发完成事件
        if (i === cols.length - 1) {
          going.value = false
          emit('end', indices)
        }
      })
    }, i * 500)
  })
}

// ===== 生命周期 =====
onMounted(() => {
  initPosition()  // 初始化位置
})

// ===== 暴露给父组件的方法 =====
defineExpose({
  go
})
</script>

<style scoped>
/* 容器样式 */
.slot_machine_wrapper {
  display: inline-block;
}

/* 老虎机主体 */
.slot_machine {
  display: flex;
  width: 360px;
}

/* 单个滚筒列 */
.slot_machine__col {
  flex: 1;
  box-shadow: 0 0 10px #ccc;
  height: 64px;          /* 固定高度 */
  overflow: hidden;      /* 隐藏溢出 */
}

/* 奖品项 */
.slot_machine__li {
  height: 64px;          /* 与列高度一致 */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

/* 奖品图片 */
.slot_machine__image {
  width: 32px;
  height: 32px;
}

/* 隐藏占位元素 */
.slot_machine__li.hide {
  visibility: hidden;
}
</style>
```

---

## 常见问题

### Q1: 为什么要复制列表多次？

**A**: 为了实现视觉上的"无限滚动"效果。如果只有一份列表，滚动一次就到头了，无法实现连续滚动的老虎机效果。

### Q2: 两段式动画的第二阶段用户能看到吗？

**A**: 看不到！因为：
1. 移除了 `transition` 过渡效果，移动是瞬间完成的
2. 移动前后显示的是同一个奖品（列表是重复的）
3. 视觉上完全无感知

### Q3: 为什么每列要延迟 500ms 启动？

**A**: 增强视觉效果！真实的老虎机也是依次启动和停止的，这样更有"波浪感"和"节奏感"，用户体验更好。

### Q4: 如何自定义滚动速度？

**A**: 修改 `moveTime` 属性即可：

```vue
<SlotMachineVue :move-time="3" />  <!-- 3秒滚动 -->
```

### Q5: 可以中途停止吗？

**A**: 当前实现不支持中途停止。如需此功能，需要：
1. 记录当前动画状态
2. 提供 `stop()` 方法
3. 清除 `setTimeout` 定时器
4. 立即执行第二阶段动画

### Q6: 为什么用 `transform` 而不是 `top`？

**A**: 性能优化！
- `transform` 只触发合成（Composite），不会触发重排（Reflow）
- `top` 会触发重排，性能差
- 动画更流畅

### Q7: 索引计算公式如何理解？

**A**: 以 `translateY1` 为例：

```javascript
const translateY1 = -oneCaseHeight + ((props.list.length - index) * liHeight)
```

分解理解：
- `-oneCaseHeight`: 移动到第一组的起始位置
- `props.list.length - index`: 从组底部往上数多少个
- `* liHeight`: 转换为像素距离
- 最终效果：定位到第一组中的目标奖品

---

## 总结

SlotMachine 组件的核心设计思想：

1. **列表复制** → 实现无限滚动视觉效果
2. **两段式动画** → 平滑滚动 + 瞬间复位，支持可重复抽奖
3. **依次启动** → 增强视觉节奏感
4. **精确控制** → 可指定每列停止的确切位置
5. **性能优化** → 使用 `transform` 实现动画

这种设计既保证了视觉效果，又确保了性能和可维护性，是一个经典的前端动画实现方案！

---

## 参考资料

- [CSS Transform 性能优化](https://web.dev/animations-guide/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [requestAnimationFrame vs setTimeout](https://developer.mozilla.org/zh-CN/docs/Web/API/window/requestAnimationFrame)

---

**文档版本**: v1.0.0  
**最后更新**: 2026-01-08  
**作者**: lattice-lottery-new 团队

