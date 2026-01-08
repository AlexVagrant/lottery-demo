<template>
  <div ref="slot_machine_wrapper" class="slot_machine_wrapper">
    <div class="slot_machine">
      <div 
        v-for="colIndex in colCount" 
        :key="colIndex" 
        class="slot_machine__col"
      >
        <div class="slot_machine__ul">
          <div 
            v-for="(item, itemIndex) in expandedList" 
            :key="itemIndex" 
            class="slot_machine__li"
          >
            <img 
              v-if="item.image" 
              :src="item.image" 
              class="slot_machine__image" 
              alt=""
            >
            <span v-if="item.label" class="slot_machine__label">
              {{ item.label }}
            </span>
          </div>
        </div>
        <div class="slot_machine__li hide"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

/**
 * Props 定义
 * @property {Array} list - 奖品列表
 * @property {Number} moveTime - 动画时间（单位：秒）
 * @property {Number} concatCount - 奖品列表复制次数
 * @property {Number} colCount - 滚筒列数
 */
const props = defineProps({
  // 奖品列表
  list: {
    type: Array,
    required: true,
    default: () => []
  },
  // 动画时间（单位：秒）
  moveTime: {
    type: Number,
    default: 4
  },
  // 奖品列表复制次数
  concatCount: {
    type: Number,
    default: 4
  },
  // 滚筒列数
  colCount: {
    type: Number,
    default: 3
  }
})

/**
 * Emits 定义
 * @event end - 抽奖结束事件，返回中奖索引数组
 */
const emit = defineEmits(['end'])

// Template refs
const slot_machine_wrapper = ref(null)
const slot_machine_ul = ref([])

// 状态管理
const going = ref(false)

/**
 * 计算扩展后的奖品列表
 * 将原始列表复制 concatCount 次，用于无限滚动效果
 */
const expandedList = computed(() => {
  let result = []
  for (let i = 0; i < props.concatCount; i++) {
    result = result.concat(props.list)
  }
  return result
})

/**
 * 初始化滚筒位置
 * 将滚筒定位到底部，准备开始滚动
 */
const initPosition = () => {
  nextTick(() => {
    const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
    if (!cols) return

    cols.forEach((col) => {
      const ul = col.querySelector('.slot_machine__ul')
      const liHide = col.querySelector('.slot_machine__li.hide')
      
      if (ul && liHide) {
        const ulHeight = ul.clientHeight
        const liHeight = liHide.clientHeight
        ul.style.transform = `translateY(${-ulHeight + liHeight}px)`
      }
    })
  })
}

/**
 * 播放单个滚筒动画
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
  const oneCaseHeight = ulHeight / props.concatCount

  // 第一阶段：滚动到顶部附近的目标位置
  const translateY1 = -oneCaseHeight + ((props.list.length - index) * liHeight)
  
  ul.style.transitionProperty = 'transform'
  ul.style.transitionDuration = `${props.moveTime}s`
  ul.style.transitionTimingFunction = 'ease-in-out'
  ul.style.transform = `translateY(${translateY1}px)`

  // 第二阶段：瞬间移动到底部的相同位置
  setTimeout(() => {
    const translateY2 = -ulHeight + ((props.list.length - index) * liHeight)
    ul.style.transitionProperty = 'none'
    ul.style.transform = `translateY(${translateY2}px)`
    
    if (callback) callback()
  }, props.moveTime * 1000)
}

/**
 * 开始抽奖
 * @param {Array} indices - 每列的中奖索引数组
 * @example go([1, 2, 3]) // 第一列停在索引1，第二列停在索引2，第三列停在索引3
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
  
  if (going.value) {
    console.warn('go function warning: Call repeatedly')
    return
  }

  going.value = true

  const cols = slot_machine_wrapper.value?.querySelectorAll('.slot_machine__col')
  if (!cols) return

  // 依次启动每列的滚动动画
  cols.forEach((col, i) => {
    setTimeout(() => {
      playCol(col, indices[i], () => {
        // 最后一列动画结束后触发 end 事件
        if (i === cols.length - 1) {
          going.value = false
          emit('end', indices)
        }
      })
    }, i * 500)
  })
}

/**
 * 组件挂载后初始化位置
 */
onMounted(() => {
  initPosition()
})

/**
 * 暴露方法给父组件
 */
defineExpose({
  go
})
</script>

<style scoped>
.slot_machine_wrapper {
  display: inline-block;
}

.slot_machine {
  display: flex;
  width: 360px;
}

.slot_machine__col {
  flex: 1;
  box-shadow: 0 0 10px #ccc;
  height: 64px;
  overflow: hidden;
}

.slot_machine__li {
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.slot_machine__image {
  width: 32px;
  height: 32px;
}

.slot_machine__li.hide {
  visibility: hidden;
}
</style>

