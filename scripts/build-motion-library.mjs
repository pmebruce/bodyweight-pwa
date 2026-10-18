import {build} from 'esbuild';
await build({entryPoints:['src/components/figure/motion-library.ts'],outfile:'public/movement3d/motion-library.js',format:'esm',bundle:true,target:'es2020',legalComments:'none'});
