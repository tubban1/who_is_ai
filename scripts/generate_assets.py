from pathlib import Path
import math, wave, struct, random
import trimesh
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'apps/web/public/assets'
AUDIO=ROOT/'apps/web/public/audio'
OUT.mkdir(parents=True,exist_ok=True); AUDIO.mkdir(parents=True,exist_ok=True)

def export(name, meshes):
    scene=trimesh.Scene()
    for i,m in enumerate(meshes): scene.add_geometry(m,node_name=f'{name}_{i}')
    scene.export(OUT/f'{name}.glb')

def box(extents,pos=(0,0,0)):
    m=trimesh.creation.box(extents=extents);m.apply_translation(pos);return m

def cyl(r,h,pos=(0,0,0),sections=20):
    m=trimesh.creation.cylinder(radius=r,height=h,sections=sections);m.apply_translation(pos);return m

def sphere(r,pos=(0,0,0)):
    m=trimesh.creation.icosphere(subdivisions=2,radius=r);m.apply_translation(pos);return m

# Avatar silhouette
export('avatar',[cyl(.38,1.2,(0,.0,0)),sphere(.34,(0,.9,0)),box((.28,.28,.9),(-.23,-.85,0)),box((.28,.28,.9),(.23,-.85,0))])
# Bench
export('bench',[box((2.5,.18,.55),(0,.55,0)),box((2.5,.15,.65),(0,.95,.25)),box((.16,.65,.45),(-.9,.2,0)),box((.16,.65,.45),(.9,.2,0))])
# Lamp
export('lamp',[cyl(.10,3.6,(0,1.8,0)),cyl(.22,.18,(0,3.55,0)),sphere(.32,(0,3.8,0))])
# Tree
export('tree',[cyl(.25,2.4,(0,1.2,0)),sphere(1.15,(0,3.0,0)),sphere(.85,(.7,2.8,.1)),sphere(.75,(-.65,2.7,-.15))])
# Kiosk
export('kiosk',[box((3.0,2.2,2.2),(0,1.1,0)),box((3.4,.20,2.6),(0,2.35,0)),box((2.0,.8,.12),(0,1.35,1.13))])
# Fountain
export('fountain',[cyl(2.4,.32,(0,.16,0),40),cyl(1.8,.28,(0,.38,0),40),cyl(.18,1.8,(0,1.25,0),24),sphere(.32,(0,2.15,0))])
# Sculpture
export('sculpture',[box((.7,1.1,.7),(0,.55,0)),cyl(.16,2.8,(0,2.0,0),12),cyl(.13,2.2,(.5,2.1,0),12),sphere(.45,(0,3.4,0))])
# Pavilion
export('pavilion',[box((5.0,.22,5.0),(0,.1,0)),cyl(.12,3.0,(-2,1.5,-2)),cyl(.12,3.0,(2,1.5,-2)),cyl(.12,3.0,(-2,1.5,2)),cyl(.12,3.0,(2,1.5,2)),box((5.2,.18,5.2),(0,3.05,0))])

# Soft synthetic ambient wav (wind + subtle pulse), original procedural audio.
sr=22050; dur=12.0; n=int(sr*dur); rng=random.Random(7); prev=0.0
samples=[]
for i in range(n):
    t=i/sr
    noise=rng.uniform(-1,1)
    prev=prev*0.992+noise*0.008
    pulse=math.sin(2*math.pi*55*t)*0.012*(0.5+0.5*math.sin(2*math.pi*.08*t))
    v=max(-1,min(1,prev*.20+pulse))
    samples.append(int(v*32767))
with wave.open(str(AUDIO/'plaza_ambient.wav'),'w') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr)
    w.writeframes(b''.join(struct.pack('<h',s) for s in samples))
print('generated',len(list(OUT.glob('*.glb'))),'glb assets')
