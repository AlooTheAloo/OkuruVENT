<template>
  <div class="body" style="align-items: center">
    <div class="friends-list">
      <div class="nearby-container">
        <p class="nearby-devices-text">Known devices</p>
      </div>
      <div class="peerSelectTypeParent">
        <div
          class="filter-Select clickable animate"
          @mouseover="hoveringFriends = true"
          @mouseleave="hoveringFriends = false"
          :style="{
            backgroundColor:
              selectedFilter == DeviceFilterType.Friends
                ? '#6A9CFF'
                : hoveringFriends
                ? '#646464'
                : '#343434',
          }"
          @click="selectedFilter = DeviceFilterType.Friends">
          <p style="text-align: center">Friends</p>
        </div>
        <div
          class="filter-Select clickable animate"
          @mouseover="hoveringBlocked = true"
          @mouseleave="hoveringBlocked = false"
          :style="{
            backgroundColor:
              selectedFilter == DeviceFilterType.Blocked
                ? '#6A9CFF'
                : hoveringBlocked
                ? '#646464'
                : '#343434',
          }"
          @click="selectedFilter = DeviceFilterType.Blocked">
          <p style="text-align: center">Blocked</p>
        </div>
      </div>
      <hr class="hrStyle" style="margin-left: 30px; margin-right: 30px" />

      <div class="devices-container-row">
        <p
          v-if="
            selectedFilter == DeviceFilterType.Friends
              ? friendsList.length == 0
              : blockedList.length == 0
          "
          style="
            width: 100%;
            text-align: center;
            line-height: 60vh;
            height: 60vh;
          ">
          {{
            selectedFilter == DeviceFilterType.Friends
              ? "Add some friends for them to appear here !"
              : "There are no blocked devices"
          }}
        </p>
        <div
          v-else
          class="devices-container-column"
          v-for="row in COLUMN_COUNT">
          <div class="friend-element" v-for="device in getRow(row - 1)">
            <p style="overflow-x: hidden; overflow-y: hidden; height: 30px">
              {{ device.lastHostname }}
            </p>
            <div
              class="peer-button-devices clickable center-inner animate"
              v-on:click="
                selectedFilter == DeviceFilterType.Blocked
                  ? unBlock(device)
                  : unFriend(device)
              "
              style="width: 40px; height: 40px">
              <img src="../../images/person_remove.svg" style="width: 20px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style src="../../css/global.css" />

<script setup lang="ts">
// Imports
import { ref } from "vue";
import { rpcHandle, rpcInvoke } from "../../js/rpc";
import { SavedPeer } from "@shared/misc";
// Enums
enum DeviceFilterType {
  Friends,
  Blocked,
}

// refs
const hoveringFriends = ref<Boolean>(false);
const hoveringBlocked = ref<Boolean>(false);

const selectedFilter = ref<DeviceFilterType>(DeviceFilterType.Friends);

const friendsList = ref<SavedPeer[]>([]);
const blockedList = ref<SavedPeer[]>([]);

// Constants
const COLUMN_COUNT = 2;

rpcInvoke("Application:Require:FriendsList");
rpcHandle("Application:FriendsList", (receivedFriendsList: SavedPeer[]) => {
  receivedFriendsList.forEach(element => {
    console.log(element.lastHostname);
  });
  friendsList.value = receivedFriendsList;
});

rpcInvoke("Application:Require:BlockedList");
rpcHandle("Application:BlockedList", (receivedBlockedList: SavedPeer[]) => {
  blockedList.value = receivedBlockedList;
});

/**
 * Fetches and returns all COLUMN_COUNTth element of the peers starting at index
 * @param index The row to get
 */
function getRow(index: number): SavedPeer[] {
  let retVal: SavedPeer[] = [];
  let targetArray: SavedPeer[] =
    selectedFilter.value == DeviceFilterType.Friends
      ? friendsList.value
      : blockedList.value;

  console.log(JSON.stringify(targetArray.map(x => x.lastHostname)));

  for (let i = index; i < targetArray.length; i += COLUMN_COUNT) {
    retVal.push(targetArray[i]);
  }
  return retVal;
}

/**
 * Asks the backend to unblock a peer
 * @param peer The peer to unblock
 */
function unBlock(peer: SavedPeer): void {
  rpcInvoke("Application:unblock", peer.friendID);
}

/**
 * Asks the backend to unfriend a peer
 * @param peer The peer to unfriend
 */
function unFriend(peer: SavedPeer): void {
  rpcInvoke("Application:unfriend", peer.friendID);
}
</script>
