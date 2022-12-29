<template>
  <div class="body">
    <div id="moreOptions" class="device-more-options-context-menu" 
    :style="{marginLeft:contextClickPos.x, marginTop:contextClickPos.y, display:windowOpened?'block':'none'}"
    >
      <p class="center-inner context-menu-text" style="color:#b8b8b8">
        {{ contextWindowPeer == undefined ? "" : contextWindowPeer.hostname }}
      </p>
      <hr style="margin-left: 20px; margin-right: 20px; background-color: gray; border: none; height: 1px;">
      <div class="device-more-options-child animate" v-on:click="contextWindowPeer == undefined ? () => {} : (contextWindowPeer.isFriend ? removeFriend() : addAsFriend())">
        <img class="context-icon" src="../../images/friends.svg">
        <p class="context-menu-text">
         {{ contextWindowPeer == undefined ? "" : (contextWindowPeer?.isFriend ? "Remove" : "Add as") }} friend
        </p>
      </div>
      <div class="device-more-options-child animate">
        <img class="context-icon" src="../../images/link.svg">
        <p class="context-menu-text">
          Send text/link
        </p>
      </div>
      <div class="device-more-options-child animate">
        <img class="context-icon" src="../../images/block.svg">
        <p class="context-menu-text">
          Block device
        </p>
      </div>

    </div>
    <div class="discoverable-header-container">
      <p>You are discoverable as</p>
      <p class="deviceName">
        <img src="../../images/computer.svg" style="width: 25px;">
        {{ deviceName }}
        <img src="../../images/edit.svg" style="margin-left:10px; width: 20px;">
      </p>
      <p>
        By 
        <div class="clickable discovery-selector" v-on:click="openDropdown()">
          <p style="margin-left: 10px; color: black;">
            Everyone
          </p>
          <img src="../../images/expand.svg" style="display: inline; position: absolute; margin-top: -27px; margin-left: 95px; width: 30px; height: 30px;">
        </div>
      </p>
      
    </div>

    <div class="discovery-selector-dropdown" :style="{
        display: dropdownOpened ? 'block' : 'none' 
      }">
      <div class="discovery-selector-child-element clickable animate list-top-element" v-on:click="setDiscoveryType(DiscoveryType.All)">
        <p class="discovery-selector-dropdown-text">Everyone</p>
      </div>
      <div class="discovery-selector-child-element clickable animate list-middle-element" v-on:click="setDiscoveryType(DiscoveryType.Friends)">
        <p class="discovery-selector-dropdown-text">Friends</p>
      </div>
      <div class="discovery-selector-child-element clickable animate list-bottom-element" v-on:click="setDiscoveryType(DiscoveryType.None)">
        <p class="discovery-selector-dropdown-text">No one</p>
      </div>
    </div>

    <div class="connected-devices"> 
      <div class="nearby-container">
        <p class="nearby-devices-text">
          Nearby devices
        </p>
      </div>
      <div class="peerSelectTypeParent">

        <div class="filter-Select clickable animate" @mouseover="hoveringAll = true" @mouseleave="hoveringAll = false"
          :style="{backgroundColor:selectedFilter == Filter.All ? '#6A9CFF' : (hoveringAll ? '#646464' : '#343434')} "
          @click="selectedFilter = Filter.All"
        >
          <p style="text-align: center;">All</p>
        </div>
        <div class="filter-Select clickable animate" @mouseover="hoveringFriends = true" @mouseleave="hoveringFriends = false"
          :style="{backgroundColor:selectedFilter == Filter.Friends ? '#6A9CFF' : (hoveringFriends ? '#646464' : '#343434')} "
          @click="selectedFilter = Filter.Friends"
        >
          <p style="text-align: center;">Friends</p>
        </div>
        
        <div class="clickable refresh animate" v-on:click="disconnectPeers()" >
          <img src="../../images/refresh.svg" style="width: 25px; height:25px;" >
        </div>
      </div>
      <hr style=" margin-left: 30px; margin-right: 30px;">
    <div class="all-clients-container" 
    :style="{justifyContent: connectedPeers?.length == 0 ? 'center' : 'start',
              alignItems: connectedPeers?.length == 0 ? 'center' : 'start'
            }"> 
      <p v-if="connectedPeers?.length == 0">
          Searching for available devices...
      </p>
      <div v-else class="client-element" v-for="peer in sanitize(connectedPeers)" >
        <div class="information-container">
          <img src="../../images/computer.svg" class="client-image">
          <p>
            {{ `${peer.hostname}` }}
            <img v-if="peer.isFriend" class="is-friend" src="../../images/isfriend.svg"> 
          </p>
        
        </div>
        <div class="peer-buttons-container">
          <div class="peer-button clickable center-inner" v-on:click="RequestFileTransfer(peer.ID)">
            <p style="color: black;">+</p>
          </div>
          <div class="peer-button clickable center-inner" v-on:click="OpenContextWindow(peer)">
            <p style="color: black; margin-top: -10px;">
              ...
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
<style src="../../css/dashboard.css"/>    
<style src="../../css/global.css"/>    

