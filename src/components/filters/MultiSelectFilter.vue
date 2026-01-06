<!--
  多选筛选器组件
  支持下拉多选，带有选中数量提示
-->
<script setup lang="ts">
import { computed, ref, type Directive } from 'vue';

interface Props {
  label: string; // 筛选器标签
  options: string[]; // 可选项列表
  modelValue: string[]; // 选中的值（v-model）
  placeholder?: string; // 占位符
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

// 自定义指令：点击外部关闭（在 script setup 中以 vXxx 命名，模板中自动识别为 v-xxx）
const vClickAway: Directive<HTMLElement & { clickAwayEvent?: (e: Event) => void }, () => void> = {
  mounted(el, binding) {
    el.clickAwayEvent = function (event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickAwayEvent);
  },
  unmounted(el) {
    if (el.clickAwayEvent) {
      document.removeEventListener('click', el.clickAwayEvent);
    }
  },
};

// 是否展开下拉框
const isExpanded = ref(false);

// 选中的项数量
const selectedCount = computed(() => props.modelValue.length);

// 显示文本
const displayText = computed(() => {
  if (selectedCount.value === 0) {
    return props.placeholder;
  }
  return `已选 ${selectedCount.value} 项`;
});

// 切换选项
function toggleOption(option: string) {
  const currentValues = [...props.modelValue];
  const index = currentValues.indexOf(option);

  if (index > -1) {
    currentValues.splice(index, 1);
  } else {
    currentValues.push(option);
  }

  emit('update:modelValue', currentValues);
}

// 全选
function selectAll() {
  emit('update:modelValue', [...props.options]);
}

// 清空
function clearAll() {
  emit('update:modelValue', []);
}

// 点击外部关闭下拉框
function handleClickOutside() {
  isExpanded.value = false;
}
</script>

<template>
  <div class="multi-select-filter">
    <label class="mb-2 block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div v-click-away="handleClickOutside" class="relative">
      <!-- 触发按钮 -->
      <button
        type="button"
        class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="{ 'border-blue-500 ring-2 ring-blue-500': isExpanded }"
        @click="isExpanded = !isExpanded"
      >
        <span
          :class="{
            'text-gray-500': selectedCount === 0,
            'font-medium text-gray-900': selectedCount > 0,
          }"
        >
          {{ displayText }}
        </span>
        <svg
          class="h-4 w-4 text-gray-400 transition-transform"
          :class="{ 'rotate-180 transform': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- 下拉选项 -->
      <div
        v-show="isExpanded"
        class="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        <!-- 操作按钮 -->
        <div
          class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2"
        >
          <button
            type="button"
            class="text-xs font-medium text-blue-600 hover:text-blue-800"
            @click="selectAll"
          >
            全选
          </button>
          <button
            type="button"
            class="text-xs font-medium text-gray-600 hover:text-gray-800"
            @click="clearAll"
          >
            清空
          </button>
        </div>

        <!-- 选项列表 -->
        <div class="py-1">
          <label
            v-for="option in options"
            :key="option"
            class="flex cursor-pointer items-center px-3 py-2 transition-colors hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :checked="modelValue.includes(option)"
              class="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="toggleOption(option)"
            />
            <span class="ml-2 text-sm text-gray-700">{{ option }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
