import { loadConfig } from './src/config/config.js';
import { logger } from './src/utils/logger.js';
import { createSessionManager } from './src/multiuser/sessionManager.js';
import { createDashboardServer } from './src/dashboard/server.js';

async function main(){
 const config=loadConfig();
 logger.info({bot:config.botName},'Starting FRANK-XMD multi-user service');
 const sessions=await createSessionManager();
 await sessions.restoreAll();
 const dashboard=createDashboardServer({sessionManager:sessions});
 await dashboard.listen();
 logger.info({port:process.env.PORT||3000,host:process.env.HOST||'0.0.0.0'},'FRANK-XMD dashboard is listening');
 const shutdown=async(signal)=>{logger.info({signal},'Shutting down');await dashboard.close();await sessions.shutdownAll();process.exit(0)};
 process.on('SIGINT',()=>shutdown('SIGINT'));
 process.on('SIGTERM',()=>shutdown('SIGTERM'));
 process.on('unhandledRejection',reason=>logger.error({err:reason instanceof Error?reason.message:String(reason)},'Unhandled rejection'));
 process.on('uncaughtException',error=>logger.error({err:error.message},'Uncaught exception'));
}
main().catch(error=>{logger.error({err:error.message},'Fatal startup error');process.exit(1)});
