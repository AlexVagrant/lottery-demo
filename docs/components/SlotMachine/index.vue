<script setup>
import { ref } from 'vue'
import SlotMachine from '../../../src/lib/SlotMachine/SlotMachine.vue'

/**
 * 奖品列表配置
 */
const list = [
  { label: "华为Mate 60 Pro+" },
  { label: "1000元现金红包" },
  { label: "三等奖" },
  { label: "500元现金红包" },
  { label: "谢谢参与" },
  { label: "六等奖" },
  { label: "7等奖" },
  { label: "8等奖" },
  { label: "9等奖" },
]

// 老虎机组件引用
const slot_machine_ref = ref(null)

/**
 * 开始抽奖
 * 模拟随机抽取3列的中奖索引
 */
const onSubmit = () => {
  if (!slot_machine_ref.value) return
  
  // 随机生成3个索引（0-8）
  const indices = [
    Math.floor(Math.random() * list.length),
    Math.floor(Math.random() * list.length),
    Math.floor(Math.random() * list.length)
  ]
  
  slot_machine_ref.value.go(indices)
}

/**
 * 抽奖结束回调
 * @param {Array} indices - 中奖索引数组
 */
const onEnd = (indices) => {
  const prizes = indices.map(index => list[index].label)
  alert(`中奖结果：${prizes.join(' | ')}`)
}
</script>

<template>
  <div class="box">
    <SlotMachine
      ref="slot_machine_ref"
      :list="list"
      :move-time="4"
      :concat-count="4"
      :col-count="3"
      @end="onEnd"
    />
    <br />
    <div @click="onSubmit" class="lottery_btn">开始抽奖</div>
  </div>
</template>

<style lang="less" scoped>
.box {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.lottery_btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
  user-select: none;
}

.lottery_btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.lottery_btn:active {
  transform: translateY(0);
}
</style>