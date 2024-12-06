import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import {createRouter, createWebHistory} from "vue-router";

const routes = [
    { name: 'Home', strict : true, path: '/', component :()=> import('./Host.vue') },
    { name:'Viewer',strict : true, path: '/channel/:channelArn', component: ()=> import('./Viewer.vue') },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})


createApp(App)
    .use(router)
    .mount('#app')
