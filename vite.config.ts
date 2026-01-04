import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // Vue 核心库
          'vue-vendor': ['vue', 'pinia'],
          // ECharts 图表库（已按需导入）
          'echarts-vendor': ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          // 数据处理库
          'data-vendor': ['papaparse'],
          // 高德地图加载器
          'amap-vendor': ['@amap/amap-jsapi-loader']
        }
      }
    },
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 600,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 压缩配置
    minify: 'esbuild',
    // 生成 sourcemap（可选，调试用）
    sourcemap: false
  }
})
