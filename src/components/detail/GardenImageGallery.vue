<!--
  园林图片展示组件
  - 从 dataset/images 中加载园林图片
  - 支持多图轮播展示
  - 无图片时显示占位符
  - 支持图片懒加载和错误处理
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  gardenName: string
}

const props = defineProps<Props>()

// 图片状态
const availableImages = ref<string[]>([])
const currentImageIndex = ref(0)
const isLoadingImages = ref(true)
const imageLoadError = ref<Set<string>>(new Set())

// 最多尝试加载的图片数量
const MAX_IMAGES = 10

// 当前显示的图片路径
const currentImageUrl = computed(() => {
  if (availableImages.value.length === 0) return null
  return availableImages.value[currentImageIndex.value]
})

// 是否有多张图片
const hasMultipleImages = computed(() => availableImages.value.length > 1)

// 是否没有任何可用图片
const hasNoImages = computed(() =>
  !isLoadingImages.value && availableImages.value.length === 0
)

/**
 * 加载园林图片
 * 尝试加载 01.jpg 到 10.jpg
 */
const loadGardenImages = async () => {
  isLoadingImages.value = true
  availableImages.value = []
  imageLoadError.value = new Set()
  currentImageIndex.value = 0

  const imagePromises: Promise<string | null>[] = []

  // 尝试加载多张图片
  for (let i = 1; i <= MAX_IMAGES; i++) {
    const imageNum = i.toString().padStart(2, '0') // 01, 02, 03, ...
    const imagePath = `/dataset/images/${props.gardenName}/${imageNum}.jpg`

    imagePromises.push(
      checkImageExists(imagePath).then(exists => exists ? imagePath : null)
    )
  }

  // 等待所有图片检查完成
  const results = await Promise.all(imagePromises)

  // 过滤出存在的图片
  availableImages.value = results.filter((path): path is string => path !== null)

  isLoadingImages.value = false

  console.log(`📷 园林 ${props.gardenName}: 找到 ${availableImages.value.length} 张图片`)
}

/**
 * 检查图片是否存在
 */
const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * 切换到上一张图片
 */
const prevImage = () => {
  if (availableImages.value.length === 0) return
  currentImageIndex.value =
    (currentImageIndex.value - 1 + availableImages.value.length) % availableImages.value.length
}

/**
 * 切换到下一张图片
 */
const nextImage = () => {
  if (availableImages.value.length === 0) return
  currentImageIndex.value = (currentImageIndex.value + 1) % availableImages.value.length
}

/**
 * 跳转到指定图片
 */
const goToImage = (index: number) => {
  currentImageIndex.value = index
}

/**
 * 处理图片加载错误
 */
const handleImageError = (url: string) => {
  imageLoadError.value.add(url)
  console.warn(`⚠️ 图片加载失败: ${url}`)
}

// 监听园林名称变化，重新加载图片
watch(() => props.gardenName, () => {
  loadGardenImages()
}, { immediate: true })

// 组件挂载时加载图片
onMounted(() => {
  loadGardenImages()
})
</script>

<template>
  <div class="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-video">
    <!-- 加载中 -->
    <div v-if="isLoadingImages" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div
          class="inline-block w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
        />
        <p class="mt-2 text-xs text-gray-500">加载图片中...</p>
      </div>
    </div>

    <!-- 无图片占位符 -->
    <div
      v-else-if="hasNoImages"
      class="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
    >
      <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div v-else class="relative w-full h-full">
      <!-- 当前图片 -->
      <img
        v-if="currentImageUrl"
        :src="currentImageUrl"
        :alt="gardenName"
        class="w-full h-full object-cover"
        @error="() => handleImageError(currentImageUrl!)"
      />

      <!-- 图片导航控件（仅多图时显示） -->
      <template v-if="hasMultipleImages">
        <!-- 左箭头 -->
        <button
          class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
          @click="prevImage"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- 右箭头 -->
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
          @click="nextImage"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- 图片指示器 -->
        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          <button
            v-for="(_, index) in availableImages"
            :key="index"
            class="w-2 h-2 rounded-full transition-all"
            :class="[
              index === currentImageIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/75'
            ]"
            @click="goToImage(index)"
          />
        </div>

        <!-- 图片计数 -->
        <div class="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded z-10">
          {{ currentImageIndex + 1 }} / {{ availableImages.length }}
        </div>
      </template>
    </div>
  </div>
</template>
