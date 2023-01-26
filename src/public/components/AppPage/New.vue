<template>
  <div class="body">
    <div
      id="moreOptions"
      class="device-more-options-context-menu"
      style="display: block; transition: opacity 0.4s ease"
      :style="{
        marginLeft: contextClickPos.x,
        marginTop: contextClickPos.y,
        opacity: windowOpened ? '1' : '0',
        pointerEvents: windowOpened ? 'all' : 'none',
      }">
      <p
        class="center-inner context-menu-text"
        style="color: #b8b8b8; text-align: center">
        {{ contextWindowPeer == undefined ? "" : contextWindowPeer.hostname }}
      </p>
      <hr class="hrStyle" />
      <div
        class="device-more-options-child animate"
        v-on:click="
          contextWindowPeer == undefined
            ? () => {}
            : contextWindowPeer.isFriend
            ? removeFriend()
            : addAsFriend()
        ">
        <img class="context-icon" src="../../images/friends.svg" />
        <p class="context-menu-text">
          {{
            contextWindowPeer == undefined
              ? ""
              : contextWindowPeer?.isFriend
              ? "Remove"
              : "Add as"
          }}
          friend
        </p>
      </div>
      <div class="device-more-options-child animate">
        <img class="context-icon" src="../../images/link.svg" />
        <p class="context-menu-text">Send text/link</p>
      </div>
      <div class="device-more-options-child animate" v-on:click="BlockPeer()">
        <img class="context-icon" src="../../images/block.svg" />
        <p class="context-menu-text">Block device</p>
      </div>
    </div>

    <div class="connected-devices">
      <div class="nearby-container">
        <p class="nearby-devices-text">Nearby devices</p>
      </div>
      <div class="peerSelectTypeParent">
        <div
          class="filter-Select clickable animate"
          @mouseover="hoveringAll = true"
          @mouseleave="hoveringAll = false"
          :style="{
            backgroundColor:
              selectedFilter == Filter.All
                ? '#6A9CFF'
                : hoveringAll
                ? '#646464'
                : '#343434',
          }"
          @click="selectedFilter = Filter.All">
          <p style="text-align: center">All</p>
        </div>
        <div
          class="filter-Select clickable animate"
          @mouseover="hoveringFriends = true"
          @mouseleave="hoveringFriends = false"
          :style="{
            backgroundColor:
              selectedFilter == Filter.Friends
                ? '#6A9CFF'
                : hoveringFriends
                ? '#646464'
                : '#343434',
          }"
          @click="selectedFilter = Filter.Friends">
          <p style="text-align: center">Friends</p>
        </div>

        <div class="clickable refresh animate" v-on:click="disconnectPeers()">
          <img
            src="../../images/refresh.svg"
            style="width: 25px; height: 25px" />
        </div>
      </div>
      <hr style="margin-left: 30px; margin-right: 30px" />
      <div
        class="all-clients-container"
        :style="{
          justifyContent:
            sanitize(connectedPeers).length == 0 ? 'center' : 'start',
          alignItems: sanitize(connectedPeers).length == 0 ? 'center' : 'start',
        }">
        <p v-if="sanitize(connectedPeers).length == 0">
          Searching for available devices...
        </p>
        <div
          v-else
          class="client-element"
          v-for="peer in sanitize(connectedPeers)">
          <div class="information-container">
            <img src="../../images/computer.svg" class="client-image" />
            <p>
              {{ `${peer.hostname}` }}
              <img
                v-if="peer.isFriend"
                class="is-friend"
                src="../../images/isfriend.svg" />
            </p>
          </div>
          <div class="peer-buttons-container">
            <div
              class="peer-button clickable center-inner animate"
              v-on:click="RequestFileTransfer(peer.ID, peer.hostname)">
              <p style="color: black">+</p>
            </div>
            <div
              class="peer-button clickable center-inner animate"
              v-on:click="OpenContextWindow(peer)">
              <p style="color: black; margin-top: -10px">...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../../css/mainPage.css" />
