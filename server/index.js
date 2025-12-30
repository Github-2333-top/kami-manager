/**
 * PM2/生产环境入口文件
 *
 * 为什么需要它：
 * - README 与现有 PM2 配置使用 `pm2 start index.js --name kami-server`
 * - 实际后端源码位于 `src/index.ts`，编译产物在 `dist/`
 * - 之前缺少该入口会导致 PM2 报错：ERR_MODULE_NOT_FOUND
 *
 * 约定：
 * - 先确保执行过 `npm run build`（生成 dist/）
 */
import './dist/index.js'


