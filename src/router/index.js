import {createRouter, createWebHistory} from 'vue-router'
import Index from '../views/index.vue'
import Login from "@/views/login.vue";
import Home from "@/views/home.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '',
            name: 'index',
            component: Index,
            redirect: '/home',
            children: []
        }, {
            path: '/login',
            name: 'login',
            component: Login
        }, {
            name: '404',
            path: '/404',
            component: () => import("@/views/error/404.vue")
        },
    ]
})

export default router
