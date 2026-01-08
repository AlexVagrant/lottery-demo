/**
 * SlotMachine 老虎机组件导出
 * 
 * 提供两种使用方式：
 * 1. SlotMachine - 原始类方式（用于原生 JS）
 * 2. SlotMachineVue - Vue 组件方式（推荐用于 Vue 项目）
 * 
 * @example
 * // 使用类方式
 * import SlotMachine from 'lattice-lottery-new/SlotMachine'
 * const machine = new SlotMachine({ element: '.lottery', list: [...] })
 * machine.go([1, 2, 3])
 * 
 * @example
 * // 使用 Vue 组件方式
 * import { SlotMachineVue } from 'lattice-lottery-new/SlotMachine'
 * // 在模板中使用 <SlotMachineVue :list="list" @end="onEnd" />
 */

import SlotMachineClass from './slot-machine-class'
import SlotMachineVue from './SlotMachine.vue'

export {
  SlotMachineClass as SlotMachine,  // 原始类导出
  SlotMachineVue                     // Vue 组件导出
}

// 默认导出原始类，保持向后兼容
export default SlotMachineClass
