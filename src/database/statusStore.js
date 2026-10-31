export function createStatusStore(){
 const statuses=[];const MAX_STATUSES=30;
 return {rememberStatus(msg){if(!msg?.key?.id)return;statuses.unshift({key:msg.key,message:msg.message,timestamp:Number(msg.messageTimestamp||Date.now()/1000),participant:msg.key.participant||msg.key.remoteJid});if(statuses.length>MAX_STATUSES)statuses.length=MAX_STATUSES;},latestStatus(){return statuses[0]||null;},listStatuses(){return [...statuses]}};
}
const defaultStore=createStatusStore();
export const rememberStatus=defaultStore.rememberStatus;
export const latestStatus=defaultStore.latestStatus;
export const listStatuses=defaultStore.listStatuses;
export default {createStatusStore,rememberStatus,latestStatus,listStatuses};
