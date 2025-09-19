import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { devLogger } from '@meituan-nocode/vite-plugin-dev-logger';
import { devHtmlTransformer, prodHtmlTransformer } from '@meituan-nocode/vite-plugin-nocode-html-transformer';
import react from '@vitejs/plugin-react';
import path from 'path';

const isProdEnv = process.env.NODE_ENV === 'production';
const PUBLIC_PATH = isProdEnv ? process.env.PUBLIC_PATH + '/' + process.env.CHAT_VARIABLE : process.env.PUBLIC_PATH;
const OUT_DIR = isProdEnv ? 'build/' + process.env.CHAT_VARIABLE : 'build';
const PLUGINS = isProdEnv ? [
  react(),
  prodHtmlTransformer(process.env.CHAT_VARIABLE)
] : [
  devLogger({
    dirname: resolve(tmpdir(), '.nocode-dev-logs'),
    maxFiles: '3d',
  }),
  react(),
  devHtmlTransformer(process.env.CHAT_VARIABLE),
];

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: '8080',
    hmr: {
      overlay: false
    },
    base: './',
    proxy: {
      '/api': {
        // 本地环境
        // target: 'http://localhost:8888',
        // 容器环境
        target: 'http://hyperealty.server:8888',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    PLUGINS
  ],
  base: PUBLIC_PATH,
  build: {
    outDir: OUT_DIR
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src') // 确保 '@' 映射到 'src' 目录
    }
  },
});

console.log('Alias @ resolves to:', path.resolve(__dirname, './src'));