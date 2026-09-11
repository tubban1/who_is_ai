import { spawn } from 'node:child_process';

const children=[];
function run(cmd,args,cwd){
  const p=spawn(cmd,args,{cwd,stdio:'inherit',shell:process.platform==='win32'}); children.push(p); return p;
}
run('npm',['--workspace','apps/server','run','dev'],process.cwd());
run('npm',['--workspace','apps/web','run','dev'],process.cwd());
function stop(){ for(const p of children)p.kill('SIGTERM'); }
process.on('SIGINT',()=>{stop();process.exit(0)});
process.on('SIGTERM',()=>{stop();process.exit(0)});
