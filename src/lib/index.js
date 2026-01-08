import SlotMachine, { SlotMachineVue } from "./SlotMachine"; // 引入封装好的组件

import LotteryGrid from './Lottery/lottery-grid'
import LotteryList from './Lottery/lottery-list'

import Turntable from './Turntable'

export {
  SlotMachine,        // 老虎机类版本（原生 JS）
  SlotMachineVue,     // 老虎机 Vue 组件版本
  LotteryGrid,        // 九宫格抽奖
  LotteryList,        // 列表抽奖
  Turntable,          // 转盘抽奖
} //实现按需引入*