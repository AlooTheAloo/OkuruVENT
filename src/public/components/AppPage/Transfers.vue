<template>
  <div class="body center-inner" style="gap: 100px">
    <div class="transfers-menu rounded">
      <p class="bold title title-margin">Incoming</p>

      <div
        style="
          width: 100%;
          height: 90%;
          margin-top: 5px;
          display: flex;
          flex-direction: column;
        "
        :style="{
          alignItems:
            liveIncomingTransfers.length === 0 &&
            waitingIncomingTransfers.length === 0
              ? 'center'
              : 'top',
          justifyContent:
            liveIncomingTransfers.length === 0 &&
            waitingIncomingTransfers.length === 0
              ? 'center'
              : 'flex-start',
        }">
        <p
          v-if="
            liveIncomingTransfers.length === 0 &&
            waitingIncomingTransfers.length === 0
          "
          class="bold"
          style="font-size: 20px">
          There are no incoming transfers.
        </p>
        <div v-else style="height: 100%; width: 100%">
          <div
            v-for="transfer in waitingIncomingTransfers"
            style="height: 15%; display: flex">
            <div
              style="
                display: flex;
                justify-content: center;
                flex-direction: column;
              ">
              <p style="margin-left: 10px">
                <b>
                  {{
                    transfer.filename.length > 20
                      ? transfer.filename.substring(0, 20) + "..."
                      : transfer.filename
                  }}
                </b>
                from
                <b>
                  {{
                    transfer.hostname.length > 20
                      ? transfer.hostname.substring(0, 20) + "..."
                      : transfer.hostname
                  }}
                </b>
              </p>
              <p style="margin-left: 10px">
                {{ ConvertBytes(transfer.fileSize, 2) }}
              </p>
            </div>
            <div
              style="
                display: flex;
                gap: 10px;
                position: absolute;
                margin-top: 40px;
                margin-left: 365px;
              ">
              <div
                class="peer-button clickable center-inner animate"
                v-on:click="RespondToTransfer(transfer.id, true)">
                <p style="color: black">✓</p>
              </div>
              <div
                class="peer-button clickable center-inner animate"
                v-on:click="RespondToTransfer(transfer.id, false)">
                <p style="color: black">X</p>
              </div>
            </div>
          </div>

          <div
            v-for="transfer in liveIncomingTransfers"
            style="height: 15%; display: flex; width: 100%">
            <div
              style="
                display: flex;
                justify-content: center;
                flex-direction: column;
                width: 100%;
              ">
              <p style="margin-left: 10px">
                <b>
                  {{
                    transfer.filename.length > 23
                      ? transfer.filename.substring(0, 20) + "..."
                      : transfer.filename
                  }}
                </b>
                from
                <b>
                  {{
                    transfer.hostname.length > 23
                      ? transfer.hostname.substring(0, 20) + "..."
                      : transfer.hostname
                  }}
                </b>
              </p>
              <div
                style="
                  height: 50%;
                  display: flex;
                  width: 100%;
                  align-items: center;
                ">
                <div
                  style="
                    background-color: white;
                    width: 50%;
                    height: 30%;
                    margin-left: 10px;
                  "
                  class="rounded">
                  <div
                    style="background-color: #6a9cff; height: 100%"
                    :style="{
                      width: getProgress(transfer),
                    }"
                    class="rounded"></div>
                </div>
                <div
                  style="
                    display: flex;
                    flex-direction: column;
                    margin-left: 10px;
                    width: calc(50% - 10px);
                    align-items: center;
                  ">
                  <p style="width: 100%">
                    {{ ConvertBytes(transfer.progress, 1) }} /
                    {{ ConvertBytes(transfer.fileSize, 1) }}
                  </p>
                  <p style="width: 100%; line-height: 15px">
                    {{ transfer.lastKnownSpeed }} MB/s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="transfers-menu rounded">
      <p class="bold title title-margin">Outgoing</p>

      <div
        style="
          width: 100%;
          height: 90%;
          margin-top: 5px;
          display: flex;
          flex-direction: column;
        "
        :style="{
          alignItems:
            liveOutgoingTransfers.length === 0 &&
            waitingOutgoingTransfers.length === 0
              ? 'center'
              : 'top',
          justifyContent:
            liveOutgoingTransfers.length === 0 &&
            waitingOutgoingTransfers.length === 0
              ? 'center'
              : 'flex-start',
        }">
        <p
          v-if="
            liveOutgoingTransfers.length === 0 &&
            waitingOutgoingTransfers.length === 0
          "
          class="bold"
          style="font-size: 20px">
          There are no outgoing transfers.
        </p>
        <div v-else style="height: 100%; width: 100%">
          <div
            v-for="transfer in waitingOutgoingTransfers"
            style="height: 15%; display: flex">
            <div
              style="
                display: flex;
                justify-content: center;
                flex-direction: column;
              ">
              <p style="margin-left: 10px">
                <b>
                  {{
                    transfer.filename.length > 20
                      ? transfer.filename.substring(0, 20) + "..."
                      : transfer.filename
                  }}
                </b>
                to
                <b>
                  {{
                    transfer.hostname.length > 20
                      ? transfer.hostname.substring(0, 20) + "..."
                      : transfer.hostname
                  }}
                </b>
              </p>
              <p style="margin-left: 10px">
                {{ ConvertBytes(transfer.fileSize, 2) }}
              </p>
            </div>
            <div
              style="
                display: flex;
                gap: 10px;
                position: absolute;
                margin-top: 30px;
                margin-left: 280px;
              ">
              <p>Awaiting response...</p>
            </div>
          </div>

          <div
            v-for="transfer in liveOutgoingTransfers"
            style="height: 15%; display: flex; width: 100%">
            <div
              style="
                display: flex;
                justify-content: center;
                flex-direction: column;
                width: 100%;
              ">
              <p style="margin-left: 10px">
                <b>
                  {{
                    transfer.filename.length > 23
                      ? transfer.filename.substring(0, 20) + "..."
                      : transfer.filename
                  }}
                </b>
                to
                <b>
                  {{
                    transfer.hostname.length > 23
                      ? transfer.hostname.substring(0, 20) + "..."
                      : transfer.hostname
                  }}
                </b>
              </p>
              <div
                style="
                  height: 50%;
                  display: flex;
                  width: 100%;
                  align-items: center;
                ">
                <div
                  style="
                    background-color: white;
                    width: 50%;
                    height: 30%;
                    margin-left: 10px;
                  "
                  class="rounded">
                  <div
                    style="background-color: #6a9cff; height: 100%"
                    :style="{
                      width: getProgress(transfer),
                    }"
                    class="rounded"></div>
                </div>
                <div
                  style="
                    display: flex;
                    flex-direction: column;
                    margin-left: 10px;
                    width: calc(50% - 10px);
                    align-items: center;
                  ">
                  <p style="width: 100%">
                    {{ ConvertBytes(transfer.progress, 1) }} /
                    {{ ConvertBytes(transfer.fileSize, 1) }}
                  </p>
                  <p style="width: 100%; line-height: 15px">
                    {{ transfer.lastKnownSpeed }} MB/s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style src="../../css/global.css" />
