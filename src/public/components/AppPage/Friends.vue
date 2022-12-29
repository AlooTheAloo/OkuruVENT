<template>
    <div class="body">
      <div v-for="friend in friendsList">
        <p>
            {{ friend.lastHostname }}
        </p>
      </div>
    </div>
  </template>
  <style src="../../css/dashboard.css"/>    
  <style src="../../css/global.css"/>    
  
  <script setup lang="ts">
  
  // Imports
  import { Friend } from '@shared/misc';
  import { ref } from 'vue';
  import { rpcHandle, rpcInvoke } from '../../js/rpc';
  
  const friendsList = ref<Friend[]>();

  
  rpcInvoke("Application:Require:FriendsList");
  rpcHandle("Application:FriendsList", (receivedFriendsList:Friend[]) => {
    friendsList.value = receivedFriendsList;
    console.log(receivedFriendsList);
  })

  
  </script>
  