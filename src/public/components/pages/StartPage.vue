<template>
    
    <input type="text"
    placeholder="Your Name (shit anime)"
    v-model="chosenHostname"/>
    <button v-on:click="handleHostName()">Button</button>
    </template>
    
    <script setup lang="ts">
    
    // Imports
    import { ref } from 'vue';
    import { rpcHandle, rpcInvoke } from '../../js/rpc';
    
    //Refs
    const chosenHostname = ref<string>("");
    
    // Invores
    // Get the device name on start for auto fill
    rpcInvoke("Application:Require:DeviceName"); 
    rpcHandle("Application:DeviceName", (hostname:string) =>{
      chosenHostname.value = hostname;  
    })
    
    function handleHostName():void{
      rpcInvoke("Application:StartPage:SendHostName", chosenHostname.value);
    }
    
    </script>
    
    <style scoped>
      @import '../../css/global.css';
    
    </style>    