<script setup lang="ts">
import { Transfer } from "@shared/misc";
import { rpcHandle, rpcInvoke } from "../../js/rpc";
import { ref } from "vue";
const liveIncomingTransfers = ref<Transfer[]>([]);
const waitingIncomingTransfers = ref<Transfer[]>([]);

const liveOutgoingTransfers = ref<Transfer[]>([]);
const waitingOutgoingTransfers = ref<Transfer[]>([]);

rpcInvoke("Application:Require:IncomingTransfers");

rpcHandle(
  "Application:Update:IncomingTransfers",
  (live: Transfer[], wait: Transfer[]) => {
    liveIncomingTransfers.value = live;
    waitingIncomingTransfers.value = wait;
  },
);

rpcInvoke("Application:Require:OutgoingTransfers");

rpcHandle(
  "Application:Update:OutgoingTransfers",
  (live: Transfer[], wait: Transfer[]) => {
    liveOutgoingTransfers.value = live;
    waitingOutgoingTransfers.value = wait;
  },
);

/**
 * Converts a number of bytes to a shortened amount
 * Shamelessly stolen from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
 * @param bytes the number to convert (in bytes)
 * @param decimals number of decimals to display
 * @returns the shortened value for the number of bytes
 */
function ConvertBytes(bytes: number, decimals: number): string {
  const thresh = 1000;

  if (Math.abs(bytes) < thresh) {
    return bytes + "B";
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  let u = -1;
  const r = 10 ** decimals;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(decimals) + " " + units[u];
}

/**
 * Takes a transfer and returns its progress
 * @param transfer The transfer to get the progress of
 * @returns A string representing the progress with a %
 */
function getProgress(transfer: Transfer): string {
  return ((transfer.progress * 100) / transfer.fileSize).toFixed(0) + "%";
}
/**
 * Tells a transfer if we want to accept it or not (true/false)
 * @param transferID The transfer to respond to
 * @param response The response
 */
function RespondToTransfer(transferID: string, response: boolean) {
  rpcInvoke("Application:RespondToTransfer:" + transferID, response);
}
</script>
