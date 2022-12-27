<template>

<Sidebar
    @tabChange="changeTab"
    :active-tab="activeTab"/>
    <!-- Current device name-->

    <div style="margin-left: 100px; overflow-x: hidden;">
      <New   v-if="activeTab == Tab.New"/>
      <Friends v-else-if="activeTab == Tab.Friends"/>
      <Transfers v-else-if="activeTab == Tab.Transfers"/>
      <History v-else-if="activeTab == Tab.History"/>
      <Settings  v-else-if="activeTab == Tab.Settings"/>
      <p v-else>This is awkward. There's nothing to show here.</p>
    </div>
      
    

    
</template>

<script setup lang="ts">

// Imports
import { ref } from 'vue';
import { rpcHandle } from '../../js/rpc';
import { Tab } from '@shared/misc';


// Pages
import Settings from "../MainPage/Settings.vue";
import Transfers from "../MainPage/Transfers.vue";
import History from "../MainPage/History.vue";
import Friends from "../MainPage/Friends.vue";
import New from "../MainPage/New.vue";
import Sidebar from "../MainPage/Sidebar.vue";


// Refs
const activeTab = ref<Tab>(Tab.New);
const slideDirection = ref(1);
const connectedPeers = ref<{address:string, ID:string, hostname:string}[]>();


// Event handlers raised by components

/**
 * Switch the main tab according to the Tab enum
 * @param {Tab} newTab  The tab to switch to
 */
async function changeTab(newTab: Tab) {
  const currentTab = activeTab.value;
  slideDirection.value = Math.min(Math.max(newTab - currentTab, -1), 1);
  activeTab.value = newTab;
}

/**
 * New client has been discovered / left the network
 */
rpcHandle("Application:PeersUpdate", (peers:{address:string, ID:string, hostname:string}[]) => {
    connectedPeers.value = peers;
}); 
</script>

<style scoped>
  @import '../../css/global.css';
  @import '../../css/dashboard.css';

</style>


