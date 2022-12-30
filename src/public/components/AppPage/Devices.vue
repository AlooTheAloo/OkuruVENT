<template>
    <div class="body" style="align-items:center">
      
      <div class="friends-list">
        <div class="nearby-container">
        <p class="nearby-devices-text">
          Known devices
        </p>
      </div>
      <div class="peerSelectTypeParent">

        <div class="filter-Select clickable animate" @mouseover="hoveringFriends = true" @mouseleave="hoveringFriends = false"
          :style="{backgroundColor:selectedFilter == DeviceFilterType.Friends ? '#6A9CFF' : (hoveringFriends ? '#646464' : '#343434')} "
          @click="selectedFilter = DeviceFilterType.Friends"
        >
          <p style="text-align: center;">Friends</p>
        </div>
        <div class="filter-Select clickable animate" @mouseover="hoveringBlocked = true" @mouseleave="hoveringBlocked = false"
          :style="{backgroundColor:selectedFilter == DeviceFilterType.Blocked ? '#6A9CFF' : (hoveringBlocked ? '#646464' : '#343434')} "
          @click="selectedFilter = DeviceFilterType.Blocked"
        >
          <p style="text-align: center;">Blocked</p>
        </div>
      </div>
        <div class="friend-element" v-for="device in (selectedFilter == DeviceFilterType.Friends ? friendsList : blockedList)">
          
          <p style="margin-left: 20px;">
              {{ device.lastHostname }}
          </p>
        </div>
      </div>
    </div>
  </template>
  <style src="../../css/global.css"/>    
  
  <script setup lang="ts">
  // Imports
  import { ref } from 'vue';
  import { rpcHandle, rpcInvoke } from '../../js/rpc';
  import { Friend } from '@shared/misc';
  // Enums
  enum DeviceFilterType {
    Friends,
    Blocked
  }
  
  const hoveringFriends = ref<Boolean>(false);
  const hoveringBlocked = ref<Boolean>(false);

  const selectedFilter = ref<DeviceFilterType>(DeviceFilterType.Friends);

  const friendsList = ref<Friend[]>();
  const blockedList = ref<Friend[]>();
  
  rpcInvoke("Application:Require:FriendsList");
  rpcHandle("Application:FriendsList", (receivedFriendsList:Friend[]) => {
    friendsList.value = receivedFriendsList;
  })

  rpcInvoke("Application:Require:BlockedList");
  rpcHandle("Application:BlockedList", (receivedBlockedList:Friend[]) => {
    blockedList.value = receivedBlockedList;
  })

  

  
  </script>
  