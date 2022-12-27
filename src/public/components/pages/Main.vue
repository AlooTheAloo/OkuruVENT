<template>
    <StartPage v-if="currentPage==Page.StartPage"/>
    <MainPage v-else-if="currentPage==Page.MainPage"/>
    <!-- Redirecting... -->
    <div v-else-if="currentPage==Page.None"></div>
    <div v-else><p>Uhhh, you're not supposed to be here</p></div>
</template>
<script setup lang="ts">

    // Imports
    import { ref } from 'vue';
    // Pages
    import StartPage from "./StartPage.vue";
    import MainPage from "./MainPage.vue";
    import { rpcHandle, rpcInvoke } from '../../js/rpc';
    import { Page } from '@shared/misc'; 
    
    // Refs
    const currentPage = ref<Page>(Page.None);
    rpcInvoke("Application:Require:ApplicationHasBeenSetup");
    rpcHandle("Application:ChangePage", (page:Page) =>{
        currentPage.value = page;
    })


</script>