<script setup lang="ts">

// Imports
import { ref } from 'vue';
import { rpcHandle, rpcInvoke } from '../../js/rpc';
import { Filter, Peer, DiscoveryType } from '@shared/misc';

// Refs
const connectedPeers = ref<Peer[]>([]);
const deviceName = ref<String>();
const selectedFilter = ref<Filter>(Filter.All);
const hoveringAll = ref<boolean>(false);
const hoveringFriends = ref<boolean>(false);
const contextClickPos = ref<{x:string, y:string}>({x:'0px', y:'0px'});
const lastMousePos = ref<{x:string, y:string}>({x:'0px', y:'0px'});
const windowOpened = ref<boolean>(false);
const dropdownOpened = ref<boolean>(false);
const contextWindowPeer = ref<Peer>();

// Mouse moving
window.addEventListener('mousemove', (evt:MouseEvent) =>{
  const x = clamp(evt.clientX - 95, 12, window.innerWidth) + "px";
  const y = clamp(evt.clientY, 12, window.innerHeight - 170)   + "px";
  lastMousePos.value = {x:x, y:y}; 
});

/**
 * Add contextWindowPeer as friend
 */
function addAsFriend(){
  rpcInvoke("Application:addAsFriend", contextWindowPeer.value?.hostname, contextWindowPeer.value?.friendID);
}

/**
 * Remove contextWindowPeer as friend
 */
function removeFriend(){
  rpcInvoke("Application:removeFriend", contextWindowPeer.value?.friendID);
}


// This is painful to do but necessary
let eatNextClickContextMenu = false;
let eatNextClickDropdown = false;

/**
 * Open context window for peer (the ... menu)
 * @param {Peer} peer Object of the peer that was clicked on 
 */
function OpenContextWindow(peer:Peer){
  console.log("received open context window");
  contextClickPos.value = lastMousePos.value; 
  contextWindowPeer.value = peer;
  eatNextClickContextMenu = true;
  windowOpened.value = true;
}

/**
 * Open dropdown menu
 */
function openDropdown(){
  if(dropdownOpened.value) return;
  dropdownOpened.value = true; 
  eatNextClickDropdown = true;
}

/**
 * Click off of moreOptions
 */
window.addEventListener("click", (evt) => {
  console.log("received click");
  if(eatNextClickContextMenu){
    console.log("1");
    eatNextClickContextMenu = false;
  }
  else{
    console.log("2");

    const moreOptionsElement = document.getElementById("moreOptions") // :death:
    if(moreOptionsElement != evt.target){
      windowOpened.value = false;
    }
  }

  if(eatNextClickDropdown){
    eatNextClickDropdown = false;
  }
  else{
    dropdownOpened.value = false;
  }
  

  
})


/**
 * Changes who can discover you
 * @param { DiscoveryType } newType the discovery type to switch to
 */
function setDiscoveryType(newType:DiscoveryType){
  rpcInvoke("Application:Set:DiscoveryType", newType);
}



/**
 * Disconnects all peers around, refreshes frontend AND backend
 */
function disconnectPeers(){
    rpcInvoke('Application:PeerDisconnect');
}

/**
 * Filter peers depending on what has been selected by the user (All | Friend)
 * @param { Peer[] }peers all peers that are currently connected
 */
function sanitize(peers:Peer[]):Peer[]{
  return peers.filter(x => selectedFilter.value == Filter.Friends ? x.isFriend : 1 == 1);
}

/**
 *  Page loaded, we want to get devicename information
 *  from main process
 */
rpcInvoke("Application:Require:HostName");
rpcHandle("Application:HostName", (res) => {
  deviceName.value = res;
})

/**
 *  New page has been opened, let's ask the server for connected peers
 */
rpcInvoke("Application:Require:PeersUpdate");

/**
 * New client has been discovered / left the network
 */
rpcHandle("Application:PeersUpdate", (peers:Peer[]) => {
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
function clamp (x:number, min:number, max:number):number{
  if(x < min) return min;
  if (x > max) return max;
  return x;
}

/**
 * Requests a file transfer to the connected peer
 * @param {string} id socket id to send the file to
 */
function RequestFileTransfer(id:string):void{ rpcInvoke(`Application:FileTransfer:RequestFileTransfer:${id}`); }



</script>
