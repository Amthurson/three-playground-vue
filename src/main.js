import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { store, key } from './store';

import '@/assets/styles/index.scss';
const app = createApp(App);
app
.use(router)
.use(store)
.use(key)
.mount("#app")