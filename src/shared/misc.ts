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
  hostname:String;
  address:string; 
  ID:string;
  isFriend:boolean;
  deviceType:DeviceType;

}



