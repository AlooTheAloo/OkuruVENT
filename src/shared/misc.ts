export enum Tab {
  New,
  Friends,
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

