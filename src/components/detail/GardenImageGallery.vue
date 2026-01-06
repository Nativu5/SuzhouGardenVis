<!--
  园林图片展示组件
  - 从 dataset/images 中加载园林图片
  - 支持多图轮播展示
  - 无图片时显示占位符
  - 支持图片懒加载和错误处理
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  gardenName: string;
}

const props = defineProps<Props>();

// 图片状态
const availableImages = ref<string[]>([]);
const currentImageIndex = ref(0);
const isLoadingImages = ref(true);
const imageLoadError = ref<Set<string>>(new Set());

// 最多尝试加载的图片数量
const MAX_IMAGES = 10;

// 当前显示的图片路径
const currentImageUrl = computed(() => {
  if (availableImages.value.length === 0) return null;
  return availableImages.value[currentImageIndex.value];
});

// 是否有多张图片
const hasMultipleImages = computed(() => availableImages.value.length > 1);

// 是否没有任何可用图片
const hasNoImages = computed(() => !isLoadingImages.value && availableImages.value.length === 0);

/**
 * 加载园林图片
 * 优化策略：优先加载第一张，成功后再异步加载后续图片
 */
const loadGardenImages = async () => {
  isLoadingImages.value = true;
  availableImages.value = [];
  imageLoadError.value = new Set();
  currentImageIndex.value = 0;

  // 1. 优先检查第一张图片
  const firstImagePath = `/dataset/images/${props.gardenName}/01.jpg`;
  const firstImageExists = await checkImageExists(firstImagePath);

  if (firstImageExists) {
    availableImages.value.push(firstImagePath);
    isLoadingImages.value = false; // 第一张存在，立即结束 loading，让用户看到图片

    // 2. 异步检查后续图片 (02-10)
    // 使用 requestIdleCallback 或 setTimeout 避免阻塞主线程
    setTimeout(async () => {
      const subsequentPromises: Promise<string | null>[] = [];
      for (let i = 2; i <= MAX_IMAGES; i++) {
        const imageNum = i.toString().padStart(2, '0');
        const imagePath = `/dataset/images/${props.gardenName}/${imageNum}.jpg`;
        subsequentPromises.push(
          checkImageExists(imagePath).then((exists) => (exists ? imagePath : null)),
        );
      }

      const results = await Promise.all(subsequentPromises);
      const validImages = results.filter((path): path is string => path !== null);

      // 将后续图片追加到列表中
      if (validImages.length > 0) {
        availableImages.value = [...availableImages.value, ...validImages];
      }
    }, 100);
  } else {
    // 第一张不存在，认为无图
    isLoadingImages.value = false;
    console.log(`📷 园林 ${props.gardenName}: 未找到图片 (01.jpg 不存在)`);
  }
};

/**
 * 检查图片是否存在
 */
const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * 切换到上一张图片
 */
const prevImage = () => {
  if (availableImages.value.length === 0) return;
  currentImageIndex.value =
    (currentImageIndex.value - 1 + availableImages.value.length) % availableImages.value.length;
};

/**
 * 切换到下一张图片
 */
const nextImage = () => {
  if (availableImages.value.length === 0) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % availableImages.value.length;
};

/**
 * 跳转到指定图片
 */
const goToImage = (index: number) => {
  currentImageIndex.value = index;
};

/**
 * 处理图片加载错误
 */
const handleImageError = (url: string) => {
  imageLoadError.value.add(url);
  console.warn(`⚠️ 图片加载失败: ${url}`);
};

// 监听园林名称变化，重新加载图片
watch(
  () => props.gardenName,
  () => {
    loadGardenImages();
  },
  { immediate: true },
);
</script>

<template>
  <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
    <!-- 加载中 -->
    <div v-if="isLoadingImages" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
        />
        <p class="mt-2 text-xs text-gray-500">加载图片中...</p>
      </div>
    </div>

    <!-- 无图片占位符 -->
    <div
      v-else-if="hasNoImages"
      class="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
    >
      <svg class="mb-2 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p class="text-sm font-medium">暂无图片</p>
    </div>

    <!-- 图片展示 -->
    <div v-else class="relative h-full w-full">
      <!-- 当前图片 -->
      <img
        v-if="currentImageUrl"
        :src="currentImageUrl"
        :alt="gardenName"
        class="h-full w-full object-cover"
        @error="() => handleImageError(currentImageUrl!)"
      />

      <!-- 图片导航控件（仅多图时显示） -->
      <template v-if="hasMultipleImages">
        <!-- 左箭头 -->
        <button
          class="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          @click="prevImage"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- 右箭头 -->
        <button
          class="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          @click="nextImage"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- 图片指示器 -->
        <div class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          <button
            v-for="(_, index) in availableImages"
            :key="index"
            class="h-2 w-2 rounded-full transition-all"
            :class="[
              index === currentImageIndex ? 'w-4 bg-white' : 'bg-white/50 hover:bg-white/75',
            ]"
            @click="goToImage(index)"
          />
        </div>

        <!-- 图片计数 -->
        <div class="absolute right-2 top-2 z-10 rounded bg-black/50 px-2 py-1 text-xs text-white">
          {{ currentImageIndex + 1 }} / {{ availableImages.length }}
        </div>
      </template>
    </div>
  </div>
</template>
