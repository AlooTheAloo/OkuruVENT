<template>
    <StartPage style="overflow-x:hidden;" v-if="currentPage==Page.StartPage"/>
    <AppPage style="overflow-x:hidden;" v-else-if="currentPage==Page.AppPage"/>
    <!-- Redirecting... -->
    <div v-else-if="currentPage==Page.None"></div>
    <div v-else><p>Uhhh you're not supposed to be here</p></div>
</template>
<script setup lang="ts">

    // Imports
    import { ref } from 'vue';
    // Pages
    import StartPage from "./StartPage.vue";
    import AppPage from "./AppPage.vue";
    import { rpcHandle, rpcInvoke } from '../../js/rpc';
    import { Page } from '@shared/misc'; 
    
    // Refs
    const currentPage = ref<Page>(Page.None);
    rpcInvoke("Application:Require:ApplicationHasBeenSetup");
    rpcHandle("Application:ChangePage", (page:Page) =>{
        currentPage.value = page;
    })


</script>