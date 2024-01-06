import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl'
import dotenv from 'dotenv';
import fs from 'fs';
// https://vitejs.dev/config/
export default (cfg) => {
  const { command, mode } = cfg;
  const env = dotenv.parse(fs.readFileSync(`.env.${mode}`));

  return defineConfig({
    plugins: [
      // basicSsl(),
      vue()],
    server: {
      host: "0.0.0.0",
      cors: true,
      // https: true,
      port: 9230,
      proxy: {
        '/api': {
          target: env.VITE_PREFIX_URL,
          changeOrigin: true,
        }
      }
    },
    resolve: {
      alias: [
        {
          find: /^~/,
          replacement: '',
        },
        {
          find: '@',
          replacement: resolve(__dirname, 'src'),
        },
        {
          find: '@img',
          replacement: resolve(__dirname, 'src/assets/img'),
        },
        {
          find: '@components',
          replacement: resolve(__dirname, 'src/components'),
        },
        {
          find: '@services',
          replacement: resolve(__dirname, 'src/services'),
        },
      ],
    },
  })
}