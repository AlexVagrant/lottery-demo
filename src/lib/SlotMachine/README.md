# SlotMachine 老虎机抽奖组件

老虎机风格的抽奖组件，支持多列滚动抽奖效果。

## 特性

- 🎰 经典老虎机滚动效果
- 🎨 可自定义奖品内容（文字/图片）
- ⚙️ 灵活配置滚动参数
- 📱 响应式设计
- 🔄 支持多列独立滚动
- 🎯 精确控制中奖结果

## 安装

```bash
npm install lattice-lottery-new
```

## 使用方式

本组件提供两种使用方式：

### 方式一：Vue 组件版本（推荐）

适用于 Vue 3 项目，提供完整的响应式和类型提示。

```vue
<template>
  <div>
    <SlotMachineVue
      ref="slot_machine_ref"
      :list="prize_list"
      :move-time="4"
      :concat-count="4"
      :col-count="3"
      @end="onEnd"
    />
    <button @click="startLottery">开始抽奖</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { SlotMachineVue } from 'lattice-lottery-new'

// 奖品列表
const prize_list = [
  { label: "一等奖" },
  { label: "二等奖" },
  { label: "三等奖" },
  { label: "谢谢参与" },
]

// 组件引用
const slot_machine_ref = ref(null)

// 开始抽奖
const startLottery = () => {
  // 传入每列的中奖索引
  slot_machine_ref.value.go([0, 1, 2])
}

// 抽奖结束回调
const onEnd = (indices) => {
  console.log('中奖索引:', indices)
}
</script>
```

### 方式二：原生 JS 类版本

适用于非 Vue 项目或需要命令式 API 的场景。

```javascript
import SlotMachine from 'lattice-lottery-new/SlotMachine'

const machine = new SlotMachine({
  element: '.lottery',
  list: [
    { label: "一等奖" },
    { label: "二等奖" },
    { label: "三等奖" },
  ],
  moveTime: 4,
  concatCount: 4,
  colCount: 3,
  onend: (indices) => {
    console.log('中奖索引:', indices)
  }
})

// 开始抽奖
machine.go([0, 1, 2])
```

## Props / Options

### Vue 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| list | Array | [] | 奖品列表，每项包含 label 或 image |
| moveTime | Number | 4 | 滚动动画时间（秒） |
| concatCount | Number | 4 | 奖品列表复制次数，影响滚动长度 |
| colCount | Number | 3 | 滚筒列数 |

### 奖品项配置

```javascript
{
  label: "奖品名称",     // 文字内容（可选）
  image: "/path/to/img"  // 图片路径（可选）
}
```

## Events

### @end

抽奖结束时触发

**参数：**
- `indices`: Array - 中奖索引数组

```vue
<SlotMachineVue @end="onEnd" />

const onEnd = (indices) => {
  console.log('中奖索引:', indices)
  // indices: [0, 1, 2] 表示第一列停在索引0，第二列停在索引1，第三列停在索引2
}
```

## Methods

### go(indices)

开始抽奖并指定中奖索引

**参数：**
- `indices`: Array - 每列的中奖索引数组

**示例：**

```javascript
// Vue 组件方式
slot_machine_ref.value.go([0, 1, 2])

// 类方式
machine.go([0, 1, 2])
```

**注意事项：**
- 索引数组长度必须等于 `colCount`
- 索引值范围：`0` 到 `list.length - 1`
- 抽奖进行中时重复调用会被忽略

## 样式自定义

可以通过 CSS 变量或覆盖类名来自定义样式：

```css
/* 自定义容器宽度 */
.slot_machine {
  width: 480px !important;
}

/* 自定义列高度 */
.slot_machine__col {
  height: 80px !important;
}

/* 自定义阴影效果 */
.slot_machine__col {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3) !important;
}
```

## 完整示例

```vue
<template>
  <div class="lottery_container">
    <h2>老虎机抽奖</h2>
    
    <SlotMachineVue
      ref="slot_machine_ref"
      :list="prize_list"
      :move-time="3"
      :concat-count="5"
      :col-count="3"
      @end="handleEnd"
    />
    
    <button 
      class="lottery_btn" 
      @click="startLottery"
      :disabled="is_running"
    >
      {{ is_running ? '抽奖中...' : '开始抽奖' }}
    </button>
    
    <div v-if="result" class="result">
      中奖结果：{{ result }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { SlotMachineVue } from 'lattice-lottery-new'

const prize_list = [
  { label: "iPhone 15 Pro" },
  { label: "MacBook Air" },
  { label: "iPad Pro" },
  { label: "AirPods Pro" },
  { label: "谢谢参与" },
]

const slot_machine_ref = ref(null)
const is_running = ref(false)
const result = ref('')

const startLottery = async () => {
  if (is_running.value) return
  
  is_running.value = true
  result.value = ''
  
  // 模拟从后端获取中奖结果
  const indices = await fetchLotteryResult()
  
  // 开始抽奖
  slot_machine_ref.value.go(indices)
}

const handleEnd = (indices) => {
  is_running.value = false
  
  // 显示中奖结果
  const prizes = indices.map(index => prize_list[index].label)
  result.value = prizes.join(' | ')
  
  // 判断是否中奖
  if (prizes.every(p => p !== '谢谢参与')) {
    alert('恭喜中奖！')
  }
}

// 模拟获取中奖结果
const fetchLotteryResult = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const indices = [
        Math.floor(Math.random() * prize_list.length),
        Math.floor(Math.random() * prize_list.length),
        Math.floor(Math.random() * prize_list.length)
      ]
      resolve(indices)
    }, 500)
  })
}
</script>

<style scoped>
.lottery_container {
  padding: 40px;
  text-align: center;
}

.lottery_btn {
  margin-top: 20px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.lottery_btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.lottery_btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
</style>
```

## 注意事项

1. **索引计算**：`go()` 方法接收的索引是从奖品列表中选择的位置，而不是滚动的距离
2. **防止重复调用**：组件内部会阻止在抽奖进行中时重复调用 `go()` 方法
3. **动画时间**：建议 `moveTime` 设置在 3-5 秒之间，过短会导致动画不流畅，过长会影响用户体验
4. **复制次数**：`concatCount` 影响滚动长度，建议设置在 4-6 之间

## 浏览器兼容性

- Chrome >= 60
- Firefox >= 60
- Safari >= 12
- Edge >= 79

## License

MIT