<style src="../../css/global.css" />

<script setup lang="ts">
// Imports
import { ref } from "vue";
import { rpcHandle, rpcInvoke } from "../../js/rpc";
import { Filter, Peer } from "@shared/misc";

// Refs
const connectedPeers = ref<Peer[]>([]);
const selectedFilter = ref<Filter>(Filter.All);
const hoveringAll = ref<boolean>(false);
const hoveringFriends = ref<boolean>(false);
const contextClickPos = ref<{ x: string; y: string }>({ x: "0px", y: "0px" });
const lastMousePos = ref<{ x: string; y: string }>({ x: "0px", y: "0px" });
const windowOpened = ref<boolean>(false);
const contextWindowPeer = ref<Peer>();
// Mouse moving
window.addEventListener("mousemove", (evt: MouseEvent) => {
  const x = clamp(evt.clientX - 230, 12, window.innerWidth) + "px";
  const y = clamp(evt.clientY, 12, window.innerHeight - 170) + "px";
  lastMousePos.value = { x: x, y: y };
});

/**
 * Add contextWindowPeer as friend
 */
function addAsFriend() {
  console.log("..");
  rpcInvoke("Application:addAsFriend", JSON.stringify(contextWindowPeer.value));
}

/**
 * Block contextWindowPeer
 */
function BlockPeer() {
  console.log("Blocking peer...");
  rpcInvoke("Application:BlockPeer", JSON.stringify(contextWindowPeer.value));
}
/**
 * Remove contextWindowPeer as friend
 */
function removeFriend() {
  rpcInvoke("Application:removeFriend", contextWindowPeer.value?.friendID);
}

// This is painful to do but necessary
let eatNextClickContextMenu = false;

/**
 * Open context window for peer (the ... menu)
 * @param {Peer} peer Object of the peer that was clicked on
 */
function OpenContextWindow(peer: Peer) {
  contextClickPos.value = lastMousePos.value;
  contextWindowPeer.value = peer;
  eatNextClickContextMenu = true;
  windowOpened.value = true;
}

/**
 * Click off of moreOptions
 */
window.addEventListener("click", evt => {
  if (eatNextClickContextMenu) {
    eatNextClickContextMenu = false;
  } else {
    const moreOptionsElement = document.getElementById("moreOptions"); // :death:
    if (moreOptionsElement != evt.target) {
      windowOpened.value = false;
    }
  }
});

/**
 * Disconnects all peers around, refreshes frontend AND backend
 */
function disconnectPeers() {
  rpcInvoke("Application:PeerDisconnect");
}

/**
 * Filter peers depending on what has been selected by the user (All | Friend)
 * @param { Peer[] }peers all peers that are currently connected
 */
function sanitize(peers: Peer[]): Peer[] {
  return peers.filter(x =>
    selectedFilter.value == Filter.Friends ? x.isFriend : 1 == 1,
  );
}

/**
 *  New page has been opened, let's ask the server for connected peers
 */
rpcInvoke("Application:Require:PeersUpdate");

/**
 * New client has been discovered / left the network
 */
rpcHandle("Application:PeersUpdate", (peers: Peer[]) => {
  connectedPeers.value = peers;
});

/**
 * Helper method to clamp a number. Assigns a maximum and a minimum to a number,
 * and if it goes past, it gets reduced to it <br>
 * @param {number} x the number to clamp
 * @param {number} min the minimum value to clamp it to
 * @param {number} max the maximum value to clamp it to
 * @returns {number} the clamped number
 */
function clamp(x: number, min: number, max: number): number {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

/**
 * Requests a file transfer to the connected peer
 * @param {string} id socket id to send the file to
 * @param {string} hostname hostname of the person to send a file to
 */
function RequestFileTransfer(id: string, hostname: string): void {
  rpcInvoke(`Application:FileTransfer:RequestFileTransfer:${id}`, hostname);
}
</script>
