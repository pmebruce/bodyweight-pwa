"""Render both sampled phases at all three app camera presets, without updating thumbnails."""
import importlib.util,json,pathlib,os
from concurrent.futures import ProcessPoolExecutor
from PIL import Image,ImageDraw
root=pathlib.Path(os.environ['BODYWEIGHT_POSE_OUTPUT'])
spec=importlib.util.spec_from_file_location('stills',pathlib.Path(__file__).with_name('render-3d-stills.py'))
stills=importlib.util.module_from_spec(spec);spec.loader.exec_module(stills)
def render_view(task):
 file,angle,camera=task
 return stills.render(file,camera,'-'+angle)
if __name__=='__main__':
 tasks=[];names=[]
 for file in sorted(root.glob('*-0.json')):
  d=json.loads(file.read_text());names.append(d['name'])
  for angle,camera in d['cameras'].items():
   for phase in [0,1]:tasks.append((root/(d['name']+'-'+str(phase)+'.json'),angle,camera))
 with ProcessPoolExecutor(max_workers=6) as pool:list(pool.map(render_view,tasks))
 for page in range((len(names)+5)//6):
  group=names[page*6:(page+1)*6];sheet=Image.new('RGB',(1296,244*len(group)),'#e9eee5');draw=ImageDraw.Draw(sheet)
  for row,name in enumerate(group):
   for a,angle in enumerate(['front','side','three']):
    for phase in [0,1]:
     x=(a*2+phase)*216;y=row*244;im=Image.open(root/(name+'-'+str(phase)+'-'+angle+'.png'));im.load();sheet.paste(im,(x,y),im);draw.text((x+4,y+221),name+' '+angle+' '+str(phase),fill='black')
  sheet.save(root/('review-'+str(page)+'.jpg'),quality=94)
 print('Rendered',len(tasks),'views across',len(names),'exercises')
