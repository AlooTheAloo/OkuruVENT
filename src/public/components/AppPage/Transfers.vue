<template>
    <div class="body center-inner" style="gap: 100px;">
        <div class="transfers-menu rounded">
            <p class="bold title title-margin">
                Incoming
            </p>
           
            <div style="background-color: red; width: 100%; height: 90%; margin-top: 5px; display: flex; flex-direction: column;"
            :style="{
                alignItems: liveIncomingTransfers.length === 0 && waitingIncomingTransfers.length === 0 ? 'center' : 'top',
                justifyContent: liveIncomingTransfers.length === 0 && waitingIncomingTransfers.length === 0 ? 'center' : 'flex-start'

            }">
                
                <p v-if="liveIncomingTransfers.length === 0 && waitingIncomingTransfers.length === 0" class="bold" style="font-size:20px;">
                    There are no incoming transfers.
                </p>
                <div v-else style="height: 100%; width: 100%;">
                    <div v-for="transfer in waitingIncomingTransfers" style="background-color: blue; height: 15%; display: flex;"
                    >
                        <div style="background-color: blue; 
                            
                           
                            display: flex;
                            justify-content: center;
                            flex-direction: column;">
                            
                            <p style="margin-left: 10px;">
                            <b>
                                {{ transfer.filename.length > 20 ? 
                                transfer.filename.substring(0, 20) + "..." :
                                transfer.filename }}
                            </b>
                              from 
                            <b> 

                                
                                {{ transfer.socketID.length > 20 ? 
                                   transfer.socketID.substring(0, 20) + "..." :
                                   transfer.socketID 
                                }}
                            </b>
                        </p>
                        <p style="margin-left: 10px;"> 
                            {{ ConvertBytes(transfer.fileSize, 2) }}
                        </p>
                        </div>
                        <div style="display: flex; gap: 10px; position: absolute; margin-top: 50px; margin-left: 365px;">
                            <div class="peer-button clickable center-inner animate" v-on:click="RespondToTransfer(transfer.id, true)">
                                <p style="color: black;">✓</p>
                            </div>
                            <div class="peer-button clickable center-inner animate" v-on:click="RespondToTransfer(transfer.id, false)">
                                <p style="color: black;">X</p>
                            </div>
                        </div>
                    </div>
                    
                </div>

                
                
            </div>
        </div>
        
        <div class="transfers-menu rounded">
            <p class="bold title title-margin">
                Outgoing
            </p>
        </div>
    </div>
</template>
<style src="../../css/global.css"/>    
<script setup lang="ts">  
    import { Transfer } from '@shared/misc';
    import { rpcHandle, rpcInvoke } from '../../js/rpc';
    import { ref } from 'vue';
    const liveIncomingTransfers = ref<Transfer[]>([]);
    const waitingIncomingTransfers = ref<Transfer[]>([]);
    
    rpcInvoke("Application:Require:IncomingTransfers");

    rpcHandle("Application:Update:IncomingTransfers", (live:Transfer[], wait:Transfer[]) => {
        liveIncomingTransfers.value = live;
        waitingIncomingTransfers.value = wait;
    })
    
    /**
     * Converts a number of bytes to a shortened amount
     * Shamelessly stolen from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
     * @param bytes the number to convert (in bytes)
     * @param decimals number of decimals to display 
     * @returns the shortened value for the number of bytes
     */
    function ConvertBytes(bytes:number, decimals:number):string{
        const thresh =  1000;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
            
        let u = -1;
        const r = 10**decimals;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


        return bytes.toFixed(decimals) + ' ' + units[u];
    }

    function RespondToTransfer(transferID:string, response:boolean){ 
        rpcInvoke("Application:RespondToTransfer:" + transferID, response);
    }




</script>