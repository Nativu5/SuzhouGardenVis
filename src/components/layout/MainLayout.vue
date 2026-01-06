<!--
  主布局容器组件
  - 整合顶部导航栏、左侧操作区、中间主视图、右侧详情区
  - 响应式三栏布局
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore';
import { computed } from 'vue';
import HeaderNav from './HeaderNav.vue';
import LeftPanel from './LeftPanel.vue';
import MainView from './MainView.vue';
import RightPanel from './RightPanel.vue';

const gardenStore = useGardenStore();

// 判断是否为探索模式
const isExploreMode = computed(() => gardenStore.viewMode === 'explore');
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <!-- 顶部导航栏 -->
    <HeaderNav />

    <!-- 主内容区 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧操作区 -->
      <LeftPanel />

      <!-- 中间主视图 -->
      <MainView />

      <!-- 右侧详情区（仅探索模式显示） -->
      <Transition
        enter-active-class="transition-transform duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <RightPanel v-if="isExploreMode" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* 确保容器占满全屏 */
.h-screen {
  height: 100vh;
  height: 100dvh; /* 支持移动端动态视口高度 */
}
</style>
