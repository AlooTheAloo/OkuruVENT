<template>
  <div
    id="sideBar"
    style="background-color: #272B2F;
      width: 100px;
      height: 100vh;
      position: absolute;
      margin-top: 0;
    ">
    <div
      class="tabIndicator"
      :style="{
        width: tabIndicatorSize,
        marginTop: tabIndicatorPosition,
      }">
      <p style="color: black; width: 90%; text-align: right; margin-top: 14px;">
        {{ Object.values(Tab)[props.activeTab] }}
      </p>  
    
    </div>
      

    <div style="margin-top: 1vh; height: 100vh; display: flex; flex-direction: column; gap: 40px;
    align-items: center; justify-content: center;">
      <img 
        src="../../images/new.svg"
        class="sideBarButton"
        @click="changeTab(Tab.New)"
        >
        <img 
        src="../../images/devices.svg"
        class="sideBarButton"
        @click="changeTab(Tab.Devices)"
        >
        <img 
        src="../../images/transfers.svg"
        class="sideBarButton"
        @click="changeTab(Tab.Transfers)"
        >
        
        <img 
        src="../../images/history.svg"
        class="sideBarButton"
        @click="changeTab(Tab.History)"
        >

        <img 
        src="../../images/settings.svg"
        class="sideBarButton"
        @click="changeTab(Tab.Settings)"
        >


      <!-- button
        :style="{
          color: inactiveTabColor,
        }"
        class="sideBarButton"
        @click="changePage(Page.Connection)"
        tabindex="-1">
        R
      </button -->
    </div>
  </div>
</template>

<script setup lang="ts">  

import { computed } from "vue";
import { Tab, Page } from "../../../shared/misc"
const props = defineProps<{
  activeTab: Tab;
}>();

const emit = defineEmits<{
  (e: "tabChange", newTab: Tab): void;
  (e: "pageChange", newPage: Page): void;
}>();

///Constants
const tabIndicatorPositions: Record<Tab, string> = {
  [Tab.New]: "191px",
  [Tab.Devices]: "257px",
  [Tab.Transfers]: "324px",
  [Tab.History]: "391px",
  [Tab.Settings]: "459px",
};

const tabIndicatorSizes: Record<Tab, string> = {
  [Tab.New]: "85px",
  [Tab.Devices]: "120px",
  [Tab.Transfers]: "130px",
  [Tab.History]: "110px",
  [Tab.Settings]: "120px",
};

///Computed properties
const tabIndicatorPosition = computed(
  () => tabIndicatorPositions[props.activeTab],
);


///Computed properties
const tabIndicatorSize = computed(
  () => tabIndicatorSizes[props.activeTab],
);


///Local event handlers
/**
 * Changes the tab on the parent component
 * @param newTab The tab to change to
 */
function changeTab(newTab: Tab) {
  emit("tabChange", newTab);
}

</script>
