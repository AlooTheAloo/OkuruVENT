<template>
  <div>
    <h1 class="title">History</h1>
    <div class="flexbox">
      <table>
        <thead>
          <tr>
            <th @click.stop.prevent="changeColumnOrder(SortColumn.FileName)">
              Filename
            </th>
            <th @click.stop.prevent="changeColumnOrder(SortColumn.FileSize)">
              File Size
            </th>
            <th @click.stop.prevent="changeColumnOrder(SortColumn.Hostname)">
              Hostname
            </th>
            <th @click.stop.prevent="changeColumnOrder(SortColumn.Time)">
              Time
            </th>
          </tr>
        </thead>

        <tbody style="height: 500px; overflow-y: auto; display: block">
          <tr
            style="height: 50px; display: table"
            v-for="item in sortedHistory"
            :key="item.date.valueOf()">
            <td>{{ item.filename }}</td>
            <td>{{ ConvertBytes(item.fileSize, 2) }}</td>
            <td>{{ item.hostname }}</td>
            <td>{{ formatDate(item.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<style src="../../css/global.css" />
<script setup lang="ts">
import { Delivery } from "@shared/misc";
import { rpcHandle, rpcInvoke } from "../../js/rpc";
import { ref, computed } from "vue";
enum SortColumn {
  FileName,
  FileSize,
  Hostname,
  Time,
}
const historyOfTransfers = ref<Delivery[]>([]);
const sortedColumn = ref(SortColumn.Time);
const ascend = ref(true);
const sortedHistory = computed(() => {
  switch (sortedColumn.value) {
    case SortColumn.Time:
      return historyOfTransfers.value.sort((a, b) => {
        return (a.date.valueOf() - b.date.valueOf()) * (ascend.value ? 1 : -1);
      });
    case SortColumn.FileName:
      return historyOfTransfers.value.sort(
        (a, b) =>
          a.filename.localeCompare(b.filename) * (ascend.value ? 1 : -1),
      );
    case SortColumn.FileSize:
      return historyOfTransfers.value.sort(
        (a, b) => (a.fileSize - b.fileSize) * (ascend.value ? 1 : -1),
      );
    case SortColumn.Hostname:
      return historyOfTransfers.value.sort(
        (a, b) =>
          a.hostname.localeCompare(b.hostname) * (ascend.value ? 1 : -1),
      );
  }
});

function changeColumnOrder(columnType: SortColumn) {
  if (sortedColumn.value == columnType) {
    ascend.value = !ascend.value;
  } else {
    sortedColumn.value = columnType;
    ascend.value = true;
  }
}

rpcInvoke("Application:Require:History");
rpcHandle("ACK:Application:Require:History", (history: Delivery[]) => {
  historyOfTransfers.value = history;
});

function ConvertBytes(bytes: number, decimals: number): string {
  const thresh = 1000;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
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

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}
</script>
