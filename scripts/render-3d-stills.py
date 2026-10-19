import numpy as np,json,pathlib,base64,os,warnings
warnings.filterwarnings("ignore",category=DeprecationWarning)
from PIL import Image,ImageDraw
from concurrent.futures import ProcessPoolExecutor
root=pathlib.Path(os.environ.get('BODYWEIGHT_POSE_OUTPUT','/tmp/bodyweight-3d-poses'));target=root/'thumbnails';target.mkdir(exist_ok=True);destination=pathlib.Path(__file__).resolve().parent.parent/'public/movement3d/thumbnails.json'
def render(file):
 d=json.load(open(file));p=np.array(d['ps']).reshape(-1,3);tri=np.array(d['ids']).reshape(-1,3);cs=np.array(d['cs']).reshape(-1,3);W,H=216,220;yaw=d.get('camera',{}).get('yaw',.3 if d['front'] else 1.05);pitch=d.get('camera',{}).get('pitch',.13)
 right=np.array([np.cos(yaw),0,-np.sin(yaw)]);up=np.array([-np.sin(pitch)*np.sin(yaw),np.cos(pitch),-np.sin(pitch)*np.cos(yaw)]);toward=np.cross(right,up);v=np.stack([p@right,p@up,p@toward],1);lo=v[:,:2].min(0);hi=v[:,:2].max(0);scale=min((W-24)/(hi[0]-lo[0]),(H-26)/(hi[1]-lo[1]));v[:,0]=(v[:,0]-(lo[0]+hi[0])/2)*scale+W/2;v[:,1]=H/2-(v[:,1]-(lo[1]+hi[1])/2)*scale
 normal=np.cross(p[tri[:,1]]-p[tri[:,0]],p[tri[:,2]]-p[tri[:,0]]);normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-10);light=np.array([-.4,.7,.65]);light/=np.linalg.norm(light);shade=.72+.30*np.maximum(0,normal@light);colors=np.clip(cs[tri].mean(1)*shade[:,None]*255,0,255).astype('uint8');r=v[tri];area=np.abs(np.cross(r[:,1,:2]-r[:,0,:2],r[:,2,:2]-r[:,0,:2]));visible=(normal@toward>0)&(area>.02);order=np.argsort(r[:,:,2].mean(1));im=Image.new('RGBA',(W,H),(233,238,229,0));draw=ImageDraw.Draw(im)
 for i in order:
  if visible[i]:draw.polygon([tuple(x) for x in r[i,:,:2]],fill=(*colors[i].tolist(),255))
 name=file.stem;im.save(root/(name+'.png'));return name
if __name__=='__main__':
 files=sorted(root.glob('*-*.json'))
 with ProcessPoolExecutor(max_workers=6) as ex:names=list(ex.map(render,files))
 names=sorted(x for x in names if x.endswith('-0'));cols=6;sheet=Image.new('RGB',(216*cols,244*((len(names)+cols-1)//cols)), '#e9eee5');draw=ImageDraw.Draw(sheet)
 for i,name in enumerate(names):
  im=Image.open(root/(name+'.png'));sheet.paste(im,((i%cols)*216,(i//cols)*244),im);draw.text(((i%cols)*216+8,(i//cols)*244+222),name[:-2],fill='black');im.save(target/(name[:-2]+'.webp'),quality=88,method=4)
 sheet.save(root/'contact.png');destination.write_text(json.dumps({p.stem:'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode() for p in target.glob('*.webp')}));print('Rendered',len(files),'pose views and',len(names),'thumbnails')
