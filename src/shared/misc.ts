export enum Tab {
  New,
  Devices,
  History,
  Transfers,
  Settings
}

export enum Page{
  StartPage,
  AppPage,
  None
}

export enum Filter{
  All,
  Friends
}

export enum DiscoveryType{
  All,
  Friends,
  None
}

export enum DeviceType{
  PC,
  Mobile
}

export type Peer = {
  hostname:string,
  address:string,
  friendID:string,
  ID:string,
  isFriend:boolean,
  deviceType:DeviceType,
  publicKey:string;
}

export type SavedPeer = {
  lastHostname:string,
  friendID:string,
  deviceType:DeviceType,
  publicKey:string;
}

export type Transfer = {
  id:string, 
  filepath:string,
  socketID:string,
  filename:string
}

export type Keys = {
  publicKey:string,
  privateKey:string,
}