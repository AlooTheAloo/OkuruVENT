<template>
    <div class="center-x animate-slow" style="position: absolute; z-index: 1;"
    :style="{
      marginLeft:activeTab == Tab.New ? '100px' : '500px',
      marginTop:activeTab == Tab.New ? '0vh': '-9vh'
    }">

        <div class="TopbarBg animate" :style="{opacity: props.activeTab == Tab.New ? '0' : '1'}" style="margin-left: 20px; cursor: pointer;"
        v-on:click=" changeTab(Tab.New) "
        
        >

        </div>

        <div class="discoverable-header-container">
            <p class="animate-slow" :style="{opacity: props.activeTab == Tab.New ? '1' : '0'}">You are discoverable as</p>
            <p class="bold large">
                <img :style="{opacity: props.activeTab == Tab.New ? '1' : '0'}"
                src="../../images/computer.svg" style="width: 25px;">
                {{ deviceName }}
            </p>
            <p :style="{opacity: props.activeTab == Tab.New ? '1' : '0'}">
                By
            </p>
                <div class="discovery-selector"
                :style="{
                pointerEvents:props.activeTab == Tab.New ? 'all' : 'none',
                marginLeft:props.activeTab == Tab.New ? '29px' : '44px'
                }"
                :class="{ clickable:props.activeTab == Tab.New  }"
                
                v-on:click="props.activeTab == Tab.New ? openDropdown() : () => {}">
                <p style="color: black; " 
                :style="{ 
                    marginLeft:props.activeTab == Tab.New ? '10px' : '0px',
                    textAlign:props.activeTab == Tab.New ? 'left' : 'center'    
                }"
                
                >
                    {{ currentDiscoveryType }}
                </p>
                <img src="../../images/expand.svg" 
                :style="{opacity: props.activeTab == Tab.New ? '1' : '0'}"
                style="display: inline; position: absolute; margin-top: -27px; margin-left: 95px; width: 30px; height: 30px;">
                </div>
            
            </div>

            <div class="discovery-selector-dropdown" :style="{
                display: dropdownOpened ? 'block' : 'none' 
            }">
            <div class="discovery-selector-child-element clickable animate list-top-element" v-on:click=" setDiscoveryType(DiscoveryType.All)">
                <p class="discovery-selector-dropdown-text">Everyone</p>
            </div>
            <div class="discovery-selector-child-element clickable animate list-middle-element" v-on:click="setDiscoveryType(DiscoveryType.Friends)">
                <p class="discovery-selector-dropdown-text">Friends</p>
            </div>
            <div class="discovery-selector-child-element clickable animate list-bottom-element" v-on:click="setDiscoveryType(DiscoveryType.None)">
                <p class="discovery-selector-dropdown-text">No one</p>
            </div>
        </div>
    </div>
    
    

</template>
<script script setup lang="ts">

    //Imports
    import { DiscoveryType, Tab } from '@shared/misc';
    import { rpcHandle, rpcInvoke } from '../../js/rpc';
    import { ref } from 'vue';

    //Refs
    const currentDiscoveryType = ref<string>("Everyone");
    const dropdownOpened = ref<boolean>(false);
    const deviceName = ref<String>();

    //Props
    const props = defineProps<{
        activeTab: Tab;
    }>();

    //Emits
    const emit = defineEmits<{
    (e: "tabChange", newTab: Tab): void;
    }>();
    
    ///Local event handlers
    function changeTab(newTab: Tab) {
        emit("tabChange", newTab);
    }

    let eatNextClickDropdown = false;

    /**
     * Open dropdown menu
     */
    function openDropdown(){
        if(dropdownOpened.value) return;
        dropdownOpened.value = true; 
        eatNextClickDropdown = true;
    }

    /**
     * Changes who can discover you
     * @param { DiscoveryType } newType the discovery type to switch to
     */
    function setDiscoveryType(newType:DiscoveryType){
        rpcInvoke("Application:Set:DiscoveryType", newType);
        createDiscoveryString(newType);
    }

    /**
     * Converts DiscoveryType to a string and sets it on currentDiscoveryType
     * @param { DiscoveryType } newType the discovery type to convert to a string
     */
    function createDiscoveryString(newType:DiscoveryType){
        //Show discovery type to user
        switch(newType){
            case DiscoveryType.All:
            currentDiscoveryType.value = "Everyone";
            break;
            case DiscoveryType.Friends:
            currentDiscoveryType.value = "Friends";
            break;
            case DiscoveryType.None:
            currentDiscoveryType.value = "No one";
            break;
        }  
    }

    
    /**
     * Click off of moreOptions
     */
    window.addEventListener("click", (evt) => {
        // depression
        if(eatNextClickDropdown){
            eatNextClickDropdown = false;
        }
        else{
            dropdownOpened.value = false;
        }
    })

    /**
    *  Page loaded, we want to get current discovery type
    */
    rpcInvoke("Application:Require:DiscoveryType");
    rpcHandle("Application:DiscoveryType", (res:DiscoveryType) => {
        createDiscoveryString(res);
    })

    /**
     *  Page loaded, we want to get devicename information
     *  from main process
     */
    rpcInvoke("Application:Require:HostName");
    rpcHandle("Application:HostName", (res:string) => {
        deviceName.value = res;
    })

</script>