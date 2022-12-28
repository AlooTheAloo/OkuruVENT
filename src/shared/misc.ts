export enum Tab {
  New,
  Friends,
  History,
  Transfers,
  Settings
}

export enum Page{
  StartPage,
  MainPage,
  None
}

export enum Filter{
  All,
  Friends
}

export enum DeviceType{
  PC,
  Mobile
}

export type Peer = {
  hostname:string;
  address:string; 
  friendID:string;
  ID:string;
  isFriend:boolean;
  deviceType:DeviceType;
}

export type Friend = {
  lastHostname:string,
  friendID:string
}

